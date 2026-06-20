#!/usr/bin/env bash
# Deploys the prebuilt Axolittles SPA (already rsynced to /tmp/axo-dist) to
# /srv/dapp/axolittles/dist behind nginx for axolittles.io + www, with LE TLS.
set -euo pipefail

APP=/srv/dapp/axolittles
SRC=/tmp/axo-dist

echo ">> placing files"
sudo mkdir -p "$APP/dist"
sudo rsync -a --delete "$SRC/" "$APP/dist/"
sudo chown -R www-data:www-data "$APP/dist" 2>/dev/null || true

echo ">> writing nginx config"
sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
sudo tee /etc/nginx/sites-available/axolittles.io.conf >/dev/null <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name axolittles.io www.axolittles.io;

    root /srv/dapp/axolittles/dist;
    index index.html;

    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Hashed build assets — cache hard
    location /assets/ {
        try_files $uri =404;
        access_log off;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Embedded static games (vanilla JS/canvas) — served verbatim
    location /games/ {
        try_files $uri $uri/ =404;
    }

    location = /index.html { add_header Cache-Control "no-cache"; }

    # SPA fallback (React Router). No `$uri/` — it would 301 /games -> /games/
    # (the static games dir) and 403 on direct load; this serves the app shell.
    location / {
        try_files $uri /index.html;
    }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/axolittles.io.conf /etc/nginx/sites-enabled/axolittles.io.conf

echo ">> testing + reloading nginx"
sudo nginx -t
sudo systemctl reload nginx

echo ">> obtaining TLS cert"
if sudo certbot --nginx -d axolittles.io -d www.axolittles.io \
      --non-interactive --agree-tos -m chetan.nxg@gmail.com --redirect; then
  echo "CERTBOT_OK"
else
  echo "CERTBOT_FAILED — site is live on HTTP, retry cert later"
fi
sudo systemctl reload nginx

echo ">> local health checks"
curl -sS -o /dev/null -w "  http  Host=axolittles.io -> %{http_code}\n" http://127.0.0.1/ -H 'Host: axolittles.io' || true
curl -skS -o /dev/null -w "  https axolittles.io     -> %{http_code}\n" https://axolittles.io/ --resolve axolittles.io:443:127.0.0.1 || true
echo "DEPLOY_DONE"
