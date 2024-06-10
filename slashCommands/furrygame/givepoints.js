const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { addToGame } = require("../../events/petfurry");
const { getPoints, removePoints, givePoints } = require("../../function/furrygame");

module.exports = {
    name: 'give',
    description: 'Give points to another user',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'who do you want to give points to',
            required: true,
            type: 6
        },
        {
            name: 'amount',
            description: 'how much do you want to give to user?',
            required: true,
            type: 4
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        await addToGame(member.id);

        let amount = options.getInteger('amount');
        let userToGive = options.getUser('user');
        let balance = await getPoints(member.id)

        await addToGame(userToGive.id);

        if(amount <= balance){
            removePoints(member.id, amount);
            givePoints(userToGive, amount)

            const embed = new EmbedBuilder()
                .setTitle(`Points given away`)
                .setDescription(`${member} just gave \`${amount} cumcoins\` to ${userToGive}!`)
                .setThumbnail('https://static1.e621.net/data/sample/81/19/811998584bb06c7b5ac501d6b6e9d747.jpg')
                .setColor('DarkBlue')

            await interaction.reply({embeds: [embed], content: `${userToGive}`})
                
        } else {
            const embed = new EmbedBuilder()
                .setDescription(`You don't have enough cumcoins to give! You only have \`${balance} cumcoins\``)
                .setColor("Red")
            await interaction.reply({embeds: [embed]})
        }

    }
}