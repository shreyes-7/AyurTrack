#!/bin/bash
set -e
cd "$(dirname "$0")"/..
echo "Generating crypto material with cryptogen..."
cryptogen generate --config=./crypto-config.yaml --output=./crypto-config
echo "crypto material generated at ./crypto-config"
