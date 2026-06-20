#!/usr/bin/env bash
# Fix: the SPA route /games collided with the static /games/ asset directory,
# so nginx 301-redirected /games -> /games/ -> 403 on direct load/refresh.
# Dropping `$uri/` from the SPA fallback makes /games serve the app shell;
# the static games files are still served by the separate `location /games/`.
set -e
for f in /etc/nginx/sites-available/axolittles.io.conf /etc/nginx/sites-available/axolittles.cterminal.xyz.conf; do
  [ -f "$f" ] && sudo sed -i 's#try_files $uri $uri/ /index.html;#try_files $uri /index.html;#g' "$f" && echo "patched $f"
done
sudo nginx -t && sudo systemctl reload nginx && echo NGINX_FIXED
