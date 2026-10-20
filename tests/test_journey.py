from fastapi.testclient import TestClient
from backend import store
from backend.app import app


def test_held_batch_correction_and_idempotent_release(tmp_path, monkeypatch):
    monkeypatch.setattr(store, "ROOT", tmp_path)
    client = TestClient(app)
    source = b"entry_id,field_name,entered_value,expected_range_min,expected_range_max,previous_value,entry_date\nE1,revenue,110,0,100,90,2026-10-01\nE2,revenue,50,0,100,45,2026-10-02\n"
    created = client.post("/api/drafts", files={"file": ("batch.csv", source, "text/csv")}).json()
    draft_id = created["draft_id"]
    inspected = client.post(f"/api/drafts/{draft_id}/inspect")
    assert inspected.status_code == 200
    assert inspected.json()["inspection"]["row_count"] == 2
    plan = client.get(f"/api/drafts/{draft_id}/plan").json()["recommended_profile"]
    approved = client.post(f"/api/drafts/{draft_id}/profile", json={**plan, "draft_version": 1})
    assert approved.status_code == 200
    review = client.post(f"/api/drafts/{draft_id}/review").json()
    assert review["holds"] == 1
    assert client.post(f"/api/drafts/{draft_id}/submit").status_code == 409
    correction = {"draft_version": 1, "changes": [{"row": 1, "field": "entered_value", "value": "90"}], "reason": "Checked source"}
    fixed = client.post(f"/api/drafts/{draft_id}/corrections", json=correction)
    assert fixed.status_code == 200
    assert fixed.json()["version"] == 2
    assert fixed.json()["review"]["holds"] == 0
    assert client.post(f"/api/drafts/{draft_id}/corrections", json=correction).status_code == 409
    first = client.post(f"/api/drafts/{draft_id}/submit")
    second = client.post(f"/api/drafts/{draft_id}/submit")
    assert first.status_code == second.status_code == 200
    assert first.json() == second.json()
    receipt = first.json()["id"]
    assert client.get(f"/api/accepted/{receipt}").json()["digest"] == first.json()["digest"]
    assert "E1,revenue,90" in client.get(f"/api/accepted/{receipt}/download").text
    assert client.post(f"/api/drafts/{draft_id}/corrections", json={"draft_version": 2, "changes": [{"row": 1, "field": "entered_value", "value": "80"}], "reason": "late edit"}).status_code == 409
    assert store.get_blob(f"original/{draft_id}/batch.csv") == source


def test_structural_errors_block_inspection(tmp_path, monkeypatch):
    monkeypatch.setattr(store, "ROOT", tmp_path)
    client = TestClient(app)
    created = client.post("/api/drafts", files={"file": ("bad.csv", b"id,id\nA,1\n", "text/csv")}).json()
    assert client.post(f"/api/drafts/{created['draft_id']}/inspect").status_code == 422
