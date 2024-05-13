const { EmbedBuilder } = require('@discordjs/builders');
const client = require('..');
const con = require('../function/db')
const moment = require('moment');
const NodeCache = require('node-cache');
const cache = new NodeCache();
const serverChannels = require('../data/channels.json');
const { isStaff } = require('../function/roles');
const { saveUserRoles } = require('../function/userRoles');

client.on('messageCreate', async msg => {

    if(msg.author.bot) return;

    const blackListedWords = cache.get("blacklistedWords");
    const matchedWord = getMatchedBlacklistedWord(msg.content.toLowerCase(), blackListedWords);

    if(matchedWord){
        msg.react('<:neko_ban:1236763354219937895>')
        if(await isStaff(msg.author.id)) return msg.author.send(`You triggered one of my blacklist words: \`${matchedWord}\`.... be more careful please.`);
        if(await msg.member.roles.cache.get('1231652744436125839')) return msg.author.send(`You triggered one of my blacklist words: \`${matchedWord}\`.... be more careful please.`);
        msg.delete().catch();
        await saveUserRoles(msg.member.id);
        await msg.member.roles.set(['1231652744436125839']);

        guild.channels.create({
            name: `muzzled-${msg.member.user.username}`,
            type: ChannelType.GuildText,
            parent: '1231601155835035799',
            permissionOverwrites: [
                {
                    id: msg.member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                },
                {
                    id: guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: '1231405365674115112',
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]

        }).then(async (ch) => {
            await saveUserRoles(msg.member.id, ch.id);
            await msg.member.roles.set([serverRoles.jailrole]);
            const jailEmbed = new EmbedBuilder()
                .setImage('https://i.redd.it/5v6ne0kjqf671.jpg')
                .setDescription(`Hello there ${user}!\nYou've been **muzzled** and have reduced visibility due to using **blacklisted word** (||\`${matchedWord}\`||). Get comfy and grab drinks-`)
            
            ch.send({content: `${user}<@&1231405365674115112>`, embeds: [jailEmbed]})
        })
    }
})


async function fetchBlacklistedWords(){
    
    con.query(`SELECT * FROM blacklistwords`, function (err, res){
        if(res.length > 0){

            const blacklistedWords = res.map((row) => row.word.toLowerCase());

            cache.set("blacklistedWords", blacklistedWords);
            //console.log("Blacklisted words loaded into cache: ", blacklistedWords);
        }
    })
}
function updateCachePeriodically() {
    fetchBlacklistedWords();
}

function getMatchedBlacklistedWord(text, blackListedWords){
    for (const word of blackListedWords){
        const regexPattern = new RegExp(`\\b${word}\\b`, "i");
        if(regexPattern.test(text)){
            return word;
        }
    }
    return null;
}

module.exports = {
    updateCachePeriodically
}