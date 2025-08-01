const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder  } = require('discord.js');
const moment = require('moment');
const client = require('..');
const serverChannels = require("../data/channels.json");
const { deleteVerifyThread } = require('../function/db/fetchAgeVerifyThread');
const { checkCreatedChannels } = require('../function/cleanup');
const { checkEntranceAfterLeaving, storeUsers } = require('../function/entrance');
const { jailrole } = require('../data/serverRoles.json');

client.on('guildMemberAdd', async (member) => {

    if(member.user.bot) return;

    const embed = new EmbedBuilder()
    .setTitle(`Member joined`)
    .setTimestamp()
    .setColor("DarkOrange")
    .addFields(
        {name: `Member`, value: `${member}\n\`${member.user.username}\``, inline: true},
        {name: `User ID`, value: `\`${member.id}\``, inline: true},
        {name: `Account created`, value: `${moment(member.user.createdAt).format("MMMM Do YYYY")}\n\`${moment(member.user.createdAt).fromNow()}\``, inline: true}
    )

    const button = new ButtonBuilder()
    .setCustomId(`acceptrules-${member.id}`)
    .setEmoji(`🌟`)
    .setStyle(ButtonStyle.Success)
    .setLabel(`I accept the rules`)

    const row = new ActionRowBuilder()
        .addComponents(button)

    const welcome = new EmbedBuilder()
    .setTitle(`Welcome to 𝐋ofn 𝐋ounge!`)
    .setTimestamp()
    .setThumbnail(member.displayAvatarURL())
    .setColor("#cd96f0")
    .setDescription(`Hope you will enjoy your stay here, please don't forget to read <#1231299438069158001>.\nTo gain access press the big button underneath this message!\n\n🔞 Remember we are **strictly +18** server!!`)

    const entrance = member.guild.channels.cache.get('1231409498686623804');
    entrance.send({content: `${member}`, embeds: [welcome], components: [row]}).then(msg => {
        storeUsers(member.id, msg.id);
    })
    const auditlog = member.guild.channels.cache.get(serverChannels.auditlogs)
    auditlog.send({embeds: [embed]})
})

client.on('guildMemberRemove', async (member) => {
    try {

    
        if(member.user.bot) return;

        const embed = new EmbedBuilder()
        .setTitle(`Member left`)
        .setTimestamp()
        .setColor("DarkOrange")
        .addFields(
            {name: `Member`, value: `${member}\n\`${member.user.username}\``, inline: true},
            {name: `User ID`, value: `\`${member.id}\``, inline: true},
            {name: `Account created`, value: `${moment(member.user.createdAt).format("MMMM Do YYYY")}\n\`${moment(member.user.createdAt).fromNow()}\``, inline: true},
            {name: `Joined server`, value: `${moment(member.joinedAt).format("MMMM Do YYYY")}\n\`${moment(member.joinedAt).fromNow()}\``, inline: true},
        )

        const auditlog = member.guild.channels.cache.get(serverChannels.auditlogs)
        auditlog.send({embeds: [embed]})
    } catch (err) {
        console.error(err);
    }

    checkCreatedChannels(member.id);
    deleteVerifyThread(member.id);
    checkEntranceAfterLeaving(member.id);
})

client.on('guildMemberUpdate', async (oldMember, newMember) => {
    if(oldMember.user.bot) return;

    // Check if the user has changed their username or avatar
    if (oldMember.user.avatar !== newMember.user.avatar) {
        if(newMember.roles.cache.has(jailrole)) {
            
            await restoreUserRoles(newMember.id);

            const muzzledChannel = newMember.guild.channels.cache.find(ch => ch.name === `muzzled-${newMember.user.username}`);
            if (muzzledChannel) {
                const embed = new EmbedBuilder()
                    .setTitle(`You have changed your avatar!`)
                    .setDescription(`Hello ${newMember}, you have changed your avatar and are no longer considered suspicious. Your muzzled channel will be deleted soon by a moderator.`)
                    .setColor("Green")

                const deleteChannelBtn = new ButtonBuilder()
                    .setCustomId('deleteChannel-staff')
                    .setLabel('Delete muzzled channel')
                    .setEmoji('🗑️')
                    .setStyle(ButtonStyle.Secondary);

                const rowBtn = new ActionRowBuilder()
                    .addComponents(deleteChannelBtn);

                await muzzledChannel.send({ content: `${newMember} <@&1248724861186998384>`, embeds: [embed], components: [rowBtn] });
            }
        }
    }
});