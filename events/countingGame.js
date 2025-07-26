const { EmbedBuilder, ButtonStyle} = require('discord.js');
const client = require('..');
const con = require('../function/db');
const queryAsync = require('../function/queryAsync');
const { ButtonBuilder } = require('discord.js');
const { ActionRowBuilder } = require('discord.js');
const { givePoints } = require('../function/furrygame');

const participants = new Set();

client.on('messageCreate', async message => {

    if(message.channelId === '1237471877388304424'){
        if(message.author.bot) return;

        let currentGameNumber = await checkNumber()
        const saveButton = new ButtonBuilder()
            .setCustomId(`saveCountingStreak-${currentGameNumber}`)
            .setLabel(`Save the streak (-${currentGameNumber} cumcoins)`)
            .setEmoji('🙏')
            .setStyle(ButtonStyle.Success)

        const row = new ActionRowBuilder()
            .setComponents(saveButton)

        const reset = new EmbedBuilder()
            .setTitle(`FUCK, YOU FUCKED IT UP!`)
            .setThumbnail('https://media.tenor.com/RDkdaZnAL8YAAAAM/furry-sad.gif')
            .setDescription(`${message.author} messed it up... now we need to start again from \`0\`.`)
            .setFooter({text: `User can only say one number at a time, and it must be number higher than before`})
            .setColor("Blurple")

        if(message.content.startsWith("fix!") && message.author.id === '102756256556519424'){
            let number = parseInt(message.content.split("!")[1]);
            fixNumber(number);
            message.react('🔨')
            const fixed = new EmbedBuilder()
                .setTitle(`Lofn stepped in...`)
                .setDescription(`The number game's number was forcefully set to \`${number}\`... now be nice and **continue**!`)
                .setFooter({text: `User can only say one number at a time, and it must be number higher than before`})
                .setColor("Red")
                .setImage('https://media.tenor.com/N8EtjGRm_90AAAAM/vyx-furry.gif')
            return message.reply({embeds: [fixed]})
        } else {
            if(isNaN(message.content)) return message.delete();
            if(await getCurrentNumber(parseInt(message.content))){
                const lastUser = await getLastUser();
    
                if(lastUser !== message.author.id){
                    participants.add(message.author.id)
                    message.react('<a:nutbutton:1236762071601909911>')
                    increaseNumber(message.author.id)
                    const record = await updateRecord(parseInt(message.content))
                    message.channel.setTopic(`Current number is ${message.content}. The record we have reached is ${record}!! :star:`)
                    if (parseInt(message.content) % 50 === 0) {
                        // Milestone reached
                        rewardParticipants(message.channel, parseInt(message.content));
                    }
                } else {
                    message.react('❌')
                    resetNumber()
                    participants.clear()
                    if(currentGameNumber == 0) {
                        message.reply({embeds: [reset]})
                    } else {
                        message.reply({embeds: [reset], components: [row]})
                    }
                    
                }
            } else {
                message.react('❌')
                resetNumber()
                participants.clear()
                if(currentGameNumber == 0) {
                    message.reply({embeds: [reset]})
                } else {
                    message.reply({embeds: [reset], components: [row]})
                }
            }
        }
        
    }
});

function rewardParticipants(channel, number){
    const participantIds = Array.from(participants);

    participantIds.forEach((id) => {
        givePoints(id, 50);
    })

    const usernames = participantIds
        .map((id) => `<@${id}>`)
        .join(', ');

    channel.send(`:tada: Milestone ${number} reached! Participants: ${usernames} have all been rewarded \`50 cumcoins\` <a:Lewd_Coom:1235063571868680243>`);

    participants.clear();

}


/**
 * 
 * @param {Integer} num 
 * @returns {Promise<Boolean>}
 */
async function getCurrentNumber(num){
    try {
        const res = await queryAsync(con, `SELECT * FROM counting`, []);
        let nextNumber = res[0].number + 1;
        return nextNumber === num;
    } catch (err) {
        throw err;
    }
}

async function checkNumber(){
    try {
        const res = await queryAsync(con, `SELECT * FROM counting`, []);
        return res[0].number;
    } catch (err) {
        throw err;
    }
}

/**
 * 
 * @returns {Promise<String>} Returns user ID of the last user
 */
async function getLastUser(){
    try {
        const res = await queryAsync(con, `SELECT * FROM counting`, []);
        return res[0].user;
    } catch (err) {
        throw err;
    }
}

/**
 * 
 * @param {String} user 
 */
async function increaseNumber(user){
    await queryAsync(con, `UPDATE counting SET number=number+1, user=?`, [user]);
}

async function fixNumber(num){
    await queryAsync(con, `UPDATE counting SET number=?, user=NULL`, [num]);
}

/**
 * 
 * @param {Integer} num 
 */
async function updateRecord(num){
    const res = await queryAsync(con, `SELECT * FROM counting`, []);
    if(res[0].record < num){
        await queryAsync(con, `UPDATE counting SET record=?`, [num]);
        return num;
    } else {
        return res[0].record;
    }
}

/**
 * 
 * @param {String} user 
 */
async function resetNumber(){
    await queryAsync(con, `UPDATE counting SET number=0, user=NULL`, []);
}

module.exports = {
    fixNumber,
    resetNumber
}