const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function getContract(user = 'appUser', org = 'Org1') {
    try {
        console.log('Connecting to Fabric network with TLS...');
        
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(`Identity ${user} not found in wallet. Run enrollAdmin.js and registerUser.js first`);
        }

        // Use connection profile if available, otherwise use inline config
        let connectionProfile;
        const ccpPath = path.resolve(__dirname, '..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        
        if (fs.existsSync(ccpPath)) {
            connectionProfile = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        } else {
            // Your existing inline configuration
            connectionProfile = {
                name: "ayurtrack-network",
                version: "1.0.0",
                client: {
                    organization: "Org1"
                },
                organizations: {
                    Org1: {
                        mspid: "Org1MSP",
                        peers: ["peer0.org1.example.com"]
                    }
                },
                peers: {
                    "peer0.org1.example.com": {
                        url: "grpcs://localhost:7051",
                        grpcOptions: {
                            "ssl-target-name-override": "peer0.org1.example.com",
                            "hostnameOverride": "peer0.org1.example.com"
                        },
                        tlsCACerts: {
                            pem: `-----BEGIN CERTIFICATE-----
MIICFjCCAb2gAwIBAgIUO5wCh+eiWf7LKT75L/ocLKVDAFMwCgYIKoZIzj0EAwIw
aDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK
EwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt
Y2Etc2VydmVyMB4XDTI1MDkyMjA5MzAwMFoXDTQwMDkxODA5MzAwMFowaDELMAkG
A1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl
cmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy
dmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE1zPN9+bIRTiDMx/jLm5x1pMa
t5xUU+Xkum97DJRxO/64AiUZg8CGGtk+KwNP7REbP8bxWuXpuX6/cFG/1WM9lqNF
MEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE
FPoyN9bA+J1NzBW8GKhDlarXzspWMAoGCCqGSM49BAMCA0cAMEQCIAwp7c2EKDRs
rdHJlmRYIO/OP3ussnhsISX3D/ai30J+AiB3sBQOmBBa/PeLH7xuhAnumIKgHmYT
SNuX8Wejknv3Lw==
-----END CERTIFICATE-----`
                        }
                    }
                },
                channels: {
                    mychannel: {
                        peers: {
                            "peer0.org1.example.com": {
                                endorsingPeer: true,
                                chaincodeQuery: true,
                                ledgerQuery: true,
                                eventSource: true
                            }
                        }
                    }
                }
            };
        }
        
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, {
            wallet,
            identity: user,
            discovery: { 
                enabled: false,
                asLocalhost: true
            }
        });
        
        console.log('✓ Connected to gateway successfully');
        
        const network = await gateway.getNetwork('mychannel');
        console.log('✓ Got network successfully');
        
        const contract = network.getContract('herbaltrace');
        console.log('✓ Got contract successfully');
        
        return { contract, gateway };
        
    } catch (error) {
        console.error('Error connecting to Fabric network:', error.message);
        throw error;
    }
}

module.exports = { getContract };
