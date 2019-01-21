#!/bin/bash
rm -rf /home/akash/.hfc-key-store
cd ./../basic-network
rm -rf ./ipfs

./stop.sh
./teardown.sh