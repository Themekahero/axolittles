#!/usr/bin/env bash
# Places the freshly-rsynced build behind nginx.
#
# NOTE: gzip is NOT configured here. The box's main /etc/nginx/nginx.conf already
# has `gzip on` + gzip_types for JS/CSS/JSON globally, so writing a conf.d gzip
# file duplicated `gzip on;` and broke `nginx -t`. Compression is handled by the
# main conf — verified below.
set -euo pipefail

# IMPORTANT: exclude server-maintained assets that don't ship in the build —
#   rhymes.json : the YouTube catalog refreshed by the refresh-rhymes cron
#   audio/      : the pre-recorded same-origin voice clips (175 m4a + manifest)
# Without these excludes, --delete wipes them on every deploy.
sudo rsync -a --delete --exclude='rhymes.json' --exclude='audio' /tmp/axo-dist/ /srv/dapp/axolittles/dist/
sudo chown -R www-data:www-data /srv/dapp/axolittles/dist 2>/dev/null || true

sudo nginx -t
sudo systemctl reload nginx
echo "DEPLOYED"

# verify the new build is served + compressed
JS=$(ls -1 /srv/dapp/axolittles/dist/assets/*.js | head -1 | sed 's#.*/dist##')
echo "checking $JS"
curl -sI -H 'Accept-Encoding: gzip' "https://axolittles.io${JS}" | grep -iE 'content-encoding|content-type' || true
