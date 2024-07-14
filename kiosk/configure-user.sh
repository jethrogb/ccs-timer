#!/bin/bash -xe
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

# .bashrc: If this is a login shell on tty1 (autologin), run startx
sed -i ~/.bashrc \
    -e '$aif [ `tty` = /dev/tty1 ]; then exec startx &> ~/.xsession-errors; fi' \
    -e '/startx/d'

# .xinitrc: start cwm, unclutter, luakit
echo > ~/.xinitrc \
'nohup cwm &
nohup unclutter --timeout 0 &
rm -rf ~/.local/share/luakit ~/.cache/luakit
exec luakit http://localhost'

# luakit userconf: always fullscreen
mkdir -p ~/.config/luakit
echo > ~/.config/luakit/userconf.lua \
'local window = require "window"
window.add_signal("init", function (w)
    w.win.maximazed = true;
    w.win.fullscreen = true;
end)'
