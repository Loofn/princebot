const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { options } = require("../..");
const con = require('../../function/db');
const { isVerified, isAdmin } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const fetch = require('node-fetch');
const { givePoints } = require("../../function/furrygame");

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

        // Check if the user is verified
        if (await isVerified(userId)) {
            let currentCumCount = 0;
            let cumAmount = parseInt(options.getString('amount') || 5);
            con.query(
                `SELECT * FROM cumcount WHERE user=?`,
                [userId],
                async (err, res) => {
                    if (err) {
                        console.error('Database error:', err);
                        return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                    }

                    currentCumCount = res.length > 0 ? res[0].count : 0;

                    // Insert or update cumcount row
                    con.query(
                        `INSERT INTO cumcount (user, count, amount) VALUES (?, 1, ?) ON DUPLICATE KEY UPDATE count = count + 1, amount = amount + ?`,
                        [userId, cumAmount, cumAmount],
                        async (err, result) => {
                            if (err) {
                                console.error('Database error:', err);
                                return await interaction.reply({ content: 'An error occurred while updating your cum count.', ephemeral: true });
                            }

                            // Prepare embed
                            let embed = new EmbedBuilder()
                                .setTitle(`${member.displayName} came!`)
                                .setDescription(`${member} has just let it loose, and produced roughly :milk: \`${cumAmount} fresh milk\`! They have ejaculated a total of **${currentCumCount + 1}** times.`)
                                .setColor("#FFFFFF")
                                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                                .setFooter({ text: `You can cum too with command /icame`, iconURL: member.guild.iconURL() })
                                .setTimestamp();

                            if (image && image.url) {
                                embed.setImage(image.url);
                            }

                            // Send embed to log channel
                            const logChannel = member.guild.channels.cache.get('1397631559317586014')
                            await logChannel.send({ embeds: [embed] });

                            // Award cumcoins
                            const coins = image ? 10 : 5;
                            givePoints(userId, coins);

                            await interaction.reply({ content: `Your cum count has been increased! You received ${coins} cumcoins.`, ephemeral: true });
                        }
                    );
                }
            );
        } else {
            await interaction.reply({ content: 'You must be verified to use this command.', ephemeral: true });
        }
    }
};