// Integration guide for application emojis in your Discord bot

/*
SETUP INSTRUCTIONS:

1. Add application emojis to your Discord Developer Portal:
   - Go to https://discord.com/developers/applications
   - Select your bot application
   - Navigate to "App Emojis" section
   - Upload emojis with names matching your shopItems.json emoji_name fields
   - Examples: "padlock", "fishing_pole", etc.

2. Install required dependencies:
   npm install @discordjs/rest discord-api-types

3. The emoji system is automatically initialized in your ready.js event!
*/

// Example: Add this to your ready.js file (ALREADY DONE!)
const { initializeEmojiSystem } = require('../function/applicationEmojis');

// In your ready event handler:
async function initializeBotEmojis(client) {
    // This is now automatically called in ready.js!
    initializeEmojiSystem(client);
}

/*
4. Using emojis in commands (MUCH SIMPLER NOW!):

// Method 1: Direct usage - no parameters needed!
const { getApplicationEmoji } = require('../../function/applicationEmojis');

const emoji = await getApplicationEmoji('padlock');
console.log(emoji); // <:padlock:123456789>

// Method 2: Batch loading (more efficient) - no parameters needed!
const { getApplicationEmojis } = require('../../function/applicationEmojis');

const emojis = await getApplicationEmojis(['padlock', 'fishing_pole']);
console.log(emojis.padlock); // <:padlock:123456789>
console.log(emojis.fishing_pole); // <:fishing_pole:987654321>

5. Error handling:
   - If an emoji doesn't exist, functions return null
   - The system includes fallback emojis (📦) for missing application emojis
   - Cache system prevents excessive API calls
   - Built-in error handling - no need for try/catch in your commands

6. Cache management:
   - Emojis are cached for 5 minutes
   - Use clearEmojiCache() to force refresh if needed
   - Cache automatically refreshes when expired

7. ONE-TIME SETUP:
   - Call initializeEmojiSystem(client) once in ready.js (ALREADY DONE!)
   - That's it! No need to pass client/token to any functions anymore
*/

module.exports = {
    initializeBotEmojis
};
