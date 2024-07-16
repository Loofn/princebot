const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js");
const openAI = require('openai');
const tiktoken = require('@dqbd/tiktoken');
const { pricing } = require("../../events/ai");
const { getDominantColorFromURL } = require("../../function/utils");
const encoder = tiktoken.get_encoding('cl100k_base');

module.exports = {
    name: 'imagegen',
    description: 'Generate image with AI.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'prompt',
            description: 'Describe what you want to create',
            type: 3,
            required: true
        },
        {
            name: 'hidden',
            description: 'Whether you want the image to be generated hidden, only for you',
            type: 5,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        if(member.roles.cache.get('1231405230906671185') || member.roles.cache.get('1231405690715770941')){

            const hiddenChoice = options.getBoolean('hidden');

            await interaction.deferReply({ephemeral: hiddenChoice})
            const openai = new openAI.OpenAI({ apiKey: process.env.OPENAIapiKey });
            const prompt = options.getString('prompt');
            const userColor = await getDominantColorFromURL(member.displayAvatarURL({extension: 'png'}))

            openai.images.generate({
                prompt: prompt,
                n: 4,
                size: '1024x1024'
            }).then(async (response) => {

                try {
                    const data = response.data;

                    const embeds = [
                        new EmbedBuilder()
                            .setColor(userColor)
                            .setAuthor({
                                name: prompt.length > 256 ? prompt.substring(0, 253) + "..." : prompt,
                                iconURL: member.displayAvatarURL()
                            })
                            .setImage(data[0].url)
                            .setFooter({
                                text: `This image costs ${pricing('dall.e', 4, '1024x1024')} out of Lofn's pocket T_T`,
                                iconURL: client.user.displayAvatarURL()
                            })
                    ];

                    const buttons = [
                        new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel("Image 1")
                            .setURL(data[0].url)
                    ];

                    for (let i = 0; i < 3; i++) {
                        const embed = new EmbedBuilder()
                            .setImage(data[i + 1].url)

                        const button = new ButtonBuilder()
                            .setStyle(ButtonStyle.Link)
                            .setLabel(`Image ${i + 2}`)
                            .setURL(data[i + 1].url)

                        embeds.push(embed);
                        buttons.push(button)
                        
                    }

                    const row = new ActionRowBuilder()
                        .addComponents(buttons);

                    await interaction.editReply({
                        embeds: embeds,
                        components: [row]
                    })
                } catch (error){
                    console.error("Error generating AI image:", error);
                }
            })

        } else {
            const button = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://www.patreon.com/lofnarts")
                    .setLabel("Subscribe on patreon")

            const row = new ActionRowBuilder()
                .setComponents(button)

            const embed = new EmbedBuilder()
                .setTitle(`No patreon subscription...`)
                .setDescription(`You are **NOT** <@&1231405690715770941>, only patrons can generate images with Mutt's AI...`)
                .setImage('https://gifdb.com/images/high/furry-being-really-nervous-alfz4v3437gdq534.gif')
                .setColor("NotQuiteBlack")

            await interaction.reply({embeds: [embed], components: [row]})
        }

    }
}