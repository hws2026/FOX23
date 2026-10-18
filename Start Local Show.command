#!/bin/sh
cd "$(dirname "$0")" || exit 1
if command -v python3 >/dev/null 2>&1 && python3 -c 'import sys; sys.exit(sys.version_info < (3, 7))' >/dev/null 2>&1; then
  python3 start-local.py "$@"
  result=$?
else
  printf '%s\n' 'Python 3 is required for this local launcher.' 'Install Python 3 from https://www.python.org/downloads/ then run this file again.'
  result=1
fi
if [ "$result" -ne 0 ]; then
  printf '\nPress Enter to close this window.'
  read -r answer
fi
exit "$result"
