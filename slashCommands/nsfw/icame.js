const { ApplicationCommandType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const { options } = require("../..");
const con = require('../../function/db');
const { isVerified, isAdmin } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const fetch = require('node-fetch');
const { givePoints } = require("../../function/furrygame");
const awardCumRole = require("../../function/awardroles");

const userCooldowns = new Map(); // Add this at the top-level

module.exports = {
    name: 'icame',
    description: 'Increase your cum count',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'amount',
            description: 'How much you came?',
            type: 3,
            required: true,
            choices: [
                { name: 'Small Load', value: '2' },
                { name: 'Medium Load', value: '5' },
                { name: 'Large Load', value: '10' },
                { name: 'Massive Load', value: '15' },
            ]
        },
        {
            name: 'image',
            description: 'Upload proof of your cum',
            type: 11,
            required: false
        }
    ],
    run: async (client, interaction) => {
        const { member, guildId, options } = interaction;
        const userId = member.id;
        const image = options.getAttachment('image');

        const now = Date.now();
        const cooldown = 60 * 60 * 1000; // 1 hour in ms

        // Check cooldown from DB
        con.query(
            `SELECT last_used FROM cumcount WHERE user=?`,
            [userId],
            async (err, res) => {
                if (err) {
                    console.error('Database error:', err);
                    return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                }
                if (res.length > 0 && res[0].last_used && (now - Number(res[0].last_used)) < cooldown) {
                    const remaining = Math.ceil((cooldown - (now - Number(res[0].last_used))) / 60000);
                    return await interaction.reply({ content: `You must wait ${remaining} more minute(s) before using this command again.`, ephemeral: true });
                }

                // Check if the user is verified
                if (await isVerified(userId)) {
                    let currentCumCount = 0;
                    let cumAmount = parseInt(options.getString('amount') || 5);
                    con.query(
                        `SELECT * FROM cumcount WHERE user=?`,
                        [userId],
                        async (err, res2) => {
                            if (err) {
                                console.error('Database error:', err);
                                return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                            }

                            currentCumCount = res2.length > 0 ? res2[0].count : 0;

                            // Insert or update cumcount row and update last_used
                            con.query(
                                `INSERT INTO cumcount (user, count, amount, last_used) VALUES (?, 1, ?, ?) ON DUPLICATE KEY UPDATE count = count + 1, amount = amount + ?, last_used = ?`,
                                [userId, cumAmount, now, cumAmount, now],
                                async (err, result) => {
                                    if (err) {
                                        console.error('Database error:', err);
                                        return await interaction.reply({ content: 'An error occurred while updating your cum count.', ephemeral: true });
                                    }

                                    // Prepare embed
                                    let embed = new EmbedBuilder()
                                        .setTitle(`${member.displayName} came!`)
                                        .setDescription(`${member} has just let it loose, and produced roughly :milk: \`${cumAmount} ml of fresh milk\`! They have ejaculated a total of **${currentCumCount + 1}** times.`)
                                        .setColor("#FFFFFF")
                                        .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                        .setFooter({ text: `You can cum too with command /icame`, iconURL: member.guild.iconURL() })
                                        .setTimestamp();

                                    if (image && image.url) {
                                        embed.setImage(image.url);
                                    }

                                    // Send embed to log channel
                                    

                                    // Award cumcoins
                                    const coins = image ? 10 : 5;
                                    givePoints(userId, coins);
                                    awardCumRole();

                                    const revertButton = new ButtonBuilder()
                                        .setCustomId(`revert-${userId}-${coins}-${cumAmount}`)
                                        .setLabel('Revert')
                                        .setStyle(ButtonStyle.Secondary)
                                        .setEmoji('🔄');

                                    const row = new ActionRowBuilder().addComponents(revertButton);

                                    const logChannel = member.guild.channels.cache.get('1397631559317586014')
                                    await logChannel.send({ embeds: [embed], components: [row] });

                                    await interaction.reply({ content: `Your cum count has been increased! You received ${coins} cumcoins.`, ephemeral: true });
                                }
                            );
                        }
                    );
                } else {
                    await interaction.reply({ content: 'You must be verified to use this command.', ephemeral: true });
                }
            }
        );
    }
};