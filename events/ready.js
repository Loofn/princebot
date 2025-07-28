const client = require('..');
const { ActivityType } = require('discord.js');
const removeUnverified = require('../timers/removeUnverified');
const remindUnverified = require('../timers/remindUnverified');
const { checkBumping } = require('./bumpReminder');
const { updateCachePeriodically } = require('./blacklist');
const { checkCreatedChannels } = require('../function/cleanup');
const { checkEntrance, remindAboutRules } = require('../function/entrance');
const { sendFurry, fiftyPercentChance } = require('./petfurry');
const { updateGagged } = require('./gagMsg');
const { getUptime } = require('../function/uptime');
const { sendInformation } = require('./ai');
const awardCumRole = require('../function/awardroles');
const { postRedditEmbeds } = require('./redditPoster');
const { listApplicationEmojiNames, initializeEmojiSystem } = require('../function/applicationEmojis');
const { initializeInventorySystem } = require('../function/inventorySchema');


client.on("ready", async () => {
    client.user.setActivity('furry booty', { type: ActivityType.Watching});
    
    // Initialize emoji system
    initializeEmojiSystem(client);
    
    // Initialize inventory system
    await initializeInventorySystem();
    
    updateCachePeriodically()
    checkCreatedChannels()
    await checkEntrance()
    remindAboutRules()
    sendFurry()
    updateGagged()
    sendInformation()
    console.log("Started", getUptime().fromNow())
    awardCumRole()
    postRedditEmbeds(); // Start Reddit poster immediately
    

    // SHORTER INTERVAL -> 10 seconds
    setInterval(() => {
        client.user.setActivity('furry booty', { type: ActivityType.Watching});
        checkBumping()
        remindUnverified()
        checkCreatedChannels()
        removeUnverified()
    }, 10000);

    // LONGER INTERVAL -> 5 minutes
    setInterval(() => {
        postRedditEmbeds();
    }, 300000);

    // LONGER INTERVAL -> 1 HOUR
    setInterval(() => {
        checkEntrance()
        remindAboutRules()
        sendInformation()
    }, 3600000)

    setInterval(() => {
        if(fiftyPercentChance()){
            sendFurry()
        }
    }, 300000)

    // Reddit poster interval (already set in redditPoster.js, but safe to require here)
    // If you want to control the interval here, you can move the setInterval from redditPoster.js to here.

    console.log(`Logged in as ${client.user.tag}!`)

    async function initializeBotEmojis(client) {
        try {
            const clientId = client.application.id;
            const token = process.env.TOKEN;
            
            // List available emojis
            const emojiNames = await listApplicationEmojiNames(clientId, token);
            console.log(`✅ Loaded ${emojiNames.length} application emojis:`, emojiNames);
            
        } catch (error) {
            console.error('❌ Failed to load application emojis:', error);
        }
    }
})