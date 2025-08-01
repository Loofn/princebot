const NodeCache = require('node-cache');
const client = require('..')
const con = require('../function/db')
const queryAsync = require('../function/queryAsync');
const cache = new NodeCache();
const moment = require('moment');
const { WebhookClient } = require('discord.js');

const blacklistChannels = ["1231601155835035799"]
const muffledSpeech = ["Mmnnfhh... mmfffnnn...", "*Inaudible noise*", "MNNGHHHHNN!!?", "Mmmgnnngnnhhh...", "*Muffled moan* Mmnnhnnhn~", "*Muffled whimpering noises*", "*Questions existence*", "Mmmnnn... mmmnnn..."] // Add more muffled speech variations as needed

client.on('messageCreate', async message => {

    if(message.author.bot) return;
    const gaggedUsers = cache.get("gaggedUsers");
    if(gaggedUsers && gaggedUsers.includes(message.author.id)){

        if(blacklistChannels.includes(message.channel.parentId)) return;

        let hook = await getWebhook(message.channelId);
        let newContent = muffledSpeech[Math.floor(Math.random() * muffledSpeech.length)]
        message.delete();
        const webHook = new WebhookClient({id: hook.id, token: hook.token});
        webHook.send({
            content: newContent,
            username: message.member.displayName,
            avatarURL: message.member.displayAvatarURL({extension: 'png'})
        }).catch(console.error);
    }
})

async function getWebhook(channelId){
    return new Promise(async (resolve, reject) => {
        const guild = client.guilds.cache.get('1231299437519966269');
        const channel = guild.channels.cache.get(channelId);
        const hooks = await channel.fetchWebhooks();
        const filterHook = await hooks.find(hook => hook.name === 'gagHook');
        if(filterHook){
            updateGagged()
            resolve(filterHook)
        } else {
            channel.createWebhook({
                name: 'gagHook',
                reason: 'Webhook for gagging users'
            }).then(hook => {
                console.log(hook)
                updateGagged();
                resolve(hook);
            })
        }
    })
}

async function fetchGaggedUsers(){
    try {
        const res = await queryAsync(con, 'SELECT * FROM user_gag');
        if(res.length > 0){
            const gaggedUsers = res.map((row) => row.user);
            cache.set("gaggedUsers", gaggedUsers);
            console.log("Gagged users:", gaggedUsers.length)
        } else {
            cache.del("gaggedUsers")
        }
    } catch (error) {
        console.error('Error fetching gagged users:', error);
    }
}

async function updateGagged() {
    fetchGaggedUsers();
}

async function checkGaggedTimer(){
    try {
        const res = await queryAsync(con, 'SELECT * FROM user_gag');
        let removedCount = 0;
        
        if(res.length > 0){
            for (let i = 0; i < res.length; i++) {
                const gagEntry = res[i];
                
                // Check if the gag has expired
                if(moment().isAfter(moment(gagEntry.date))){
                    await queryAsync(con, 'DELETE FROM user_gag WHERE user = ?', [gagEntry.user]);
                    removedCount++;
                    console.log(`🔓 Removed expired gag for user: ${gagEntry.user}`);
                }
            }

            if(removedCount > 0) {
                console.log(`🔓 Removed ${removedCount} expired gag(s)`);
                updateGagged(); // Update the cache after removing expired gags
            }
        }
    } catch (error) {
        console.error('Error checking gagged timer:', error);
    }
}

module.exports = {
    getWebhook,
    updateGagged,
    checkGaggedTimer
}