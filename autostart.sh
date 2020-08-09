#!/bin/bash
cd /home/pi/dev/SpotUtils/
sudo forever stop SpotUtilsServer
sudo yarn build
sudo forever start -a --uid "SpotUtilsServer" ./dist/index.js
