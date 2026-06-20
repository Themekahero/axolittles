#!/usr/bin/env bash
# Places the freshly-rsynced build and enables gzip for JS/CSS (the big perf win).
set -euo pipefail

# IMPORTANT: exclude server-maintained assets that don't ship in the build —
#   rhymes.json : the YouTube catalog refreshed by the refresh-rhymes cron
#   audio/      : the pre-recorded same-origin voice clips (172+ m4a + manifest)
# Without these excludes, --delete wipes them on every deploy.
sudo rsync -a --delete --exclude='rhymes.json' --exclude='audio' /tmp/axo-dist/ /srv/dapp/axolittles/dist/

# Enable gzip for application assets (global; merges with http{} defaults).
sudo tee /etc/nginx/conf.d/axo-gzip.conf >/dev/null <<'GZIP'
gzip on;
gzip_vary on;
gzip_comp_level 6;
gzip_min_length 1024;
gzip_proxied any;
gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml application/xml+rss;
GZIP

sudo nginx -t
sudo systemctl reload nginx
echo "DEPLOYED + GZIP"
# verify compression on the JS asset
JS=$(ls -1 /srv/dapp/axolittles/dist/assets/*.js | head -1 | sed 's#.*/dist##')
echo "checking $JS"
curl -sI -H 'Accept-Encoding: gzip,br' "https://axolittles.cterminal.xyz${JS}" | grep -iE 'content-encoding|content-length' || true
