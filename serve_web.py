#!/usr/bin/env python3
"""
Local development server for Dinkball web export.

Godot 4 WebAssembly builds require Cross-Origin-Opener-Policy and
Cross-Origin-Embedder-Policy headers — this server adds them automatically.

Usage:
    1. In the Godot editor: Editor → Manage Export Templates → Download (4.6.1)
    2. Project → Export → Add → Web → Export Project → export/web/index.html
    3. python3 serve_web.py
    4. Open http://localhost:8080 in your browser
"""

import http.server
import os
import sys

PORT    = 8080
WEBDIR  = os.path.join(os.path.dirname(__file__), "export", "web")


class CORPHandler(http.server.SimpleHTTPRequestHandler):
    """SimpleHTTPRequestHandler with the COOP/COEP headers Godot 4 requires."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEBDIR, **kwargs)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy",   "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        self.send_header("Cache-Control", "no-cache, no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        print(f"  {self.address_string()} → {fmt % args}")


if __name__ == "__main__":
    if not os.path.isdir(WEBDIR):
        print(f"[!] Export directory not found: {WEBDIR}")
        print("    Run 'Project → Export → Web' in the Godot editor first.")
        sys.exit(1)

    print(f"[Dinkball] Serving from: {WEBDIR}")
    print(f"[Dinkball] Open → http://localhost:{PORT}")
    print(f"[Dinkball] Press Ctrl+C to stop\n")

    with http.server.HTTPServer(("", PORT), CORPHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n[Dinkball] Server stopped.")
