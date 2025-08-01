const { EmbedBuilder } = require('discord.js');

const ANNOUNCEMENT_CHANNEL_ID = '1399583622452871228';

function setupKofiWebhook(app, client) {
    // Health check endpoint
    app.get('/webhook-status', (req, res) => {
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            message: 'Ko-Fi webhook server is running' 
        });
    });

    // Ko-Fi webhook endpoint
    app.post('/kofi-webhook', (req, res) => {
        try {
            // Ko-Fi sends data as form-encoded
            const data = JSON.parse(req.body.data);
            
            if (data.verification_token !== process.env.KOFI_VERIFICATION_TOKEN) {
                console.log('Invalid Ko-Fi verification token');
                return res.status(401).send('Unauthorized');
            }

            // Handle different Ko-Fi event types
            if (data.type === 'Donation' || data.type === 'Subscription') {
                handleDonation(data, client);
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error processing Ko-Fi webhook:', error);
            res.status(500).send('Internal Server Error');
        }
    });
}

async function handleDonation(data, client) {
    try {
        const channel = client.channels.cache.get(ANNOUNCEMENT_CHANNEL_ID);
        if (!channel) {
            console.log('Ko-Fi announcement channel not found');
            return;
        }

        // Create embed for donation announcement
        const embed = new EmbedBuilder()
            .setTitle('☕ New Ko-Fi Donation!')
            .setColor('#ff5f5f') // Ko-Fi brand color
            .setThumbnail('https://storage.ko-fi.com/cdn/nav-logo-stroke.png')
            .setTimestamp()
            .setFooter({ text: 'Thank you for your support!' });

        // Add donor information
        if (data.from_name) {
            embed.addFields({ 
                name: '💝 From', 
                value: data.from_name, 
                inline: true 
            });
        }

        // Add donation amount
        if (data.amount) {
            embed.addFields({ 
                name: '💰 Amount', 
                value: `${data.currency || '$'}${data.amount}`, 
                inline: true 
            });
        }

        // Add donation type
        const donationType = data.type === 'Subscription' ? 'Monthly Subscription' : 'One-time Donation';
        embed.addFields({ 
            name: '📋 Type', 
            value: donationType, 
            inline: true 
        });

        // Add message if provided
        if (data.message) {
            embed.addFields({ 
                name: '💬 Message', 
                value: data.message.length > 1024 ? data.message.substring(0, 1021) + '...' : data.message,
                inline: false 
            });
        }

        // Add special field for public donations
        if (data.is_public) {
            embed.setDescription('🌟 **Public donation** - Thank you for supporting our community!');
        } else {
            embed.setDescription('🤗 **Private donation** - Your support means the world to us!');
        }

        await channel.send({ embeds: [embed] });
        console.log(`Ko-Fi donation announcement sent for ${data.from_name || 'Anonymous'}`);

    } catch (error) {
        console.error('Error sending Ko-Fi donation announcement:', error);
    }
}

module.exports = { setupKofiWebhook };
