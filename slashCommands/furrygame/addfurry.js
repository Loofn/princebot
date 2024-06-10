const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const { isImageLink, getDominantColorFromURL } = require('../../function/utils');
const con = require('../../function/db');

module.exports = {
    name: 'addfurry',
    description: 'Add furry to the game',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'imagelink',
            description: 'Link to the image of the furry',
            type: 3,
            required: true
        },
        {
            name: 'action',
            description: 'Which action is required to please the furry',
            type: 3,
            required: true,
            choices: [
                {name: `pet`, value: `pet`},
                {name: `suck`, value: `suck`},
                {name: `fuck`, value: `fuck`},
                {name: `ride`, value: `ride`},
                {name: `lick`, value: `lick`}
            ]
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        const imgString = options.getString('imagelink');
        const actionString = options.getString('action');

        if(await isAdmin(member.id)){
            if(isImageLink(imgString)){

                con.query(`INSERT INTO furries (action, imgurl) VALUES ('${actionString}', '${imgString}')`);
                const hex = await getDominantColorFromURL(imgString) ? await getDominantColorFromURL(imgString) : "Random";
    
                const embedFurry = new EmbedBuilder()
                .setTitle(`New furry added!`)
                .setImage(imgString)
                .setColor(hex);
    
                await interaction.reply({embeds: [embedFurry], ephemeral: true});
            } else {
                await interaction.reply({content: `This is not image link!`, ephemeral: true});
            }
        } else {
            await interaction.reply({ embeds: [noPerms], ephemeral: true });
        }
        
    }
}