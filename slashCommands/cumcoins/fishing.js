const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const itemSystem = require('../../function/itemSystem');
const { getFishingBoost, getRareCatchChance, hasTool } = require('../../function/itemUtils');
const { getApplicationEmojis } = require('../../function/applicationEmojis');
const queryAsync = require('../../function/queryAsync');
const con = require('../../function/db');
const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'fishing',
    description: 'Go fishing to catch fish and items.',
    cooldown: 30000, // 30 second cooldown
    type: 1, // ChatInput
    options: [
        
    ],

    run: async (client, interaction) => {
        const userId = interaction.user.id;
        
        // Check if the user has a fishing rod or fishing pole
        const hasFishingRod = await hasTool(userId, 'fishingrod');
        const hasFishingPole = await hasTool(userId, 'fishingpole');
        
        if (!hasFishingRod && !hasFishingPole) {
            const embed = new EmbedBuilder()
                .setTitle('🎣 Fishing Tools Required')
                .setColor('Red')
                .setDescription('You need a **Fishing Rod** or **Fishing Pole** to go fishing! Buy one from the shop with `/shop buy`.');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Load all fishable items
        const shopPath = path.join(__dirname, '../../data/shopItems.json');
        const allItems = JSON.parse(fs.readFileSync(shopPath, 'utf8'));
        const fishableItems = allItems.filter(item => item.fishable === true);
        
        if (fishableItems.length === 0) {
            const embed = new EmbedBuilder()
                .setTitle('🎣 No Fish Available')
                .setColor('Orange')
                .setDescription('There are no fish to catch right now. Try again later!');
            return await interaction.reply({ embeds: [embed], ephemeral: true });
        }

        // Start animated fishing minigame
        const fishingResult = await playFishingMinigame(interaction, userId);
        if (!fishingResult.success) {
            return; // User cancelled or error occurred
        }

        // Check if user failed the timing challenge
        if (!fishingResult.caughtFish) {
            // Fish escaped due to poor timing - no catch roll needed
            return;
        }

        // Get user's fishing boosts
        const fishingBoost = await getFishingBoost(userId);
        const rareCatchBonus = await getRareCatchChance(userId);

        // Calculate catch chances based on rarity and item type
        const catchTable = fishableItems.map(item => {
            let baseChance = 0;
            
            // Fish get higher base chances than other items
            const isFish = ['salmon', 'trout', 'catfish', 'goldfish'].includes(item.id);
            
            // Set base chances by rarity (fish get bonus)
            switch (item.rarity?.toLowerCase()) {
                case 'common':
                    baseChance = isFish ? 35 : 15; // Fish: 35%, Others: 15%
                    break;
                case 'uncommon':
                    baseChance = isFish ? 25 : 10; // Fish: 25%, Others: 10%
                    break;
                case 'rare':
                    baseChance = isFish ? 15 : 5;  // Fish: 15%, Others: 5%
                    break;
                case 'epic':
                    baseChance = isFish ? 8 : 3;   // Fish: 8%, Others: 3%
                    break;
                case 'legendary':
                    baseChance = isFish ? 3 : 1;   // Fish: 3%, Others: 1%
                    break;
                default:
                    baseChance = isFish ? 20 : 8;  // Default fallback
            }

            // Apply fishing boost
            let finalChance = baseChance * fishingBoost;
            
            // Apply rare catch bonus for rare+ items
            if (['rare', 'epic', 'legendary'].includes(item.rarity?.toLowerCase())) {
                finalChance += (baseChance * rareCatchBonus);
            }

            return {
                item: item,
                chance: Math.min(finalChance, 50) // Cap at 50% max chance per item
            };
        });

        // Perform the catch roll
        const roll = Math.random() * 100;
        let cumulativeChance = 0;
        let caughtItem = null;

        // Sort by chance (highest first) for better distribution
        catchTable.sort((a, b) => b.chance - a.chance);

        for (const entry of catchTable) {
            cumulativeChance += entry.chance;
            if (roll <= cumulativeChance) {
                caughtItem = entry.item;
                break;
            }
        }

        // If nothing was caught (unlucky roll)
        if (!caughtItem) {
            const embed = new EmbedBuilder()
                .setTitle(`🎣 ${interaction.user.displayName || interaction.user.username}'s Fishing Result`)
                .setColor('Blue')
                .setDescription('🌊 They cast their line but didn\'t catch anything this time. Better luck next time!')
                .setFooter({ text: `Fishing boost: ${fishingBoost.toFixed(1)}x | Rare bonus: +${(rareCatchBonus * 100).toFixed(1)}%` });
            
            try {
                await fishingResult.response.edit({ embeds: [embed] });
            } catch (error) {
                await interaction.followUp({ embeds: [embed] });
            }
            return;
        }

        // Add caught item to inventory
        try {
            // Check if user already has this item
            const existing = await queryAsync(con, 
                'SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ?', 
                [userId, caughtItem.id]
            );

            if (existing.length > 0) {
                // Update existing inventory entry
                await queryAsync(con, 
                    'UPDATE user_inventories SET quantity = quantity + 1 WHERE user_id = ? AND item_id = ?', 
                    [userId, caughtItem.id]
                );
            } else {
                // Insert new inventory entry
                await queryAsync(con, 
                    'INSERT INTO user_inventories (user_id, item_id, quantity) VALUES (?, ?, ?)', 
                    [userId, caughtItem.id, 1]
                );
            }

            // Get emoji for the caught item
            const emojiNames = [caughtItem.emoji_name || caughtItem.id];
            const emojis = await getApplicationEmojis(emojiNames);
            const itemEmoji = emojis[caughtItem.emoji_name || caughtItem.id] || '🐟';

            // Get rarity emoji
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

            const rarityEmoji = getRarityEmoji(caughtItem.rarity);

            // Success embed
            const embed = new EmbedBuilder()
                .setTitle(`🎣 ${interaction.user.displayName || interaction.user.username}'s Fishing Result`)
                .setColor('Green')
                .setDescription(`🎉 **They caught something!**\n\n${itemEmoji} **${caughtItem.name}** ${rarityEmoji}\n*${caughtItem.description}*\n\n💰 **Value:** ${caughtItem.price} cumcoins`)
                .setFooter({ text: `Fishing boost: ${fishingBoost.toFixed(1)}x | Rare bonus: +${(rareCatchBonus * 100).toFixed(1)}%` })
                .setTimestamp();

            try {
                await fishingResult.response.edit({ embeds: [embed] });
            } catch (error) {
                await interaction.followUp({ embeds: [embed] });
            }

        } catch (error) {
            console.error('Error adding caught item to inventory:', error);
            const embed = new EmbedBuilder()
                .setTitle('🎣 Fishing Error')
                .setColor('Red')
                .setDescription(`${interaction.user.displayName || interaction.user.username} caught something, but there was an error adding it to their inventory. Please try again.`);
            
            try {
                await fishingResult.response.edit({ embeds: [embed] });
            } catch (editError) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        }
    }
}

/**
 * Animated fishing minigame with Discord embed updates
 * @param {Interaction} interaction - Discord interaction
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Result object with success status
 */
async function playFishingMinigame(interaction, userId) {
    const username = interaction.user.displayName || interaction.user.username;
    
    const animations = [
        {
            title: `🎣 ${username} is casting their line...`,
            description: '```\n      🎣\n     /|\\\n      |\n      |\n   🌊🌊🌊🌊🌊\n```',
            color: 0x4A90E2
        },
        {
            title: `🎣 ${username} is waiting for a bite...`,
            description: '```\n      🎣\n     /|\\\n      |\n      |  💭\n   🌊🌊🌊🌊🌊\n```',
            color: 0x4A90E2
        },
        {
            title: `🎣 Something's nibbling on ${username}'s line!`,
            description: '```\n      🎣\n     /|\\\n      |\\  \n      | \\ 💨\n   🌊🌊🌊🌊🌊\n     🐟\n```',
            color: 0xF5A623
        },
        {
            title: `🎣 ${username} has a fish on the line!`,
            description: '```\n      🎣\n     /|\\\n      |\\\\ \n      | \\\\💨💨\n   🌊🌊🌊🌊🌊\n       🐟💨\n```\n**⚡ Quick! ${username} needs to press the button to reel it in! ⚡**',
            color: 0xF5A623,
            needsButton: true
        }
    ];

    try {
        // Send initial fishing embed
        const initialEmbed = new EmbedBuilder()
            .setTitle(animations[0].title)
            .setDescription(animations[0].description)
            .setColor(animations[0].color)
            .setFooter({ text: 'Fishing in progress...' })
            .setTimestamp();

        const response = await interaction.reply({ 
            embeds: [initialEmbed],
            fetchReply: true 
        });

        // Animate through first 3 stages (before the button stage)
        for (let i = 1; i < 3; i++) {
            await new Promise(resolve => setTimeout(resolve, 1500)); // 1.5 second delay

            const embed = new EmbedBuilder()
                .setTitle(animations[i].title)
                .setDescription(animations[i].description)
                .setColor(animations[i].color)
                .setFooter({ text: 'Fishing in progress...' })
                .setTimestamp();

            try {
                await response.edit({ embeds: [embed] });
            } catch (editError) {
                console.log('Could not edit fishing animation:', editError.message);
            }
        }

        // Wait a random amount before showing the button (2-4 seconds)
        const waitTime = Math.random() * 2000 + 2000; // 2-4 seconds
        await new Promise(resolve => setTimeout(resolve, waitTime));

        // Show the "Fish on the line!" stage with button
        const buttonEmbed = new EmbedBuilder()
            .setTitle(animations[3].title)
            .setDescription(animations[3].description)
            .setColor(animations[3].color)
            .setFooter({ text: `Quick! ${username} has 3 seconds to reel it in! (Only ${username} can press the button)` })
            .setTimestamp();

        const reelButton = new ButtonBuilder()
            .setCustomId(`reel_${userId}_${Date.now()}`)
            .setLabel('Reel it in!')
            .setEmoji('🎣')
            .setStyle(ButtonStyle.Primary);

        const actionRow = new ActionRowBuilder().addComponents(reelButton);

        try {
            await response.edit({ 
                embeds: [buttonEmbed], 
                components: [actionRow] 
            });
        } catch (editError) {
            console.log('Could not show reel button:', editError.message);
            return { success: false };
        }

        // Set up button interaction collector with 3 second timeout
        const collector = response.createMessageComponentCollector({
            time: 3000 // 3 seconds to press the button
        });

        return new Promise((resolve) => {
            let buttonPressed = false;
            let reactionTime = Date.now();

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== userId) {
                    await buttonInteraction.reply({ 
                        content: `🎣 This is ${username}'s fishing line! Only they can reel in their catch.`, 
                        ephemeral: true 
                    });
                    return;
                }

                buttonPressed = true;
                const timeTaken = Date.now() - reactionTime;
                
                // Acknowledge the button press
                await buttonInteraction.deferUpdate();

                // Success - they pressed the button in time!
                const successEmbed = new EmbedBuilder()
                    .setTitle(`🎣 ${username} is reeling it in!`)
                    .setDescription('```\n      🎣\n     /|\\\n      |\\\\\\\n      | \\\\\\💨\n   🌊🌊🌊🌊🌊\n        🐟\n```\n🎉 **Perfect timing!** They\'re reeling in their catch!')
                    .setColor(0x7ED321)
                    .setFooter({ text: `${username}'s reaction time: ${timeTaken}ms` })
                    .setTimestamp();

                try {
                    await response.edit({ 
                        embeds: [successEmbed], 
                        components: [] // Remove button
                    });
                } catch (editError) {
                    console.log('Could not update success embed:', editError.message);
                }

                // Short delay before resolving
                setTimeout(() => {
                    resolve({ success: true, response: response, caughtFish: true });
                }, 1000);
            });

            collector.on('end', async (collected) => {
                if (!buttonPressed) {
                    // Too slow! Fish escaped
                    const failEmbed = new EmbedBuilder()
                        .setTitle(`🎣 ${username}'s fish got away!`)
                        .setDescription('```\n      🎣\n     /|\\\n      |\n      |\n   🌊🌊🌊🌊🌊\n        💨 🐟\n```\n😔 **Too slow!** The fish escaped while they hesitated.')
                        .setColor(0xE74C3C)
                        .setFooter({ text: `${username} needs to be quicker next time!` })
                        .setTimestamp();

                    try {
                        await response.edit({ 
                            embeds: [failEmbed], 
                            components: [] // Remove button
                        });
                    } catch (editError) {
                        console.log('Could not update fail embed:', editError.message);
                    }

                    resolve({ success: true, response: response, caughtFish: false });
                }
            });
        });

    } catch (error) {
        console.error('Error in fishing minigame:', error);
        
        // Fallback to simple message if animation fails
        const fallbackEmbed = new EmbedBuilder()
            .setTitle('🎣 Fishing')
            .setDescription('You cast your line into the water...')
            .setColor(0x4A90E2);

        try {
            const response = await interaction.reply({ 
                embeds: [fallbackEmbed],
                fetchReply: true 
            });
            return { success: true, response: response, caughtFish: true }; // Allow normal fishing on fallback
        } catch (fallbackError) {
            console.error('Fallback fishing embed failed:', fallbackError);
            return { success: false };
        }
    }
}