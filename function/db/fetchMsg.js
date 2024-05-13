const client = require("../..");

async function fetchMessage(msgId, channelId, remove = false){

    const guild = client.guilds.cache.get('1231299437519966269')
    const channel = guild.channels.cache.get(channelId)
    const message = await channel.messages.fetch(msgId, {force: true, cache: true})

    if(remove){
        message.delete()
    }

    return message;
}

module.exports = fetchMessage;