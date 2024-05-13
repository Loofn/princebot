const client = require('..');
const { ActivityType } = require('discord.js');
const removeUnverified = require('../timers/removeUnverified');
const remindUnverified = require('../timers/remindUnverified');
const { checkBumping } = require('./bumpReminder');
const { updateCachePeriodically } = require('./blacklist');
const { checkCreatedChannels } = require('../function/cleanup');
const { checkEntrance } = require('../function/entrance');
const { sendFurry, fiftyPercentChance } = require('./petfurry');
const { updateGagged } = require('./gagMsg');

client.on("ready", async () => {
    client.user.setActivity('furry booty', { type: ActivityType.Watching});
    updateCachePeriodically()
    checkCreatedChannels()
    checkEntrance()
    sendFurry()
    updateGagged()
    setInterval(() => {
        client.user.setActivity('furry booty', { type: ActivityType.Watching});
        checkBumping()
        remindUnverified()
        checkCreatedChannels()
        removeUnverified()
        checkEntrance()
    }, 10000);

    setInterval(() => {
        if(fiftyPercentChance()){
            sendFurry()
        }
    }, 300000)
    console.log(`Logged in as ${client.user.tag}!`)
})