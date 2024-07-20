const { ApplicationCommandType, EmbedBuilder, ChannelType, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const serverRoles = require('../../data/serverRoles.json')
const con = require('../../function/db');
const {fetchThread} = require('../../function/db/fetchAgeVerifyThread');
const { saveUserRoles } = require('../../function/userRoles');


module.exports = {
    name: 'ageverify',
    description: 'Verify your age within the server',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        //console.log("debug")
        if(member.roles.cache.get(serverRoles.verified)){
            const verifiedalready = new EmbedBuilder()
            .setTitle(`You are already verified...`)
            .setDescription(`You have been age verified already and don't need to verify yourself anymore. Enjoy-!`)
            .setColor("Red")

            return interaction.reply({embeds: [verifiedalready], ephemeral: true})
        }

        if(await fetchThread(member.id)){
            const currentThread = await fetchThread(member.id)
            const threadAlready = new EmbedBuilder()
            .setTitle(`You have thread open already...`)
            .setDescription(`You have opened thread already ${currentThread}, return talking there.`)

            return interaction.reply({embeds: [threadAlready], ephemeral: true})
        }
        await interaction.deferReply({ephemeral: true});
        await saveUserRoles(member.id);
        await member.roles.add([serverRoles.unverified]);

        const kindergartenCh = guild.channels.cache.get('1233466742148300984');
        kindergartenCh.threads.create({
            name: `Age Verify: ${member.user.username}`,
            type: ChannelType.PrivateThread,
            invitable: false
        }).then(async (thread) => {
            await thread.members.add(member);
            await thread.members.add('102756256556519424')
            const modrole = guild.roles.cache.get(serverRoles.mod);
            const trialmodrole = guild.roles.cache.get('1231615507485163611');
            const modUsers = modrole.members;
            const trialmodusers = trialmodrole.members;

            modUsers.forEach(mod => {
                thread.members.add(mod);
            });

            trialmodusers.forEach(mod => {
                thread.members.add(mod);
            });

            const deleteThread = new ButtonBuilder()
                .setCustomId(`deletethread-${member.id}`)
                .setLabel("Delete thread")
                .setStyle(ButtonStyle.Danger)
                .setEmoji('🗑️')

            const verifyButton = new ButtonBuilder()
                .setCustomId(`verifyage-${member.id}`)
                .setLabel(`Verify Age`)
                .setStyle(ButtonStyle.Primary)
                .setEmoji('✅')

            const row = new ActionRowBuilder()
                .addComponents(verifyButton, deleteThread)

            const verifyGuidelines = new EmbedBuilder()
                .setTitle(`Age Verification of ${member.user.username}`)
                .setDescription(`Here is what we need you to do, to verify your age. Remember if you do not verify your age, you will be **banned** from the server.\n\n## Steps to verify\n:arrow_right: You need either birth certificate, driver's license or passport.\n\n:arrow_right: Take a picture of the ID of your choosing, blurr any information on it except **date of birth** and place it on top of the paper. Paper has to have the server name and today's date written to it.\n\nOnce you have sent the image, wait for <@&1231405365674115112> to verify you.`)
                .setColor("LuminousVividPink")
                .setTimestamp()
                .setImage('https://i.imgur.com/E8wPLE8.png')
                .setFooter({text: `Follow the guidelines above so you know what you are expected to do`, iconURL: guild.iconURL()})

            await thread.send({embeds: [verifyGuidelines], components: [row]});
            con.query(`INSERT INTO ageverify VALUES ('${member.id}', '${thread.id}' ON DUPLICATE KEY UPDATE thread='${thread.id}')`);

            await interaction.editReply({content: `Your age verify has been opened in ${thread}!`})
        })
    }
}