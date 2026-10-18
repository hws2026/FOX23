#!/usr/bin/env python3
"""Serve an extracted WLD package on this computer; never modify show data."""
import argparse
import functools
import json
import re
import sys
import threading
import webbrowser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

DEFAULT_PORT = 5502
REQUIRED = (
    'index.html', 'overlay.html', 'boot.js', 'bridge.js', 'runtime-worker.js',
    'core.py', 'team_library.py', 'nfl-2026.json', 'panel.js', 'panel.css',
    'graphics.js', 'graphics.css', 'cloud/config.js', 'cloud/sync.js',
    'cloud/delta.js', 'broadcast-logos226/assignments.json',
    'broadcast-logos236/mlb-assignments.json',
)
IMPORTS = re.compile(r'''(?:\bfrom\s*|\bimport\s*(?:\(\s*)?)["'](\.[^"']+)["']''')
HTML_LINKS = re.compile(r'''(?:src|href)\s*=\s*["']([^"']+)["']''', re.I)
CSS_URLS = re.compile(r'''url\(\s*["']?([^\s)'";]+)''', re.I)


def within_root(root, path):
    try:
        path.resolve().relative_to(root.resolve())
        return True
    except (ValueError, OSError, RuntimeError):
        return False


def preflight(root):
    """Check startup modules, their static dependencies, and bundled logo/photo paths."""
    root = Path(root).resolve()
    todo = list(REQUIRED)
    checked, errors = set(), []
    while todo:
        name = todo.pop()
        if name in checked:
            continue
        checked.add(name)
        path = root / name
        try:
            if not within_root(root, path) or not path.is_file():
                errors.append('Missing package file: ' + name)
                continue
            if path.stat().st_size == 0:
                errors.append('Empty package file: ' + name)
                continue
        except OSError as error:
            errors.append('Cannot access package file ' + name + ': ' + str(error))
            continue
        if path.suffix not in ('.js', '.css', '.html', '.json'):
            continue
        try:
            source = path.read_text(encoding='utf-8')
            links = []
            if path.suffix == '.js':
                links = IMPORTS.findall(source)
            elif path.suffix == '.html':
                links = HTML_LINKS.findall(source)
            elif path.suffix == '.css':
                links = CSS_URLS.findall(source)
            elif name == 'nfl-2026.json':
                catalog = json.loads(source)
                def assets(value):
                    if isinstance(value, dict):
                        for item in value.values():
                            assets(item)
                    elif isinstance(value, list):
                        for item in value:
                            assets(item)
                    elif isinstance(value, str) and value.startswith('assets/'):
                        todo.append(value)
                assets(catalog)
            elif name.endswith('/assignments.json'):
                assignments = json.loads(source)
                todo.extend('broadcast-logos226/teams/' + item['file'] for item in assignments['teams'])
                todo.extend('broadcast-logos226/' + item['file'] for item in assignments.get('marks', []))
            elif name.endswith('/mlb-assignments.json'):
                assignments = json.loads(source)
                todo.extend('broadcast-logos236/mlb/' + item['file'] for item in assignments['teams'])
            for link in links:
                parsed = urlsplit(link)
                if parsed.scheme or parsed.netloc or not parsed.path or '${' in link:
                    continue
                relative = unquote(parsed.path)
                target = (root / relative.lstrip('/')) if relative.startswith('/') else path.parent / relative
                if within_root(root, target):
                    # Navigation to an app directory is valid if it has an index.
                    if target.is_dir():
                        target = target / 'index.html'
                    todo.append(target.resolve().relative_to(root).as_posix())
                else:
                    errors.append('Package reference leaves this folder: ' + name)
        except (OSError, ValueError, KeyError, TypeError) as error:
            errors.append('Cannot read package file ' + name + ': ' + str(error))
    return sorted(set(errors)), len(checked)


class LocalHandler(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map,
                      '.js': 'text/javascript', '.mjs': 'text/javascript',
                      '.wasm': 'application/wasm'}

    def resolve_request(self):
        try:
            request_path = unquote(urlsplit(self.path).path, errors='strict')
        except (UnicodeError, ValueError):
            return None
        if '\x00' in request_path or '\\' in request_path:
            return None
        parts = request_path.split('/')
        if any(part.startswith('.') for part in parts if part):
            return None
        root = Path(self.directory).resolve()
        target = root.joinpath(*(part for part in parts if part))
        return target if within_root(root, target) else None

    def send_head(self):
        target = self.resolve_request()
        root = Path(self.directory).resolve()
        if target is None:
            self.send_error(403, 'This path is outside the show package.')
            return None
        if target.is_dir():
            for name in ('index.html', 'index.htm'):
                index = target / name
                if index.exists() and not within_root(root, index):
                    self.send_error(403, 'This path is outside the show package.')
                    return None
        return super().send_head()

    def translate_path(self, path):
        # send_head rejects unsafe paths before the standard handler opens them.
        target = self.resolve_request()
        return str(target) if target is not None else str(Path(self.directory) / '__blocked__')

    def list_directory(self, path):
        self.send_error(403, 'Directory listing is disabled.')
        return None

    def end_headers(self):
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    def log_message(self, format, *args):
        # Only failed requests need attention during a show.
        if len(args) > 1 and str(args[1]).startswith(('4', '5')):
            super().log_message(format, *args)


def make_server(root, port):
    handler = functools.partial(LocalHandler, directory=str(Path(root).resolve()))
    return ThreadingHTTPServer(('127.0.0.1', port), handler)


def main(argv=None):
    parser = argparse.ArgumentParser(description='Start a local WLD show on this computer.')
    parser.add_argument('--check', action='store_true', help='Check package files without opening a browser or server.')
    parser.add_argument('--no-browser', action='store_true', help='Start the server without opening a browser.')
    parser.add_argument('--port', type=int, default=DEFAULT_PORT, help='Advanced: use a different port (a different browser show).')
    args = parser.parse_args(argv)
    if not 1 <= args.port <= 65535:
        parser.error('--port must be between 1 and 65535')
    root = Path(__file__).resolve().parent
    errors, count = preflight(root)
    if errors:
        print('WLD could not start: the extracted package is incomplete.', file=sys.stderr)
        for error in errors[:30]:
            print('  ' + error, file=sys.stderr)
        if len(errors) > 30:
            print('  ... and ' + str(len(errors) - 30) + ' more missing or invalid files.', file=sys.stderr)
        print('Extract the COMPLETE LOCAL package, keeping every folder. An UPDATE ZIP alone is not a fresh installation.\nDo not move index.html out of its folder. Your saved show has not been changed.', file=sys.stderr)
        return 1
    print('Package check passed (' + str(count) + ' files).', flush=True)
    if args.check:
        return 0
    try:
        server = make_server(root, args.port)
    except OSError as error:
        print('Cannot start http://127.0.0.1:' + str(args.port) + '/: ' + str(error), file=sys.stderr)
        print('If a local show server is already running, use its window. Otherwise close the app using this port and retry. This launcher will not stop another process or silently change your show address.', file=sys.stderr)
        return 1
    url = 'http://127.0.0.1:' + str(args.port) + '/index.html'
    print('Local show: ' + url + '\nKeep this window open. Press Ctrl+C here to stop the server.\nFirst startup needs internet for the browser engine; live feeds also need internet.', flush=True)
    if args.port != DEFAULT_PORT:
        print('Different ports have separate browser saves. Export/import your show to move between addresses.', flush=True)
    if not args.no_browser:
        def open_browser():
            try:
                if not webbrowser.open(url):
                    print('Open the local show URL above in your browser.', flush=True)
            except Exception:
                print('Open the local show URL above in your browser.', flush=True)
        threading.Thread(target=open_browser, daemon=True).start()
    try:
        with server:
            server.serve_forever()
    except KeyboardInterrupt:
        print('\nLocal server stopped. Browser-saved show data was not deleted.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
