#!/bin/sh
set -e

cat > /usr/share/nginx/html/env-config.js << EOF
window.__ENV = {
  VITE_API_BASE_URL: "${VITE_API_BASE_URL}",
  VITE_API_KEY: "${VITE_API_KEY}",
  VITE_APP_NAME: "${VITE_APP_NAME}"
};
EOF

exec "$@"
