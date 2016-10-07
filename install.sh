#!/bin/bash

echo "Installing NodeJS 4.x..."

sudo apt-get update
curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Installing Java JDK 8"

sudo apt-get install -y openjdk-8-jre

echo "Installing MongoDB 3.2.10..."

sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv EA312927
echo "deb http://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/3.2 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.2.list
sudo apt-get update
sudo apt-get install -y mongodb-org=3.2.10 mongodb-org-server=3.2.10 mongodb-org-shell=3.2.10 mongodb-org-mongos=3.2.10 mongodb-org-tools=3.2.10

echo "Starting MongoDB..."

sudo mkdir -p /data/db
sudo service mongod start

echo "Downloading YCSB visualization release"

curl -O --location https://github.com/ArchangelX360/ycsb-visualization/releases/download/0.10.0-visualisation/ycsb-0.10.0-visualization-release.tar.gz
tar -zxvf ycsb-0.10.0-visualization-release.tar.gz

echo "Installing Node packages..."
npm install
cd public/
npm install

echo "Installing memcached..."

sudo apt-get install memcached
sudo service memcached stop

echo "You need to configure your path in config files, see README.md"

