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
            name: 'timeout',
            description: 'Timeout a user from using icame command',
            type: 1, // Subcommand
            options: [
                {
                    name: 'user',
                    description: 'User to timeout',
                    type: 6, // User
                    required: true
                },
                {
                    name: 'duration',
                    description: 'Duration in hours (default: 1)',
                    type: 4, // Integer
                    required: true
                }
            ],
        },
        {
            name: 'check',
            description: 'Check your cum count',
            type: 1,
        },
        {
            name: 'leaderboard',
            description: 'Check cum count leaderboard',
            type: 1,
            options: [
                {
                    name: 'sortby',
                    description: 'Sort leaderboard by',
                    type: 3,
                    required: false,
                    choices: [
                        { name: 'Cum Count', value: 'count' },
                        { name: 'Cum Amount', value: 'amount' },
                    ]
                }
            ]
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
            if (options.getString('sortby') === 'amount') {
                con.query(`SELECT * FROM cumcount ORDER BY amount DESC LIMIT 10`, async (err, res) => {
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
            } else {
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
        } else if(subcommand === 'timeout') {
            // Logic to timeout a user from using icame command
            if (!await isStaff(member.id)) {
                return await interaction.reply({ content: 'You do not have permission to timeout users.', ephemeral: true });
            }
            const user = options.getUser('user');
            const duration = options.getInteger('duration') || 60; // Default to 60 minutes
            const reason = options.getString('reason') || 'No reason provided';
            const now = Date.now();
            const timeoutDuration = duration * 60 * 1000; // Convert to ms
            const expires = now + timeoutDuration;

            // Check if user is already timed out in DB
            con.query(`SELECT * FROM cumcount_timeout WHERE user=? AND expires > ?`, [user.id, now], async (err, res) => {
                if (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }
                if (res.length > 0) {
                    const remaining = Math.ceil((res[0].expires - now) / 60000);
                    return await interaction.reply({ content: `User is already timed out for another ${remaining} minute(s).`, ephemeral: true });
                }
                // Insert or update timeout
                con.query(`INSERT INTO cumcount_timeout (user, expires, reason, moderator) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE expires=?, reason=?, moderator=?`,
                    [user.id, expires, reason, member.id, expires, reason, member.id], async (err2) => {
                        if (err2) {
                            console.error('Database error:', err2);
                            return await interaction.reply({ content: 'An error occurred while setting the timeout.', ephemeral: true });
                        }
                        await interaction.reply({ content: `User ${user.tag} has been timed out from cum count for ${duration} minute(s). Reason: ${reason}`, ephemeral: true });

                        const embed = new EmbedBuilder()
                            .setTitle('Cum Count Timeout')
                            .setDescription(`User ${user} (\`${user.id}\`) has been timed out from cum count for ${duration} minute(s).`)
                            .addFields(
                                { name: 'Reason', value: reason },
                                { name: 'Moderator', value: `${member} (\`${member.id}\`)` }
                            )
                            .setColor('#FF0000')
                            .setTimestamp();

                        const auditlogChannel = member.guild.channels.cache.get(auditlogs);
                        if (auditlogChannel) {
                            await auditlogChannel.send({ embeds: [embed] });
                        }
                    });
            });
        }
    }
};