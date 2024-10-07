const { ChannelType, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const client = require("..");
const con = require('../function/db')
const {saveUserRoles} = require('../function/userRoles')
const serverRoles = require('../data/serverRoles.json')

async function defaultAvatar(userId, remove=true){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = guild.members.cache.get(userId);

    if(!member.user.avatar){
        guild.channels.create({
            name: `muzzled-${member.user.username}`,
            type: ChannelType.GuildText,
            parent: '1231601155835035799',
            permissionOverwrites: [
                {
                    id: member.id,
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
            await saveUserRoles(member.id, ch.id);
            await member.roles.set([serverRoles.jailrole]);
            const jailEmbed = new EmbedBuilder()
                .setImage('https://i.redd.it/5v6ne0kjqf671.jpg')
                .setDescription(`Hello there ${member}!\nYou've been **muzzled** and have reduced visibility. This is as your account is considered suspicious (default profile picture).`)
            
                const deleteChannelBtn = new ButtonBuilder()
                .setCustomId("deleteChannel-staff")
                .setLabel("Delete muzzled channel")
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Primary)

                const kickBtn = new ButtonBuilder()
                .setCustomId(`kickUser-${member.id}`)
                .setLabel("Kick muzzled user")
                .setEmoji('🥾')
                .setStyle(ButtonStyle.Danger)

            const row = new ActionRowBuilder()
                .addComponents(deleteChannelBtn, kickBtn)
                
            ch.send({content: `${member}<@&1231405365674115112>`, embeds: [jailEmbed], components: [row]})
        })

        return true;

    }

    return false;
}

module.exports = {
    defaultAvatar
}