const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed, ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { isMod, isAdmin, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { restoreUserRoles, saveUserRoles } = require('../../function/userRoles');
const { addModlog } = require('../../function/modlog');

module.exports = {
    name: 'muzzle',
    description: 'Applies muzzled role to user, removing all other roles from them.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to muzzle',
            type: 6,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        if(await isTrialMod(member.id) || await isMod(member.id) || await isAdmin(member.id)){
            const user = guild.members.cache.get(options.getUser('user').id);
            

            const embed = new EmbedBuilder()
                .setTitle(`User was jailed.`)
                .setDescription(`${user} had their roles saved in database, and <@&${serverRoles.jailrole}> was applied to them.`)
                .setColor("Greyple")

            const log = new EmbedBuilder()
                .setTitle(`User was jailed`)
                .setDescription(`${member} has jailed ${user}, stripping all roles from them.`)
                .setTimestamp()
                .setColor("Greyple");

            addModlog(user.id, "JAIL", member.id);
            const logchannel = guild.channels.cache.get(serverChannels.moderation)
            logchannel.send({embeds: [log]})
            interaction.reply({embeds: [embed], ephemeral: true})

            // Create jail channel

            guild.channels.create({
                name: `muzzled-${user.user.username}`,
                type: ChannelType.GuildText,
                parent: '1231601155835035799',
                permissionOverwrites: [
                    {
                        id: user.id,
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: guild.roles.everyone,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: '1231405365674115112',
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    },
                    {
                        id: '1231615507485163611',
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                    }
                ]

            }).then(async (ch) => {
                await saveUserRoles(user.id, ch.id);
                await user.roles.set([serverRoles.jailrole]);
                const jailEmbed = new EmbedBuilder()
                    .setImage('https://i.redd.it/5v6ne0kjqf671.jpg')
                    .setDescription(`Hello there ${user}!\nYou've been **muzzled** and have reduced visibility until one of our <@&1231405365674115112> explains your situation. Get comfy and grab drinks-`)
                
                
                const deleteChannelBtn = new ButtonBuilder()
                .setCustomId("deleteChannel-staff")
                .setLabel("Delete muzzled channel")
                .setEmoji('🗑️')
                .setStyle(ButtonStyle.Primary)

                const kickBtn = new ButtonBuilder()
                .setCustomId(`kickUser-${user.id}`)
                .setLabel("Kick muzzled user")
                .setEmoji('🥾')
                .setStyle(ButtonStyle.Danger)

                const row = new ActionRowBuilder()
                    .addComponents(deleteChannelBtn, kickBtn)

                ch.send({content: `${user}<@&1231405365674115112>`, embeds: [jailEmbed], components: [row]})
            })

        } else {
            interaction.reply({embeds: [noPerms], ephemeral: true})
        }
        
    }
}