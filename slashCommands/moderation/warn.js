const { EmbedBuilder, ApplicationCommandType, MessageFlags, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { isStaff } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { addModlog } = require('../../function/modlog');

module.exports = {
    name: 'warn',
    description: 'Give user a official warning.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Who are we giving a warning',
            type: 6,
            required: true
        },
        {
            name: 'reason',
            description: 'Write a reason for warning (this will be DM\'d to user)',
            type: 3,
            required: true
        },
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;


        if(await isStaff(member.id)){
            const warnedUser = await guild.members.fetch(options.getUser('user').id, {force: true, cache: true});
            const reason = options.getString('reason');
            const logChannel = guild.channels.cache.get(serverChannels.auditlogs)

            if(warnedUser.user.bot){
                const noBots = new EmbedBuilder()
                    .setTitle(`Can't warn bot accounts`)
                    .setDescription(`We can't warn bot accounts, because that would be dumm, right?`)
                    .setColor("Red")

                return await interaction.reply({embeds: [noBots], ephemeral: true})
            }

            const serverBtn = new ButtonBuilder()
                .setStyle(ButtonStyle.Secondary)
                .setLabel(`Warning received from ${guild.name}`)
                .setCustomId('sentfrom')
                .setDisabled(true)

            const row = new ActionRowBuilder()
                .addComponents(serverBtn)

            const warningDM = new EmbedBuilder()
                .setTitle(`Hold up! Time out!`)
                .setDescription(`:warning: ${warnedUser}, you have been warned by ${member} for *${reason}*.`)
                .setColor("Yellow")
                .setFooter({text: `Please open a ticket if you feel you received the warning without reason.`, iconURL: guild.iconURL()})
                .setTimestamp()

            const warningLog = new EmbedBuilder()
                .setTitle(`New warning`)
                .addFields(
                    {name: `Warned user`, value: `${warnedUser}\nID:\`${warnedUser.id}\``, inline: true},
                    {name: `Moderator`, value: `${member}\nID:\`${member.id}\``, inline: true},
                    {name: `Reason`, value: `${reason}`}
                )
                .setTimestamp()

            addModlog(warnedUser.id, "WARNING", member.id, reason);
            interaction.reply({embeds: [warningDM], content: `${warnedUser}`});
            logChannel.send({embeds: [warningLog]})
            warnedUser.send({embeds: [warningDM], components: [row]}).catch(() => {
                interaction.editReply({content: `${warnedUser} has DM's disabled, so I unfortunately could not deliver the warning in DM's.`})
            })
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}