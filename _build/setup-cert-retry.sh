#!/usr/bin/env bash
# Installs a self-removing root cron that issues the axolittles.io TLS cert as
# soon as DNS finishes propagating to this box (LE currently still sees Netlify).
set -euo pipefail

sudo tee /srv/dapp/axolittles/issue-cert.sh >/dev/null <<'EOS'
#!/usr/bin/env bash
# Runs as root via cron. Issues axolittles.io cert once LE can validate, then self-removes.
if [ -d /etc/letsencrypt/live/axolittles.io ]; then
  crontab -l 2>/dev/null | grep -v '/srv/dapp/axolittles/issue-cert.sh' | crontab - || true
  exit 0
fi
certbot --nginx -d axolittles.io -d www.axolittles.io --non-interactive --agree-tos \
  -m chetan.nxg@gmail.com --redirect >> /var/log/axolittles-cert.log 2>&1 || true
if [ -d /etc/letsencrypt/live/axolittles.io ]; then
  systemctl reload nginx
  crontab -l 2>/dev/null | grep -v '/srv/dapp/axolittles/issue-cert.sh' | crontab - || true
fi
EOS
sudo chmod +x /srv/dapp/axolittles/issue-cert.sh

# Install/refresh the root cron (every 20 min — under LE's failed-validation rate limit)
( sudo crontab -l 2>/dev/null | grep -v '/srv/dapp/axolittles/issue-cert.sh'; \
  echo '*/20 * * * * /srv/dapp/axolittles/issue-cert.sh' ) | sudo crontab -

echo "CERT_RETRY_INSTALLED"
sudo crontab -l | grep issue-cert.sh
