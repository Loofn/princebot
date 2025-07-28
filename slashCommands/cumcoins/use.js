const itemSystem = require('../../function/itemSystem');

module.exports = {
    name: 'use',
    description: 'Use an item from your inventory',
    cooldown: 3000,
    type: 1, // ChatInput
    options: [
        {
            name: 'item_id',
            description: 'ID of the item to use',
            type: 3,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const itemId = interaction.options.getString('item_id');
        const userId = interaction.user.id;

        // Use the item through the item system
        const result = await itemSystem.useItem(userId, itemId);

        if (result.success) {
            await interaction.reply({ 
                content: result.message, 
                ephemeral: true 
            });
        } else {
            await interaction.reply({ 
                content: result.message, 
                ephemeral: true 
            });
        }
    }
};
