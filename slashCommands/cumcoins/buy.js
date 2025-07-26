const path = require('path');
const queryAsync = require('../../function/queryAsync');
const con = require('../../function/db');

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
        }
    ],

    run: async (client, interaction) => {
        const itemId = interaction.options.getString('item_id');
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const shopItems = JSON.parse(require('fs').readFileSync(shopPath, 'utf8'));
        const userId = interaction.user.id;
        const item = shopItems.find(i => i.id === itemId);
        if (!item) return await interaction.reply({ content: 'Item not found.', ephemeral: true });
        // TODO: Replace with actual cumcoin balance check
        let userBalance = 9999;
        if (userBalance < item.price) return await interaction.reply({ content: 'Not enough cumcoins.', ephemeral: true });

        // Check if user already owns the item
        const existing = await queryAsync(con, 'SELECT * FROM user_inventories WHERE user_id = ? AND item_id = ?', [userId, itemId]);
        if (existing.length > 0) {
            return await interaction.reply({ content: 'You already own this item.', ephemeral: true });
        }

        // Add item to inventory
        await queryAsync(con, 'INSERT INTO user_inventories (user_id, item_id) VALUES (?, ?)', [userId, itemId]);
        await interaction.reply({ content: `You bought **${item.name}**!`, ephemeral: true });
    }
};
