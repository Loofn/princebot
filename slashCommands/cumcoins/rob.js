const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const con = require('../../function/db')

const moment = require('moment');
const { getRandomInteger } = require("../../function/utils");
const { sendFurry, addToGame } = require('../../events/petfurry');
const { removePoints, givePoints, getPoints } = require("../../function/furrygame");
const { isProtectedFromRobbery } = require("../../function/itemUtils");
const itemSystem = require('../../function/itemSystem');
const queryAsync = require('../../function/queryAsync');

module.exports = {
    name: 'rob',
    description: 'Rob some cumcoins from another user',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User to rob',
            type: 6,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        const targetUser = options.getUser('user');

        await addToGame(member.id);

        if(await hasSelfCooldown(member.id)){
            const embed = new EmbedBuilder()
                .setTitle(`Uh no...`)
                .setColor("Red")
                .setDescription(`<:Catto_Gesp:1236763359215620257> You are too tired to rob anyone yet...!`)

            return await interaction.reply({embeds: [embed]})
        }

        if(await isProtectedFromRobbery(targetUser.id)){
            // Check if robber has a lockpick
            const hasLockpick = await queryAsync(con, 
                'SELECT quantity FROM user_inventories WHERE user_id = ? AND item_id = ? AND quantity > 0', 
                [member.id, 'lockpick']
            );

            if (hasLockpick.length > 0) {
                // Use lockpick to break target's protection
                const breakResult = await itemSystem.removeProtection(targetUser.id, 'robbery');
                
                // Consume the lockpick
                await queryAsync(con, `
                    UPDATE user_inventories 
                    SET quantity = quantity - 1 
                    WHERE user_id = ? AND item_id = ? AND quantity > 0
                `, [member.id, 'lockpick']);

                // Remove lockpick entry if quantity reaches 0
                await queryAsync(con, `
                    DELETE FROM user_inventories 
                    WHERE user_id = ? AND item_id = ? AND quantity <= 0
                `, [member.id, 'lockpick']);

                if (breakResult) {
                    const embed = new EmbedBuilder()
                        .setTitle(`🗝️ Lock Picked!`)
                        .setColor("Orange")
                        .setDescription(`You used a **Lockpick** to break ${targetUser}'s padlock protection! Your lockpick broke in the process. Try robbing again now!`)

                    return await interaction.reply({embeds: [embed]})
                } else {
                    const embed = new EmbedBuilder()
                        .setTitle(`🗝️ Lockpick Wasted!`)
                        .setColor("Red")
                        .setDescription(`You used a **Lockpick** but ${targetUser} didn't have any active protection. Your lockpick broke anyway!`)

                    return await interaction.reply({embeds: [embed]})
                }
            } else {
                const embed = new EmbedBuilder()
                    .setTitle(`Uh no...`)
                    .setColor("Red")
                    .setDescription(`<:Catto_Gesp:1236763359215620257> You cannot rob ${targetUser}, they are protected from robbery! You need a **Lockpick** to break their protection.`)
                return await interaction.reply({embeds: [embed]})
            }
        }

        if(await hasCooldown(targetUser.id)){
            const embed = new EmbedBuilder()
                .setTitle(`Uh no...`)
                .setColor("Red")
                .setDescription(`<:Catto_Gesp:1236763359215620257> Could not rob ${targetUser}, they are too on alert currently!`)

            return await interaction.reply({embeds: [embed]})
        }

        if(member.id === targetUser.id){
            const memberCoins = await getPoints(member.id);
            const amountToRob = getRandomInteger(Math.round(memberCoins/3))
            const embed = new EmbedBuilder()
                .setTitle(`What the fuck?!`)
                .setColor("Red")
                .setDescription(`You decided to donate \`${amountToRob} cumcoins\` <a:Lewd_Coom:1235063571868680243> to <@102756256556519424> <a:Catto_Tongue:1235220627237900400>`)

            removePoints(member.id, amountToRob)
            givePoints(targetUser.id, amountToRob)
            addCooldown(targetUser.id)
            addCooldown(member.id)
            addSelfCooldown(member.id)

            return await interaction.reply({embeds: [embed]})
        }
        
        else {

            const targetPoints = await getPoints(targetUser.id);
            const amountToRob = getRandomInteger(Math.round(targetPoints/2))

            if(targetPoints === 0){
                const embed = new EmbedBuilder()
                    .setTitle(`Uh no...`)
                    .setColor("Red")
                    .setDescription(`<:Catto_Gesp:1236763359215620257> Could not rob ${targetUser}, they are too broke...!`)

                return await interaction.reply({embeds: [embed]})
            }

            removePoints(targetUser.id, amountToRob)
            givePoints(member.id, amountToRob)
            addCooldown(targetUser.id)
            addSelfCooldown(member.id)

            const embed = new EmbedBuilder()
                .setTitle(`Goddammit! Woooooo`)
                .setDescription(`${member} successfully robbed ${targetUser} for \`${amountToRob} cumcoins\` <a:Lewd_Coom:1235063571868680243>`)
                .setColor("Gold")
                .setThumbnail('https://rule34.xxx//samples/6930/sample_d25117c565cfd52fe1ab7b4cb1d700367508b47c.jpg')

            await interaction.reply({content: `${targetUser}`, embeds: [embed]});
        }

        
    }
}



function addCooldown(userId){
    const cooldown = moment().add(48, 'hours').format("YYYY-MM-DD HH:mm:ss")
    con.query(`INSERT INTO furry_rob VALUES ('${userId}', '${cooldown}')`)
}

async function hasCooldown(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM furry_rob WHERE user='${userId}'`, function (err, res){
            if(res.length === 0){
                resolve(false)
            } else {
                if(moment().isAfter(res[0].expire)){
                    con.query(`DELETE FROM furry_rob WHERE user='${userId}'`);
                    resolve(false)
                } else {
                    resolve(true)
                }
            }
        })
    })
}

function addSelfCooldown(userId){
    const cooldown = moment().add(6, 'hours').format("YYYY-MM-DD HH:mm:ss")
    con.query(`INSERT INTO furry_robself VALUES ('${userId}', '${cooldown}')`)
}

async function hasSelfCooldown(userId){
    return new Promise((resolve, reject) => {
        con.query(`SELECT * FROM furry_robself WHERE user='${userId}'`, function (err, res){
            if(res.length === 0){
                resolve(false)
            } else {
                if(moment().isAfter(res[0].expire)){
                    con.query(`DELETE FROM furry_robself WHERE user='${userId}'`);
                    resolve(false)
                } else {
                    resolve(true)
                }
            }
        })
    })
}