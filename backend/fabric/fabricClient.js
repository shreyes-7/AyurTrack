const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

async function getContract(user = 'appUser', org = 'Org1') {
    try {
        console.log(`Connecting to Fabric network with user: ${user}...`);

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(`Identity ${user} not found in wallet. Run createIdentitiesFromCerts.js first`);
        }

        // Use connection profile path - adjust this to your actual path
        const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');

        let connectionProfile;

        if (fs.existsSync(ccpPath)) {
            console.log(`Using connection profile: ${ccpPath}`);
            connectionProfile = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            
            // Enhance the existing connection profile for better multi-peer support
            if (connectionProfile.peers && connectionProfile.peers['peer0.org1.example.com']) {
                // Add peer0.org2 to the connection profile for endorsement
                const peer2TlsCertPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
                
                if (fs.existsSync(peer2TlsCertPath)) {
                    const peer2TlsCert = fs.readFileSync(peer2TlsCertPath, 'utf8');
                    
                    connectionProfile.peers['peer0.org2.example.com'] = {
                        url: "grpcs://localhost:9051",
                        grpcOptions: {
                            "ssl-target-name-override": "peer0.org2.example.com",
                            "hostnameOverride": "peer0.org2.example.com"
                        },
                        tlsCACerts: {
                            pem: peer2TlsCert
                        }
                    };
                    
                    // Update channel configuration to include both peers
                    if (connectionProfile.channels && connectionProfile.channels.mychannel) {
                        connectionProfile.channels.mychannel.peers['peer0.org2.example.com'] = {
                            endorsingPeer: true,
                            chaincodeQuery: true,
                            ledgerQuery: true,
                            eventSource: false
                        };
                    }
                    
                    // Update organization to include both peers
                    if (connectionProfile.organizations && connectionProfile.organizations.Org1) {
                        connectionProfile.organizations.Org1.peers.push('peer0.org2.example.com');
                    }
                    
                    console.log('✓ Enhanced connection profile with Org2 peer for endorsement');
                }
            }
            
        } else {
            console.log('Connection profile not found, using dynamic certificate configuration...');

            // Build dynamic connection profile with both peers
            const peer1TlsCertPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt');
            const peer2TlsCertPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');

            if (!fs.existsSync(peer1TlsCertPath)) {
                throw new Error(`Peer1 TLS certificate not found at: ${peer1TlsCertPath}`);
            }
            if (!fs.existsSync(peer2TlsCertPath)) {
                throw new Error(`Peer2 TLS certificate not found at: ${peer2TlsCertPath}`);
            }

            const peer1TlsCert = fs.readFileSync(peer1TlsCertPath, 'utf8');
            const peer2TlsCert = fs.readFileSync(peer2TlsCertPath, 'utf8');

            connectionProfile = {
                name: "ayurtrack-network",
                version: "1.0.0",
                client: {
                    organization: "Org1"
                },
                organizations: {
                    Org1: {
                        mspid: "Org1MSP",
                        peers: ["peer0.org1.example.com", "peer0.org2.example.com"]
                    }
                },
                peers: {
                    "peer0.org1.example.com": {
                        url: "grpcs://localhost:7051",
                        grpcOptions: {
                            "ssl-target-name-override": "peer0.org1.example.com",
                            "hostnameOverride": "peer0.org1.example.com",
                            "grpc-max-receive-message-length": 15728640,
                            "grpc-max-send-message-length": 15728640
                        },
                        tlsCACerts: {
                            pem: peer1TlsCert
                        }
                    },
                    "peer0.org2.example.com": {
                        url: "grpcs://localhost:9051",
                        grpcOptions: {
                            "ssl-target-name-override": "peer0.org2.example.com",
                            "hostnameOverride": "peer0.org2.example.com",
                            "grpc-max-receive-message-length": 15728640,
                            "grpc-max-send-message-length": 15728640
                        },
                        tlsCACerts: {
                            pem: peer2TlsCert
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
                            },
                            "peer0.org2.example.com": {
                                endorsingPeer: true,
                                chaincodeQuery: true,
                                ledgerQuery: true,
                                eventSource: false
                            }
                        }
                    }
                }
            };
        }

        const gateway = new Gateway();
        
        // Enhanced gateway options for better reliability
        await gateway.connect(connectionProfile, {
            wallet,
            identity: user,
            discovery: {
                enabled: true,
                asLocalhost: true
            },
            eventHandlerOptions: {
                commitTimeout: 300,
                strategy: null // Use default strategy
            }
        });

        console.log('✓ Connected to gateway successfully');

        const network = await gateway.getNetwork('mychannel');
        console.log('✓ Got network successfully');

        const contract = network.getContract('herbaltrace');
        console.log('✓ Got contract successfully');

        return { contract, gateway };

    } catch (error) {
        console.error('❌ Error connecting to Fabric network:', error.message);
        
        // Enhanced error reporting
        if (error.message.includes('No valid responses from any peers')) {
            console.error('💡 Troubleshooting tips:');
            console.error('   1. Check if both peer containers are running: docker ps');
            console.error('   2. Verify chaincode is deployed: docker ps | grep herbaltrace');
            console.error('   3. Test with CLI: peer chaincode query -C mychannel -n herbaltrace -c \'{"function":"QueryParticipants","Args":["farmer"]}\'');
            console.error('   4. Check chaincode logs: docker logs [chaincode-container-name]');
        }
        
        if (error.message.includes('wallet') || error.message.includes('Identity')) {
            console.error('💡 Identity issue: Run createIdentitiesFromCerts.js to create wallet identities');
        }
        
        throw error;
    }
}

// Helper function to test chaincode connectivity
async function testChaincode() {
    try {
        console.log('🧪 Testing chaincode connectivity...');
        const { contract, gateway } = await getContract('admin');
        
        // Test with a simple read operation first
        const result = await contract.evaluateTransaction('QueryParticipants', 'farmer');
        console.log('✅ Chaincode test successful, farmers found:', JSON.parse(result.toString()).length);
        
        await gateway.disconnect();
        return true;
    } catch (error) {
        console.error('❌ Chaincode test failed:', error.message);
        return false;
    }
}

module.exports = { getContract, testChaincode };
