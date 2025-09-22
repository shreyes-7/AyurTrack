const FabricCAServices = require('fabric-ca-client');
const { Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

class BlockchainService {
    constructor() {
        // Load connection profile once
        const ccpPath = path.resolve(__dirname, '../../fabric/connection-org1.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        this.ccp = JSON.parse(ccpJSON);

        this.walletPath = path.join(__dirname, '../fabric/wallet');
    }

    async getCAClient(orgName = 'FarmerOrg') {
        const caMap = {
            'FarmerOrg': 'ca_farmer',
            'ProcessorOrg': 'ca_processor',
            'CollectorOrg': 'ca_collector',
            'LabOrg': 'ca_lab',
            'ManufacturerOrg': 'ca_manufacturer'
        };

        const caInfo = this.ccp.certificateAuthorities[caMap[orgName]];
        const caTLSCACerts = caInfo.tlsCACerts.pem;

        return new FabricCAServices(caInfo.url, {
            trustedRoots: caTLSCACerts,
            verify: false
        }, caInfo.caName);
    }

    async ensureAdminEnrolled(orgName = 'FarmerOrg') {
        const wallet = await Wallets.newFileSystemWallet(this.walletPath);
        const adminId = `admin_${orgName}`;

        // Check if admin exists
        const adminIdentity = await wallet.get(adminId);
        if (adminIdentity) {
            return adminIdentity;
        }

        // Enroll admin
        const ca = await this.getCAClient(orgName);
        const enrollment = await ca.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw'
        });

        const mspMap = {
            'FarmerOrg': 'FarmerMSP',
            'ProcessorOrg': 'ProcessorMSP',
            'CollectorOrg': 'CollectorMSP',
            'LabOrg': 'LabMSP',
            'ManufacturerOrg': 'ManufacturerMSP'
        };

        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: mspMap[orgName],
            type: 'X.509',
        };

        await wallet.put(adminId, x509Identity);
        return x509Identity;
    }

    async enrollUser(userId, orgName = 'FarmerOrg') {
        try {
            const wallet = await Wallets.newFileSystemWallet(this.walletPath);

            // Check if user already enrolled
            const userIdentity = await wallet.get(userId);
            if (userIdentity) {
                return { success: true, message: 'User already enrolled' };
            }

            // Ensure admin is enrolled
            await this.ensureAdminEnrolled(orgName);

            const adminId = `admin_${orgName}`;
            const adminIdentity = await wallet.get(adminId);

            const ca = await this.getCAClient(orgName);

            // Build admin user context
            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, adminId);

            // Register the user
            const affiliationMap = {
                'FarmerOrg': 'farmer.department1',
                'ProcessorOrg': 'processor.department1',
                'CollectorOrg': 'collector.department1',
                'LabOrg': 'lab.department1',
                'ManufacturerOrg': 'manufacturer.department1'
            };

            const secret = await ca.register({
                affiliation: affiliationMap[orgName],
                enrollmentID: userId,
                role: 'client'
            }, adminUser);

            // Enroll the user
            const enrollment = await ca.enroll({
                enrollmentID: userId,
                enrollmentSecret: secret
            });

            const mspMap = {
                'FarmerOrg': 'FarmerMSP',
                'ProcessorOrg': 'ProcessorMSP',
                'CollectorOrg': 'CollectorMSP',
                'LabOrg': 'LabMSP',
                'ManufacturerOrg': 'ManufacturerMSP'
            };

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: mspMap[orgName],
                type: 'X.509',
            };

            await wallet.put(userId, x509Identity);

            return {
                success: true,
                message: 'User successfully enrolled in blockchain',
                enrollmentId: userId
            };

        } catch (error) {
            console.error(`Failed to enroll user ${userId}:`, error);
            return {
                success: false,
                message: 'Blockchain enrollment failed',
                error: error.message
            };
        }
    }
}

module.exports = new BlockchainService();
