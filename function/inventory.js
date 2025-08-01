const queryAsync = require('./queryAsync');
const con = require('./db');

// Function to add item to user's inventory
async function addItemToUser(userId, itemId, quantity) {
    try {
        // Check if user already has this item
        const existing = await queryAsync(con, `
            SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ?
        `, [userId, itemId]);

        if (existing.length > 0) {
            // Update existing quantity
            await queryAsync(con, `
                UPDATE user_inventories 
                SET quantity = quantity + ? 
                WHERE user_id = ? AND item_id = ?
            `, [quantity, userId, itemId]);
        } else {
            // Insert new item
            await queryAsync(con, `
                INSERT INTO user_inventories (user_id, item_id, quantity) 
                VALUES (?, ?, ?)
            `, [userId, itemId, quantity]);
        }
        return true;
    } catch (error) {
        console.error('Error adding item to user:', error);
        return false;
    }
}

// Function to remove item from user's inventory
async function removeItemFromUser(userId, itemId, quantity) {
    try {
        // Check if user has this item
        const existing = await queryAsync(con, `
            SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ?
        `, [userId, itemId]);
        
        if (existing.length > 0) {
            const currentQuantity = existing[0].quantity || 1;
            if (currentQuantity < quantity) {
                return false; // Not enough quantity to remove
            }
            // Update quantity
            await queryAsync(con, `
                UPDATE user_inventories 
                SET quantity = quantity - ? 
                WHERE user_id = ? AND item_id = ?
            `, [quantity, userId, itemId]);

            // Remove entry if quantity reaches 0
            await queryAsync(con, `
                DELETE FROM user_inventories 
                WHERE user_id = ? AND item_id = ? AND quantity <= 0
            `, [userId, itemId]);
            return true;
        }
        return false; // Item not found in inventory
    } catch (error) {
        console.error('Error removing item from user:', error);
        return false;
    }
}

// Function to get user's inventory
async function getUserInventory(userId) {
    try {
        const rows = await queryAsync(con, `
            SELECT item_id, quantity FROM user_inventories 
            WHERE user_id = ? AND quantity > 0
        `, [userId]);
        return rows;
    } catch (error) {
        console.error('Error getting user inventory:', error);
        return [];
    }
}

// Function to check if user has specific item with enough quantity
async function hasItem(userId, itemId, requiredQuantity = 1) {
    try {
        const result = await queryAsync(con, `
            SELECT quantity FROM user_inventories 
            WHERE user_id = ? AND item_id = ? AND quantity >= ?
        `, [userId, itemId, requiredQuantity]);
        return result.length > 0;
    } catch (error) {
        console.error('Error checking if user has item:', error);
        return false;
    }
}

// Function to get specific item quantity from user's inventory
async function getItemQuantity(userId, itemId) {
    try {
        const result = await queryAsync(con, `
            SELECT quantity FROM user_inventories 
            WHERE user_id = ? AND item_id = ?
        `, [userId, itemId]);
        return result.length > 0 ? result[0].quantity : 0;
    } catch (error) {
        console.error('Error getting item quantity:', error);
        return 0;
    }
}

module.exports = {
    addItemToUser,
    removeItemFromUser,
    getUserInventory,
    hasItem,
    getItemQuantity
};
