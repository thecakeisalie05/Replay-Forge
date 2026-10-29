"""Offline, stdlib-only tests for replay directory scanning."""
import tempfile
import unittest
from pathlib import Path

from replay_forge.library import list_replays, scan, summary

class LibraryTest(unittest.TestCase):
    def test_recursive_index_and_idempotency(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            folder = root / "nested"
            folder.mkdir()
            (folder / "a.replay").write_bytes(b"replay sample")
            (folder / "ignored.txt").write_bytes(b"nothing")
            db = root / "database.sqlite3"
            first = scan(root, db)
            self.assertEqual(first["found"], 1)
            self.assertEqual(first["indexed"], 1)
            second = scan(root, db)
            self.assertEqual(second["unchanged"], 1)
            rows = list_replays(db)
            self.assertEqual(len(rows), 1)
            self.assertEqual(rows[0]["status"], "awaiting_decoder")
            self.assertFalse(summary(db)["physics_metrics_available"])

    def test_missing_directory(self):
        with tempfile.TemporaryDirectory() as temp:
            with self.assertRaises(ValueError):
                scan(Path(temp) / "no-such-dir", Path(temp) / "db.sqlite3")

if __name__ == "__main__":
    unittest.main()
