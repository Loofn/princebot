const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const con = require('../../function/db');
const moment = require('moment');
const { isVerified, isAdmin } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const { getWebhook, updateGagged } = require("../../events/gagMsg");

const blacklistUsers = ['102756256556519424']

module.exports = {
    name: 'gag',
    description: 'Gag user',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: `User you want to gag`,
            type: 6,
            required: true
        },
        {
            name: 'time',
            description: `How long in minutes, should the user be gagged`,
            type: 4
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        let gagUser = options.getUser('user');
        let time = options.getInteger('time') ? options.getInteger('time') : 300;
        if(await isVerified(member.id) || await isAdmin(member.id)){
            if(await isGagged(gagUser.id)){
                const embed = new EmbedBuilder()
                    .setTitle(`Oh no....`)
                    .setDescription(`Looks like ${gagUser} is gagged already...! <:Catto_OwO:1236763355872624722>`)
                    .setColor("Red")
                
                return await interaction.reply({embeds: [embed]});
            }

            if(blacklistUsers.includes(gagUser.id)){
                let sql = `INSERT INTO user_gag VALUES (?, ?, ?)`
                let date = moment().add(time, 'seconds').format("YYYY-MM-DD HH:mm:ss");
                con.query(sql, [member.id, member.id, date])
                const embed = new EmbedBuilder()
                    .setTitle(`Oh... you tried to gag them?`)
                    .setColor("NotQuiteBlack")
                    .setImage(`https://d.furaffinity.net/art/dfox789/1490831095/1490831095.dfox789_1486785623.smokethetyphlosion_output_fbyesc.gif`)
                    .setDescription(`Jokes on you... you can't gag ${gagUser}, so for that you are gagged for ${moment(date).fromNow(true)} <:Catto_UvU:1236762320248766484>`)

                updateGagged()
                return await interaction.reply({embeds: [embed]});
            }
            time = await getTime(member.id, time)
            await getWebhook(channelId);

            let sql = `INSERT INTO user_gag VALUES (?, ?, ?)`
            let date = moment().add(time, 'seconds').format("YYYY-MM-DD HH:mm:ss");
            con.query(sql, [gagUser.id, member.id, date])

            const gagged = new EmbedBuilder()
                .setTitle(`User gagged!`)
                .setDescription(`${gagUser} has been gagged by ${member}, ohhh no.... <:Catto_OwO:1236763355872624722>\nThey are gagged for **${moment(date).fromNow(true)}**`)
                .setColor("NotQuiteBlack")
                .setImage(`https://d.furaffinity.net/art/dfox789/1490831095/1490831095.dfox789_1486785623.smokethetyphlosion_output_fbyesc.gif`)

            updateGagged()
            await interaction.reply({embeds: [gagged]})
        } else {
            await interaction.reply({embeds: [mustVerify]})
        }
        
    }
}

async function isGagged(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM user_gag WHERE user='${userId}'`, function (err, res){
            console.log(res.length)
            if(res.length === 0){
                resolve(false)
            } else {
                resolve(true)
            }
        })
    })
}

async function getTime(userId, requestTime){
    return new Promise(async (resolve, reject) => {
        if(await isAdmin(userId)){
            resolve(requestTime)
        } else {
            resolve(60)
        }
    })
}