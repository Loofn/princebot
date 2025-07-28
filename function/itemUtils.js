const itemSystem = require('./itemSystem');

/**
 * Utility functions for integrating items with bot features
 */

/**
 * Check if user has robbery protection active
 * @param {string} userId - Discord user ID
 * @returns {Promise<boolean>} True if user is protected from robbery
 */
async function isProtectedFromRobbery(userId) {
    return await itemSystem.hasProtection(userId, 'robbery');
}

/**
 * Check if user can use lockpick on themselves to break their own protection
 * @param {string} userId - Discord user ID
 * @returns {Promise<boolean>} True if user has both lockpick and protection
 */
async function canBreakOwnProtection(userId) {
    const hasLockpick = await hasTool(userId, 'lockpick');
    const hasProtection = await isProtectedFromRobbery(userId);
    return hasLockpick && hasProtection;
}

/**
 * Get user's fishing boost from their tools and active effects
 * @param {string} userId - Discord user ID
 * @returns {Promise<number>} Fishing boost multiplier
 */
async function getFishingBoost(userId) {
    let totalBoost = 1.0;
    
    // Get fishing tools
    const tools = await itemSystem.getUserTools(userId);
    for (const tool of tools) {
        if (tool.effects.fishing_boost) {
            totalBoost = Math.max(totalBoost, tool.effects.fishing_boost);
        }
    }
    
    // Get active fishing effects
    const effects = await itemSystem.getActiveEffects(userId);
    for (const effect of effects) {
        if (effect.effect_type === 'fishing_luck_boost') {
            totalBoost *= effect.effect_value;
        }
    }
    
    return totalBoost;
}

/**
 * Get user's rare catch chance bonus from their tools
 * @param {string} userId - Discord user ID
 * @returns {Promise<number>} Additional rare catch chance (0.0 to 1.0)
 */
async function getRareCatchChance(userId) {
    let bonusChance = 0;
    
    const tools = await itemSystem.getUserTools(userId);
    for (const tool of tools) {
        if (tool.effects.rare_catch_chance) {
            bonusChance = Math.max(bonusChance, tool.effects.rare_catch_chance);
        }
    }
    
    return bonusChance;
}

/**
 * Check if user has a specific tool
 * @param {string} userId - Discord user ID
 * @param {string} toolId - Tool item ID
 * @returns {Promise<boolean>} True if user owns the tool
 */
async function hasTool(userId, toolId) {
    const tools = await itemSystem.getUserTools(userId);
    return tools.some(tool => tool.id === toolId);
}

/**
 * Get formatted list of user's active protections
 * @param {string} userId - Discord user ID
 * @returns {Promise<string>} Formatted string of active protections
 */
async function getActiveProtections(userId) {
    const protections = await itemSystem.getActiveEffects(userId);
    if (protections.length === 0) {
        return 'No active protections';
    }
    
    return protections.map(p => {
        const timeLeft = Math.ceil((p.expires_at - Date.now()) / 1000 / 60); // minutes
        return `🛡️ Protected from ${p.effect_type} (${timeLeft}m left)`;
    }).join('\n');
}

/**
 * Example usage in gambling/robbery commands
 */
async function exampleRobberyCheck(robberId, targetId) {
    // Check if target is protected
    if (await isProtectedFromRobbery(targetId)) {
        return {
            success: false,
            message: '🔒 This user is protected by a padlock! You cannot rob them.'
        };
    }
    
    // Proceed with robbery logic...
    return { success: true };
}

/**
 * Example usage in fishing commands
 */
async function exampleFishingBoost(userId) {
    const boost = await getFishingBoost(userId);
    const rareChance = await getRareCatchChance(userId);
    
    console.log(`User ${userId} has ${boost}x fishing boost and ${rareChance * 100}% bonus rare chance`);
    
    // Apply boosts to fishing calculations...
    return {
        fishingMultiplier: boost,
        rareCatchBonus: rareChance
    };
}

module.exports = {
    isProtectedFromRobbery,
    canBreakOwnProtection,
    getFishingBoost,
    getRareCatchChance,
    hasTool,
    getActiveProtections,
    exampleRobberyCheck,
    exampleFishingBoost
};
