const { EmbedBuilder, ApplicationCommandType, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder } = require('discord.js');
const { isMod, isAdmin, isVIP, isTrialMod } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const moment = require('moment');


module.exports = {
    name: 'Delete message with reason',
    type: ApplicationCommandType.Message,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        if(await isAdmin(member.id) || await isMod(member.id) || await isTrialMod(member.id)){
            const select = new StringSelectMenuBuilder()
            .setCustomId(`deletemsg-${interaction.targetMessage.id}`)
            .setPlaceholder('Select reason for message removal')
            .addOptions(
                new StringSelectMenuOptionBuilder()
                    .setLabel('Advertising')
                    .setDescription('Message advertises commissions, services or other paid things.')
                    .setValue('ad')
                    .setEmoji('🗑️'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('OffTopic')
                    .setDescription('This message is offtopic considering the channel topic')
                    .setValue('offtopic')
                    .setEmoji('❓'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('Rule breaking')
                    .setDescription('This message breaks the guidelines')
                    .setValue('rulebreak')
                    .setEmoji('💢')
            )

            const row = new ActionRowBuilder()
                .addComponents(select);

            const embed = new EmbedBuilder()
                .setTitle(`Message removal`)
                .setDescription(`You are about to delete following message: ${interaction.targetMessage.url} by ${interaction.targetMessage.author}, please select removal reason below.`)
                .setColor('Red');
            const response = await interaction.reply({embeds: [embed], components: [row], ephemeral: true})

            const collectorFilter = i => i.user.id === interaction.user.id;
            try {
                const confirmation = await response.awaitMessageComponent({filter: collectorFilter, time: 60_000});
                const value = confirmation.values[0];

                if(value === 'ad'){
                    const dm = new EmbedBuilder()
                    .setTitle(`Message deleted`)
                    .setColor("Red")
                    .setThumbnail(guild.iconURL())
                    .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**advertising paid commissions/services**'\n\n**Content:**\n*${interaction.targetMessage.content}*`)

                    interaction.targetMessage.delete().catch()
                    const deleted = new EmbedBuilder()
                        .setTitle(`Message deleted`)
                        .setColor("Red")
                        .setDescription(`Message was deleted and user was direct messaged about it.`)
                    await interaction.editReply({embeds: [deleted], components: []})
                    try {
                        await interaction.targetMessage.author.send({embeds: [dm]});
                    } catch (err) {
                        const nodmsent = new EmbedBuilder()
                            .setTitle(`Message deleted`)
                            .setColor("Red")
                            .setThumbnail(guild.iconURL())
                            .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**advertising paid commissions/services**'`)
                            .setFooter({text: `This follow-up message was sent because message author could not be DM'd`})

                        await interaction.followUp({embeds: [nodmsent]})
                    }
                }

                if(value === 'offtopic'){
                    const dm = new EmbedBuilder()
                    .setTitle(`Message deleted`)
                    .setColor("Red")
                    .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**offtopic message**'\n\n**Content:**\n*${interaction.targetMessage.content}*`)

                    interaction.targetMessage.delete().catch()
                    const deleted = new EmbedBuilder()
                        .setTitle(`Message deleted`)
                        .setColor("Red")
                        .setThumbnail(guild.iconURL())
                        .setDescription(`Message was deleted and user was direct messaged about it.`)
                    await interaction.editReply({embeds: [deleted], components: []})
                    try {
                        await interaction.targetMessage.author.send({embeds: [dm]});
                    } catch (err) {
                        const nodmsent = new EmbedBuilder()
                            .setTitle(`Message deleted`)
                            .setColor("Red")
                            .setThumbnail(guild.iconURL())
                            .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**offtopic message**'`)
                            .setFooter({text: `This follow-up message was sent because message author could not be DM'd`})

                        await interaction.followUp({embeds: [nodmsent]})
                    }
                }

                if(value === 'rulebreak'){
                    const dm = new EmbedBuilder()
                    .setTitle(`Message deleted`)
                    .setColor("Red")
                    .setThumbnail(guild.iconURL())
                    .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**breaking our guidelines**'\n\n**Content:**\n*${interaction.targetMessage.content}*`)

                    interaction.targetMessage.delete().catch()
                    const deleted = new EmbedBuilder()
                        .setTitle(`Message deleted`)
                        .setColor("Red")
                        .setThumbnail(guild.iconURL())
                        .setDescription(`Message was deleted and user was direct messaged about it.`)
                    await interaction.editReply({embeds: [deleted], components: []})
                    try {
                        await interaction.targetMessage.author.send({embeds: [dm]});
                    } catch (err) {
                        const nodmsent = new EmbedBuilder()
                            .setTitle(`Message deleted`)
                            .setColor("Red")
                            .setThumbnail(guild.iconURL())
                            .setDescription(`Hello ${interaction.targetMessage.author}!\nYour message sent in ${interaction.targetMessage.channel} was deleted by ${member} for '**breaking our guidelines**'`)
                            .setFooter({text: `This follow-up message was sent because message author could not be DM'd`})

                        await interaction.followUp({embeds: [nodmsent]})
                    }
                }
                
            } catch (e) {
                const cancelled = new EmbedBuilder()
                .setTitle(`Message removal`)
                .setDescription(`Message removal timed out for ${interaction.targetMessage.url}, use the command again to try again...`)
                .setColor("DarkGrey")
                await interaction.editReply({embeds: [cancelled], components: []})
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
        
    }
}