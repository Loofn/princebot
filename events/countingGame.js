const { EmbedBuilder, ButtonStyle} = require('discord.js');
const client = require('..');
const con = require('../function/db');
const { ButtonBuilder } = require('discord.js');
const { ActionRowBuilder } = require('discord.js');

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
                    if (currentCount % 50 === 0) {
                        // Milestone reached
                        rewardParticipants(message.channel);
                    }
                } else {
                    message.react('❌')
                    resetNumber()
                    participants.clear()
                    message.reply({embeds: [reset], components: [row]})
                }
            } else {
                message.react('❌')
                resetNumber()
                participants.clear()
                message.reply({embeds: [reset], components: [row]})
            }
        }
        
    }
});

function rewardParticipants(){
    console.log("TODO: make reward participants")
}


/**
 * 
 * @param {Integer} num 
 * @returns {Promise<Boolean>}
 */
async function getCurrentNumber(num){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM counting`, function (err, res){
            if(err){
                reject(err)
            }
            let nextNumber = res[0].number + 1;
            resolve(nextNumber === num);
        })
    })
}

async function checkNumber(num){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM counting`, function (err, res){
            if(err) {
                reject(err)
            }
            resolve(res[0].number)
        })
    })
}

/**
 * 
 * @returns {Promise<String>} Returns user ID of the last user
 */
async function getLastUser(){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM counting`, function (err, res){
            if(err){
                reject(err)
            }
            resolve(res[0].user);
        })
    })
}

/**
 * 
 * @param {String} user 
 */
function increaseNumber(user){
    con.query(`UPDATE counting SET number=number+1, user='${user}'`);
}

function fixNumber(num){
    con.query(`UPDATE counting SET number='${num}', user=NULL`)
}

/**
 * 
 * @param {Integer} num 
 */
async function updateRecord(num){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM counting`, function (err, res){
            if(res[0].record < num){
                con.query(`UPDATE counting SET record='${num}'`)
                resolve(num);
            } else {
                resolve(res[0].record)
            }
        })
    })
    
}

/**
 * 
 * @param {String} user 
 */
function resetNumber(){
    con.query(`UPDATE counting SET number=0, user=NULL`);
}

module.exports = {
    fixNumber,
    resetNumber
}