const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getApplicationEmojis } = require('../../function/applicationEmojis');
const { getUserInventory } = require('../../function/inventory');

module.exports = {
    name: 'inventory',
    description: 'View your cumcoin inventory',
    cooldown: 3000,
    type: 1, // ChatInput
    options: [],

    run: async (client, interaction) => {
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const shopItems = JSON.parse(require('fs').readFileSync(shopPath, 'utf8'));
        const userId = interaction.user.id;
        
        // Get user's inventory with quantities
        const rows = await getUserInventory(userId);
        
        if (rows.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('📦 Your Inventory')
                .setColor('Orange')
                .setDescription('Your inventory is empty. Visit the shop to buy some items!')
                .setFooter({ text: 'Use /shop view to see available items' })
                .setTimestamp();
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Get application emojis for all items in inventory
        const emojiNames = rows.map(row => {
            const item = shopItems.find(i => i.id === row.item_id);
            return item ? (item.emoji_name || item.id) : row.item_id;
        });
        const emojis = await getApplicationEmojis(emojiNames);

        // Items per page
        const itemsPerPage = 5;
        const totalPages = Math.ceil(rows.length / itemsPerPage);
        let currentPage = 0;

        // Get rarity emoji function
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

        // Function to create embed for a specific page
        const createInventoryEmbed = (page) => {
            const start = page * itemsPerPage;
            const end = start + itemsPerPage;
            const pageItems = rows.slice(start, end);
            
            let inventoryDescription = '';
            let totalValue = 0;
            
            // Calculate total value of all items (not just current page)
            for (const row of rows) {
                const item = shopItems.find(i => i.id === row.item_id);
                if (item) {
                    totalValue += item.price * row.quantity;
                }
            }
            
            // Build current page items
            for (const row of pageItems) {
                const item = shopItems.find(i => i.id === row.item_id);
                if (item) {
                    const emojiName = item.emoji_name || item.id;
                    const itemEmoji = emojis[emojiName] || '📦';
                    const rarityEmoji = getRarityEmoji(item.rarity);
                    const itemValue = item.price * row.quantity;
                    
                    inventoryDescription += `${itemEmoji} **${item.name}** ${rarityEmoji}\n`;
                    inventoryDescription += `*${item.description}*\n`;
                    inventoryDescription += `**Quantity:** \`${row.quantity}\` | **Value:** \`${itemValue} cumcoins\`\n\n`;
                } else {
                    // Handle unknown items
                    inventoryDescription += `❓ **Unknown Item** (${row.item_id})\n`;
                    inventoryDescription += `**Quantity:** \`${row.quantity}\`\n\n`;
                }
            }

            const embed = new EmbedBuilder()
                .setTitle(`📦 ${interaction.user.displayName || interaction.user.username}'s Inventory`)
                .setColor('Green')
                .setDescription(inventoryDescription || 'No items on this page.')
                .setFooter({ 
                    text: `Page ${page + 1} of ${totalPages} • Total items: ${rows.length} types | Total value: ${totalValue} cumcoins` 
                })
                .setTimestamp();

            return embed;
        };

        // Function to create action row with pagination buttons
        const createActionRow = (page, totalPages) => {
            const row = new ActionRowBuilder();
            
            // Previous button
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('inventory_prev')
                    .setLabel('◀ Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === 0)
            );
            
            // Page indicator
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('inventory_page')
                    .setLabel(`${page + 1}/${totalPages}`)
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
            );
            
            // Next button
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('inventory_next')
                    .setLabel('Next ▶')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(page === totalPages - 1)
            );
            
            return row;
        };

        // Create initial embed and buttons
        const embed = createInventoryEmbed(currentPage);
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
                    content: 'You cannot interact with this inventory menu.', 
                    ephemeral: true 
                });
            }
            
            // Handle button clicks
            if (buttonInteraction.customId === 'inventory_prev') {
                currentPage = Math.max(0, currentPage - 1);
            } else if (buttonInteraction.customId === 'inventory_next') {
                currentPage = Math.min(totalPages - 1, currentPage + 1);
            }
            
            // Update embed and buttons
            const newEmbed = createInventoryEmbed(currentPage);
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
                        .setCustomId('inventory_prev')
                        .setLabel('◀ Previous')
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('inventory_page')
                        .setLabel(`${currentPage + 1}/${totalPages}`)
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(true),
                    new ButtonBuilder()
                        .setCustomId('inventory_next')
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
                console.log('Could not disable inventory pagination buttons:', error.message);
            }
        });

        // Handle errors
        collector.on('error', (error) => {
            console.error('Error in inventory collector:', error);
            interaction.followUp({
                content: 'An error occurred while processing the inventory interaction.',
                ephemeral: true
            });
        });
    }
};
