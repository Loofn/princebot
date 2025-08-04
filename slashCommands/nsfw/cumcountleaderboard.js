const { ApplicationCommandType } = require("discord.js");
const { EmbedBuilder } = require('discord.js');
const con = require('../../function/db');
const { isVerified, isStaff } = require("../../function/roles");
const { auditlogs } = require('../../data/channels.json');

// Helper function to format amount (convert ml to liters if >= 1000ml)
function formatAmount(amount) {
    if (amount >= 1000) {
        const liters = (amount / 1000).toFixed(2);
        return `${liters} L`;
    }
    return `${amount} ml`;
}

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
            try {
                const [rows] = await con.execute(`SELECT * FROM cumcount WHERE user=?`, [member.id]);

                if (rows.length > 0) {
                    const userCumCount = rows[0].count;
                    const userCumAmount = rows[0].amount || 0; // Default to 0 if amount is not set
                    const embed = new EmbedBuilder()
                        .setDescription(`:milk: You have cummed **${userCumCount}** times (\`${formatAmount(userCumAmount)}\`).`)
                        .setColor(0x00AE86);

                    return await interaction.reply({ embeds: [embed] });
                } else {
                    return await interaction.reply({ content: 'You have not ejaculated any times yet... Get to jerking!', ephemeral: true });
                }
            } catch (err) {
                console.error('Database error:', err);
                return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
            }
        } else if (subcommand === 'leaderboard') {
            // Logic to show cum count leaderboard
            if (options.getString('sortby') === 'amount') {
                try {
                    const [rows] = await con.execute(`SELECT * FROM cumcount ORDER BY amount DESC LIMIT 10`);
                    let totalCumAmount = rows.reduce((sum, row) => sum + (row.amount || 0), 0);
                    let leaderboard = rows.map((row, index) => `${index + 1}. <@${row.user}> - ${row.count} times (\`${formatAmount(row.amount || 0)}\`)`).join('\n');
                    leaderboard += `\n\n**Total milk amount:** \`${formatAmount(totalCumAmount)}\``;
                    if (!leaderboard) leaderboard = 'No users found in the leaderboard.';

                    const embed = new EmbedBuilder()
                        .setTitle('Cum Count Leaderboard')
                        .setDescription(leaderboard)
                        .setImage('https://static1.e621.net/data/7a/9f/7a9f945838745704e4a44a4740b236b0.gif')
                        .setFooter({text: 'You can contribute your cummings with /icame', iconURL: member.guild.iconURL()})
                        .setColor(0x00AE86);

                    return await interaction.reply({ embeds: [embed] });
                } catch (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }
            } else {
                try {
                    const [rows] = await con.execute(`SELECT * FROM cumcount ORDER BY count DESC LIMIT 10`);
                    let leaderboard = rows.map((row, index) => `${index + 1}. <@${row.user}> - ${row.count} times (\`${formatAmount(row.amount || 0)}\`)`).join('\n');
                    if (!leaderboard) leaderboard = 'No users found in the leaderboard.';

                    const embed = new EmbedBuilder()
                        .setTitle('Cum Count Leaderboard')
                        .setDescription(leaderboard)
                        .setImage('https://static1.e621.net/data/7a/9f/7a9f945838745704e4a44a4740b236b0.gif')
                        .setFooter({text: 'You can contribute your cummings with /icame', iconURL: member.guild.iconURL()})
                        .setColor(0x00AE86);

                    return await interaction.reply({ embeds: [embed] });
                } catch (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }
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
            try {
                const [rows] = await con.execute(`SELECT * FROM cumcount_timeout WHERE user=? AND expires > ?`, [user.id, now]);
                if (rows.length > 0) {
                    const remaining = Math.ceil((rows[0].expires - now) / 60000);
                    return await interaction.reply({ content: `User is already timed out for another ${remaining} minute(s).`, ephemeral: true });
                }
                // Insert or update timeout
                await con.execute(`INSERT INTO cumcount_timeout (user, expires, reason, moderator) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE expires=?, reason=?, moderator=?`,
                    [user.id, expires, reason, member.id, expires, reason, member.id]);
                
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
            } catch (err) {
                console.error('Database error:', err);
                return await interaction.reply({ content: 'An error occurred while setting the timeout.', ephemeral: true });
            }
        }
    }
};