const { EmbedBuilder, Collection, PermissionsBitField } = require('discord.js');
const ms = require('ms');
const client = require('..');
const serverChannels = require("../data/channels.json")

// Voice channel event logging
client.on('voiceStateUpdate', async (oldState, newState) => {
    const user = newState.member || oldState.member;
    if (!user || user.user.bot) return;
    const auditlog = (newState.guild || oldState.guild).channels.cache.get(serverChannels.general);
    if (!auditlog) return;

    // Voice channel join/leave
    if (oldState.channelId !== newState.channelId) {
        if (oldState.channelId && !newState.channelId) {
            // Left voice channel
            const embed = new EmbedBuilder()
                .setTitle('Voice Channel Left')
                .setColor('Red')
                .setTimestamp()
                .setThumbnail(user.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                    { name: 'Channel', value: `<#${oldState.channelId}>`, inline: true }
                );
            auditlog.send({ embeds: [embed] });
        } else if (!oldState.channelId && newState.channelId) {
            // Joined voice channel
            const embed = new EmbedBuilder()
                .setTitle('Voice Channel Joined')
                .setColor('Green')
                .setTimestamp()
                .setThumbnail(user.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                    { name: 'Channel', value: `<#${newState.channelId}>`, inline: true }
                );
            auditlog.send({ embeds: [embed] });
        } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // Switched voice channel
            const embed = new EmbedBuilder()
                .setTitle('Voice Channel Switched')
                .setColor('Orange')
                .setTimestamp()
                .setThumbnail(user.user.displayAvatarURL())
                .addFields(
                    { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                    { name: 'From', value: `<#${oldState.channelId}>`, inline: true },
                    { name: 'To', value: `<#${newState.channelId}>`, inline: true }
                );
            auditlog.send({ embeds: [embed] });
        }
    }

    // Streaming start/stop
    if (!oldState.streaming && newState.streaming) {
        const embed = new EmbedBuilder()
            .setTitle('User Started Streaming')
            .setColor('Purple')
            .setTimestamp()
            .setThumbnail(user.user.displayAvatarURL())
            .addFields(
                { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                { name: 'Channel', value: newState.channelId ? `<#${newState.channelId}>` : 'Unknown', inline: true }
            );
        auditlog.send({ embeds: [embed] });
    } else if (oldState.streaming && !newState.streaming) {
        const embed = new EmbedBuilder()
            .setTitle('User Stopped Streaming')
            .setColor('Purple')
            .setTimestamp()
            .setThumbnail(user.user.displayAvatarURL())
            .addFields(
                { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                { name: 'Channel', value: oldState.channelId ? `<#${oldState.channelId}>` : 'Unknown', inline: true }
            );
        auditlog.send({ embeds: [embed] });
    }

    // Camera on/off
    if (!oldState.selfVideo && newState.selfVideo) {
        const embed = new EmbedBuilder()
            .setTitle('User Turned On Camera')
            .setColor('Blue')
            .setTimestamp()
            .setThumbnail(user.user.displayAvatarURL())
            .addFields(
                { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                { name: 'Channel', value: newState.channelId ? `<#${newState.channelId}>` : 'Unknown', inline: true }
            );
        auditlog.send({ embeds: [embed] });
    } else if (oldState.selfVideo && !newState.selfVideo) {
        const embed = new EmbedBuilder()
            .setTitle('User Turned Off Camera')
            .setColor('Blue')
            .setTimestamp()
            .setThumbnail(user.user.displayAvatarURL())
            .addFields(
                { name: 'Member', value: `${user} \nID:\`${user.id}\``, inline: true },
                { name: 'Channel', value: oldState.channelId ? `<#${oldState.channelId}>` : 'Unknown', inline: true }
            );
        auditlog.send({ embeds: [embed] });
    }
});

const EXCLUDED_CHANNELS = [
    '1248723073654456360',
    '1234534548818100365'
    // Add more channel IDs here as needed
];

client.on('messageUpdate', async (oldMsg, newMsg) => {
    if(!newMsg.author || !newMsg.cleanContent || !oldMsg.cleanContent) return;
    if(newMsg.author.bot) return;
    if(EXCLUDED_CHANNELS.includes(newMsg.channelId)) return;

    // Prevent logging if the only change is a gif embed (e.g., Tenor, Discord, Giphy)
    // These embeds are usually added automatically and do not change the message content
    const isGifEmbed = (msg) => {
        if (!msg.embeds || msg.embeds.length === 0) return false;
        return msg.embeds.some(e =>
            e.type === 'gifv' &&
            e.url && (
                e.url.includes('tenor.com') ||
                e.url.includes('media.discordapp.net') ||
                e.url.includes('giphy.com')
            )
        );
    };

    // If the content is unchanged and only a gif embed was added, skip logging
    if (
        oldMsg.cleanContent === newMsg.cleanContent &&
        !isGifEmbed(oldMsg) && isGifEmbed(newMsg)
    ) {
        return;
    }

    let oldMsgFormat = oldMsg.cleanContent;
    let newMsgFormat = newMsg.cleanContent;
    if(oldMsgFormat.length > 2000){
        oldMsgFormat = oldMsgFormat.slice(0, 2000) + "...";
    }
    if(newMsgFormat.length > 2000){
        newMsgFormat = newMsgFormat.slice(0, 2000) + "...";
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

    const auditlog = newMsg.guild.channels.cache.get(serverChannels.general)
    auditlog.send({embeds: [editLog]})
})

client.on('messageDelete', async (oldMsg) => {
    if(!oldMsg.author) return;
    if(oldMsg.author.bot) return;
    if(EXCLUDED_CHANNELS.includes(oldMsg.channelId)) return;

    let oldMsgFormat = oldMsg.cleanContent;
    if(oldMsgFormat && oldMsgFormat.length > 2000){
        oldMsgFormat = oldMsgFormat.slice(0, 2000) + "...";
    }

    const deleteLog = new EmbedBuilder()
        .setTitle(`Message removed`)
        .setThumbnail(oldMsg.author.displayAvatarURL())
        .setColor("DarkBlue")
        .setTimestamp()
        .addFields(
            {name: `Member`, value: `${oldMsg.author}\nID:\`${oldMsg.author.id}\``, inline: true},
            {name: `Channel`, value: `${oldMsg.channel}`, inline: true}
        );

    // Add message content
    if (oldMsgFormat) {
        deleteLog.setDescription(`Message content:\n\n${oldMsgFormat}`);
    }

    // Add deleted image attachments if present
    if (oldMsg.attachments && oldMsg.attachments.size > 0) {
        const imageUrls = Array.from(oldMsg.attachments.values())
            .filter(att => att.contentType && att.contentType.startsWith('image/'))
            .map(att => att.url);
        if (imageUrls.length > 0) {
            deleteLog.addFields({ name: 'Deleted Images', value: imageUrls.join('\n') });
            // Optionally, set the first image as embed image
            deleteLog.setImage(imageUrls[0]);
        }
    }

    const auditlog = oldMsg.guild.channels.cache.get(serverChannels.general)
    auditlog.send({embeds: [deleteLog]})
})