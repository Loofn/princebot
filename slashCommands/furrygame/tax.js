const { ApplicationCommandType, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../../function/roles");
const { noPerms } = require("../../data/embeds");
const { getPoints, removePoints, setPoints } = require("../../function/furrygame");

module.exports = {
    name: 'tax',
    description: 'Tax some cummies away from user',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'user',
            description: 'User who the tax officer will go to',
            type: 6,
            required: true
        },
        {
            name: 'amount',
            description: 'Amount of cummies that should be removed',
            type: 4,
            required: true
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        const targetUser = options.getUser('user');
        const amount = options.getInteger('amount');

        if(await isAdmin(member.id)){
            let targetBalance = await getPoints(targetUser.id)
            if(targetBalance <= 0){
                setPoints(targetUser.id, 0);
                const embed = new EmbedBuilder()
                    .setDescription(`Unfortunately balance of ${targetUser} is <a:Lewd_Coom:1235063571868680243> \`${targetBalance} cumcoins\`.\n\n*Negative values will be fixed to 0.*`)
                return interaction.reply({embeds: [embed], ephemeral: true})
            } else {

                removePoints(targetUser.id, amount);
                const embed = new EmbedBuilder()
                    .setTitle(`Tax officer has knocked on door of ${targetUser.username}`)
                    .setDescription(`Hello there ${targetUser}, unfortunately we have noticed you have not paid your taxes. So we have collected \`-${amount} cumcoins\` <a:Lewd_Coom:1235063571868680243> from you.`)
                    .setColor("Blurple")
                    .setFooter({text: `Taxes has been collected by ${member.displayName}`, iconURL: member.displayAvatarURL()})
                    .setThumbnail("https://static1.e621.net/data/13/f9/13f96a2a344f2a3f8d040af95ad99531.png");

                await interaction.reply({embeds: [embed], content: `${targetUser}`})
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }
}