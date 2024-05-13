const { EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require('discord.js');
const client = require('..');
const con = require('../function/db');
const { getDominantColorFromURL } = require('../function/utils');

async function addToGame(userId, points=0){
    return new Promise((resolve, reject) => {
        con.query(`INSERT INTO user_points VALUES ('${userId}', '${points}') ON DUPLICATE KEY UPDATE points=points+'${points}'`, function (err, res){
            if(res){
                resolve(true)
            }
        });
    })
}

function fiftyPercentChance() {
    return Math.random() < 0.5;
}

async function sendFurry(){
    const guild = client.guilds.cache.get('1231299437519966269');
    const isActive = await activeFurry();
    if(isActive === 1) return;

    con.query(`SELECT * FROM furries`, async function (err, res){

        if(res.length === 0) return;

        const randomFurry = Math.floor(Math.random() * res.length);
        const hex = await getDominantColorFromURL(res[randomFurry].imgurl) ? await getDominantColorFromURL(res[randomFurry].imgurl) : "Random";

        const embedFurry = new EmbedBuilder()
        .setTitle(`Poor furry looking for attention...`)
        .setDescription(`**Pat**, **Suck**, **Fuck** or **Ride** the furry to make them feel better!\n*Remember they will only like one of the actions...!!*`)
        .setFooter({text: `Use buttons to react to the furry`})
        .setImage(res[randomFurry].imgurl)
        .setColor(hex);

        const petBtn = new ButtonBuilder()
            .setCustomId(`furrygame-pet-${res[randomFurry].id}`)
            .setLabel(`Pet them!`)
            .setStyle(ButtonStyle.Primary)
        
        const suckBtn = new ButtonBuilder()
            .setCustomId(`furrygame-suck-${res[randomFurry].id}`)
            .setLabel(`Suck them!`)
            .setStyle(ButtonStyle.Primary)

        const fuckBtn = new ButtonBuilder()
            .setCustomId(`furrygame-fuck-${res[randomFurry].id}`)
            .setLabel(`Fuck them!`)
            .setStyle(ButtonStyle.Primary)

        const rideBtn = new ButtonBuilder()
            .setCustomId(`furrygame-ride-${res[randomFurry].id}`)
            .setLabel(`Ride them!`)
            .setStyle(ButtonStyle.Primary)

        const rows = new ActionRowBuilder()
            .addComponents(petBtn, suckBtn, fuckBtn, rideBtn)

        const channel = guild.channels.cache.get('1236764013967446016');
        changeFurryState(true);
        channel.send({embeds: [embedFurry], components: [rows]});
    })
    
}

async function activeFurry() {
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM booleans WHERE name='furrygame'`, function (err, res) {
            if (err) {
                reject(err); // Reject the promise if there's an error
            } else {
                resolve(res[0].value); // Resolve the promise with the value from the query
            }
        });
    });
}


/**
 * 
 * @param {boolean} bool true or false
 */
function changeFurryState(bool){
    bool = bool ? 1 : 0;
    con.query(`UPDATE booleans SET value='${bool}' WHERE name='furrygame'`)
}

async function getFurry(id){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM furries WHERE id='${id}'`, function (err, res) {
            if (err) {
                reject(err); // Reject the promise if there's an error
            } else {
                resolve(res[0]); // Resolve the promise with the value from the query
            }
        });
    });
}

// BUTTONS
client.on('interactionCreate', async interaction => {

    if(interaction.isButton()){
        const member = interaction.member;
        const customId = interaction.customId;
        const guild = interaction.member.guild;
        const splitId = customId.split('-');

        if(splitId[0] === 'furrygame'){
            let furry = await getFurry(splitId[2])
            let msg = interaction.message;
            let oldEmbed = msg.embeds[0];
            if(furry.action === splitId[1]){

                const embed = new EmbedBuilder()
                    .setTitle(`Aww... they got what they were looking for!`)
                    .setDescription(`${member} satisfied the needs of this poor furry! \`+1 cumcoins\` <a:coom:1235063571868680243>`)
                    .setImage(oldEmbed.image.url)
                    .setFooter({text: `This furry was satisfied!\n\Keep eyes out for next one!`})
                    .setColor(oldEmbed.color)

                msg.edit({embeds: [embed], components: []})
                addToGame(member.id, 1)
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`Fuck... they left angry..`)
                    .setDescription(`${member} tried to \`${splitId[1].toUpperCase()}\` them but it did not go so well!`)
                    .setImage(oldEmbed.image.url)
                    .setFooter({text: `This furry was was not satisfied, let's hope better luck next time!`})
                    .setColor(oldEmbed.color)

                msg.edit({embeds: [embed], components: []})
            }

            changeFurryState(false);
            await interaction.reply({content: `You tried to \`${splitId[1].toUpperCase()}\` the furry!`, ephemeral: true})

        } else return;

    }
})

module.exports = {
    sendFurry,
    activeFurry,
    fiftyPercentChance,
    addToGame
}