const path = require('path');
const queryAsync = require('../../function/queryAsync');
const con = require('../../function/db');
const { getPoints, removePoints } = require('../../function/furrygame');

module.exports = {
    name: 'buy',
    description: 'Buy an item from the shop with cumcoins',
    cooldown: 3000,
    type: 1, // ChatInput
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
    ],

    run: async (client, interaction) => {
        const itemId = interaction.options.getString('item_id');
        const amount = interaction.options.getInteger('amount') || 1;
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const shopItems = JSON.parse(require('fs').readFileSync(shopPath, 'utf8'));
        const userId = interaction.user.id;
        
        // Find the item in shop
        const item = shopItems.find(i => i.id === itemId);
        if (!item) {
            return await interaction.reply({ 
                content: 'Item not found in shop.', 
                ephemeral: true 
            });
        }

        // Check if amount exceeds max_amount for the item
        if (amount > item.max_amount) {
            return await interaction.reply({ 
                content: `You can only buy a maximum of ${item.max_amount} of this item.`, 
                ephemeral: true 
            });
        }

        // Get user's current cumcoin balance
        const userBalance = await getPoints(userId);
        const totalCost = item.price * amount;
        
        if (userBalance < totalCost) {
            return await interaction.reply({ 
                content: `Not enough cumcoins. You need ${totalCost} cumcoins but only have ${userBalance}.`, 
                ephemeral: true 
            });
        }

        // Check current inventory count for this item
        const existing = await queryAsync(con, 'SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ?', [userId, itemId]);
        const currentQuantity = existing.length > 0 ? existing[0].quantity || 1 : 0;
        
        // Check if buying this amount would exceed the max_amount
        if (currentQuantity + amount > item.max_amount) {
            const remainingSpace = item.max_amount - currentQuantity;
            if (remainingSpace <= 0) {
                return await interaction.reply({ 
                    content: `You already own the maximum amount (${item.max_amount}) of this item.`, 
                    ephemeral: true 
                });
            } else {
                return await interaction.reply({ 
                    content: `You can only buy ${remainingSpace} more of this item (you currently own ${currentQuantity}/${item.max_amount}).`, 
                    ephemeral: true 
                });
            }
        }

        try {
            // Deduct cumcoins
            await removePoints(userId, totalCost);

            // Add or update item in inventory
            if (existing.length > 0) {
                // Update existing inventory entry
                await queryAsync(con, 
                    'UPDATE user_inventories SET quantity = quantity + ? WHERE user_id = ? AND item_id = ?', 
                    [amount, userId, itemId]
                );
            } else {
                // Insert new inventory entry
                await queryAsync(con, 
                    'INSERT INTO user_inventories (user_id, item_id, quantity) VALUES (?, ?, ?)', 
                    [userId, itemId, amount]
                );
            }

            // Success message
            const pluralName = amount > 1 ? `${amount}x ${item.name}` : item.name;
            const costText = amount > 1 ? `${totalCost} cumcoins (${item.price} each)` : `${totalCost} cumcoins`;
            
            await interaction.reply({ 
                content: `✅ Successfully bought **${pluralName}** for ${costText}!\n💰 Remaining balance: ${userBalance - totalCost} cumcoins`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error processing purchase:', error);
            await interaction.reply({ 
                content: 'An error occurred while processing your purchase. Please try again.', 
                ephemeral: true 
            });
        }
    }
};
