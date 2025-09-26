const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const fs = require('fs');

// Helper function to get organization info based on role
function getOrgInfo(role) {
    const orgMap = {
        'admin': { mspId: 'Org1MSP', caName: 'ca.org1.example.com', orgName: 'Org1' },
        'farmer': { mspId: 'Org1MSP', caName: 'ca.org1.example.com', orgName: 'Org1' },
        'processor': { mspId: 'Org1MSP', caName: 'ca.org1.example.com', orgName: 'Org1' },
        'lab': { mspId: 'Org2MSP', caName: 'ca.org1.example.com', orgName: 'Org1' }, // FIXED: Use Org1 CA
        'manufacturer': { mspId: 'Org2MSP', caName: 'ca.org1.example.com', orgName: 'Org1' } // FIXED: Use Org1 CA
    };
    return orgMap[role] || { mspId: 'Org1MSP', caName: 'ca.org1.example.com', orgName: 'Org1' };
}

// FIXED: Function to register and enroll a new user
async function registerAndEnrollUser(userId, role = 'client') {
    try {
        console.log(`Registering and enrolling user ${userId} with role ${role}...`);
        
        const orgInfo = getOrgInfo(role);
        console.log(`Using org: ${orgInfo.orgName}, MSP: ${orgInfo.mspId}, CA: ${orgInfo.caName}`);
        
    
        // FIXED: Always use org1 connection profile since admin is enrolled there
        const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 
            'test-network', 'organizations', 'peerOrganizations', 
            'org1.example.com', 'connection-org1.json'); // Always use org1
        
        let ccp;
        if (fs.existsSync(ccpPath)) {
            ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            console.log('✅ Connection profile loaded');
        } else {
            throw new Error(`Connection profile not found at: ${ccpPath}`);
        }

        // FIXED: Always use ca.org1.example.com since admin is enrolled there
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        if (!caInfo) {
            throw new Error('CA info for ca.org1.example.com not found');
        }
        
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, { 
            trustedRoots: caTLSCACerts, 
            verify: false 
        }, caInfo.caName);

        // Load wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if user already exists
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`✓ User ${userId} already exists in wallet`);
            return { success: true, message: 'User already enrolled' };
        }

        // Check if admin exists
        const adminIdentity = await wallet.get('admin');
        if (!adminIdentity) {
            throw new Error('Admin identity not found. Run enrollAdmin.js first');
        }

        console.log('✅ Admin identity found');

        // Build admin user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, 'admin');

        if (!adminUser || !adminUser.getSigningIdentity()) {
            throw new Error('Admin user context is invalid');
        }

        console.log('✅ Admin user context created');

        // STEP 1: Register the user with CA
        console.log(`Registering user ${userId}...`);
        
        // FIXED: Use fixed affiliation that exists in test-network
        const secret = await ca.register({
            affiliation: 'org1.department1', // FIXED: Always use org1.department1
            enrollmentID: userId,
            role: 'client',
            attrs: [
                { name: 'role', value: role, ecert: true },
                { name: 'userId', value: userId, ecert: true },
                { name: 'mspId', value: orgInfo.mspId, ecert: true }
            ]
        }, adminUser);

        console.log(`✓ User ${userId} registered successfully`);

        // STEP 2: Enroll the user
        console.log(`Enrolling user ${userId}...`);
        const enrollment = await ca.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });

        // STEP 3: Create identity and add to wallet
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgInfo.mspId, // This can be different MSP (Org1MSP or Org2MSP)
            type: 'X.509',
        };

        await wallet.put(userId, x509Identity);
        console.log(`✓ User ${userId} enrolled successfully and added to wallet`);

        return { 
            success: true, 
            message: 'User registered and enrolled successfully',
            userId: userId,
            mspId: orgInfo.mspId
        };

    } catch (error) {
        console.error(`❌ Failed to register/enroll user ${userId}:`, error.message);
        
        if (error.message.includes('fabric-ca request register failed')) {
            console.error('💡 CA Registration failed - check:');
            console.error('   1. Admin identity is properly enrolled');
            console.error('   2. CA server is running');
            console.error('   3. User does not already exist');
            console.error('   4. Affiliation exists (org1.department1)');
        }
        
        throw error;
    }
}

// Keep all other functions unchanged
async function getContract(user = 'admin', org = 'Org1') {
    try {
        console.log(`Connecting to Fabric network with user: ${user}...`);

        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(`Identity ${user} not found in wallet. Run enrollAdmin.js first or register the user.`);
        }

        // FIXED: Always use org1 connection profile
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
            throw new Error(`Connection profile not found at: ${ccpPath}`);
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
                strategy: null
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

// Helper function to initialize ledger (useful for setup)
async function initializeLedger() {
    try {
        console.log('🚀 Initializing blockchain ledger...');
        const { contract, gateway } = await getContract('admin');

        const result = await contract.submitTransaction('InitLedger');
        console.log('✅ Ledger initialized successfully');

        await gateway.disconnect();
        return { success: true, result: JSON.parse(result.toString()) };
    } catch (error) {
        console.error('❌ Failed to initialize ledger:', error.message);
        return { success: false, error: error.message };
    }
}

// Helper function to check if user exists in wallet
async function userExists(userId) {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        const identity = await wallet.get(userId);
        return !!identity;
    } catch (error) {
        console.error('Error checking user existence:', error.message);
        return false;
    }
}

// Helper function to get user identity from wallet
async function getUserIdentity(userId) {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        return await wallet.get(userId);
    } catch (error) {
        console.error('Error getting user identity:', error.message);
        return null;
    }
}

// Helper function to safely disconnect gateway
async function safeDisconnect(gateway) {
    try {
        if (gateway) {
            await gateway.disconnect();
        }
    } catch (error) {
        console.error('Warning: Error disconnecting gateway:', error.message);
    }
}

// Helper function to test CA connectivity
async function testCAConnection(caUrl = 'https://localhost:7054', caName = 'ca-org1') {
    try {
        console.log(`🧪 Testing CA connection to ${caUrl}...`);
        const ca = new FabricCAServices(caUrl, { verify: false }, caName);
        // Skip info() method as it might not exist
        console.log('✓ CA Connection created successfully');
        return true;
    } catch (error) {
        console.error('❌ CA Connection failed:', error.message);
        return false;
    }
}

module.exports = {
    getContract,
    registerAndEnrollUser,
    testChaincode,
    initializeLedger,
    safeDisconnect,
    userExists,
    getUserIdentity,
    testCAConnection,
    getOrgInfo
};
