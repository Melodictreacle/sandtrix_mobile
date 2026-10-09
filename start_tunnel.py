#!/usr/bin/env python3
"""Automated Trusted HTTPS Launcher for Sandtrix Mobile.
Starts local HTTP server + Cloudflare Tunnel for trusted SSL.
Eliminates all 'Not Safe' warnings and unlocks hardware motion sensors on phones.
"""

import subprocess
import threading
import http.server
import socketserver
import os
import sys
import time
import re

PORT = 8080

def start_http_server():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    handler = http.server.SimpleHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True
    try:
        with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
            httpd.serve_forever()
    except Exception:
        pass

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(base_dir)
    cloudflared_path = os.path.join(base_dir, "cloudflared.exe")

    if not os.path.exists(cloudflared_path):
        print(f"[ERROR] cloudflared.exe not found at {cloudflared_path}", flush=True)
        input("Press Enter to exit...")
        return

    # Start local HTTP server in background thread
    server_thread = threading.Thread(target=start_http_server, daemon=True)
    server_thread.start()
    time.sleep(1)

    print("======================================================================", flush=True)
    print("            SANDTRIX MOBILE - STARTING SECURE TUNNEL                  ", flush=True)
    print("======================================================================", flush=True)
    print("Connecting to secure cloud gateway for trusted HTTPS...", flush=True)

    # Start cloudflared
    cmd = [cloudflared_path, "tunnel", "--url", f"http://127.0.0.1:{PORT}", "--no-autoupdate"]
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        universal_newlines=True,
        bufsize=1
    )

    tunnel_url = None
    url_pattern = re.compile(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com')

    try:
        for line in proc.stdout:
            match = url_pattern.search(line)
            if match and not tunnel_url:
                tunnel_url = match.group(0)
                print("", flush=True)
                print("======================================================================", flush=True)
                print("             [OK] TRUSTED SECURE CONNECTION READY!                    ", flush=True)
                print("======================================================================", flush=True)
                print("", flush=True)
                print("  -->  OPEN THIS LINK ON YOUR PHONE BROWSER:", flush=True)
                print(f"       {tunnel_url}", flush=True)
                print("", flush=True)
                print("  * 100% VALID SSL CERTIFICATE -- NO 'NOT SAFE' WARNING!", flush=True)
                print("  * HARDWARE GYROSCOPE & ROTATION SENSORS UNLOCKED!", flush=True)
                print("  * TAP CHROME MENU (3 dots) -> 'INSTALL APP' FOR STANDALONE APK!", flush=True)
                print("", flush=True)
                print("======================================================================", flush=True)
                print("Keep this terminal open while playing. Press Ctrl+C to stop.", flush=True)
                print("======================================================================", flush=True)
                print("", flush=True)
    except KeyboardInterrupt:
        print("\nStopping tunnel...", flush=True)
    finally:
        proc.terminate()

if __name__ == '__main__':
    main()
