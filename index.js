require('dotenv').config();
require('events').EventEmitter.prototype._maxListeners = 100;
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const { setupKofiWebhook } = require('./events/kofiWebhook');
const { setupPaypalWebhook } = require('./events/paypalWebhook');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildScheduledEvents,
    ],
    partials: [Partials.Channel, Partials.Message, Partials.User, Partials.GuildMember, Partials.Reaction, Partials.ThreadMember]
});

// Setup Express server for webhooks
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Start the webhook server
const PORT = process.env.WEBHOOK_PORT || 3000;
app.listen(PORT, () => {
    console.log(`Webhook server running on port ${PORT}`);
});

client.commands = new Collection();
client.aliases = new Collection();
client.slashCommands = new Collection();
client.buttons = new Collection();

module.exports = client;

fs.readdirSync('./handlers').forEach((handler) => {
    require(`./handlers/${handler}`)(client)
});

// Setup Ko-Fi and PayPal webhooks after client is ready
client.once('ready', () => {
    setupKofiWebhook(app, client);
    setupPaypalWebhook(app, client);
    console.log('Ko-Fi and PayPal webhooks setup complete');
});

client.login(process.env.TOKEN);