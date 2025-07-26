const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'shop',
    description: 'View and buy items from the cumcoin shop',
    cooldown: 3000,
    type: 1, // ChatInput
    options: [],

    run: async (client, interaction) => {
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const shopItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
        let shopList = shopItems.map(item => `**${item.name}** - ${item.price} cumcoins\n${item.description}`).join('\n\n');
        await interaction.reply({ content: `__**Cumcoin Shop**__\n\n${shopList}\n\nTo buy: /buy <item_id>`, ephemeral: true });
    }
};
