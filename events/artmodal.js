const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const client = require('..');

const {noPerms} = require('../data/embeds');
const serverRoles = require('../data/serverRoles.json')
const serverChannels = require('../data/channels.json')

client.on('interactionCreate', async interaction => {

    if(interaction.isModalSubmit()){

        const customId = interaction.customId.split('-');

        if(customId[0] === 'artist'){
            const socials = interaction.fields.getTextInputValue('socials');
            const info = interaction.fields.getTextInputValue('info') ? interaction.fields.getTextInputValue('info') : "N/A";
            const staffCh = interaction.guild.channels.cache.get('1233555624026050631');

            const acceptBtn = new ButtonBuilder()
                .setCustomId(`artaccept-${customId[1]}`)
                .setEmoji('✅')
                .setLabel(`Accept & give role`)
                .setStyle(ButtonStyle.Success)

            const denyBtn = new ButtonBuilder()
                .setCustomId(`artdeny-${customId[1]}`)
                .setEmoji('🗑️')
                .setLabel(`Deny role`)
                .setStyle(ButtonStyle.Danger)

            const buttons = new ActionRowBuilder().addComponents(acceptBtn, denyBtn);

            const request = new EmbedBuilder()
                .setTitle(`New Artist role request!`)
                .setDescription(`Please verify the details below that social media matches with the user requesting the role and that they are not using someone else's account to get the <@&1235261365095108608> role.`)
                .addFields(
                    {name: `Requested by`, value: `${interaction.member} \`${interaction.member.user.globalName}\``, inline: true},
                    {name: `Socials`, value: `${socials}`},
                    {name: `Additional information`, value: `${info}`}
                )
                .setTimestamp()
                .setFooter({text: `Use buttons below to accept/deny`})
                .setThumbnail(interaction.member.displayAvatarURL())

            staffCh.send({embeds: [request], content: `@here`, components: [buttons]});

            const requestSent = new EmbedBuilder()
                .setDescription(`Your artist role request has been sent successfully, and now you can wait patiently for mods to review it!`)

            await interaction.reply({embeds: [requestSent]})
        }

    }

    if(interaction.isButton()){
        const guild = interaction.guild;
        const customId = interaction.customId.split('-');

        if(customId[0] === 'artaccept'){
            const artist = await guild.members.fetch(customId[1]);
            await artist.roles.add('1235261365095108608')
            const embed = new EmbedBuilder()
                .setTitle(`Artist role accepted`)
                .setDescription(`Your artist role has been accepted, and you can now post in <#1235618662874873916>.\n\n**Remember** you are **__NOT__** allowed to promote commissions.`)

            artist.send({embeds: [embed]}).catch(console.error)

            await interaction.reply({content: `Role has been given and the user has been DM'd, thank you ${interaction.member}`}).then(() => {
                interaction.message.delete();
            })
        }

        if(customId[0] === 'artdeny'){
            const artist = await guild.members.fetch(customId[1]);

            const embed = new EmbedBuilder()
            .setTitle(`Artist role denied`)
            .setDescription(`Your artist role has been denied by ${member}. You can DM them to ask reasos if you are confused.`)

            artist.send({embeds: [embed]}).catch(console.error)

            await interaction.reply({content: `Art role request has been declined by ${interaction.member}, and member has been informed about it. They have right to come to your DMs to ask reasoning!`}).then(() => {
                interaction.message.delete();
            })
        }
    }
})