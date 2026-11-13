#!/usr/bin/env python3
"""Local SPA server with direct-route fallback; requires only Python 3."""

import argparse
import os
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


PROJECT = Path(__file__).resolve().parent.parent


class SPAHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, root, **kwargs):
        self.root = root
        super().__init__(*args, directory=str(root), **kwargs)

    def do_GET(self):
        self._route()
        super().do_GET()

    def do_HEAD(self):
        self._route()
        super().do_HEAD()

    def _route(self):
        path = unquote(urlsplit(self.path).path)
        if path == '/favicon.ico':
            self.path = '/icons/platform.svg'
            path = self.path
        if path.startswith('/icons/') and (self.root / 'public').is_dir():
            self.path = '/public' + path
            return
        requested = (self.root / path.lstrip('/')).resolve()
        if not requested.is_relative_to(self.root):
            return
        # SPA pages have extensionless URLs. Missing static files remain 404s.
        if not requested.is_file() and not Path(path).suffix:
            self.path = '/index.html'

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        super().end_headers()


def main():
    parser = argparse.ArgumentParser(description='Servidor local de Security Platform')
    parser.add_argument('--port', type=int, default=int(os.environ.get('PORT', '4173')))
    parser.add_argument('--bind', default='127.0.0.1')
    parser.add_argument('--dist', action='store_true', help='Servir la compilación dist/')
    args = parser.parse_args()
    root = (PROJECT / 'dist' if args.dist else PROJECT).resolve()
    if not (root / 'index.html').is_file():
        parser.error(f'No existe {root / "index.html"}. Ejecuta npm run build primero.')
    handler = partial(SPAHandler, root=root)
    with ThreadingHTTPServer((args.bind, args.port), handler) as server:
        print(f'Security Platform: http://{args.bind}:{args.port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print('\nServidor detenido.')


if __name__ == '__main__':
    main()
