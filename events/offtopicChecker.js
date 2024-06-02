const { EmbedBuilder} = require('discord.js');
const client = require('..');
const con = require('../function/db')

const messageCount = new Map();
client.on('messageCreate', async message => {

    
    if(message.author.bot) return;
    if(message.channelId === '1235252848627814440') return;
    if(message.channel.parentId === '1233560718281015327'){

        if(message.attachments.size === 0){
            if(messageCount.get(message.channelId) === 5){
                message.delete()
                const embed = new EmbedBuilder()
                    .setTitle(`Dude... stop...`)
                    .setDescription(`To prevent pushing images and videos up with useless messages, please utilise <#1235252848627814440> channel!`)
                    .setThumbnail('https://i.pinimg.com/originals/99/98/7a/99987ac3b2965f9bb910a2fda8d9baf4.gif')
                    .setColor("Red");

                return message.channel.send({content: `${message.author}`, embeds: [embed]}).then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(console.error())
                    }, 15000);
                })
            }
            const channelId = message.channel.id;
            const count = messageCount.get(channelId) || 0;
            messageCount.set(channelId, count + 1);
            console.log("YES", messageCount.get(channelId))
            if(count + 1 >= 5){
                message.delete()
                const embed = new EmbedBuilder()
                    .setTitle(`Dude... stop...`)
                    .setDescription(`To prevent pushing images and videos up with useless messages, please utilise <#1235252848627814440> channel!`)
                    .setThumbnail('https://i.pinimg.com/originals/99/98/7a/99987ac3b2965f9bb910a2fda8d9baf4.gif')
                    .setColor("Red");

                message.channel.send({content: `${message.author}`, embeds: [embed]}).then(msg => {
                    setTimeout(() => {
                        msg.delete().catch(console.error())
                    }, 60000);
                })
            }
        } else {
            messageCount.delete(message.channel.id);
        }
    }
})