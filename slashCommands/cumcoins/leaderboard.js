const { ApplicationCommandType, EmbedBuilder } = require('discord.js');
const {isAdmin} = require('../../function/roles.js');
const { noPerms } = require('../../data/embeds.js');
const { isImageLink, getDominantColorFromURL } = require('../../function/utils.js');
const con = require('../../function/db.js');
const { sendFurry, addToGame } = require('../../events/petfurry.js');
const serverRoles = require('../../data/serverRoles.json')
const {mustVerify} = require('../../data/embeds.js')

module.exports = {
    name: 'leaderboard',
    description: 'Check leaderboard, who has most cumcoins?',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 

        const { guild } = member;

        if(member.roles.cache.get(serverRoles.verified) || await isAdmin(member.id)){
            con.query(`SELECT * FROM user_points ORDER BY points DESC`, async function (err, res){
            
                let userslist = "";
                let placements = [":trophy::one:", ":two:", ":three:", ":four:", ":five:", ":six:"]
                let count = 0;
                for (let i = 0; i < res.length; i++) {
                    let user = await guild.members.fetch(res[i].user).catch(() => undefined);
                    if(user === undefined) continue;
                    if(user.id === '102756256556519424') continue; // Skip developer
                    if (count === 5) break;
                    count++;
                    // Points convert to millions, thousands, etc.
                    const points = res[i].points;
                    let displayPoints = points;
                    let suffix = '';

                    if (points >= 1000000) {
                        displayPoints = (points / 1000000).toFixed(1);
                        suffix = 'mil';
                    } else if (points >= 1000) {
                        displayPoints = (points / 1000).toFixed(1);
                        suffix = 'k';
                    }
                    userslist += `${placements[count]} ${user} \`${displayPoints}${suffix} cumcoins\`\n`
                }

                const embed = new EmbedBuilder()
                    .setDescription(`${userslist}`)
                    .setColor("#FFFFFF")
                    .setTitle(`Cumcoins leaderboard`)
    
                await interaction.reply({embeds: [embed]}).catch(err => {
                    console.error('Failed to send interaction reply:', err);
                });
            })
        } else {
            await interaction.reply({embeds: [mustVerify], ephemeral: true})
        }
        
    }
}