
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
