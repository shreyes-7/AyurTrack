const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

class BlockchainService {
    constructor() {
        // Load connection profile once
        const ccpPath = path.resolve(__dirname, '../../../fabric/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com/connection-org1.json');

        if (fs.existsSync(ccpPath)) {
            const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
            this.ccp = JSON.parse(ccpJSON);
            console.log('✓ Connection profile loaded successfully');
            console.log('Available CAs:', Object.keys(this.ccp.certificateAuthorities || {}));
        } else {
            console.error('Connection profile not found at:', ccpPath);
            throw new Error('Connection profile not found');
        }

        this.walletPath = path.join(__dirname, '../fabric/wallet');
    }

    async getCAClient(orgName = 'FarmerOrg') {
        // Map ALL organizations to the ONLY available CA (Org1)
        const caMap = {
            'FarmerOrg': 'ca.org1.example.com',
            'ProcessorOrg': 'ca.org1.example.com',
            'CollectorOrg': 'ca.org1.example.com',
            'LabOrg': 'ca.org1.example.com',        // Changed: Use Org1 CA
            'ManufacturerOrg': 'ca.org1.example.com' // Changed: Use Org1 CA
        };

        const caName = caMap[orgName];
        const caInfo = this.ccp.certificateAuthorities[caName];

        if (!caInfo) {
            console.error('Available CAs:', Object.keys(this.ccp.certificateAuthorities || {}));
            throw new Error(`CA information not found for organization: ${orgName} (looking for ${caName})`);
        }

        console.log(`✓ Using CA: ${caName} for organization: ${orgName}`);

        const caTLSCACerts = caInfo.tlsCACerts.pem;

        return new FabricCAServices(caInfo.url, {
            trustedRoots: caTLSCACerts,
            verify: false
        }, caInfo.caName);
    }

    async ensureAdminEnrolled(orgName = 'FarmerOrg') {
        const wallet = await Wallets.newFileSystemWallet(this.walletPath);
        const adminId = `admin`; // Use single admin for all orgs

        // Check if admin exists
        const adminIdentity = await wallet.get(adminId);
        if (adminIdentity) {
            console.log('✓ Admin identity already exists');
            return adminIdentity;
        }

        console.log('📝 Enrolling admin identity...');

        // Enroll admin
        const ca = await this.getCAClient(orgName);
        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        // Map all organizations to Org1MSP since we only have one CA
        const mspMap = {
            'FarmerOrg': 'Org1MSP',
            'ProcessorOrg': 'Org1MSP',
            'CollectorOrg': 'Org1MSP',
            'LabOrg': 'Org1MSP',           // Changed: Use Org1MSP
            'ManufacturerOrg': 'Org1MSP'   // Changed: Use Org1MSP
        };

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspMap[orgName] || 'Org1MSP',
            type: 'X.509',
        };

        await wallet.put(adminId, x509Identity);
        console.log('✅ Admin identity enrolled successfully');
        return x509Identity;
    }

    async enrollUser(userId, orgName = 'FarmerOrg') {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if user already enrolled
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                console.log(`✓ User ${userId} already enrolled`);
                return { success: true, message: 'User already enrolled' };
            }

            console.log(`📝 Enrolling user ${userId} in organization ${orgName}...`);

            // Ensure admin is enrolled
            await this.ensureAdminEnrolled(orgName);

            const adminId = `admin`;
            const adminIdentity = await wallet.get(adminId);

            const ca = await this.getCAClient(orgName);

            // Build admin user context
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminId);

            // Use simple affiliation (all use org1 since we only have one CA)
            const affiliationMap = {
                'FarmerOrg': 'org1.department1',
                'ProcessorOrg': 'org1.department1',
                'CollectorOrg': 'org1.department1',
                'LabOrg': 'org1.department1',           // Changed: Use org1
                'ManufacturerOrg': 'org1.department1'   // Changed: Use org1
            };

            const secret = await ca.register({
                affiliation: affiliationMap[orgName] || 'org1.department1',
                enrollmentID: userId,
                role: 'client'
            }, adminUser);

            // Enroll the user
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const mspMap = {
                'FarmerOrg': 'Org1MSP',
                'ProcessorOrg': 'Org1MSP',
                'CollectorOrg': 'Org1MSP',
                'LabOrg': 'Org1MSP',           // Changed: Use Org1MSP
                'ManufacturerOrg': 'Org1MSP'   // Changed: Use Org1MSP
            };

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: mspMap[orgName] || 'Org1MSP',
                type: 'X.509',
            };

            await wallet.put(userId, x509Identity);

            console.log(`✅ User ${userId} enrolled successfully in ${orgName}`);

            return {
                success: true,
                message: 'User successfully enrolled in blockchain',
                enrollmentId: userId,
                mspId: mspMap[orgName] || 'Org1MSP'
            };

        } catch (error) {
            console.error(`❌ Failed to enroll user ${userId}:`, error.message);
            return {
                success: false,
                message: 'Blockchain enrollment failed',
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService();
