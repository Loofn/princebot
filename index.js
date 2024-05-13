const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction, Partials.ThreadMember]
});

require('dotenv').config();

client.commands = new Collection();
client.aliases = new Collection();
client.slashCommands = new Collection();
client.buttons = new Collection();

module.exports = client;

fs.readdirSync('./handlers').forEach((handler) => {
    require(`./handlers/${handler}`)(client)
});

client.login(process.env.TOKEN);