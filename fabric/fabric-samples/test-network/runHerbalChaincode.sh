#!/bin/bash
# Make sure you run: chmod +x runHerbalChaincode.sh

export ORDERER_CA=$PWD/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

PEER0_ORG1_TLS=$PWD/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
PEER0_ORG2_TLS=$PWD/organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt

CHANNEL="mychannel"
CHAINCODE="herbaltrace"

echo "=== Init Ledger ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C $CHANNEL -n $CHAINCODE \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_TLS \
  --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_TLS \
  --waitForEvent \
  -c '{"Args":["InitLedger"]}'

sleep 3

echo "=== Create HERB3 ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C $CHANNEL -n $CHAINCODE \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_TLS \
  --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_TLS \
  --waitForEvent \
  -c '{"Args":["CreateHerb","HERB3","Brahmi","India","50","Supplier3","2025-03-10","2026-03-10"]}'

sleep 3

echo "=== Transfer HERB3 to SupplierX ==="
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C $CHANNEL -n $CHAINCODE \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_TLS \
  --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_TLS \
  --waitForEvent \
  -c '{"Args":["TransferHerb","HERB3","SupplierX"]}'

sleep 3

echo "=== Query all herbs ==="
peer chaincode query -C $CHANNEL -n $CHAINCODE -c '{"Args":["GetAllHerbs"]}'

echo "=== Query HERB3 ==="
peer chaincode query -C $CHANNEL -n $CHAINCODE -c '{"Args":["ReadHerb","HERB3"]}'
