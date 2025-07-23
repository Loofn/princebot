const { ApplicationCommandType } = require("discord.js");
const { EmbedBuilder } = require('discord.js');
const con = require('../../function/db');
const { isVerified } = require("../../function/roles");

module.exports = {
    name: 'cumcount',
    description: 'Check your cum count',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'check',
            description: 'Check your cum count',
            type: 1,
        },
        {
            name: 'leaderboard',
            description: 'Check cum count leaderboard',
            type: 1,
        },
    ],
    run: async (client, interaction) => {
        const { member, options } = interaction;
        const subcommand = options.getSubcommand();

        if (subcommand === 'check') {
            // Logic to check user's cum count
            con.query(`SELECT * FROM cumcount WHERE user=?`, [member.id], async (err, res) => {
                if (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }

                if (res.length > 0) {
                    const userCumCount = res[0].count;
                    const userCumAmount = res[0].amount || 0; // Default to 0 if amount is not set
                    const embed = new EmbedBuilder()
                        .setDescription(`:milk: You have cummed **${userCumCount}** times (\`${userCumAmount} ml\`).`)
                        .setColor(0x00AE86);

                    return await interaction.reply({ embeds: [embed] });
                } else {
                    return await interaction.reply({ content: 'You have not ejaculated any times yet... Get to jerking!', ephemeral: true });
                }
            });
        } else if (subcommand === 'leaderboard') {
            // Logic to show cum count leaderboard
            con.query(`SELECT * FROM cumcount ORDER BY count DESC LIMIT 10`, async (err, res) => {
                if (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }

                let leaderboard = res.map((row, index) => `${index + 1}. <@${row.user}> - ${row.count} times (\`${row.amount || 0} ml\`)`).join('\n');
                if (!leaderboard) leaderboard = 'No users found in the leaderboard.';

                const embed = new EmbedBuilder()
                    .setTitle('Cum Count Leaderboard')
                    .setDescription(leaderboard)
                    .setImage('https://static1.e621.net/data/7a/9f/7a9f945838745704e4a44a4740b236b0.gif')
                    .setFooter({text: 'You can contribute your cummings with /icame', iconURL: member.guild.iconURL()})
                    .setColor(0x00AE86);

                return await interaction.reply({ embeds: [embed] });
            });
        }
    }
};