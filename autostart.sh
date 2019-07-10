#!/bin/bash
cd /home/pi/dev/SpotUtils/
sudo forever stop SpotUtilsServer
sudo npm run build
sudo forever start -a --uid "SpotUtilsServer" ./dist/server/index.js
