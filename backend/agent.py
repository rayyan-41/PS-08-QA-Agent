"""Bounded ADK ReAct turns using the analytical MCP server."""
from __future__ import annotations

import os
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools.mcp_tool import McpToolset, StreamableHTTPConnectionParams
from google.genai import types


async def run_turn(draft_id: str, purpose: str):
    if not os.getenv("GEMINI_API_KEY"):
        return {"status": "unavailable", "reason": "GEMINI_API_KEY is not configured", "activity": [], "note": ""}
    port = os.getenv("PORT", "8080")
    toolset = McpToolset(connection_params=StreamableHTTPConnectionParams(url=f"http://127.0.0.1:{port}/tools/mcp", timeout=15, sse_read_timeout=90))
    if purpose == "plan":
        instruction = "You help configure a pre-submission financial data review. Call inspect_draft and supported_checks before responding. Recommend only available checks. Ask up to four short questions about unresolved meaning, units, supporting documents, or uniqueness. Do not claim labels are verified or infer business meaning from numeric columns alone. Do not change data."
        prompt = f"Inspect draft {draft_id}; call the tools, then summarize applicable checks and questions in concise plain English."
    else:
        instruction = "You investigate evidence for a pre-submission review. First call execute_review for the draft, then get_review_evidence using the returned review ID. Call procedure_for for at least one finding category if findings exist. Explain major holds and next actions grounded in tool evidence. Never authorize release or invent a correction. Keep the answer brief."
        prompt = f"Review draft {draft_id} through tools and explain its main issues."
    agent = Agent(name=f"quality_{purpose}", model=os.getenv("PS08_GEMINI_MODEL", "gemini-3.5-flash-lite"), instruction=instruction, tools=[toolset])
    sessions = InMemorySessionService()
    session = await sessions.create_session(app_name="ps08", user_id=draft_id)
    runner = Runner(agent=agent, app_name="ps08", session_service=sessions)
    activity=[]; notes=[]
    try:
        async for event in runner.run_async(user_id=draft_id, session_id=session.id, new_message=types.Content(role="user", parts=[types.Part(text=prompt)])):
            for part in getattr(getattr(event, "content", None), "parts", None) or []:
                if getattr(part, "function_call", None):
                    activity.append({"step": part.function_call.name, "status": "called"})
                if getattr(part, "function_response", None):
                    activity.append({"step": part.function_response.name, "status": "observed"})
                if getattr(part, "text", None) and getattr(event, "is_final_response", lambda: False)():
                    notes.append(part.text)
        required = {"inspect_draft", "supported_checks"} if purpose == "plan" else {"execute_review", "get_review_evidence"}
        called = {x["step"] for x in activity if x["status"] == "called"}
        if not required <= called:
            return {"status": "incomplete", "reason": f"Agent did not call required tools: {sorted(required-called)}", "activity": activity, "note": " ".join(notes)}
        return {"status": "completed", "activity": activity, "note": " ".join(notes)}
    except Exception as exc:
        return {"status": "failed", "reason": f"{type(exc).__name__}: {exc}", "activity": activity, "note": ""}
    finally:
        await toolset.close()
