#!/bin/bash
# AyurTrack Fabric network script (WSL/Git Bash compatible)

# Absolute path to Fabric test-network
FABRIC_SAMPLES_PATH=$(pwd)/fabric-samples/test-network

# Smart contract path
CHAINCODE_PATH=$(pwd)/chaincode/herbalTrace

# Function to start network
startNetwork() {
    echo "Starting Hyperledger Fabric network..."
    cd $FABRIC_SAMPLES_PATH || { echo "test-network folder not found!"; exit 1; }

    # Bring up the network with a channel
    ./network.sh up createChannel -c mychannel -ca
    if [ $? -ne 0 ]; then
        echo "Failed to start network"; exit 1
    fi

    # Deploy chaincode
    ./network.sh deployCC -ccn herbalTrace -ccp $CHAINCODE_PATH -ccl javascript
    if [ $? -ne 0 ]; then
        echo "Failed to deploy chaincode"; exit 1
    fi

    echo "Fabric network is up and chaincode deployed!"
}

# Function to stop network
stopNetwork() {
    echo "Stopping Hyperledger Fabric network..."
    cd $FABRIC_SAMPLES_PATH || { echo "test-network folder not found!"; exit 1; }
    ./network.sh down
    echo "Network stopped."
}

# Script arguments
case "$1" in
  up)
    startNetwork
    ;;
  down)
    stopNetwork
    ;;
  *)
    echo "Usage: ./network.sh [up|down]"
    ;;
esac
