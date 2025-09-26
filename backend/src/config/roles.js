const allRoles = {
  // Basic user - minimal permissions
  user: [
    'viewOwnProfile',
    'updateOwnProfile'
  ],

  // Admin - full system access
  admin: [
    // User management
    'getUsers', 
    'manageUsers',
    'createUsers',
    'deleteUsers',
    'updateUsers',
    
    // Blockchain management
    'manageBlockchain',
    'initLedger',
    'deleteByKey',
    
    // Participant management (admin-only in chaincode)
    'createParticipant',
    'updateParticipant', 
    'deleteParticipant',
    'getParticipants',
    'queryParticipants',
    
    // Species rules (admin-only in chaincode)
    'setSpeciesRules',
    'getSpeciesRules',
    
    // Batch management
    'createBatches',
    'updateBatches',
    'deleteBatches',
    'getBatches',
    'queryAllBatches',
    
    // Collections
    'createCollection',
    'getCollections',
    'getCollection',
    'queryCollections',
    
    // Processing
    'addProcessingStep',
    'getProcessingSteps',
    
    // Quality testing
    'addQualityTest',
    'getQualityTests',
    
    // Formulations
    'createFormulation',
    'getFormulation',
    'generateQRCode',
    
    // Provenance
    'getProvenance',
    'queryByPrefix',
    
    // System operations
    'viewOwnProfile',
    'updateOwnProfile'
  ],

  // Farmer - herb collection and batch creation
  farmer: [
    // Core farmer functions (based on chaincode)
    'createBatches',           // CreateHerbBatch function
    'createCollection',        // Collection events
    'getBatches',              // Read their own batches
    'getCollection',           // Read collection data
    'getCollections',          // Query collections
    'updateBatches',           // Update batch status when transferring
    
    // Participant functions
    'getParticipants',         // View other participants for transfers
    'queryParticipants',       // Query participants by type
    
    // Species information
    'getSpeciesRules',         // Check growing rules and restrictions
    
    // Profile management
    'viewOwnProfile',
    'updateOwnProfile',
    'getUsers',                // View other users for coordination
    
    // Read-only access for transparency
    'getProvenance',           // View full supply chain
    'queryByPrefix'            // General queries
  ],

  // Processor - processing herbs into intermediate products
  processor: [
    // Core processor functions
    'addProcessingStep',       // AddProcessingStep function
    'getBatches',              // Read batches for processing
    'updateBatches',           // Update batch status after processing
    'getProcessingSteps',      // View processing history
    
    // Collection and supply chain
    'getCollection',           // View collection data
    'getCollections',          // Query collections
    'queryAllBatches',         // Find batches to process
    
    // Participant and user management
    'getParticipants',         // View participants for sourcing
    'queryParticipants',       // Query by participant type
    'getUsers',                // View users for coordination
    
    // Quality and compliance
    'getQualityTests',         // View quality test results
    'getSpeciesRules',         // Understand species requirements
    
    // Profile and transparency
    'viewOwnProfile',
    'updateOwnProfile',
    'getProvenance',           // Full supply chain visibility
    'querySupplyChain',        // Custom supply chain queries
    'queryByPrefix'            // General queries
  ],

  // Lab - quality testing and certification
  lab: [
    // Core lab functions
    'addQualityTest',          // AddQualityTest function
    'getQualityTests',         // View all quality tests
    'createTestReports',       // Generate test reports
    
    // Batch access for testing
    'getBatches',              // Read batches for testing
    'updateBatches',           // Update batch status after testing
    'queryAllBatches',         // Find batches requiring testing
    
    // Collection and processing data
    'getCollection',           // View collection origins
    'getCollections',          // Query collections
    'getProcessingSteps',      // View processing history
    
    // Participant and compliance
    'getParticipants',         // View participants
    'queryParticipants',       // Query participants by type
    'getSpeciesRules',         // Understand quality thresholds
    'getUsers',                // View users for coordination
    
    // Profile and transparency
    'viewOwnProfile',
    'updateOwnProfile',
    'getProvenance',           // Full traceability
    'querySupplyChain',        // Supply chain analysis
    'queryByPrefix'            // General queries
  ],

  // Manufacturer - final product creation
  manufacturer: [
    // Core manufacturer functions
    'createFormulation',       // CreateFormulation function
    'getFormulation',          // Read formulations
    'generateQRCode',          // GenerateBatchQR function
    'createProducts',          // Product creation
    'manufactureBatches',      // Manufacturing operations
    
    // Batch and ingredient management
    'getBatches',              // Source ingredient batches
    'updateBatches',           // Update batch status when using
    'queryAllBatches',         // Find suitable batches
    
    // Supply chain visibility
    'getCollection',           // View ingredient origins
    'getCollections',          // Query collections
    'getProcessingSteps',      // View processing history
    'getQualityTests',         // Verify ingredient quality
    
    // Participant and user management
    'getParticipants',         // View suppliers and partners
    'queryParticipants',       // Query by participant type
    'getUsers',                // View users for coordination
    
    // Compliance and quality
    'getSpeciesRules',         // Understand ingredient requirements
    'getProvenance',           // Full ingredient traceability
    
    // Profile and operations
    'viewOwnProfile',
    'updateOwnProfile',
    'querySupplyChain',        // Supply chain optimization
    'queryByPrefix'            // General queries
  ]
};

const roles = Object.keys(allRoles);
const roleRights = new Map(Object.entries(allRoles));

module.exports = {
  roles,
  roleRights,
};
