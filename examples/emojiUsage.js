// Example usage of applicationEmojis.js
// This file shows how to integrate application emojis into your Discord bot

const { getApplicationEmoji, getApplicationEmojis, listApplicationEmojiNames } = require('./function/applicationEmojis');

// Example 1: Using in a slash command
async function exampleSlashCommand(interaction) {
    // No need to pass clientId or token anymore!
    const padlockEmoji = await getApplicationEmoji('padlock');
    const fishingEmoji = await getApplicationEmoji('fishing_pole');
    
    // Use in embed or message
    const embed = new EmbedBuilder()
        .setTitle('Shop Items')
        .setDescription(`${padlockEmoji || '🔒'} Padlock - Protection from robbers\n${fishingEmoji || '🎣'} Fishing Pole - Catch some fish!`);
    
    await interaction.reply({ embeds: [embed] });
}

// Example 2: Batch loading emojis for shop system
async function loadShopEmojis(client) {
    // Much simpler - no parameters needed!
    const shopEmojis = await getApplicationEmojis([
        'padlock',
        'fishing_pole',
        'rare_gem',
        'common_coin'
    ]);
    
    // Store in client for easy access
    client.shopEmojis = shopEmojis;
    
    console.log('Loaded shop emojis:', Object.keys(shopEmojis));
}

// Example 3: Initialize emojis when bot starts
async function initializeEmojis(client) {
    try {
        // List all available emojis
        const emojiNames = await listApplicationEmojiNames();
        console.log('Available application emojis:', emojiNames);
        
        // Load commonly used emojis
        await loadShopEmojis(client);
        
    } catch (error) {
        console.error('Failed to initialize application emojis:', error);
    }
}

// Example 4: Using in your existing shop system
function formatShopItem(item, emoji) {
    const emojiString = emoji || '📦'; // Fallback emoji
    return `${emojiString} **${item.name}** - ${item.price} coins\n${item.description}`;
}

module.exports = {
    exampleSlashCommand,
    loadShopEmojis,
    initializeEmojis,
    formatShopItem
};
