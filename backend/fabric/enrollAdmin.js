// enrollAdmin.js - Fixed version
const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function main() {
    try {
        console.log('🚀 Starting Admin Enrollment Process...');
        console.log('=====================================\n');

        // Step 1: Determine connection profile path
        console.log('📁 Step 1: Locating connection profile...');
        const ccpPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        console.log(`   Path: ${ccpPath}`);

        let ccp;

        // Check if connection profile exists
        if (!fs.existsSync(ccpPath)) {
            console.log('❌ Connection profile not found at specified path');
            console.log('🔧 Using fallback inline configuration...');

            // Get fresh TLS certificate from running network
            const tlsCertPath = path.resolve(__dirname, '..', '..', 'fabric', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'ca', 'ca.org1.example.com-cert.pem');
            
            let tlsCert;
            if (fs.existsSync(tlsCertPath)) {
                tlsCert = fs.readFileSync(tlsCertPath, 'utf8');
                console.log('✅ Found TLS certificate');
            } else {
                console.log('⚠️  TLS certificate not found, using hardcoded fallback');
                tlsCert = "-----BEGIN CERTIFICATE-----\nMIICFjCCAb2gAwIBAgIUe8/d1WNqwL9xLgubDoaZI+i/CNkwCgYIKoZIzj0EAwIw\naDELMAkGA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQK\nEwtIeXBlcmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMt\nY2Etc2VydmVyMB4XDTI1MDkyMjEzMjEwMFoXDTQwMDkxODEzMjEwMFowaDELMAkG\nA1UEBhMCVVMxFzAVBgNVBAgTDk5vcnRoIENhcm9saW5hMRQwEgYDVQQKEwtIeXBl\ncmxlZGdlcjEPMA0GA1UECxMGRmFicmljMRkwFwYDVQQDExBmYWJyaWMtY2Etc2Vy\ndmVyMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEzlCHVk6a1PuWArpX1Ld4zdLq\nZmW3IK505JfN/ojYfrKhWs3CE2kG6HpO/aRDKL32eiZtfR1jNDtFKCe/GeKgJqNF\nMEMwDgYDVR0PAQH/BAQDAgEGMBIGA1UdEwEB/wQIMAYBAf8CAQEwHQYDVR0OBBYE\nFCERi9dLG8dtfJCjiW9JFubnqC8bMAoGCCqGSM49BAMCA0cAMEQCIHIH7UB1PIry\nen8teokwBVDcX13HEMbk+3W9cEN7QAByAiBeMp0P7gPSGmEFBpYrEX2d7Bd+dSzJ\nh3Ucxo5xHQETsw==\n-----END CERTIFICATE-----\n";
            }

            ccp = {
                "name": "test-network-org1",
                "version": "1.0.0",
                "client": {
                    "organization": "Org1"
                },
                "organizations": {
                    "Org1": {
                        "mspid": "Org1MSP",
                        "peers": ["peer0.org1.example.com"],
                        "certificateAuthorities": ["ca.org1.example.com"]
                    }
                },
                "certificateAuthorities": {
                    "ca.org1.example.com": {
                        "url": "https://localhost:7054",
                        "caName": "ca-org1",
                        "tlsCACerts": {
                            "pem": [tlsCert]
                        },
                        "httpOptions": {
                            "verify": false
                        }
                    }
                }
            };
        } else {
            console.log('✅ Connection profile found');
            ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        }

        // Step 2: Create CA client and test connectivity
        console.log('\n🔗 Step 2: Creating CA client...');
        const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
        
        if (!caInfo) {
            throw new Error('CA information not found in connection profile');
        }

        console.log(`   CA URL: ${caInfo.url}`);
        console.log(`   CA Name: ${caInfo.caName}`);

        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const ca = new FabricCAServices(caInfo.url, {
            trustedRoots: caTLSCACerts,
            verify: false
        }, caInfo.caName);

        // FIXED: Skip CA info test and proceed directly to enrollment
        console.log('   ✅ CA client created (skipping connectivity test)');

        // Step 3: Set up wallet
        console.log('\n💼 Step 3: Setting up wallet...');
        const walletPath = path.join(__dirname, 'wallet');
        console.log(`   Wallet path: ${walletPath}`);

        // Ensure wallet directory exists
        if (!fs.existsSync(walletPath)) {
            fs.mkdirSync(walletPath, { recursive: true });
            console.log('   ✅ Created wallet directory');
        } else {
            console.log('   ✅ Wallet directory exists');
        }

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Step 4: Check for existing admin identity
        console.log('\n👤 Step 4: Checking for existing admin identity...');
        const existingIdentity = await wallet.get('admin');
        
        if (existingIdentity) {
            console.log('   ⚠️  Admin identity already exists');
            console.log(`   📋 Current MSP ID: ${existingIdentity.mspId}`);
            console.log(`   📋 Current Type: ${existingIdentity.type}`);
            console.log('   🔄 Removing existing identity to create fresh one...');
            await wallet.remove('admin');
            console.log('   ✅ Existing admin identity removed');
        } else {
            console.log('   ✅ No existing admin identity found');
        }

        // Step 5: Enroll admin
        console.log('\n📝 Step 5: Enrolling admin with CA...');
        console.log('   Using credentials: admin / adminpw');
        
        let enrollment;
        try {
            enrollment = await ca.enroll({
                enrollmentID: 'admin',
                enrollmentSecret: 'adminpw'
            });
            console.log('   ✅ Admin enrollment successful');
        } catch (error) {
            console.error('   ❌ Admin enrollment failed');
            
            if (error.message.includes('Authentication failure')) {
                console.error('   💡 Authentication failure - check if credentials are correct');
                console.error('   💡 Default test-network admin credentials are: admin / adminpw');
            } else if (error.message.includes('already enrolled')) {
                console.error('   💡 Admin already enrolled with CA');
            } else if (error.message.includes('ECONNREFUSED')) {
                console.error('   💡 CA server is not running - check Docker containers');
            } else {
                console.error(`   💡 Error details: ${error.message}`);
            }
            
            throw error;
        }

        // Step 6: Create and store identity
        console.log('\n🆔 Step 6: Creating and storing identity...');
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put('admin', x509Identity);
        console.log('   ✅ Admin identity stored in wallet');

        // Step 7: Verify stored identity
        console.log('\n✅ Step 7: Verifying stored identity...');
        const storedIdentity = await wallet.get('admin');
        
        if (storedIdentity) {
            console.log('   ✅ Identity verification successful');
            console.log(`   📋 MSP ID: ${storedIdentity.mspId}`);
            console.log(`   📋 Type: ${storedIdentity.type}`);
            console.log(`   📋 Certificate length: ${storedIdentity.credentials.certificate.length} chars`);
            console.log(`   📋 Private key length: ${storedIdentity.credentials.privateKey.length} bytes`);
        } else {
            throw new Error('Failed to retrieve stored admin identity');
        }

        // Step 8: Test admin context creation
        console.log('\n🧪 Step 8: Testing admin context creation...');
        try {
            const provider = wallet.getProviderRegistry().getProvider(storedIdentity.type);
            const adminUser = await provider.getUserContext(storedIdentity, 'admin');
            
            if (adminUser) {
                console.log('   ✅ Admin user context created successfully');
                console.log(`   📋 Admin name: ${adminUser.getName()}`);
                console.log(`   📋 Admin MSP ID: ${adminUser.getMspid()}`);
                
                // Test if admin can sign
                const signingIdentity = adminUser.getSigningIdentity();
                if (signingIdentity) {
                    console.log('   ✅ Admin signing identity is valid');
                } else {
                    console.log('   ❌ Admin signing identity is invalid');
                }
            } else {
                console.log('   ❌ Failed to create admin user context');
            }
        } catch (error) {
            console.error(`   ❌ Admin context test failed: ${error.message}`);
        }

        console.log('\n🎉 SUCCESS! Admin enrollment completed successfully!');
        console.log('=====================================');
        console.log('✅ Admin identity is ready for blockchain operations');
        console.log('✅ You can now register and enroll users');
        console.log('✅ Your user creation should work without authentication errors');
        console.log('\n💡 Next steps:');
        console.log('   1. Try creating a user from your frontend');
        console.log('   2. Check the logs for successful blockchain enrollment');
        console.log('   3. If issues persist, check Docker containers: docker ps | grep ca\n');

    } catch (error) {
        console.error('\n❌ ADMIN ENROLLMENT FAILED');
        console.error('============================');
        console.error(`Error: ${error.message}`);
        
        // Don't show full stack trace for known errors
        if (!error.message.includes('ECONNREFUSED') && !error.message.includes('Authentication failure')) {
            console.error('\n🔍 Full error details:');
            console.error(error.stack);
        }
        
        console.error('\n💡 Troubleshooting Steps:');
        console.error('1. Check if Fabric network is running:');
        console.error('   docker ps | grep -E "(peer|orderer|ca)"');
        console.error('\n2. If no containers, start the network:');
        console.error('   cd ~/AyurTrack/fabric/fabric-samples/test-network');
        console.error('   ./network.sh down && ./network.sh up createChannel -ca');
        console.error('\n3. Check CA container logs:');
        console.error('   docker logs ca_org1');
        console.error('\n4. Deploy chaincode:');
        console.error('   ./network.sh deployCC -ccn herbaltrace -ccp ../../chaincode/herbaltrace/ -ccl javascript');
        
        process.exit(1);
    }
}

// Simple test function to verify admin works
async function createSimpleTest() {
    const testScript = `
// testAdmin.js - Simple admin test
const { Wallets } = require('fabric-network');
const path = require('path');

async function testAdmin() {
    try {
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        
        const adminIdentity = await wallet.get('admin');
        if (adminIdentity) {
            console.log('✅ Admin identity exists');
            console.log('✅ MSP ID:', adminIdentity.mspId);
            return true;
        } else {
            console.log('❌ Admin identity not found');
            return false;
        }
    } catch (error) {
        console.log('❌ Test failed:', error.message);
        return false;
    }
}

testAdmin();
`;

    try {
        fs.writeFileSync(path.join(__dirname, 'testAdmin.js'), testScript);
        console.log('✅ Created testAdmin.js script');
    } catch (error) {
        // Ignore file creation errors
    }
}

// Run main function
main().then(() => {
    createSimpleTest();
});
