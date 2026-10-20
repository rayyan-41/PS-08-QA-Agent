"""Streamable HTTP MCP tools used by the ADK planner and investigator."""
from __future__ import annotations

from mcp.server.mcpserver import MCPServer
from . import analysis, store

server = MCPServer("ps08-quality-tools")


@server.tool()
def inspect_draft(draft_id: str) -> dict:
    """Read a persisted schema, counts, warnings, and bounded sample for a draft."""
    draft = store.get_doc("drafts", draft_id)
    if not draft or "inspection" not in draft:
        return {"status": "unavailable", "reason": "Draft has not been inspected"}
    inspection = draft["inspection"]
    return {"status": "ok", "draft_id": draft_id, "version": draft["version"], "row_count": inspection["row_count"], "columns": inspection["columns"], "warnings": inspection["warnings"], "examples": inspection["preview"][:3]}


@server.tool()
def supported_checks() -> dict:
    """List implemented checks and model prerequisites for plan selection."""
    return {"deterministic": ["required_value", "duplicate_entry", "range_violation", "date_conflict", "missing_document", "logical_relationship"], "statistics": ["iqr", "mad", "z_score", "previous_change"], "models": analysis.MODEL_NAMES[4:], "model_prerequisites": "Independent comparable history; reviewed labels for classifiers; regular dated history for forecasts"}


@server.tool()
def execute_review(draft_id: str) -> dict:
    """Execute the approved checks for a saved draft and return evidence summary."""
    from .app import get_draft, review_draft
    draft = get_draft(draft_id)
    result = review_draft(draft)
    return {"status": "completed", "review_id": result["id"], "draft_version": result["draft_version"], "total_findings": result["total"], "holds": result["holds"], "by_code": result["by_code"], "outcomes": result["outcomes"]}


@server.tool()
def get_review_evidence(review_id: str, limit: int = 15) -> dict:
    """Read a bounded set of current findings and raw supporting evidence."""
    review = store.get_doc("reviews", review_id)
    if not review:
        return {"status": "unavailable", "reason": "Review not found"}
    return {"status": "ok", "review_id": review_id, "draft_version": review["draft_version"], "findings": review["findings"][:max(1, min(limit, 30))], "remaining": max(0, len(review["findings"])-limit)}


@server.tool()
def procedure_for(code: str) -> dict:
    """Return the supported analyst procedure for a finding category."""
    procedures = {
        "range_violation": "Compare the source report, value scale, currency and period; correct only from a verified source.",
        "duplicate_entry": "Check the original entry and reporting period before choosing which record to keep.",
        "required_value": "Find the required source field and enter its exact verified value.",
        "missing_document": "Attach or verify the cited supporting document before release.",
        "date_conflict": "Confirm the source date and enter it as YYYY-MM-DD.",
        "format_error": "Correct the value format against the source document.",
        "statistical_anomaly": "Verify units, period and source value; a statistical signal alone does not justify replacement.",
        "logical_inconsistency": "Check the linked fields against the source; confirm their units and period before correcting.",
        "stale_data": "Confirm the record's effective period against the approved freshness limit.",
        "historical_anomaly": "Compare source value and units with the prior comparable records; a model signal is not a replacement value.",
        "required_check_incomplete": "Provide eligible reference data or revise and reconfirm the review plan.",
    }
    return {"code": code, "procedure": procedures.get(code, "Inspect the source and document the decision."), "source": "built-in review procedure"}


mcp_app = server.streamable_http_app(streamable_http_path="/mcp", stateless_http=True, json_response=True, host="0.0.0.0")
