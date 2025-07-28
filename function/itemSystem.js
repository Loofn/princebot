const fs = require('fs');
const path = require('path');
const queryAsync = require('./queryAsync');
const con = require('./db');
const { addPoints } = require('./furrygame');

/**
 * Generic item usage system that handles all items based on their metadata
 */
class ItemSystem {
    constructor() {
        this.shopItems = null;
        this.loadShopItems();
    }

    /**
     * Load shop items from JSON file
     */
    loadShopItems() {
        const shopPath = path.join(__dirname, '../data/shopItems.json');
        this.shopItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    }

    /**
     * Get item by ID
     * @param {string} itemId - The item ID
     * @returns {Object|null} Item object or null if not found
     */
    getItem(itemId) {
        if (!this.shopItems) this.loadShopItems();
        return this.shopItems.find(item => item.id === itemId) || null;
    }

    /**
     * Use an item from user's inventory
     * @param {string} userId - Discord user ID
     * @param {string} itemId - Item ID to use
     * @returns {Promise<Object>} Result object with success/error info
     */
    async useItem(userId, itemId) {
        try {
            const item = this.getItem(itemId);
            if (!item) {
                return { success: false, message: 'Item not found in shop.' };
            }

            if (!item.usable) {
                return { success: false, message: `**${item.name}** cannot be used directly. It's a ${item.use_type}.` };
            }

            // Check if user has the item in inventory
            const inventory = await queryAsync(con, 
                'SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ?', 
                [userId, itemId]
            );

            if (inventory.length === 0 || inventory[0].quantity <= 0) {
                return { success: false, message: `You don't have any **${item.name}** in your inventory.` };
            }

            // Process item usage based on type and effects
            const result = await this.processItemEffects(userId, item);
            if (!result.success) {
                return result;
            }

            // Remove item from inventory (consumables only)
            if (item.use_type === 'consumable') {
                await this.consumeItem(userId, itemId);
            }

            return {
                success: true,
                message: item.use_message || `You used **${item.name}**.`,
                effects: result.effects
            };

        } catch (error) {
            console.error('Error using item:', error);
            return { success: false, message: 'An error occurred while using the item.' };
        }
    }

    /**
     * Process item effects based on metadata
     * @param {string} userId - Discord user ID
     * @param {Object} item - Item object
     * @returns {Promise<Object>} Processing result
     */
    async processItemEffects(userId, item) {
        const effects = item.effects || {};
        const processedEffects = {};

        try {
            // Handle cumcoins reward
            if (effects.cumcoins_reward) {
                await addPoints(userId, effects.cumcoins_reward);
                processedEffects.cumcoins_added = effects.cumcoins_reward;
            }

            // Handle protection effects
            if (effects.protection_duration && effects.protection_type) {
                const expiresAt = Date.now() + effects.protection_duration;
                await this.applyProtection(userId, effects.protection_type, expiresAt);
                processedEffects.protection = {
                    type: effects.protection_type,
                    duration: effects.protection_duration
                };
            }

            // Handle temporary boosts
            if (effects.fishing_luck_boost && effects.duration) {
                const expiresAt = Date.now() + effects.duration;
                await this.applyTemporaryEffect(userId, 'fishing_luck_boost', effects.fishing_luck_boost, expiresAt);
                processedEffects.fishing_boost = {
                    multiplier: effects.fishing_luck_boost,
                    duration: effects.duration
                };
            }

            // Handle special effects
            if (effects.meme_power) {
                processedEffects.meme_power = true;
                // Could add special database entry or temporary status here
            }

            return { success: true, effects: processedEffects };

        } catch (error) {
            console.error('Error processing item effects:', error);
            return { success: false, message: 'Failed to apply item effects.' };
        }
    }

    /**
     * Apply protection to user
     * @param {string} userId - Discord user ID
     * @param {string} protectionType - Type of protection
     * @param {number} expiresAt - Expiration timestamp
     */
    async applyProtection(userId, protectionType, expiresAt) {
        await queryAsync(con, `
            INSERT INTO user_protections (user_id, protection_type, expires_at) 
            VALUES (?, ?, ?) 
            ON DUPLICATE KEY UPDATE expires_at = GREATEST(expires_at, ?)
        `, [userId, protectionType, expiresAt, expiresAt]);
    }

    /**
     * Apply temporary effect to user
     * @param {string} userId - Discord user ID
     * @param {string} effectType - Type of effect
     * @param {number} value - Effect value/multiplier
     * @param {number} expiresAt - Expiration timestamp
     */
    async applyTemporaryEffect(userId, effectType, value, expiresAt) {
        await queryAsync(con, `
            INSERT INTO user_temporary_effects (user_id, effect_type, effect_value, expires_at) 
            VALUES (?, ?, ?, ?) 
            ON DUPLICATE KEY UPDATE expires_at = GREATEST(expires_at, ?), effect_value = GREATEST(effect_value, ?)
        `, [userId, effectType, value, expiresAt, expiresAt, value]);
    }

    /**
     * Remove consumable item from inventory
     * @param {string} userId - Discord user ID
     * @param {string} itemId - Item ID
     */
    async consumeItem(userId, itemId) {
        await queryAsync(con, `
            UPDATE user_inventories 
            SET quantity = quantity - 1 
            WHERE user_id = ? AND item_id = ? AND quantity > 0
        `, [userId, itemId]);

        // Remove entry if quantity reaches 0
        await queryAsync(con, `
            DELETE FROM user_inventories 
            WHERE user_id = ? AND item_id = ? AND quantity <= 0
        `, [userId, itemId]);
    }

    /**
     * Check if user has active protection
     * @param {string} userId - Discord user ID
     * @param {string} protectionType - Type of protection to check
     * @returns {Promise<boolean>} True if protected
     */
    async hasProtection(userId, protectionType) {
        const result = await queryAsync(con, `
            SELECT expires_at FROM user_protections 
            WHERE user_id = ? AND protection_type = ? AND expires_at > ?
        `, [userId, protectionType, Date.now()]);

        return result.length > 0;
    }

    /**
     * Get user's active temporary effects
     * @param {string} userId - Discord user ID
     * @returns {Promise<Array>} Array of active effects
     */
    async getActiveEffects(userId) {
        return await queryAsync(con, `
            SELECT effect_type, effect_value, expires_at 
            FROM user_temporary_effects 
            WHERE user_id = ? AND expires_at > ?
        `, [userId, Date.now()]);
    }

    /**
     * Get user's tools/equipment (non-consumable items)
     * @param {string} userId - Discord user ID
     * @returns {Promise<Array>} Array of tools user owns
     */
    async getUserTools(userId) {
        const inventory = await queryAsync(con, `
            SELECT item_id, quantity FROM user_inventories WHERE user_id = ?
        `, [userId]);

        const tools = [];
        for (const inv of inventory) {
            const item = this.getItem(inv.item_id);
            if (item && item.use_type === 'tool') {
                tools.push({
                    ...item,
                    owned_quantity: inv.quantity
                });
            }
        }

        return tools;
    }
}

// Export singleton instance
module.exports = new ItemSystem();
