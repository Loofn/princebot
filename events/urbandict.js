const { EmbedBuilder} = require('discord.js');
const fetch = require("node-fetch");
const client = require('..');
client.on('messageCreate', async message => {

    if(message.author.bot) return;

    const match = message.content.toLowerCase().match(/^mutt what is the meaning of (.+)/i);
    if(!match) return;

    const query = encodeURIComponent(match[1]);
    const url = `https://unofficialurbandictionaryapi.com/api/search?term=${query}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.data && data.data.length > 0) {
            const entry = data.data[0];
            const definition = entry.meaning;
            const example = entry.example ? `\n\n*${entry.example}*` : "";

            await message.reply(`***${entry.word}***\n${definition}${example}`)
        } else {
            await message.reply(`I am sorry but I have no idea...`)
        }
    } catch (err) {
        console.error(err);
    }

})