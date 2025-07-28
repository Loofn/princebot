const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');

// Cache for application emojis to avoid repeated API calls
let emojiCache = new Map();
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Store client reference for internal use
let discordClient = null;

/**
 * Initialize the emoji system with a Discord client
 * Call this once when your bot starts up
 * @param {Client} client - The Discord.js client instance
 */
function initializeEmojiSystem(client) {
    discordClient = client;
    console.log('✅ Emoji system initialized');
}

/**
 * Internal function to get client info
 * @returns {Object} Object containing clientId and token
 */
function getClientInfo() {
    if (!discordClient) {
        throw new Error('Emoji system not initialized. Call initializeEmojiSystem(client) first.');
    }
    
    return {
        clientId: discordClient.application?.id,
        token: process.env.TOKEN
    };
}

/**
 * Fetches application emojis from Discord Developer Portal
 * @returns {Promise<Map>} Map of emoji names to emoji objects
 */
async function fetchApplicationEmojis() {
    const now = Date.now();
    
    // Return cached emojis if they're still fresh
    if (emojiCache.size > 0 && (now - lastFetchTime) < CACHE_DURATION) {
        return emojiCache;
    }

    const { clientId, token } = getClientInfo();

    // Validate token and clientId before making request
    if (!token) {
        throw new Error('No bot token found in process.env.TOKEN');
    }
    
    if (!clientId) {
        throw new Error('Client application ID not available. Make sure bot is logged in.');
    }

    try {
        const rest = new REST({ version: '10' }).setToken(token);
        
        // Fetch application emojis
        const emojis = await rest.get(Routes.applicationEmojis(clientId));
        
        // Clear old cache and populate with new data
        emojiCache.clear();
        
        // Validate that emojis is an array
        if (!Array.isArray(emojis)) {
            console.warn('Application emojis response is not an array:', typeof emojis, emojis);
            // If no emojis or invalid response, just log and continue with empty cache
            lastFetchTime = now;
            console.log('No application emojis found or invalid response');
            return emojiCache;
        }
        
        // If emojis array is empty, that's fine - just means no emojis uploaded yet
        if (emojis.length === 0) {
            lastFetchTime = now;
            console.log('No application emojis uploaded yet');
            return emojiCache;
        }
        
        for (const emoji of emojis) {
            emojiCache.set(emoji.name, {
                id: emoji.id,
                name: emoji.name,
                animated: emoji.animated || false,
                // Format for use in Discord messages
                toString: () => emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.name}:${emoji.id}>`
            });
        }
        
        lastFetchTime = now;
        console.log(`Fetched ${emojis.length} application emojis`);
        
        return emojiCache;
    } catch (error) {
        console.error('Error fetching application emojis:', error);
        // Return cached emojis if available, otherwise empty map
        return emojiCache.size > 0 ? emojiCache : new Map();
    }
}

/**
 * Gets a specific application emoji by name
 * @param {string} emojiName - The name of the emoji
 * @returns {Promise<string|null>} The emoji string for Discord messages, or null if not found
 */
async function getApplicationEmoji(emojiName) {
    try {
        const emojis = await fetchApplicationEmojis();
        const emoji = emojis.get(emojiName);
        
        if (emoji) {
            return emoji.toString();
        }
        
        console.warn(`Application emoji '${emojiName}' not found`);
        return null;
    } catch (error) {
        console.error(`Error getting application emoji '${emojiName}':`, error.message);
        return null;
    }
}

/**
 * Gets multiple application emojis by names
 * @param {string[]} emojiNames - Array of emoji names
 * @returns {Promise<Object>} Object with emoji names as keys and emoji strings as values
 */
async function getApplicationEmojis(emojiNames) {
    try {
        const emojis = await fetchApplicationEmojis();
        const result = {};
        
        for (const name of emojiNames) {
            const emoji = emojis.get(name);
            result[name] = emoji ? emoji.toString() : null;
        }
        
        return result;
    } catch (error) {
        console.error('Error getting application emojis:', error.message);
        // Return empty object with null values for all requested emojis
        const result = {};
        emojiNames.forEach(name => {
            result[name] = null;
        });
        return result;
    }
}

/**
 * Lists all available application emoji names
 * @returns {Promise<string[]>} Array of emoji names
 */
async function listApplicationEmojiNames() {
    try {
        const emojis = await fetchApplicationEmojis();
        return Array.from(emojis.keys());
    } catch (error) {
        console.error('Error listing application emoji names:', error.message);
        return [];
    }
}

/**
 * Clears the emoji cache (useful for forcing a refresh)
 */
function clearEmojiCache() {
    emojiCache.clear();
    lastFetchTime = 0;
    console.log('Application emoji cache cleared');
}

module.exports = {
    initializeEmojiSystem,
    fetchApplicationEmojis,
    getApplicationEmoji,
    getApplicationEmojis,
    listApplicationEmojiNames,
    clearEmojiCache
};
