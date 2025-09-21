const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');

async function getContract(user = 'appUser', org = 'FarmerOrg') {
    try {
        // Load the connection profile
        const ccpPath = path.resolve(__dirname, 'connection-org1.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Setup wallet
        const walletPath = path.join(__dirname, 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check if user identity exists
        const identity = await wallet.get(user);
        if (!identity) {
            throw new Error(`Identity ${user} not found in wallet`);
        }

        // Create a gateway connection
        const gateway = new Gateway();
        await gateway.connect(ccp, {
            wallet,
            identity: user,
            discovery: { enabled: true, asLocalhost: true } // true for local network
        });

        // Get network (channel)
        const network = await gateway.getNetwork('AyurChannel');

        const contract = network.getContract('HerbalTraceContract');

        return { contract, gateway };
    } catch (error) {
        console.error(`Error connecting to Fabric network: ${error}`);
        throw error;
    }
}

module.exports = { getContract };
