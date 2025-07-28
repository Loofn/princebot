const { ApplicationCommandType, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const con = require('../../function/db');
const queryAsync = require('../../function/queryAsync');
const { isVerified } = require("../../function/roles");
const { givePoints } = require("../../function/furrygame");
const awardCumRole = require("../../function/awardroles");

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
                { name: 'No Load', value: '0' },
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
        
        const { member, options } = interaction;
        const userId = member.id;
        const image = options.getAttachment('image');
        const now = Date.now();
        const cooldown = 60 * 60 * 1000; // 1 hour in ms
        const dayMs = 24 * 60 * 60 * 1000;

        // Check if user is currently timed out from using icame
        const timeoutRes = await queryAsync(con, `SELECT * FROM cumcount_timeout WHERE user=? AND expires > ?`, [userId, now]);
        if (timeoutRes.length > 0) {
            const remaining = Math.ceil((timeoutRes[0].expires - now) / 60000);
            const embed = new EmbedBuilder()
                .setTitle('Horni jail!')
                .setDescription(`You are currently timed out from using /icame for another ${remaining} minute(s). *Maybe touch some grass?*`)
                .setColor('#FF0000');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        try {
            // Check cooldown from last event
            const lastEvent = await queryAsync(con, `SELECT last_used FROM cumcount WHERE user=?`, [userId]);
            if (lastEvent.length > 0 && (now - Number(lastEvent[0].last_used)) < cooldown) {
                const remaining = Math.ceil((cooldown - (now - Number(lastEvent[0].last_used))) / 60000);
                return await interaction.reply({ content: `You must wait ${remaining} more minute(s) before using this command again.`, ephemeral: true });
            }

            // Check if the user is verified
            if (!(await isVerified(userId))) {
                return await interaction.reply({ content: 'You must be verified to use this command.', ephemeral: true });
            }

            // Get current cum count
            const res2 = await queryAsync(con, `SELECT count FROM cumcount WHERE user=?`, [userId]);
            const currentCumCount = res2.length > 0 ? res2[0].count : 0;
            const cumAmount = parseInt(options.getString('amount') || 5);

            // Check how many times user has cum'd without image in last 24h (cumlog)
            const res3 = await queryAsync(
                con,
                `SELECT COUNT(*) AS noimg_count, MIN(timestamp) AS first_noimg FROM cumlog WHERE user=? AND image IS NULL AND timestamp > ?`,
                [userId, now - dayMs]
            );
            const noimgCount = res3[0]?.noimg_count || 0;
            const firstNoimg = res3[0]?.first_noimg;

            if (!image && noimgCount >= 3) {
                // If 3 or more no-image posts in last 24h, require image
                let waitMsg = 'You have reached the limit of 3 cumcounts without image in 24 hours. Please upload an image to continue.';
                if (firstNoimg) {
                    const resetIn = Math.ceil(((Number(firstNoimg) + dayMs) - now) / 60000);
                    if (resetIn > 0) waitMsg += ` You can post without image again in ${resetIn} minute(s).`;
                }
                return await interaction.reply({ content: waitMsg, ephemeral: true });
            }

            // Insert cum event into cumlog
            await queryAsync(
                con,
                `INSERT INTO cumlog (user, amount, image, timestamp) VALUES (?, ?, ?, ?)`,
                [userId, cumAmount, image ? image.url : null, now]
            );

            // Update cumcount total
            const exists = await queryAsync(con, `SELECT * FROM cumcount WHERE user=?`, [userId]);
            if (exists.length === 0) {
                await queryAsync(con, `INSERT INTO cumcount (user, count, amount, last_used) VALUES (?, 1, ?, ?)`, [userId, cumAmount, now]);
            } else {
                await queryAsync(con, `UPDATE cumcount SET count = count + 1, amount = amount + ?, last_used = ? WHERE user=?`, [cumAmount, now, userId]);
            }

            // Prepare embed
            let embed = new EmbedBuilder()
                .setTitle(`${member.displayName} came!`)
                .setDescription(`${member} has just let it loose, and produced roughly :milk: \
                \`${cumAmount} ml of fresh milk\`! They have ejaculated a total of **${currentCumCount + 1}** times.`)
                .setColor("#FFFFFF")
                .setThumbnail(member.displayAvatarURL({ dynamic: true }))
                .setFooter({ text: `You can cum too with command /icame`, iconURL: member.guild.iconURL() })
                .setTimestamp();
            if (image && image.url) {
                embed.setImage(image.url);
            }

            if (cumAmount === 0) {
                embed.setDescription(`${member} has just let it loose, but there was no milk produced!! They have ejaculated a total of **${currentCumCount + 1}** times.`);
            }

            // Award cumcoins
            const coins = image ? 10 : 5;
            givePoints(userId, coins);
            awardCumRole();

            // Add revert button
            const revertButton = new ButtonBuilder()
                .setCustomId(`revert-${userId}-${coins}-${cumAmount}`)
                .setLabel('Revert')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄');
            const row = new ActionRowBuilder().addComponents(revertButton);

            // Send embed to log channel
            const logChannel = member.guild.channels.cache.get('1397631559317586014');
            if (logChannel) {
                await logChannel.send({ embeds: [embed], components: [row] });
            }

            await interaction.reply({ content: `Your cum count has been increased! You received ${coins} cumcoins.`, ephemeral: true });
        } catch (err) {
            console.error('Database error:', err);
            await interaction.reply({ content: 'An error occurred while processing your request.', ephemeral: true });
        }
    }
}