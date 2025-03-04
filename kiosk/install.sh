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

cd -- "$(dirname "$0")"/..
host=$1
shift
rsync --rsh="ssh $*" --relative --mkpath -arv *.html resources/ scripts/ api/contests/manual kiosk/configure*.sh $host:setup/html/
ssh "$@" $host sudo setup/html/kiosk/configure.sh
