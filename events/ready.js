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

client.on("ready", async () => {
    client.user.setActivity('furry booty', { type: ActivityType.Watching});
    updateCachePeriodically()
    checkCreatedChannels()
    await checkEntrance()
    remindAboutRules()
    sendFurry()
    updateGagged()
    console.log("Started", getUptime().fromNow())

    // SHORTER INTERVAL -> 10 seconds
    setInterval(() => {
        client.user.setActivity('furry booty', { type: ActivityType.Watching});
        checkBumping()
        remindUnverified()
        checkCreatedChannels()
        removeUnverified()
        
    }, 10000);

    // LONGER INTERVAL -> 1 HOUR
    setInterval(() => {
        checkEntrance()
        remindAboutRules()
    }, 3600000)

    setInterval(() => {
        if(fiftyPercentChance()){
            sendFurry()
        }
    }, 300000)
    console.log(`Logged in as ${client.user.tag}!`)
})