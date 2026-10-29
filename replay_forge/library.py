"""Read-only replay directory scanner backed by SQLite."""
from __future__ import annotations

import hashlib
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

SCHEMA = """
CREATE TABLE IF NOT EXISTS replay_files (
    sha256 TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    mtime_ns INTEGER NOT NULL,
    indexed_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'awaiting_decoder'
);
CREATE INDEX IF NOT EXISTS idx_replay_path ON replay_files(path);
"""

def db_path() -> Path:
    target = Path.home() / ".replay_forge" / "library.sqlite3"
    target.parent.mkdir(parents=True, exist_ok=True)
    return target

def connect(db: Path | None = None) -> sqlite3.Connection:
    location = db or db_path()
    location.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(location)
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA)
    return conn

def sha256_file(path: Path, chunk: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        while data := stream.read(chunk):
            digest.update(data)
    return digest.hexdigest()

def scan(root: str | Path, database: Path | None = None) -> dict:
    root = Path(root).expanduser().resolve()
    if not root.is_dir():
        raise ValueError(f"Not a directory: {root}")
    found = indexed = reused = failed = 0
    errors: list[dict[str, str]] = []
    with connect(database) as conn:
        by_path = {row["path"]: row for row in conn.execute("SELECT * FROM replay_files")}
        for path in root.rglob("*"):
            if not path.is_file() or path.suffix.lower() != ".replay":
                continue
            found += 1
            try:
                stat = path.stat()
                key = str(path.resolve())
                old = by_path.get(key)
                if old and old["size_bytes"] == stat.st_size and old["mtime_ns"] == stat.st_mtime_ns:
                    reused += 1
                    continue
                sha = sha256_file(path)
                conn.execute("""
                    INSERT INTO replay_files (sha256,path,size_bytes,mtime_ns,indexed_at,status)
                    VALUES (?,?,?,?,?,?)
                    ON CONFLICT(sha256) DO UPDATE SET
                       path=excluded.path, size_bytes=excluded.size_bytes,
                       mtime_ns=excluded.mtime_ns, indexed_at=excluded.indexed_at
                """, (sha, key, stat.st_size, stat.st_mtime_ns, datetime.now(timezone.utc).isoformat(), "awaiting_decoder"))
                indexed += 1
            except (OSError, sqlite3.Error) as exc:
                failed += 1
                errors.append({"path": str(path), "error": str(exc)})
    return {"root": str(root), "found": found, "indexed": indexed, "unchanged": reused, "failed": failed, "errors": errors}

def list_replays(database: Path | None = None, limit: int = 100, offset: int = 0, search: str = "") -> list[dict]:
    with connect(database) as conn:
        pattern = f"%{search}%"
        rows = conn.execute(
            "SELECT * FROM replay_files WHERE path LIKE ? ORDER BY indexed_at DESC LIMIT ? OFFSET ?",
            (pattern, min(max(limit, 1), 1000), max(offset, 0))
        ).fetchall()
        return [dict(row) for row in rows]

def summary(database: Path | None = None) -> dict:
    with connect(database) as conn:
        row = conn.execute("SELECT COUNT(*) AS files, COALESCE(SUM(size_bytes),0) AS bytes FROM replay_files").fetchone()
    return {"replays_indexed": row["files"], "total_bytes": row["bytes"], "decoded_matches": 0, "physics_metrics_available": False}
