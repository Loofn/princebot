const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder} = require('discord.js');
const client = require('..');
const openAI = require('openai');
const { getDominantColorFromURL } = require('../function/utils');
const tiktoken = require('@dqbd/tiktoken');
const encoder = tiktoken.get_encoding('cl100k_base');

client.on('messageCreate', async message => {

    if(message.author.bot) return;
    if(message.channelId !== '1262837525219770620') return;

    const hardCodePrompt = `Please respond in a conversational and natural manner, if you were having a conversation with a person. You are an Chat GPT AI bot called Mutt developed by Lofn in Javascript with Discord.js. Provide different stuff to assist in answering the task or question. Use appropriate Discord markdown formatting depend on code language to clearly distinguish syntax in your responses if you have to respond any code. sometimes use emojis and shorthand like "np", "lol", "idk", and "nvm" depend on user messages. You have many interests and you are slightly shy.`
    const userColor = await getDominantColorFromURL(message.author.displayAvatarURL({extension: 'png'}))
    const reactions = ["<:Catto_Cummies:1236761878365999115>", "<:Catto_Gesp:1236763359215620257>", "<:Catto_OwO:1236763355872624722>", "<:Catto_Sadge:1236763357638426727>"]
    const question = message.cleanContent;
    if(message.mentions.has(client.user) || message.cleanContent.toLowerCase().startsWith("mutt")){
        try {
            const openai = new openAI.OpenAI({ apiKey: process.env.OPENAIapiKey });

            const messages = [
                {
                    "role": "system",
                    "content": hardCodePrompt
                },
                {
                    "role": "user",
                    "content": message.cleanContent
                }
            ]

            openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: tokenizer('gpt-3.5', messages).maxTokens,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0.0,
                presence_penalty: 0.0
            }).then(async (response) => {

                await message.react(reactions[Math.floor(Math.random() * reactions.length)])
                const answer = response.choices[0].message.content;
                const usage = response.usage;
                if (answer.length <= 4096) {

                    const embed = new EmbedBuilder()
                        .setColor(userColor)
                        .setAuthor({
                            name: question.length > 256 ? question.substring(0, 253) + "..." : question,
                            iconURL: message.author.displayAvatarURL()
                        })
                        .setDescription(answer)
                        .setFooter({
                            text: `This response costs ${pricing('gpt-3.5', usage.total_tokens)} out of Lofn's pocket T_T`,
                            iconURL: client.user.displayAvatarURL()
                        });

                    await message.reply({ embeds: [embed] });

                } else {

                    const attachment = new AttachmentBuilder(
                        Buffer.from(`${question}\n\n${answer}`, 'utf-8'),
                        { name: 'response.txt' }
                    );

                    await message.reply({ files: [attachment] });

                };

        
            })

            
        } catch (error) {
            console.error('AI Error:', error);
            await message.react('<:Catto_Fail:1236776960152043621>')
            await message.reply({content: `Something went wrong...`})
        }
    }

})

function tokenizer(model, prompt) {

    let tokensPerMessage;
    let nameAdjustment;

    if (model === 'gpt-4') {
        tokensPerMessage = 3;
        nameAdjustment = 1;
    } else {
        tokensPerMessage = 4;
        nameAdjustment = -1;
    }

    const messagesTokenCounts = prompt.map((messages) => {

        const propertyTokenCounts = Object.entries(messages).map(([key, value]) => {
            const numTokens = encoder.encode(value).length;
            const adjustment = (key === 'name') ? nameAdjustment : 0;
            return numTokens + adjustment;
        });

        return propertyTokenCounts.reduce((a, b) => a + b, tokensPerMessage);

    });

    const messagesTokens = messagesTokenCounts.reduce((a, b) => a + b, 0) + 2;

    let maxTokens;
    if (model === 'gpt-3.5') maxTokens = 4097
    else if (model === 'gpt-4') maxTokens = 8192

    return {
        tokens: messagesTokens,
        maxTokens: maxTokens - messagesTokens
    };

}

function pricing(model, number, resolution) {

    let cost = 0.0;
    if (model === 'dall.e') {
        let pricing = {
            '1024x1024': 0.020,
            '512x512': 0.018,
            '256x256': 0.016
        };
        cost = number * pricing[resolution];
    }
    else if (model === 'gpt-3.5') cost = number * (0.002 / 1000);
    else if (model === 'gpt-4') cost = number * (0.060 / 1000);

    return `$${Number(cost.toFixed(4))}`;
}

async function sendInformation(){

    const guild = client.guilds.cache.get('1231299437519966269');
    const channel = guild.channels.cache.get('1262837525219770620');

    const fetchMessages = await channel.messages.fetch({limit: 1});
    const latestMessage = fetchMessages.first();

    // Message is by bot and last message
    if(latestMessage && latestMessage.author.bot) {
        const embeds = latestMessage.embeds;
        if(embeds.length > 0){
            const title = embeds[0].title;

            if(!title || !title.startsWith("How to use Mutt AI?")){

                const button = new ButtonBuilder()
                    .setStyle(ButtonStyle.Link)
                    .setURL("https://www.patreon.com/lofnarts")
                    .setLabel("Subscribe on patreon")

                const row = new ActionRowBuilder()
                    .setComponents(button)
                
                const embed = new EmbedBuilder()
                    .setImage('https://gifdb.com/images/high/furry-being-really-nervous-alfz4v3437gdq534.gif')
                    .setColor("NotQuiteBlack")
                    .setTitle(`How to use Mutt AI?`)
                    .setDescription(`Helloo furry boy!\n\nIf you are wondering ***"How do I send message here?"***, let me tell you. You must have either <@&1231405690715770941> or <@&1233470240646758431> role to send messages.\n\nYou can become patreon [here!](https://www.patreon.com/lofnarts) or simply boost the server to gain access.\n\nWhen talking to me here, you must ping/tag me in your message.`)
            
                channel.send({embeds: [embed], components: [row]})
            }
        }
    }
}

module.exports = {
    tokenizer,
    pricing,
    sendInformation
}