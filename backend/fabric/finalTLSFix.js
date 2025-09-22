// fabric/finalTLSFix.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function finalTLSFix() {
    try {
        console.log('Extracting TLS certificate and updating fabricClient...');

        // Extract TLS CA certificate
        const tlsCert = execSync('docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/tls/ca.crt', { encoding: 'utf8' });
        console.log('✓ TLS certificate extracted');

        // Create the final working fabricClient.js
        const finalFabricClient = `const { Gateway, Wallets } = require('fabric-network');
const path = require('path');

async function getContract(user = 'appUser', org = 'Org1') {
    try {
        console.log('Connecting to Fabric network with TLS...');
        
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(\`Identity \${user} not found in wallet\`);
        }
        
        const connectionProfile = {
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
                    url: "grpcs://localhost:7051", // TLS enabled
                    grpcOptions: {
                        "ssl-target-name-override": "peer0.org1.example.com",
                        "hostnameOverride": "peer0.org1.example.com"
                    },
                    tlsCACerts: {
                        pem: \`${tlsCert.trim()}\`
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
        
        const gateway = new Gateway();
        await gateway.connect(connectionProfile, {
            wallet,
            identity: user,
            discovery: { 
                enabled: false,
                asLocalhost: true  // Important for TLS override
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

module.exports = { getContract };`;

        // Write the final fabricClient.js
        const fabricClientPath = path.join(__dirname, 'fabricClient.js');
        fs.writeFileSync(fabricClientPath, finalFabricClient);
        console.log('✓ Updated fabricClient.js with TLS support');

        console.log('\n🎉 Setup complete! Your blockchain connection should now work.');
        console.log('Test your API with: POST http://localhost:3000/v1/herbs');

    } catch (error) {
        console.error('Failed to extract TLS cert:', error.message);

        if (error.message.includes('ca.crt')) {
            console.log('\nTrying alternative TLS cert path...');
            try {
                const altTlsCert = execSync('docker exec peer0.org1.example.com cat /etc/hyperledger/fabric/tls/server.crt', { encoding: 'utf8' });
                console.log('✓ Alternative TLS certificate found');
                // You can manually update fabricClient.js with this certificate
                fs.writeFileSync(path.join(__dirname, 'tls_server.crt'), altTlsCert);
                console.log('✓ Saved TLS certificate to tls_server.crt file');
            } catch (altError) {
                console.error('Could not find TLS certificate at expected paths');
            }
        }
    }
}

finalTLSFix();
