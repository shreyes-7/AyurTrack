#!/bin/bash

export FABRIC_CFG_PATH=${PWD}

CHANNEL_NAME=ayurchannel

echo "Generating genesis block..."
configtxgen -profile AyurGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block

echo "Generating channel configuration transaction..."
configtxgen -profile AyurChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME

echo "Generating anchor peer update transactions..."

configtxgen -profile AyurChannel -outputAnchorPeersUpdate ./channel-artifacts/FarmerOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg FarmerMSP

configtxgen -profile AyurChannel -outputAnchorPeersUpdate ./channel-artifacts/ProcessorOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ProcessorMSP

configtxgen -profile AyurChannel -outputAnchorPeersUpdate ./channel-artifacts/CollectorOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg CollectorMSP

configtxgen -profile AyurChannel -outputAnchorPeersUpdate ./channel-artifacts/LabOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg LabMSP

configtxgen -profile AyurChannel -outputAnchorPeersUpdate ./channel-artifacts/ManufacturerOrgMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ManufacturerMSP
