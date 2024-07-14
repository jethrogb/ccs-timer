# Raspberry Pi Zero W setup

## Setup SD card

Use rpi-imager to build a Raspbian disk with the following settings:

* General settings
	* Set hostname
	* Set username and password (any password, it will be removed)
	* Set local settings
* Services settings
	* Enable SSH
		* Allow public-key authentication only

Then, open a shell in the bootfs partition (you may need to remount your SD
card after imaging), and run `rpi-zero-reconfig.sh`. This sets up the USB
console and removes the user password.

## Establish connectivity

Put the SD card in the RPi Zero W and wait for it to boot up. It will take
several minutes, especially on first boot. You should be able to connect to the
console via the Micro-USB port like so:

```
screen /dev/ttyACM0
```

Once connected, login as with the username you configured earlier. Then, setup
Wi-Fi:

```
sudo nmtui
```

You should now be able to SSH in.

```
ssh YOUR_USER@IP -i /path/to/ssh_key
```

## Install software

Setup your CCS API endpoint and credentials in `configure.sh`, modifying the
two appropriate lines like so:

```
CCS_API_URL=https://open.kattis.com/api
CCS_API_KEY="$(echo -n YOUR_USER:YOUR_API_KEY|base64)"
```

Now, install the necessary software packages, this software, and configure the
RPi for kiosk mode:

```
./install.sh YOUR_USER@IP -i /path/to/ssh_key
```
