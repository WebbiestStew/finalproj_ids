#!/bin/sh
set -e

DATA_DIR="$(dirname "${DB_PATH:-/app/data/dauto.db}")"
mkdir -p "$DATA_DIR"

# Hosts mount volumes owned by root; without this the unprivileged user can't write the database.
if [ "$(id -u)" = "0" ]; then
  chown -R node:node "$DATA_DIR"
  exec su-exec node "$@"
fi

exec "$@"
