const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPoints } = require('../../function/furrygame');
const crypto = require('crypto');

// Exchange rates (adjust these as needed)
const EXCHANGE_RATES = {
    10000: { price: 1.00, label: '10K Cumcoins' },
    50000: { price: 4.50, label: '50K Cumcoins' },
    100000: { price: 8.00, label: '100K Cumcoins' },
    250000: { price: 18.00, label: '250K Cumcoins' },
    500000: { price: 32.00, label: '500K Cumcoins' }
};

module.exports = {
    name: 'buycoins',
    description: 'Buy cumcoins with PayPal',
    cooldown: 5000,
    disabled: true, // Only developer can use this command
    type: 1, // ChatInput
    options: [
        {
            name: 'amount',
            description: 'How many cumcoins do you want to buy?',
            type: 4, // Integer
            required: true,
            choices: [
                { name: '10,000 Cumcoins - $1.00', value: 10000 },
                { name: '50,000 Cumcoins - $4.50', value: 50000 },
                { name: '100,000 Cumcoins - $8.00', value: 100000 },
                { name: '250,000 Cumcoins - $18.00', value: 250000 },
                { name: '500,000 Cumcoins - $32.00', value: 500000 }
            ]
        }
    ],

    run: async (client, interaction) => {
        const { member } = interaction;
        const amount = interaction.options.getInteger('amount');
        
        if (!EXCHANGE_RATES[amount]) {
            return interaction.reply({
                content: '❌ Invalid amount selected!',
                ephemeral: true
            });
        }

        const { price, label } = EXCHANGE_RATES[amount];
        const currentPoints = await getPoints(member.id);
        
        // Generate unique order ID
        const orderId = crypto.randomBytes(16).toString('hex');
        
        // Create PayPal payment link
        const paypalEmail = process.env.PAYPAL_EMAIL; // Your PayPal email
        const returnUrl = `${process.env.BASE_URL || 'https://your-domain.com'}/paypal-success`;
        const cancelUrl = `${process.env.BASE_URL || 'https://your-domain.com'}/paypal-cancel`;
        
        const paypalUrl = new URL('https://www.paypal.com/cgi-bin/webscr');
        paypalUrl.searchParams.set('cmd', '_xclick');
        paypalUrl.searchParams.set('business', paypalEmail);
        paypalUrl.searchParams.set('item_name', `${label} for ${member.displayName}`);
        paypalUrl.searchParams.set('amount', price.toFixed(2));
        paypalUrl.searchParams.set('currency_code', 'USD');
        paypalUrl.searchParams.set('custom', JSON.stringify({
            userId: member.id,
            orderId: orderId,
            cumcoins: amount,
            discordUsername: member.user.username
        }));
        paypalUrl.searchParams.set('return', returnUrl);
        paypalUrl.searchParams.set('cancel_return', cancelUrl);
        paypalUrl.searchParams.set('notify_url', `${process.env.BASE_URL || 'https://your-domain.com'}/paypal-webhook`);

        // Store pending order in database (you'll need to create this table)
        // storePendingOrder(orderId, member.id, amount, price);

        const embed = new EmbedBuilder()
            .setTitle('💰 Buy Cumcoins with PayPal')
            .setColor('#0070f3')
            .setDescription(`You're about to purchase **${amount.toLocaleString()} cumcoins** for **$${price.toFixed(2)} USD**`)
            .addFields(
                { name: '👤 Buyer', value: member.displayName, inline: true },
                { name: '🪙 Current Balance', value: `${currentPoints.toLocaleString()} cumcoins`, inline: true },
                { name: '🆔 Order ID', value: `\`${orderId}\``, inline: true },
                { name: '📦 Package', value: label, inline: true },
                { name: '💵 Price', value: `$${price.toFixed(2)} USD`, inline: true },
                { name: '🎯 Final Balance', value: `${(currentPoints + amount).toLocaleString()} cumcoins`, inline: true }
            )
            .setThumbnail('https://cdn-icons-png.flaticon.com/512/196/196566.png')
            .setFooter({ text: 'Click the PayPal button below to complete your purchase' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Pay with PayPal')
                    .setStyle(ButtonStyle.Link)
                    .setURL(paypalUrl.toString())
                    .setEmoji('💳'),
                new ButtonBuilder()
                    .setCustomId(`cancel_order_${orderId}`)
                    .setLabel('Cancel')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('❌')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });

        // Log the transaction attempt
        console.log(`PayPal purchase initiated: ${member.user.username} (${member.id}) - ${amount} cumcoins for $${price}`);
    }
};
