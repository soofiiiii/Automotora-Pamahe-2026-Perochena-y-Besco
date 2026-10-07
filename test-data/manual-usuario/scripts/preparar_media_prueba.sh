#!/usr/bin/env bash
set -euo pipefail
PROJECT_ROOT="${1:-.}"
PACKAGE_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$PROJECT_ROOT/backend/uploads"
SOURCE="$PACKAGE_ROOT/media/uploads"
[[ -d "$PROJECT_ROOT/backend" ]] || { echo "No encuentro backend en $PROJECT_ROOT" >&2; exit 1; }
echo "ATENCION: se limpiará $TARGET"
rm -rf "$TARGET"
mkdir -p "$TARGET"
cp -R "$SOURCE"/. "$TARGET"/
echo "Media de prueba preparada en $TARGET"
