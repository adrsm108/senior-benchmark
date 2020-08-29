#!/bin/bash

systemctl stop seniorbenchmark.service

echo "Node Server Stopped"

journalctl -u seniorbenchmark.service | tail -n 300

sleep 3

echo "Pulling from repo"

git pull

sleep 5

echo "Trying to build"

npm build

echo "Attempting to Restart"

systemctl restart seniorbenchmark

journalctl -u seniorbenchmark.service | tail -n 300
