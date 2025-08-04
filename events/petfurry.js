const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const client = require('..');
const queryAsync = require('../function/queryAsync');
const con = require('../function/db');
const { getDominantColorFromURL, chance, getRandomInteger } = require('../function/utils');
const { removePoints, givePoints } = require('../function/furrygame');

async function addToGame(userId, points=0){
    try {
        await queryAsync(con, `
            INSERT INTO user_points (user, points) VALUES (?, ?) 
            ON DUPLICATE KEY UPDATE points = points + ?
        `, [userId, points, points]);
        return true;
    } catch (error) {
        console.error('Error adding user to game:', error);
        return false;
    }
}

function fiftyPercentChance() {
    return Math.random() < 0.5;
}

async function sendFurry(){
    const guild = client.guilds.cache.get('1231299437519966269');
    
    try {
        // Atomically check and set the state to prevent race conditions
        const stateChanged = await trySetFurryState();
        if (!stateChanged) {
            console.log('Furry game already active, skipping spawn');
            return; // Another furry is already active
        }
        
        // Set a timeout to automatically unlock if something goes wrong (5 minutes)
        const unlockTimeout = setTimeout(async () => {
            console.log('Furry game auto-unlock triggered after timeout');
            await changeFurryState(false);
        }, 5 * 60 * 1000); // 5 minutes

        const furries = await queryAsync(con, `SELECT * FROM furries`);
        
        if(furries.length === 0) {
            clearTimeout(unlockTimeout);
            await changeFurryState(false);
            return;
        }

        const randomFurry = Math.floor(Math.random() * furries.length);
        const selectedFurry = furries[randomFurry];
        const hex = await getDominantColorFromURL(selectedFurry.imgurl) ? await getDominantColorFromURL(selectedFurry.imgurl) : "Random";

        const embedFurry = new EmbedBuilder()
            .setTitle(`Poor furry looking for attention...`)
            .setDescription(`**Pat**, **Lick**, **Suck**, **Fuck** or **Ride** the furry to make them feel better!\n*Remember they will only like one of the actions...!!*`)
            .setFooter({text: `Use buttons to react to the furry`})
            .setImage(selectedFurry.imgurl)
            .setColor(hex);

        const petBtn = new ButtonBuilder()
            .setCustomId(`furrygame-pet-${selectedFurry.id}`)
            .setLabel(`Pet them!`)
            .setStyle(ButtonStyle.Primary)

        const lickBtn = new ButtonBuilder()
            .setCustomId(`furrygame-lick-${selectedFurry.id}`)
            .setLabel(`Lick them!`)
            .setStyle(ButtonStyle.Primary)
        
        const suckBtn = new ButtonBuilder()
            .setCustomId(`furrygame-suck-${selectedFurry.id}`)
            .setLabel(`Suck them!`)
            .setStyle(ButtonStyle.Primary)

        const fuckBtn = new ButtonBuilder()
            .setCustomId(`furrygame-fuck-${selectedFurry.id}`)
            .setLabel(`Fuck them!`)
            .setStyle(ButtonStyle.Primary)

        const rideBtn = new ButtonBuilder()
            .setCustomId(`furrygame-ride-${selectedFurry.id}`)
            .setLabel(`Ride them!`)
            .setStyle(ButtonStyle.Primary)

        const rows = new ActionRowBuilder()
            .addComponents(petBtn, lickBtn, suckBtn, fuckBtn, rideBtn)

        const channel = guild.channels.cache.get('1236764013967446016');
        
        const message = await channel.send({embeds: [embedFurry], components: [rows]});
        
        // Store timeout ID in the message for cleanup when interaction happens
        message.unlockTimeout = unlockTimeout;
        
        console.log(`Furry spawned successfully: ${selectedFurry.id}`);
        
    } catch (error) {
        console.error('Error in sendFurry:', error);
        // Always unlock on error
        await changeFurryState(false);
    }
}

async function activeFurry() {
    try {
        const result = await queryAsync(con, `SELECT value FROM booleans WHERE name = 'furrygame'`);
        return result[0]?.value || 0;
    } catch (error) {
        console.error('Error checking furry game state:', error);
        return 0; // Default to inactive on error
    }
}

/**
 * Atomically check if furry game is inactive and set it to active
 * Returns true if successfully changed from inactive to active, false otherwise
 */
async function trySetFurryState() {
    try {
        const result = await queryAsync(con, `
            UPDATE booleans 
            SET value = 1 
            WHERE name = 'furrygame' AND value = 0
        `);
        
        // If affectedRows is 0, it means the state was already 1 (active)
        const success = result.affectedRows > 0;
        if (success) {
            console.log('Furry game state set to active');
        } else {
            console.log('Furry game already active, cannot spawn');
        }
        return success;
    } catch (error) {
        console.error('Error trying to set furry game state:', error);
        return false;
    }
}


/**
 * 
 * @param {boolean} bool true or false
 */
async function changeFurryState(bool){
    try {
        const value = bool ? 1 : 0;
        await queryAsync(con, `UPDATE booleans SET value = ? WHERE name = 'furrygame'`, [value]);
        console.log(`Furry game state changed to: ${bool}`);
    } catch (error) {
        console.error('Error changing furry game state:', error);
    }
}

async function getFurry(id){
    try {
        const result = await queryAsync(con, `SELECT * FROM furries WHERE id = ?`, [id]);
        return result[0] || null;
    } catch (error) {
        console.error('Error getting furry:', error);
        return null;
    }
}

// BUTTONS
client.on('interactionCreate', async interaction => {

    if(interaction.isButton()){
        const member = interaction.member;
        const customId = interaction.customId;
        const guild = interaction.member.guild;
        const splitId = customId.split('-');

        if(splitId[0] === 'furrygame'){
            try {
                // Clear the timeout if it exists
                if(interaction.message.unlockTimeout) {
                    clearTimeout(interaction.message.unlockTimeout);
                }

                const furry = await getFurry(splitId[2]);
                if (!furry) {
                    await changeFurryState(false);
                    return await interaction.reply({content: 'Error: Furry not found!', ephemeral: true});
                }

                const msg = interaction.message;
                const oldEmbed = msg.embeds[0];
                
                if(furry.action === splitId[1]){
                    const embed = new EmbedBuilder()
                        .setTitle(`Aww... they got what they were looking for!`)
                        .setDescription(`${member} satisfied the needs of this poor furry! \`+2 cumcoins\` <a:coom:1235063571868680243>`)
                        .setImage(oldEmbed.image.url)
                        .setFooter({text: `This furry was satisfied!\nKeep eyes out for next one!`})
                        .setColor(oldEmbed.color)

                    await msg.edit({embeds: [embed], components: []});
                    await addToGame(member.id, 2);
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle(`Fuck... they left angry..`)
                        .setDescription(`${member} tried to \`${splitId[1].toUpperCase()}\` them but it did not go so well!\n\n\`-1 cumcoins\` <a:coom:1235063571868680243>`)
                        .setImage(oldEmbed.image.url)
                        .setFooter({text: `This furry was not satisfied, let's hope better luck next time!`})
                        .setColor(oldEmbed.color)

                    await msg.edit({embeds: [embed], components: []});
                    await addToGame(member.id);
                    await removePoints(member.id, 1);
                }

                await changeFurryState(false);
                await interaction.reply({content: `You tried to \`${splitId[1].toUpperCase()}\` the furry!`, ephemeral: true});
                
            } catch (error) {
                console.error('Error in furry game interaction:', error);
                await changeFurryState(false); // Always unlock on error
                await interaction.reply({content: 'An error occurred while processing your action!', ephemeral: true});
            }
        } else return;

    }
})

// Grant points randomly if posting lewds
client.on('messageCreate', async message => {
    let prizeReactions = ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣"];
    if(message.channel.parentId === '1233560718281015327'){
        if(message.author.bot) return;

        if(message.attachments.size > 0){
            if(chance(60)){
                await addToGame(message.author.id);
                let prize = getRandomInteger(9);
                await message.react('<a:Lewd_Coom:1235063571868680243>')
                await message.react(prizeReactions[prize - 1]);
                givePoints(message.author.id, prize);
            }
        }
    }
})

module.exports = {
    sendFurry,
    activeFurry,
    fiftyPercentChance,
    addToGame
}