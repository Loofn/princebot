
const path = require('path');
const { isAdmin } = require('../../function/roles');
const { addItemToUser, removeItemFromUser, getUserInventory, getItemQuantity } = require('../../function/inventory');

module.exports = {
    name: 'giveitem',
    description: 'Give an item to another user',
    cooldown: 3000,
    type: 1, // ChatInput
    autocomplete: true, // Enable autocomplete for this command
    options: [
        {
            name: 'user',
            description: 'User to give the item to',
            type: 6, // User
            required: true
        },
        {
            name: 'item_id',
            description: 'ID of the item to give',
            type: 3, // String
            required: true,
            autocomplete: true // Enable autocomplete for this option
        },
        {
            name: 'amount',
            description: 'Amount of the item to give (default: 1)',
            type: 4, // Integer
            required: false,
            choices: [
                { name: '1', value: 1 },
                { name: '5', value: 5 },
                { name: '10', value: 10 },
                { name: '20', value: 20 }
            ]
        },
        {
            name: 'admin-use',
            description: 'Whether to use admin privileges for this action',
            type: 5, // Boolean
            required: false
        }
    ],

    run: async (client, interaction) => {
        const userToGive = interaction.options.getUser('user');
        const itemId = interaction.options.getString('item_id');
        const amount = interaction.options.getInteger('amount') || 1;
        const adminUse = interaction.options.getBoolean('admin-use') || false;
        const userId = interaction.user.id;

        // Check if the user has admin privileges if adminUse is true
        if (adminUse && !await isAdmin(userId)) {
            return await interaction.reply({ 
                content: 'You do not have permission to use admin privileges for this action.', 
                ephemeral: true 
            });
        }

        // Load shop items
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const shopItems = JSON.parse(require('fs').readFileSync(shopPath, 'utf8'));
        
        // Find the item in shop
        const item = shopItems.find(i => i.id === itemId);
        if (!item) {
            return await interaction.reply({ 
                content: 'Item does not exist.', 
                ephemeral: true 
            });
        }

        // Check if amount exceeds max_amount for the item
        if (adminUse && amount <= item.max_amount) {
            await addItemToUser(userToGive.id, itemId, amount);
            return await interaction.reply({ 
                content: `Successfully gave ${amount} of ${item.name} to ${userToGive.username}.`, 
                ephemeral: false 
            });
        }

        // Check if the user has the item in their inventory
        const userInventory = await getUserInventory(userId);
        const userItem = userInventory.find(i => i.item_id === itemId);
        if (!userItem || userItem.quantity < amount) {
            return await interaction.reply({ 
                content: `You don't have enough **${item.name}** in your inventory.`, 
                ephemeral: true 
            });
        }

        
        if (amount > item.max_amount) {
            return await interaction.reply({ 
                content: `You can only give a maximum of ${item.max_amount} of this item.`, 
                ephemeral: true 
            });
        }
        // Check if the user is trying to give an item to themselves
        if (userToGive.id === userId) {
            return await interaction.reply({ 
                content: 'You cannot give an item to yourself.', 
                ephemeral: true 
            });
        }

        // Give the item to the user
        await addItemToUser(userToGive.id, itemId, amount);
        await removeItemFromUser(userId, itemId, amount);

        return await interaction.reply({ 
            content: `Successfully gave ${amount} of ${item.name} to ${userToGive.username}.`, 
            ephemeral: false 
        });
    },

    // Autocomplete handler
    autocompleteRun: async (client, interaction) => {
        const focusedOption = interaction.options.getFocused(true);
        
        if (focusedOption.name === 'item_id') {
            const userId = interaction.user.id;
            
            try {
                // Get user's inventory
                const userInventory = await getUserInventory(userId);
                
                // Load shop items to get item details
                const shopPath = path.join(__dirname, '../../data/shopItems.json');
                const shopItems = JSON.parse(require('fs').readFileSync(shopPath, 'utf8'));
                
                // Create choices from user's inventory
                const choices = userInventory
                    .map(invItem => {
                        const shopItem = shopItems.find(s => s.id === invItem.item_id);
                        if (shopItem) {
                            return {
                                name: `${shopItem.name} (${invItem.quantity})`,
                                value: shopItem.id
                            };
                        }
                        return null;
                    })
                    .filter(choice => choice !== null)
                    .filter(choice => {
                        // Filter based on what user is typing
                        const userInput = focusedOption.value.toLowerCase();
                        return choice.name.toLowerCase().includes(userInput) || 
                               choice.value.toLowerCase().includes(userInput);
                    })
                    .slice(0, 25); // Discord limits to 25 choices

                await interaction.respond(choices);
            } catch (error) {
                console.error('Error in autocomplete:', error);
                await interaction.respond([]);
            }
        }
    }
}