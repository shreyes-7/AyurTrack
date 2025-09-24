const allRoles = {
  user: [],
  admin: ['getUsers', 'manageUsers', 'manageBlockchain'],
  farmer: ['getUsers', 'createBatches', 'viewOwnProfile', 'updateOwnProfile'],
  processor: ['getUsers', 'processBatches', 'viewOwnProfile', 'updateOwnProfile', 'querySupplyChain'],
  lab: ['getUsers', 'testBatches', 'viewOwnProfile', 'updateOwnProfile', 'querySupplyChain', 'createTestReports'],
  manufacturer: ['getUsers', 'manufactureBatches', 'viewOwnProfile', 'updateOwnProfile', 'querySupplyChain', 'createProducts'],
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
