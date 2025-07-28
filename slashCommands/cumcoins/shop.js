const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getApplicationEmojis } = require('../../function/applicationEmojis');
const { getPoints } = require('../../function/furrygame');

module.exports = {
    name: 'shop',
    description: 'View and buy items from the cumcoin shop',
    cooldown: 3000,
    type: 1, // ChatInput
    options: [
        {
            name: 'view',
            description: 'View the cumcoin shop',
            type: 1, // Subcommand
        },
        {
            name: 'buy',
            description: 'Buy an item from the shop',
            type: 1, // Subcommand
            options: [
                {
                    name: 'item_id',
                    description: 'ID of the item to buy',
                    type: 3,
                    required: true
                },
                {
                    name: 'amount',
                    description: 'Amount of the item to buy (default: 1)',
                    type: 4, // Integer
                    required: false,
                    choices: [
                        { name: '1', value: 1 },
                        { name: '5', value: 5 },
                        { name: '10', value: 10 },
                        { name: '20', value: 20 }
                    ]
                }
            ]
        }
    ],

    run: async (client, interaction) => {
        if(interaction.options.getSubcommand() === 'buy') {
            return require('./buy').run(client, interaction);
        } else if(interaction.options.getSubcommand() === 'view') {
            return viewShop(client, interaction);
        }
    }
}

async function viewShop(client, interaction) {
    const shopPath = path.join(__dirname, '../../data/shopItems.json');
    const shopItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
    
    // Get application emojis for shop items (no need to pass client/token!)
    const emojiNames = shopItems.map(item => item.emoji_name || item.id);
    const emojis = await getApplicationEmojis(emojiNames);
    
    // Items per page
    const itemsPerPage = 5;
    const totalPages = Math.ceil(shopItems.length / itemsPerPage);
    let currentPage = 0;

    // Get user's cumcoins
    const userCumcoins = await getPoints(interaction.user.id);
    
    // Function to create embed for a specific page
    const createShopEmbed = (page) => {
        const start = page * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = shopItems.slice(start, end);
        
        const embed = new EmbedBuilder()
            .setTitle('Cumcoin Shop')
            .setColor(0x00AE86)
            .setFooter({ 
                text: `Page ${page + 1} of ${totalPages} • Use /buy <item_id> to purchase`,
                iconURL: interaction.guild?.iconURL() 
            })
            .setTimestamp();
        
        let description = '-# You have ' + userCumcoins + ' cumcoins.\n\n';
        pageItems.forEach((item, index) => {
            const emojiName = item.emoji_name || item.id;
            const emoji = emojis[emojiName] || '📦';
            const rarityEmoji = getRarityEmoji(item.rarity);
            
            description += `### ${emoji} **${item.name}** ${rarityEmoji}\n`;
            description += `*${item.description}*\n`;
            description += `**Price:** \`${item.price} cumcoins\`\n`;
            description += `**ID:** \`${item.id}\`\n`;
            if (item.max_amount > 1) {
                description += `**Max:** \`${item.max_amount}\`\n`;
            }
            description += '\n';
        });
        
        embed.setDescription(description || 'No items available on this page.');
        return embed;
    };
    
    // Function to get rarity emoji
    const getRarityEmoji = (rarity) => {
        switch (rarity?.toLowerCase()) {
            case 'common': return '⭐';
            case 'uncommon': return '⭐⭐';
            case 'rare': return '⭐⭐⭐';
            case 'epic': return '⭐⭐⭐⭐';
            case 'legendary': return '⭐⭐⭐⭐⭐';
            default: return '⭐';
        }
    };
    
    // Function to create action row with pagination buttons
    const createActionRow = (page, totalPages) => {
        const row = new ActionRowBuilder();
        
        // Previous button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('shop_prev')
                .setLabel('◀ Previous')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === 0)
        );
        
        // Page indicator
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('shop_page')
                .setLabel(`${page + 1}/${totalPages}`)
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true)
        );
        
        // Next button
        row.addComponents(
            new ButtonBuilder()
                .setCustomId('shop_next')
                .setLabel('Next ▶')
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(page === totalPages - 1)
        );
        
        return row;
    };
    
    // Create initial embed and buttons
    const embed = createShopEmbed(currentPage);
    const components = totalPages > 1 ? [createActionRow(currentPage, totalPages)] : [];
    
    // Send initial response
    const response = await interaction.reply({ 
        embeds: [embed], 
        components: components,
        ephemeral: true 
    });
    
    // If only one page, no need for pagination
    if (totalPages <= 1) return;
    
    // Create collector for button interactions
    const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes
    });
    
    collector.on('collect', async (buttonInteraction) => {
        // Check if the user who clicked is the same as who ran the command
        if (buttonInteraction.user.id !== interaction.user.id) {
            return buttonInteraction.reply({ 
                content: 'You cannot interact with this shop menu.', 
                ephemeral: true 
            });
        }
        
        // Handle button clicks
        if (buttonInteraction.customId === 'shop_prev') {
            currentPage = Math.max(0, currentPage - 1);
        } else if (buttonInteraction.customId === 'shop_next') {
            currentPage = Math.min(totalPages - 1, currentPage + 1);
        }
        
        // Update embed and buttons
        const newEmbed = createShopEmbed(currentPage);
        const newComponents = [createActionRow(currentPage, totalPages)];
        
        await buttonInteraction.update({ 
            embeds: [newEmbed], 
            components: newComponents 
        });
    });
    
    collector.on('end', async () => {
        // Disable all buttons when collector expires
        const disabledRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('shop_prev')
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('shop_page')
                    .setLabel(`${currentPage + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('shop_next')
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        try {
            await response.edit({ 
                components: totalPages > 1 ? [disabledRow] : [] 
            });
        } catch (error) {
            // Message might have been deleted, ignore error
            console.log('Could not disable shop pagination buttons:', error.message);
        }
    });
    // Handle errors
    collector.on('error', (error) => {
        console.error('Error in shop collector:', error);
        interaction.followUp({
            content: 'An error occurred while processing the shop interaction.',
            ephemeral: true
        });
    });
}
