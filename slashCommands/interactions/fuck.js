const { ApplicationCommandType } = require("discord.js");

module.exports = {
    name: 'fuck',
    description: 'Fuck someone, and be gay about it, and furry..',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Target of fuck',
            type: 6,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        if(await isVerified(member.id)){
            const notVerified = new EmbedBuilder()
                .setTitle(`You're not verified`)
                .setDescription(`<a:AAAAHHHH:689609874430099528> You need to verify yourself if you want to use this command, you nasty!!`)
                .setColor("Red");

            return await interaction.reply({embeds: [notVerified], ephemeral: true});
        }
        
        
        const user = options.getUser('user');
        const imgs = ["https://sexdicted.com/wp-content/uploads/2020/05/gay_furry_-5882.gif", "https://us.rule34.xxx//images/5493/65387c708e89d692c5da8b787b1198a6.gif", "https://us.rule34.xxx//images/4025/d5898a8adb0c0321cb8bb01c692d1e50.gif", "https://us.rule34.xxx//images/4080/404cbc8623bb8d8d4f27dac407dad0d5.gif", "https://us.rule34.xxx//images/2046/619dec76b52068b0d4f1f8e1a5ca0e6b.gif"]
        const random = imgs[Math.floor(Math.random() * imgs.length)]
        interaction.reply({content: `${member} fucks the brains out of ${user}, *ahhh~*`, files: [random]});
    }
}