#!/bin/bash -e
#
# Copyright (c) Jethro G. Beekman
#
# This file is part of CCS timer.
#
# CCS timer program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as published
# by the Free Software Foundation, either version 3 of the License, or (at
# your option) any later version.
#
# This program is distributed in the hope that it will be useful, but
# WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY
# or FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public
# License for more details.
#
# You should have received a copy of the GNU Affero General Public License
# along with this program. If not, see <https://www.gnu.org/licenses/>.

CCS_API_URL=
CCS_API_KEY=

if [ -z "$CCS_API_URL" ] || [ -z "$CCS_API_KEY" ]; then
	echo ERROR: Make sure to set CCS_API_URL and CCS_API_KEY in configure.sh
	exit 1
fi

sudo -u $SUDO_USER "$(dirname "$0")"/configure-user.sh

cd -- "$(dirname "$0")"/../..
set -x

raspi-config nonint do_blanking 1
# autologin (console)
raspi-config nonint do_boot_behaviour B2

systemctl stop lightdm
systemctl disable lightdm

rm -r html/kiosk

systemctl stop packagekit || true
systemctl disable packagekit || true
apt-get -y update
apt-get -y purge packagekit xscreensaver firefox
apt-get -y install --no-install-recommends cwm luakit nginx unclutter-xfixes
apt-get -y autopurge

# Configure NGINX
mkdir -p /etc/systemd/system/nginx.service.d
echo > /etc/systemd/system/nginx.service.d/restart.conf \
'[Service]
Restart=always
RestartSec=5'
cat <<EOT > /etc/nginx/sites-available/default
server {
	listen localhost:80 default_server;

	root /var/www/html;

	index index.html;

	server_name _;

	location /api {
		proxy_ssl_server_name on;
		proxy_pass $CCS_API_URL;
		proxy_set_header Authorization "Basic $CCS_API_KEY";
	}
	location / {
		try_files \$uri \$uri/ =404;
	}
}
EOT
systemctl daemon-reload
systemctl restart nginx || true

chown -R root:root html
chmod ugo+rX html
rm -r /var/www/html
mv html /var/www/html
