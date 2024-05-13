const { EmbedBuilder, ApplicationCommandType, MessageFlags, roleMention, Embed } = require('discord.js');
const { isMod, isAdmin, isStaff } = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const serverRoles = require('../../data/serverRoles.json');
const serverChannels = require('../../data/channels.json');
const con = require('../../function/db');
const { updateCachePeriodically } = require('../../events/blacklist');

module.exports = {
    name: 'blacklistwords',
    description: 'Manage blacklisted words.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'add',
            description: 'Add word to blacklist.',
            type: 1,
            options: [
                {
                    name: 'word',
                    description: 'Word to blacklist',
                    type: 3,
                    required: true
                }
            ]
        },
        {
            name: 'remove',
            description: 'Remove word from blacklist.',
            type: 1,
            options: [
                {
                    name: 'word',
                    description: 'Word to remove from blacklist',
                    type: 3,
                    required: true
                }
            ]
        },
        {
            name: 'show',
            description: 'Show all blacklisted words',
            type: 1,
            
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const subCmd = options.getSubcommand();
        const logchannel = guild.channels.cache.get(serverChannels.auditlogs);

        if(subCmd === 'show'){
            if(isStaff(member.id)){
                con.query(`SELECT * FROM blacklistwords`, function (err, res){
                    let words = "";

                    for (let i = 0; i < res.length; i++) {
                        words += `\`${res[i].word}\` - `
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`All blacklisted words (${res.length})`)
                        .setDescription(`${words}`)
                        .setTimestamp()

                    interaction.reply({embeds: [embed], ephemeral: true})
                })
            } else {
                interaction.reply({embeds: [noPerms], ephemeral: true})
            }
        }

        if(await isAdmin(member.id)){
            if(subCmd === 'add'){
                const word = options.getString('word').toLowerCase();
                
                sql = `INSERT IGNORE INTO blacklistwords (word) VALUES (?)`;
                con.query(sql, [word]);
                updateCachePeriodically()
                const log = new EmbedBuilder()
                    .setTitle(`New blacklisted word`)
                    .setDescription(`${member} added ||\`${word}\`|| as blacklisted word.`)
                    .setTimestamp()
                

                const embed = new EmbedBuilder()
                    .setTitle(`New blacklist word added`)
                    .setDescription(`You have successfully blacklisted word: \`${word}\`.`)
                    .setColor("DarkButNotBlack")

                await interaction.reply({embeds: [embed], ephemeral: true})
                
                logchannel.send({embeds: [log]});
            }

            if(subCmd === 'remove'){
                const word = options.getString('word').toLowerCase();

                sql = `DELETE FROM blacklistedwords WHERE word=?`;
                con.query(sql, [word], function (err, res, fields){
                    if(res.affectedRows > 0){
                        updateCachePeriodically()
                        const embed = new EmbedBuilder()
                            .setTitle(`Blacklisted word removed`)
                            .setDescription(`You have successfully removed blacklisted word: \`${word}\`.`)
                            .setColor("DarkButNotBlack");

                        const log = new EmbedBuilder()
                            .setTitle(`Blacklsited word removed`)
                            .setDescription(`${member} removed ||\`${word}\`|| from blacklist.`)
                            .setTimestamp()

                        logchannel.send({embeds: [log]});

                        interaction.reply({embeds: [embed], ephemeral: true})
                    } else {
                        const embed = new EmbedBuilder()
                            .setTitle(`Oops...`)
                            .setDescription(`The word: \`${word}\` is not blacklisted, so I could not remove it..`)
                            .setColor("Red");

                        interaction.reply({embeds: [embed], ephemeral: true})
                    }
                })
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }

    }
}