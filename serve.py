#!/usr/bin/env python3
"""Local testing HTTP and HTTPS server for Sandtrix Mobile.
Serves current directory with HTTPS on port 8443 (required for mobile gyro/sensors)
and HTTP on port 8080.
"""

import http.server
import socket
import socketserver
import ssl
import threading
import os
import sys

# Ensure UTF-8 output on Windows consoles
if sys.platform == 'win32':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

HTTP_PORT = 8080
HTTPS_PORT = 8443

def get_local_ip():
    """Retrieve the primary local LAN IP address."""
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS and disable caching during dev
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run_https(local_ip, cert_path):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", HTTPS_PORT), CustomHandler) as httpd:
        ssl_ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        ssl_ctx.load_cert_chain(cert_path)
        httpd.socket = ssl_ctx.wrap_socket(httpd.socket, server_side=True)
        try:
            httpd.serve_forever()
        except Exception:
            pass

def run_http(local_ip):
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", HTTP_PORT), CustomHandler) as httpd:
        try:
            httpd.serve_forever()
        except Exception:
            pass

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    local_ip = get_local_ip()
    cert_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cert.pem")

    has_ssl = os.path.exists(cert_path)

    print("=" * 64)
    print("         SANDTRIX MOBILE - LOCAL TESTING SERVER")
    print("=" * 64)
    print("")
    if has_ssl:
        print("  [RECOMMENDED FOR REAL HARDWARE GYRO ON MOBILE]:")
        print(f"  👉  HTTPS:  https://{local_ip}:{HTTPS_PORT}")
        print("      (Open in Chrome/Safari, click 'Advanced' -> 'Proceed')")
        print("      * HTTPS unlocks full hardware gyroscope & rotation sensors!")
        print("")
    print("  [STANDARD HTTP]:")
    print(f"  👉  HTTP:   http://{local_ip}:{HTTP_PORT}")
    print(f"  👉  LOCAL:  http://localhost:{HTTP_PORT}")
    print("")
    print("=" * 64)
    print("  * ROTATE YOUR PHONE: Detected automatically in real time!")
    print("  * FLICK / TWIST PHONE: Rotates the tetromino shape!")
    print("  * TILT PHONE: Steers piece and sloshes sand & water!")
    print("  * SHAKE PHONE: Slams piece down (Hard Drop)!")
    print("  * Press Ctrl+C in this terminal to stop the server.")
    print("=" * 64)
    print("")

    threads = []
    if has_ssl:
        t_https = threading.Thread(target=run_https, args=(local_ip, cert_path), daemon=True)
        t_https.start()
        threads.append(t_https)

    t_http = threading.Thread(target=run_http, args=(local_ip,), daemon=True)
    t_http.start()
    threads.append(t_http)

    try:
        for t in threads:
            t.join()
    except KeyboardInterrupt:
        print("\nServer stopped.")

if __name__ == '__main__':
    main()
