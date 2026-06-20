#!/usr/bin/env bash
# Adds a reliable HTTPS temp host (axolittles.cterminal.xyz → already wildcard-
# resolves to this box) for the Axolittles SPA, while axolittles.io DNS propagates.
set -euo pipefail
HOST=axolittles.cterminal.xyz

sudo tee /etc/nginx/sites-available/$HOST.conf >/dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $HOST;
    root /srv/dapp/axolittles/dist;
    index index.html;
    add_header X-Content-Type-Options "nosniff" always;

    location /assets/ { try_files \$uri =404; access_log off; expires 30d; add_header Cache-Control "public, immutable"; }
    location /games/  { try_files \$uri \$uri/ =404; }
    location = /index.html { add_header Cache-Control "no-cache"; }
    location /        { try_files \$uri /index.html; }
}
NGINX

sudo ln -sf /etc/nginx/sites-available/$HOST.conf /etc/nginx/sites-enabled/$HOST.conf
sudo nginx -t
sudo systemctl reload nginx

if sudo certbot --nginx -d $HOST --non-interactive --agree-tos -m chetan.nxg@gmail.com --redirect; then
  echo "CERTBOT_OK"
else
  echo "CERTBOT_FAILED"
fi
sudo systemctl reload nginx
curl -skS -o /dev/null -w "  https $HOST -> %{http_code}\n" https://$HOST/ || true
echo "TEMP_DEPLOY_DONE"
