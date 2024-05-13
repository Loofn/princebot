const { EmbedBuilder, Collection, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const client = require('..');
const serverChannels = require("../data/channels.json")

client.on('messageUpdate', async (oldMsg, newMsg) => {

    if(!newMsg.author || !newMsg.cleanContent || !oldMsg.cleanContent) return;
    if(newMsg.author.bot) return;
    if(newMsg.channelId === '1152288540793774160') return;

    let oldMsgFormat = oldMsg.cleanContent;
    let newMsgFormat = newMsg.cleanContent;
    if(oldMsgFormat.length > 2000){
        oldMsgFormat.slice(0, 2000)
        oldMsgFormat += "..."
    }
    if(newMsgFormat.length > 2000){
        newMsgFormat = newMsgFormat.slice(0, 2000)
        newMsgFormat += "..."
    }

    const editLog = new EmbedBuilder()
        .setTitle(`Message modified`)
        .setThumbnail(newMsg.author.displayAvatarURL())
        .addFields(
            {name: `Member`, value: `${newMsg.author}\nID:\`${newMsg.author.id}\``, inline: true},
            {name: `Link to message`, value: `${newMsg.url}`, inline: true}
        )
        .setTimestamp()
        .setColor("DarkNavy")
        .setDescription(`**__OLD:__** ${oldMsgFormat}\n\n**__NEW:__** ${newMsgFormat}`);

    const auditlog = newMsg.guild.channels.cache.get(serverChannels.auditlogs)
    auditlog.send({embeds: [editLog]})
})

client.on('messageDelete', async (oldMsg) => {
    if(!oldMsg.author) return;
    if(oldMsg.author.bot) return;
    if(oldMsg.channelId === '1152288540793774160') return;

    let oldMsgFormat = oldMsg.cleanContent;
    if(oldMsgFormat.length > 2000){
        oldMsgFormat.slice(0, 2000)
        oldMsgFormat += "..."
    }

    const deleteLog = new EmbedBuilder()
        .setTitle(`Message removed`)
        .setThumbnail(oldMsg.author.displayAvatarURL())
        .setDescription(`Message content:\n\n${oldMsgFormat}`)
        .setColor("DarkBlue")
        .setTimestamp()
        .addFields(
            {name: `Member`, value: `${oldMsg.author}\nID:\`${oldMsg.author.id}\``, inline: true},
            {name: `Channel`, value: `${oldMsg.channel}`, inline: true}
        )

    const auditlog = oldMsg.guild.channels.cache.get(serverChannels.auditlogs)
    auditlog.send({embeds: [deleteLog]})
})