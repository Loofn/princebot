const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = require('..');
const con = require('../function/db');
const queryAsync = require('../function/queryAsync');
const fetch = require('node-fetch');

client.on('messageCreate', async message => {

    if(message.channel.id === '1234534548818100365' && !message.author.bot) { // Replace with your venting channel ID
        let content = message.content;
        if(content.length > 4096) {
            content = content.slice(0, 4093) + '...';
        }

        // Check for image attachment
        let fileToSend = null;
        let imageName = null;
        if (message.attachments && message.attachments.size > 0) {
            const attachment = message.attachments.find(att => att.contentType && att.contentType.startsWith('image/'));
            const fileAttachment = attachment || message.attachments.first();
            if (fileAttachment) {
                try {
                    const response = await fetch(fileAttachment.url);
                    const buffer = await response.buffer();
                    imageName = fileAttachment.name || 'image.png';
                    fileToSend = new AttachmentBuilder(buffer, { name: imageName });
                } catch (err) {
                    console.error('Failed to fetch attachment:', err);
                }
            }
        }

        let button = new ButtonBuilder()
            .setCustomId(`deleteVentMsg-${message.author.id}`)
            .setLabel('Delete Message')
            .setStyle(ButtonStyle.Danger);

        let row = new ActionRowBuilder()
            .addComponents(button);

        // Insert into DB and use insertId in footer
        try {
            const result = await queryAsync(con, `INSERT INTO venting (user, message) VALUES (?, ?)`, [message.author.id, null]);
            const insertId = result.insertId;
            let embed = new EmbedBuilder()
                .setDescription(`${content}`)
                .setTimestamp()
                .setColor("#000000")
                .setFooter({text: `No.${insertId} | All messages to venting channel are anonymized!`});
            if (fileToSend && imageName) {
                embed.setImage(`attachment://${imageName}`);
            }

            let sendOptions = fileToSend
                ? { embeds: [embed], files: [fileToSend], components: [row] }
                : { embeds: [embed], components: [row] };

            message.channel.send(sendOptions).then(async (msg) => {
                message.delete().catch(err => console.error(err));
                await queryAsync(con, `UPDATE venting SET message = ? WHERE id = ?`, [msg.id, insertId]);
                msg.startThread({
                    name: `Discussion for No.${insertId}`,
                    autoArchiveDuration: 1440
                }).catch(err => console.error('Failed to create thread:', err));
            });
        } catch (err) {
            console.error('DB insert error:', err);
        }
    }
})

client.on('messageCreate', async threadMsg => {
    if (threadMsg.author.bot || !threadMsg.channel.isThread()) return;
    if (!threadMsg.channel.name.startsWith('Discussion for No.')) return;

    // Prevent double-posting: only handle user messages, not already-anonymized ones
    if (threadMsg.webhookId) return;

    let anonContent = threadMsg.content;
    if (anonContent.length > 4096) {
        anonContent = anonContent.slice(0, 4093) + '...';
    }

    // Check for image attachment in thread message
    let anonFile = null;
    let anonImageName = null;
    if (threadMsg.attachments && threadMsg.attachments.size > 0) {
        const attachment = threadMsg.attachments.find(att => att.contentType && att.contentType.startsWith('image/'));
        const fileAttachment = attachment || threadMsg.attachments.first();
        if (fileAttachment) {
            try {
                const response = await fetch(fileAttachment.url);
                const buffer = await response.buffer();
                anonImageName = fileAttachment.name || 'image.png';
                anonFile = new AttachmentBuilder(buffer, { name: anonImageName });
            } catch (err) {
                console.error('Failed to fetch thread attachment:', err);
            }
        }
    }

    // Extract insertId from thread name
    const match = threadMsg.channel.name.match(/No\.(\d+)/);
    const insertId = match ? match[1] : '???';

    let anonEmbed = new EmbedBuilder()
        .setDescription(`${anonContent}`)
        .setTimestamp()
        .setColor("#000000")
        .setFooter({text: `No.${insertId} | Anonymous reply`});
    if (anonFile && anonImageName) {
        anonEmbed.setImage(`attachment://${anonImageName}`);
    }

    let anonSendOptions = anonFile
        ? { embeds: [anonEmbed], files: [anonFile] }
        : { embeds: [anonEmbed] };

    // Send anonymous message and delete original
    threadMsg.channel.send(anonSendOptions).then(() => {
        threadMsg.delete().catch(err => console.error(err));
    });
    });