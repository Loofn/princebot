const { getPoints } = require("../../function/furrygame");

module.exports = {
    name: 'profile',
    description: 'View your profile',
    cooldown: 3000,
    type: 1, // ChatInput
    options: [
        {
            name: 'user',
            description: 'User to view the profile of (default: yourself)',
            type: 6, // User
            required: false
        }
    ],

    run: async (client, interaction) => {
        const user = interaction.options.getUser('user') || interaction.user;
        const userId = user.id;

        const profileData = {
            points: 0, // Default points
            xp: 0, // Default XP
            levels: 0, // Default levels
        };

        getPoints(userId).then(points => {
            if(points > 1000000){
                points = points.toFixed(1) + "M";
            } else if(points > 1000){
                points = points.toFixed(1) + "k";
            }
            profileData.points = points; 
        }).catch(err => {
            console.error(`Error fetching points for user ${userId}:`, err);
        });

        // Create an embed to display the profile
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Profile`)
            .setColor(user.roles.cache.highest.color || '#7289DA')
            .addFields(
                { name: `Cumcoins`, value: `<a:Lewd_Coom:1235063571868680243> ${profileData.points} `, inline: true },
            )
            .setThumbnail(user.displayAvatarURL());

        await interaction.reply({ embeds: [embed] });
    }
}