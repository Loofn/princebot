const { EmbedBuilder } = require('@discordjs/builders');
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const client = require('..');
const con = require('../function/db')
const queryAsync = require('../function/queryAsync');
const moment = require('moment');
const NodeCache = require('node-cache');
const cache = new NodeCache();
const serverChannels = require('../data/channels.json');
const serverRoles = require('../data/serverRoles.json'); // Make sure this file exists and contains a 'jailrole' property
const { isStaff } = require('../function/roles');
const { saveUserRoles } = require('../function/userRoles');

client.on('messageCreate', async msg => {

    if(msg.author.bot) return;

    const blackListedWords = cache.get("blacklistedWords");
    if (!Array.isArray(blackListedWords) || blackListedWords.length === 0) return;

    const matchedWord = getMatchedBlacklistedWord(msg.content.toLowerCase(), blackListedWords);

    if(matchedWord){
        msg.react('<:neko_ban:1236763354219937895>')
        if(await isStaff(msg.author.id)) return msg.author.send(`You triggered one of my blacklist words: \`${matchedWord}\`.... be more careful please.`);
        if(await msg.member.roles.cache.get('1231652744436125839')) return msg.author.send(`You triggered one of my blacklist words: \`${matchedWord}\`.... be more careful please.`);
        msg.delete().catch();
        await saveUserRoles(msg.member.id);
        await msg.member.roles.set(['1231652744436125839']);

        msg.guild.channels.create({
            name: `muzzled-${msg.member.user.username}`,
            type: ChannelType.GuildText,
            parent: '1231601155835035799',
            permissionOverwrites: [
                {
                    id: msg.member.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                },
                {
                    id: msg.guild.roles.everyone,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: '1231405365674115112',
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                }
            ]

        }).then(async (ch) => {
            await saveUserRoles(msg.member.id, ch.id);
            const jailEmbed = new EmbedBuilder()
                .setImage('https://i.redd.it/5v6ne0kjqf671.jpg')
                .setDescription(`Hello there ${msg.member.user}!\nYou've been **muzzled** and have reduced visibility due to using **blacklisted word** (||\`${matchedWord}\`||). Get comfy and grab drinks-`)            
            ch.send({content: `${msg.member.user}<@&1231405365674115112>`, embeds: [jailEmbed]})
        })
    }
})


async function fetchBlacklistedWords(){
    const res = await queryAsync(con, `SELECT * FROM blacklistwords`, []);
    if(res.length > 0){
        const blacklistedWords = res.map((row) => row.word.toLowerCase());
        cache.set("blacklistedWords", blacklistedWords);
        //console.log("Blacklisted words loaded into cache: ", blacklistedWords);
    }
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