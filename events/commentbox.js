const { EmbedBuilder} = require('discord.js');
const client = require('..');
client.on('messageCreate', async message => {

    const blacklistedChannels = ["1259942649968988310"]


    if(message.channel.parentId === '1231627001035620474'){
        if(message.author.bot) return;
        if(message.channel.type !== 0) return;

        if(blacklistedChannels.includes(message.channelId)) return;
        
        message.startThread({
            name: `Comments`,
            rateLimitPerUser: 10
        }).then(thread => {
            if(message.content.toLowerCase().startsWith("patreon:")){

                if(message.channel.id !== '1231633231154253958') return;

                const patreonAd = new EmbedBuilder()
                .setColor("#FFA500")
                .setDescription(`This art is **exclusively** for <@&1231405690715770941>, [become patron](https://www.patreon.com/lofnarts) and go see it in Patreon or at <#1231636531639353464>`)
                thread.send({embeds: [patreonAd]})
            }
        })
    }
})