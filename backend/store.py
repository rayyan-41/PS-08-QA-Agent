"""Local development store and Cloud Storage/Firestore production store."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
import threading

ROOT = Path(os.getenv("PS08_LOCAL_DATA", "/tmp/ps08-store"))
LOCK = threading.RLock()
BUCKET = os.getenv("PS08_BUCKET")
PROJECT = os.getenv("GOOGLE_CLOUD_PROJECT")


def _cloud():
    if not BUCKET or not PROJECT:
        return None
    from google.cloud import firestore, storage
    return firestore.Client(project=PROJECT), storage.Client(project=PROJECT).bucket(BUCKET)


def put_blob(key: str, payload: bytes, immutable=False):
    clients = _cloud()
    if clients:
        from google.api_core.exceptions import PreconditionFailed
        blob = clients[1].blob(key)
        try:
            blob.upload_from_string(payload, if_generation_match=0 if immutable else None)
        except PreconditionFailed:
            if not immutable or blob.download_as_bytes() != payload:
                raise
    else:
        path = ROOT / "blobs" / key
        path.parent.mkdir(parents=True, exist_ok=True)
        if immutable and path.exists():
            if path.read_bytes() != payload:
                raise ValueError("Immutable object conflict")
            return
        path.write_bytes(payload)


def get_blob(key: str) -> bytes:
    clients = _cloud()
    if clients:
        return clients[1].blob(key).download_as_bytes()
    return (ROOT / "blobs" / key).read_bytes()


def get_doc(collection: str, key: str):
    clients = _cloud()
    if clients:
        snap = clients[0].collection(collection).document(key).get()
        return snap.to_dict() if snap.exists else None
    path = ROOT / "docs" / collection / f"{key}.json"
    return json.loads(path.read_text()) if path.exists() else None


def put_doc(collection: str, key: str, value: dict):
    clients = _cloud()
    if clients:
        clients[0].collection(collection).document(key).set(value)
    else:
        path = ROOT / "docs" / collection / f"{key}.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(value, default=str))


def update_draft_if_version(draft: dict, expected_version: int):
    """Compare-and-set a draft so edits cannot race an accepted release."""
    clients = _cloud()
    if clients:
        from google.cloud import firestore
        db = clients[0]
        ref = db.collection("drafts").document(draft["id"])
        accepted_ref = db.collection("accepted").document(f"{draft['id']}-{expected_version}")
        transaction = db.transaction()
        @firestore.transactional
        def commit(tx):
            current = ref.get(transaction=tx)
            accepted = accepted_ref.get(transaction=tx)
            if not current.exists or current.to_dict()["version"] != expected_version or accepted.exists:
                raise ValueError("Draft changed or was accepted")
            tx.set(ref, draft)
        commit(transaction)
    else:
        with LOCK:
            current = get_doc("drafts", draft["id"])
            accepted = get_doc("accepted", f"{draft['id']}-{expected_version}")
            if not current or current["version"] != expected_version or accepted:
                raise ValueError("Draft changed or was accepted")
            put_doc("drafts", draft["id"], draft)


def list_docs(collection: str):
    clients = _cloud()
    if clients:
        return [x.to_dict() for x in clients[0].collection(collection).stream()]
    folder = ROOT / "docs" / collection
    return [json.loads(p.read_text()) for p in folder.glob("*.json")] if folder.exists() else []


def digest(payload: bytes):
    return hashlib.sha256(payload).hexdigest()


def publish_once(draft_id: str, version: int, receipt: dict):
    """The Firestore record is the publication boundary."""
    key = f"{draft_id}-{version}"
    clients = _cloud()
    if clients:
        from google.cloud import firestore
        db = clients[0]
        ref = db.collection("accepted").document(key)
        draft_ref = db.collection("drafts").document(draft_id)
        transaction = db.transaction()
        @firestore.transactional
        def commit(tx):
            old = ref.get(transaction=tx)
            if old.exists:
                return old.to_dict()
            draft = draft_ref.get(transaction=tx).to_dict()
            if not draft or draft["version"] != version or draft.get("review", {}).get("holds", 1):
                raise ValueError("Draft changed or is held")
            tx.create(ref, receipt)
            return receipt
        return commit(transaction)
    with LOCK:
        old = get_doc("accepted", key)
        if old:
            return old
        draft = get_doc("drafts", draft_id)
        if not draft or draft["version"] != version or draft.get("review", {}).get("holds", 1):
            raise ValueError("Draft changed or is held")
        put_doc("accepted", key, receipt)
        return receipt
