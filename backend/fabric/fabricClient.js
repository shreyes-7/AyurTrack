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

        // Use connection profile path - adjust this to your actual path
        const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');

        let connectionProfile;

        if (fs.existsSync(ccpPath)) {
            console.log(`Using connection profile: ${ccpPath}`);
            connectionProfile = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        } else {
            console.log('Connection profile not found, using dynamic certificate...');

            // Dynamic TLS certificate path
            const tlsCertPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'tlsca', 'tlsca.org1.example.com-cert.pem');

            if (!fs.existsSync(tlsCertPath)) {
                throw new Error(`TLS certificate not found at: ${tlsCertPath}`);
            }

            const tlsCert = fs.readFileSync(tlsCertPath, 'utf8');

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
                            pem: tlsCert
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
