const { EmbedBuilder } = require('discord.js');
const { givePoints, getPoints } = require('../function/furrygame');
const crypto = require('crypto');

const ANNOUNCEMENT_CHANNEL_ID = '1399583622452871228'; // Same as Ko-Fi channel or different one

function setupPaypalWebhook(app, client) {
    // PayPal IPN (Instant Payment Notification) endpoint
    app.post('/paypal-webhook', async (req, res) => {
        try {
            console.log('PayPal IPN received:', req.body);
            
            // Verify the IPN with PayPal (important for security)
            const verified = await verifyPayPalIPN(req.body);
            if (!verified) {
                console.log('PayPal IPN verification failed');
                return res.status(400).send('IPN verification failed');
            }

            // Process the payment
            if (req.body.payment_status === 'Completed') {
                await handlePayPalPayment(req.body, client);
            }

            res.status(200).send('OK');
        } catch (error) {
            console.error('Error processing PayPal IPN:', error);
            res.status(500).send('Internal Server Error');
        }
    });

    // Success page endpoint
    app.get('/paypal-success', (req, res) => {
        res.send(`
            <html>
                <head><title>Payment Successful</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #28a745;">✅ Payment Successful!</h1>
                    <p>Thank you for your purchase! Your cumcoins will be delivered shortly.</p>
                    <p>You can now close this tab and return to Discord.</p>
                </body>
            </html>
        `);
    });

    // Cancel page endpoint
    app.get('/paypal-cancel', (req, res) => {
        res.send(`
            <html>
                <head><title>Payment Cancelled</title></head>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                    <h1 style="color: #dc3545;">❌ Payment Cancelled</h1>
                    <p>Your payment was cancelled. No charges were made.</p>
                    <p>You can close this tab and return to Discord to try again.</p>
                </body>
            </html>
        `);
    });
}

async function verifyPayPalIPN(ipnData) {
    try {
        // This is a simplified verification - in production you should verify with PayPal
        // For now, we'll just check if required fields exist
        return ipnData.txn_id && ipnData.payment_status && ipnData.custom;
    } catch (error) {
        console.error('PayPal IPN verification error:', error);
        return false;
    }
}

async function handlePayPalPayment(ipnData, client) {
    try {
        // Parse custom data
        const customData = JSON.parse(ipnData.custom);
        const { userId, orderId, cumcoins, discordUsername } = customData;

        // Verify payment amount matches expected amount
        const expectedAmount = getExpectedAmount(cumcoins);
        if (parseFloat(ipnData.mc_gross) !== expectedAmount) {
            console.log(`Payment amount mismatch: expected ${expectedAmount}, got ${ipnData.mc_gross}`);
            return;
        }

        // Give cumcoins to the user
        givePoints(userId, cumcoins);
        console.log(`Delivered ${cumcoins} cumcoins to user ${userId} (${discordUsername})`);

        // Try to send DM to user
        try {
            const user = await client.users.fetch(userId);
            const currentPoints = await getPoints(userId);
            
            const dmEmbed = new EmbedBuilder()
                .setTitle('🎉 Cumcoins Purchase Successful!')
                .setColor('#28a745')
                .setDescription(`Your PayPal payment has been processed successfully!`)
                .addFields(
                    { name: '📦 Purchased', value: `${cumcoins.toLocaleString()} cumcoins`, inline: true },
                    { name: '💵 Amount Paid', value: `$${parseFloat(ipnData.mc_gross).toFixed(2)} USD`, inline: true },
                    { name: '🆔 Transaction ID', value: ipnData.txn_id, inline: false },
                    { name: '🪙 New Balance', value: `${currentPoints.toLocaleString()} cumcoins`, inline: true }
                )
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/196/196566.png')
                .setFooter({ text: 'Thank you for your purchase!' })
                .setTimestamp();

            await user.send({ embeds: [dmEmbed] });
        } catch (dmError) {
            console.log(`Could not send DM to user ${userId}:`, dmError.message);
        }

        // Post announcement in channel
        const channel = client.channels.cache.get(ANNOUNCEMENT_CHANNEL_ID);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('💰 Cumcoins Purchase!')
                .setColor('#0070f3')
                .setDescription(`Someone just bought cumcoins with PayPal!`)
                .addFields(
                    { name: '🛒 Purchase', value: `${cumcoins.toLocaleString()} cumcoins`, inline: true },
                    { name: '💵 Amount', value: `$${parseFloat(ipnData.mc_gross).toFixed(2)} USD`, inline: true },
                    { name: '👤 Buyer', value: discordUsername, inline: true }
                )
                .setThumbnail('https://cdn-icons-png.flaticon.com/512/196/196566.png')
                .setFooter({ text: 'Support our server by buying cumcoins!' })
                .setTimestamp();

            await channel.send({ embeds: [embed] });
        }

    } catch (error) {
        console.error('Error handling PayPal payment:', error);
    }
}

function getExpectedAmount(cumcoins) {
    const rates = {
        1000: 1.00,
        5000: 4.50,
        10000: 8.00,
        25000: 18.00,
        50000: 32.00
    };
    return rates[cumcoins] || 0;
}

module.exports = { setupPaypalWebhook };
