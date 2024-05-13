const { EmbedBuilder} = require('discord.js');
const client = require('..');
const con = require('../function/db')
client.on('messageCreate', async message => {

    if(message.author.bot) return;
    if(fahrenheit(message.content)){
        var regex = /\b\d+\s*fahrenheit\b/i;
        var match = message.content.match(regex);
        var number = parseFloat(match[0])
        message.reply(`That is **${convertF(number)}°C** for you non-americans <:blush_blep:1236762311910494259>`)
    }

    if(celcius(message.content)){
        var regex = /\b\d+\s*celcius\b/i;
        var match = message.content.match(regex);
        var number = parseFloat(match[0])
        message.reply(`That is **${convertC(number)}°F** for you patriotic gun-heads <:neko_annoyed:1236763357638426727>`)
    }
})

function fahrenheit(str){ 
    var regex = /\b\d+\s*fahrenheit\b/i;
    return regex.test(str);
}

function celcius(str){ 
    var regex = /\b\d+\s*celcius\b/i;
    return regex.test(str);
}

function convertF(num){
    return parseInt((num - 32) * 5 / 9);
}

function convertC(num){
    return parseInt((num * 9 / 5) + 32);

}