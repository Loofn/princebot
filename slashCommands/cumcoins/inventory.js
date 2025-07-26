const path = require('path');
const queryAsync = require('../../function/queryAsync');
const con = require('../../function/db');

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
        const rows = await queryAsync(con, 'SELECT item_id FROM user_inventories WHERE user_id = ?', [userId]);
        const userInv = rows.map(row => row.item_id);
        if (userInv.length === 0) return await interaction.reply({ content: 'Your inventory is empty.', ephemeral: true });
        let invList = userInv.map(itemId => {
            const item = shopItems.find(i => i.id === itemId);
            return item ? `**${item.name}** - ${item.description}` : `Unknown item (${itemId})`;
        }).join('\n');
        await interaction.reply({ content: `__**Your Inventory**__\n\n${invList}`, ephemeral: true });
    }
};
