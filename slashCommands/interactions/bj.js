const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const {isVerified} = require('../../function/roles');

module.exports = {
    name: 'blowjob',
    description: 'Give a blowjob to someone, and be gay about it, and furry...',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'Target of blowjob',
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
        const imgs = ["https://us.rule34.xxx//images/6847/89c8fe3c908220a5c032396cbb1d0368.gif", "https://us.rule34.xxx//images/3258/da268280495b2570cb942dc365197f5f.gif", "https://us.rule34.xxx//images/6847/071d7614d7da52696259540f6d446bdf.gif", "https://static1.e621.net/data/ff/89/ff89dcce46fc3ae11d61237ab4bfeb01.gif", "https://static18.hentai-img.com/upload/20220622/917/938148/174.gif"]
        const random = imgs[Math.floor(Math.random() * imgs.length)]
        interaction.reply({content: `${member} sucks off ${user}, *growl~*`, files: [random]});
    }
}