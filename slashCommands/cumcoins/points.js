const { ApplicationCommandType, EmbedBuilder } = require('discord.js');

const {isAdmin} = require('../../function/roles');
const { noPerms } = require('../../data/embeds');
const { isImageLink, getDominantColorFromURL } = require('../../function/utils');
const con = require('../../function/db');
const { sendFurry, addToGame } = require('../../events/petfurry');

module.exports = {
    name: 'points',
    description: 'Check your game points',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'check',
            description: 'Check your current points',
            type: 1,
        },
        {
            name: 'redistribute',
            description: 'Redistribute points from left users to all users',
            type: 1,
        },
        {
            name: 'giveall',
            description: 'Give all users a certain amount of points',
            type: 1,
            options: [
                {
                    name: 'amount',
                    description: 'How many points to give to all users?',
                    type: 4,
                    required: true
                }
            ]
        },
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        await addToGame(member.id);

        if(interaction.options.getSubcommand() === 'redistribute') {
            if(await isAdmin(member.id)){
                con.query(`SELECT * FROM user_points`, async function (err, res){
                    if(err) {
                        console.error('Database error:', err);
                        return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                    }

                    let leftPoints = 0;
                    let currentMembers = [];
                    let leftUsers = [];

                    // Fetch all guild members
                    await guild.members.fetch();

                    for (const user of res) {
                        // Check if user is still in the guild
                        const isMember = guild.members.cache.has(user.user);
                        if (isMember) {
                            currentMembers.push(user);
                        } else {
                            leftPoints += parseInt(user.points, 10);
                            leftUsers.push(user.user);
                            con.query(`DELETE FROM user_points WHERE user = ?`, [user.user], (err) => {
                                if (err) {
                                    console.error('Error deleting user points:', err);
                                }
                            });
                        }
                    }

                    if (currentMembers.length === 0) {
                        return await interaction.reply({ content: 'No current members found to redistribute points to.', ephemeral: true });
                    }

                    // Distribute points from left users to current members (integer division)
                    const extraPoints = Math.floor(leftPoints / currentMembers.length);

                    for (const user of currentMembers) {
                        con.query(`UPDATE user_points SET points = points + ? WHERE user = ?`, [extraPoints, user.user]);
                    }

                    // Optionally, set points of left users to 0
                    if (leftUsers.length > 0) {
                        con.query(`UPDATE user_points SET points = 0 WHERE user IN (${leftUsers.map(() => '?').join(',')})`, leftUsers);
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Points Redistributed')
                        .setDescription(
                            `Redistributed \`${leftPoints}\` cumcoins from users who left to current members (\`${currentMembers.length}\`).\n` +
                            `Each current member received <a:coom:1235063571868680243> \`${extraPoints}\` extra cumcoins.`
                        )
                        .setImage('https://img1.thatpervert.com/pics/post/sterr-furry-artist-artist-yiff-gif-8927969.gif')
                        .setColor('White');

                    await interaction.reply({ embeds: [embed], ephemeral: false });
                });
            } else {
                await interaction.reply({embeds: [noPerms], ephemeral: true});
            }
            return;
        }

        if(interaction.options.getSubcommand() === 'check') {

            con.query(`SELECT * FROM user_points WHERE user='${member.id}'`, async function (err, res){
                
                const embed = new EmbedBuilder()
                    .setDescription(`${member} has collected <a:coom:1235063571868680243> \`${res[0].points} cumcoins\``)
                    .setColor("White")

                await interaction.reply({embeds: [embed]});
            })
        }

        if(interaction.options.getSubcommand() === 'giveall') {
            if(await isAdmin(member.id)){
                let amount = options.getInteger('amount');

                con.query(`SELECT * FROM user_points`, async function (err, res){
                    if(err) {
                        console.error('Database error:', err);
                        return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                    }

                    for (const user of res) {
                        con.query(`UPDATE user_points SET points = points + ? WHERE user = ?`, [amount, user.user]);
                    }

                    const embed = new EmbedBuilder()
                        .setTitle('Gods smile upon us!')
                        .setImage('https://img1.thatpervert.com/pics/post/sterr-furry-artist-artist-yiff-gif-8927969.gif')
                        .setFooter({ text: `Better give big thanks to ${member.displayName}!`, iconURL: member.displayAvatarURL() })
                        .setDescription(`<a:coom:1235063571868680243> \`${amount} cumcoins\` were given to all users!`)
                        .setColor("White");

                    await interaction.reply({embeds: [embed]});
                });
            } else {
                await interaction.reply({embeds: [noPerms], ephemeral: true});
            }
        }
    }
}