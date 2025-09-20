# AyurTrack Blockchain Traceability

AyurTrack is a Hyperledger Fabric-based traceability system for Ayurvedic herbs.  
It allows stakeholders (suppliers, collectors, regulators) to **track the lifecycle of herbs**, validate quality, and ensure compliance with geofence and harvesting rules.

---

## Table of Contents
- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup Instructions](#setup-instructions)
- [Chaincode Functions](#chaincode-functions)
- [Running the Network](#running-the-network)
- [Using the Chaincode](#using-the-chaincode)
- [Notes](#notes)

---

## Project Overview

This project demonstrates a blockchain-based supply chain for Ayurvedic herbs:

- **Ledger Initialization:** Seeds the ledger with default herbs (`HERB1`, `HERB2`) and species rules.
- **CRUD Operations:** Add, update, read, delete herbs.
- **Transfer Ownership:** Track ownership changes across suppliers and collectors.
- **Collection Rules:** Validate geofence, allowed harvest months, and quality thresholds (moisture, pesticide levels).
- **Query Functions:** Fetch all herbs, read specific herb by ID, query by document type.

---

## Prerequisites

Make sure your system has the following installed:

- **Operating System:** Linux or WSL2 on Windows
- **Docker & Docker Compose:** For running Fabric network
- **Node.js & npm:** Required for JavaScript chaincode
- **Hyperledger Fabric Samples, Binaries, and Docker Images**  
  Follow official [Fabric setup guide](https://hyperledger-fabric.readthedocs.io/en/latest/install.html)

---
1️⃣ Install System Prerequisites

Update & install packages
```
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git docker.io docker-compose nodejs npm jq -y
sudo apt install build-essential libnss3 libnspr4 libatk1.0-0 libxss1 libgtk-3-0 -y

```
Start Docker and enable on boot
```
sudo systemctl start docker
sudo systemctl enable docker

```
Add your user to Docker group
```
sudo usermod -aG docker $USER
newgrp docker

```
Verify installations
```
docker --version
docker-compose --version
node -v
npm -v
git --version
```
2️⃣ Install Hyperledger Fabric Binaries
# Move to your AyurTrack folder
```
cd ~/AyurTrack/fabric

# Download Fabric binaries and Docker images
curl -sSL https://bit.ly/HyperledgerFabricInstall | bash -s

```
This downloads peer, orderer, configtxgen, fabric-ca-client, and docker images.

Verify installation:
```
peer version
```
## Project Structure

```text
AyurTrack/
│── README.md
│── runHerbalChaincode.sh
│── fabric/
│   ├── fabric-samples/
│   │   └── test-network/
│   │       ├── network.sh
│   │       ├── organizations/
│   │       └── ...
│   └── chaincode/
│       └── herbaltrace/
│           ├── package.json
│           ├── index.js
│           └── herbalContract.js
Setup Instructions
Navigate to test-network:

```
bash
Copy code
```
cd ~/AyurTrack/fabric/fabric-samples/test-network
Bring up Fabric network:
```
bash
Copy code
```
./network.sh up
```
Create a channel:
bash
Copy code
```
./network.sh createChannel
```
Deploy the chaincode:

bash
Copy code
```
./network.sh deployCC -ccn herbaltrace -ccp ../../chaincode/herbaltrace/ -ccl javascript
```
Run the helper script to initialize ledger, create, and transfer herbs:

bash
Copy code
```
./runHerbalChaincode.sh
```
The script will:

Initialize the ledger (InitLedger)

Create a new herb (HERB3)

Transfer HERB3 to a new owner (SupplierX)

Query and display all herbs

Chaincode Functions
Function	Description	Arguments
InitLedger	Initialize ledger with default herbs and species rules	None
CreateHerb	Add a new herb	id, name, source, quantity, owner, manufactureDate, expiryDate
ReadHerb	Query herb by ID	id
UpdateHerb	Update herb details	id, name, source, quantity, owner, manufactureDate, expiryDate
DeleteHerb	Delete a herb by ID	id
TransferHerb	Change herb ownership	id, newOwner
GetAllHerbs	List all herbs	None
RecordCollection	Log collection event with quality & geofence validation	collectionId, collectorId, lat, long, timestamp, species, qualityJson
QueryByKey	Query by key	key
QueryByDocType	Query all entries of a doc type	docType

Running the Network
After running network.sh and runHerbalChaincode.sh, you can:

Query all herbs:

bash
Copy code
```
peer chaincode query -C mychannel -n herbaltrace -c '{"Args":["GetAllHerbs"]}'
```
Query a specific herb:

bash
Copy code
```
peer chaincode query -C mychannel -n herbaltrace -c '{"Args":["ReadHerb","HERB1"]}'
```
Create a new herb manually:

bash
Copy code
```
peer chaincode invoke -o localhost:7050 \
  --ordererTLSHostnameOverride orderer.example.com \
  --tls --cafile $ORDERER_CA \
  -C mychannel -n herbaltrace \
  --peerAddresses localhost:7051 --tlsRootCertFiles $PEER0_ORG1_TLS \
  --peerAddresses localhost:9051 --tlsRootCertFiles $PEER0_ORG2_TLS \
  --waitForEvent \
  -c '{"Args":["CreateHerb","HERB4","Shatavari","India","75","Supplier4","2025-04-10","2026-04-10"]}'
  ```
Notes
Always ensure both peers are included in your invoke commands (--peerAddresses) to avoid endorsement failures.

Ledger initialization must be invoked only once per network setup. Re-invoking InitLedger will throw errors if herbs already exist.

Use GetAllHerbs after every invoke to verify the current ledger state.

The provided runHerbalChaincode.sh script automates these common operations.

References
Hyperledger Fabric Documentation

Fabric Samples GitHub

Chaincode JavaScript API
