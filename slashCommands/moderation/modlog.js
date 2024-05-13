const { EmbedBuilder, ApplicationCommandType } = require('discord.js');
const { isMod, isAdmin, isStaff } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const { getModlogs } = require('../../function/modlog');
const moment = require('moment');

module.exports = {
    name: 'modlogs',
    description: 'Check users moderation logs.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'lookup',
            description: `Lookup user's moderation logs.`,
            type: 1,
            options: [
                {
                    name: 'user',
                    description: 'User to check',
                    type: 6,
                    required: true
                }
            ]
        }
        
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const subCmd = options.getSubcommand();

        if(subCmd === 'lookup'){
            const user = options.getUser('user');
            
            if(await isStaff(member.id)){
                const logs = await getModlogs(user.id);
                if(logs === null || logs.length === 0){
                    const nologs = new EmbedBuilder()
                        .setTitle(`Modlogs for ${user.username}`)
                        .setDescription(`:thumbsup: No actions taken towards the user.`)
                        .setTimestamp()
                        .setColor("DarkerGrey")

                    return await interaction.reply({embeds: [nologs], ephemeral: true})
                }
                let logsToLook = logs.length > 30 ? 30 : logs.length;
                let logsText = "Dates are in format (DD MM YY)\n"

                
                for(i = 0; i < logsToLook; i++){
                    let moderator = await guild.members.cache.get(logs[i].moderator);
                    let comments = logs[i].comment ? logs[i].comment : "*No comment*";
                    logsText += `- \`[${logs[i].action}] - ${moment(logs[i].date).format("DD MM YY")}:\` ${comments} :star: ${moderator}\n`
                }

                const embed = new EmbedBuilder()
                    .setTitle(`Modlogs for ${user.username}`)
                    .setDescription(`${logsText}`)
                    .setColor("DarkerGrey")
                    .setTimestamp()

                interaction.reply({embeds: [embed], ephemeral: true})

            } else {
                interaction.reply({embeds: [noPerms], ephemeral: true})
            }
        }
    }
}