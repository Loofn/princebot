const { EmbedBuilder} = require('discord.js');
const client = require('..');
const con = require('../function/db')
client.on('messageCreate', async message => {

    if(message.channelId === '1237471877388304424'){
        if(message.author.bot) return;
        const reset = new EmbedBuilder()
            .setTitle(`FUCK, YOU FUCKED IT UP!`)
            .setThumbnail('https://media.tenor.com/RDkdaZnAL8YAAAAM/furry-sad.gif')
            .setDescription(`${message.author} messed it up... now we need to start again from \`0\`.`)
            .setFooter({text: `User can only say one number at a time, and it must be number higher than before`})
            .setColor("Blurple")

        if(isNaN(message.content)) return message.delete();
        if(await getCurrentNumber(parseInt(message.content))){
            const lastUser = await getLastUser();

            if(lastUser !== message.author.id){
                message.react('<a:nutbutton:1236762071601909911>')
                increaseNumber(message.author.id)
                const record = await updateRecord(parseInt(message.content))
                message.channel.setTopic(`Current number is ${message.content}. The record we have reached is ${record}!! :star:`)
            } else {
                message.react('❌')
                resetNumber()
                message.reply({embeds: [reset]})
            }
        } else {
            message.react('❌')
            resetNumber()
            message.reply({embeds: [reset]})
        }
    }
});


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