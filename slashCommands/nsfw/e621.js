const fetch = require("node-fetch");
const { isVerified, isAdmin } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder } = require("discord.js");
const moment = require('moment');
const { getDominantColorFromURL, shortenString } = require("../../function/utils");

module.exports = {
    name: 'e621',
    description: 'Search pictures from E621 site.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'tags',
            description: `Search tags (space between them)`,
            type: 3,
            required: true
        },
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;
        const username = "lofnarts"
        const apikey = process.env.E621API;
        const tags = encodeURIComponent(options.getString("tags"));
        const url = `https://e621.net/posts.json?tags=${tags}`
        if(await isVerified(member.id) || await isAdmin(member.id)){
            await interaction.deferReply()
            const response = await fetch(url, {
                headers: { "Authorization": "Basic " + btoa(`${username}:${apikey}`),
                "User-Agent": `Muttbot (${username})` }
            });
        

            const json = await response.json();
            
            if(json.posts.length === 0){
                const embed = new EmbedBuilder()
                    .setTitle(`Oh no....`)
                    .setThumbnail(`https://media.tenor.com/ZhqTExCaIEEAAAAi/furry-cry.gif`)
                    .setDescription(`No images or results found with tags: \`${options.getString("tags")}\``)
                    .setColor("Red");
                return await interaction.editReply({embeds: [embed]});
            }
            const random = Math.floor(Math.random() * json.posts.length);
            const color = await getDominantColorFromURL(json.posts[random].file.url);
            //console.log(json.posts[random])
            const attachment = new AttachmentBuilder(json.posts[random].file.url)
            const embed = new EmbedBuilder()
                .setTitle(`E621 images`)
                .setColor(color)
                .setAuthor({name: `Author: ${json.posts[random].tags.artist[0]}`, url: `${json.posts[random].sources[0]}`})
                .setDescription(`*${json.posts[random].description !== '' ? shortenString(json.posts[random].description, 2000) : "No description"}*\n:heart: \`Likes: ${json.posts[random].fav_count}\`\n:bookmark: \`Tags: ${json.posts[random].tags.general.slice(0, 10).join(", ")}\``)

            await interaction.editReply({embeds: [embed], files: [attachment]});
        } else {
            await interaction.editReply({embeds: [mustVerify], ephemeral: true})
        }
    }
}