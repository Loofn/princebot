const NodeCache = require('node-cache');
const client = require('..')
const con = require('../function/db')
const cache = new NodeCache();
const moment = require('moment');
const { WebhookClient } = require('discord.js');

const blacklistChannels = ["1231601155835035799"]
const muffledSpeech = ["Mmnnfhh... mmfffnnn...", "*Inaudible noise*", "MNNGHHHHNN!!?", "Mmmgnnngnnhhh...", "*Muffled moan* Mmnnhnnhn~", "*Muffled whimpering noises*"]

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
    
    con.query(`SELECT * FROM user_gag`, function (err, res){
        if(res.length > 0){

            const gaggedUsers = res.map((row) => row.user);

            cache.set("gaggedUsers", gaggedUsers);
            console.log("Gagged users:", gaggedUsers.length)
        } else {
            cache.del("gaggedUsers")
        }
    })
}

async function updateGagged() {
    fetchGaggedUsers();
}

function checkGaggedTimer(){
    con.query(`SELECT * FROM user_gag`, async function(err, res){
        if(res.length > 0){
            for (let i = 0; i < res.length; i++) {
                
                if(moment().isAfter(res[i].date)){
                    con.query(`DELETE FROM user_gag WHERE user='${res[i].user}'`);
                }
                
            }

            updateGagged()
        }
    })
}

module.exports = {
    getWebhook,
    updateGagged,
    checkGaggedTimer
}