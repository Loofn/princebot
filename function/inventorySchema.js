const con = require('./db');

/**
 * Updates the user_inventories table to support quantities if not already present
 */
async function updateInventorySchema() {
    return new Promise((resolve, reject) => {
        // Check if quantity column exists
        con.query(`SHOW COLUMNS FROM user_inventories LIKE 'quantity'`, (err, result) => {
            if (err) {
                console.error('Error checking inventory schema:', err);
                return reject(err);
            }
            
            // If quantity column doesn't exist, add it
            if (result.length === 0) {
                con.query(`ALTER TABLE user_inventories ADD COLUMN quantity INT DEFAULT 1`, (err2) => {
                    if (err2) {
                        console.error('Error adding quantity column:', err2);
                        return reject(err2);
                    }
                    console.log('✅ Added quantity column to user_inventories table');
                    resolve();
                });
            } else {
                console.log('✅ Inventory schema is up to date');
                resolve();
            }
        });
    });
}

/**
 * Creates all necessary tables for the item system
 */
async function createItemSystemTables() {
    const tables = [
        // User inventories table
        `CREATE TABLE IF NOT EXISTS user_inventories (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            item_id VARCHAR(255) NOT NULL,
            quantity INT DEFAULT 1,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_item (user_id, item_id)
        )`,
        
        // User protections table (for padlocks, shields, etc.)
        `CREATE TABLE IF NOT EXISTS user_protections (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            protection_type VARCHAR(255) NOT NULL,
            expires_at BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_protection (user_id, protection_type)
        )`,
        
        // Temporary effects table (for boosts, buffs, etc.)
        `CREATE TABLE IF NOT EXISTS user_temporary_effects (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(255) NOT NULL,
            effect_type VARCHAR(255) NOT NULL,
            effect_value DECIMAL(10,4) NOT NULL,
            expires_at BIGINT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_user_effect (user_id, effect_type)
        )`
    ];

    for (const tableSQL of tables) {
        await new Promise((resolve, reject) => {
            con.query(tableSQL, (err) => {
                if (err) {
                    console.error('Error creating table:', err);
                    return reject(err);
                }
                resolve();
            });
        });
    }
    
    console.log('✅ Item system tables ready');
}

/**
 * Initialize inventory system - call this once when bot starts
 */
async function initializeInventorySystem() {
    try {
        await createItemSystemTables();
        await updateInventorySchema();
        console.log('✅ Inventory system initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize inventory system:', error);
    }
}

module.exports = {
    initializeInventorySystem,
    updateInventorySchema,
    createItemSystemTables
};
