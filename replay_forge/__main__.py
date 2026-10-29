"""Replay Forge scanner and minimal read-only HTTP API."""
from __future__ import annotations

import argparse
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

from .library import list_replays, scan, summary

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)
        if parsed.path == "/health":
            data = {"status": "ok", "service": "replay-forge"}
        elif parsed.path == "/summary":
            data = summary()
        elif parsed.path == "/replays":
            try:
                limit = int(params.get("limit", ["100"])[0])
                offset = int(params.get("offset", ["0"])[0])
                query = params.get("search", [""])[0]
                data = {"items": list_replays(limit=limit, offset=offset, search=query)}
            except ValueError:
                self.send_error(400, "Invalid pagination")
                return
        else:
            self.send_error(404, "Not found")
            return
        body = json.dumps(data).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "http://localhost:5173")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

def main() -> None:
    parser = argparse.ArgumentParser(description="Replay Forge local library")
    sub = parser.add_subparsers(dest="command", required=True)
    scanner = sub.add_parser("scan", help="Index replay files recursively")
    scanner.add_argument("directory", help="Root directory")
    server = sub.add_parser("serve", help="Serve library JSON on localhost")
    server.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()
    if args.command == "scan":
        print(json.dumps(scan(args.directory), indent=2))
    else:
        address = ("127.0.0.1", args.port)
        print(f"Replay Forge API listening on http://{address[0]}:{address[1]}", flush=True)
        ThreadingHTTPServer(address, Handler).serve_forever()

if __name__ == "__main__":
    main()
