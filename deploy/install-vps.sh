#!/usr/bin/env bash
set -euo pipefail

archive="${1:-}"
release_id="${2:-}"
domain="landing.redline-tutors.ru"
server_ip="89.108.81.82"

if [[ ! "$archive" =~ ^/tmp/redline-landing-[0-9]{14}\.tar\.gz$ ]]; then
  echo "Unexpected archive path" >&2
  exit 1
fi

if [[ ! "$release_id" =~ ^[0-9]{14}$ ]]; then
  echo "Unexpected release id" >&2
  exit 1
fi

release_dir="/var/www/redline-landing-releases/$release_id"
install -d -m 0755 "$release_dir" /opt/redline-landing-api
tar -xzf "$archive" -C "$release_dir"
test -s "$release_dir/index.html"
test -s "$release_dir/parent-review-video.mp4"
chown -R www-data:www-data "$release_dir"

ln -sfn "$release_dir" /var/www/redline-landing-next
mv -Tf /var/www/redline-landing-next /var/www/redline-landing

install -m 0644 /tmp/redline-landing-api-server.mjs /opt/redline-landing-api/server.mjs
install -m 0644 /tmp/redline-landing-api.service /etc/systemd/system/redline-landing-api.service

if [[ ! -f /etc/nginx/sites-available/redline-landing ]]; then
  install -m 0644 /tmp/redline-landing.nginx.conf /etc/nginx/sites-available/redline-landing
fi
ln -sfn /etc/nginx/sites-available/redline-landing /etc/nginx/sites-enabled/redline-landing

systemctl daemon-reload
systemctl enable --now redline-landing-api.service
systemctl restart redline-landing-api.service
for attempt in {1..10}; do
  if curl --fail --silent http://127.0.0.1:4100/health >/dev/null; then
    break
  fi
  if [[ "$attempt" == "10" ]]; then
    systemctl status redline-landing-api.service --no-pager -l >&2
    exit 1
  fi
  sleep 1
done

nginx -t
systemctl reload nginx

resolved_ip="$(getent ahostsv4 "$domain" 2>/dev/null | awk 'NR == 1 { print $1 }' || true)"
if [[ "$resolved_ip" == "$server_ip" ]] && [[ ! -d "/etc/letsencrypt/live/$domain" ]]; then
  certbot --nginx --non-interactive --agree-tos --redirect \
    --register-unsafely-without-email -d "$domain"
fi

rm -f "$archive" \
  /tmp/redline-landing-api-server.mjs \
  /tmp/redline-landing-api.service \
  /tmp/redline-landing.nginx.conf \
  /tmp/redline-landing-install.sh

echo "Deployment complete: $release_id"
