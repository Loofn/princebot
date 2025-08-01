const { ApplicationCommandType, EmbedBuilder, Embed, ButtonBuilder, ActionRowBuilder, ButtonStyle } = require("discord.js");
const { addToGame } = require("../../events/petfurry");
const { getPoints, removePoints, givePoints } = require("../../function/furrygame");
const { user } = require("../..");
const { isAdmin } = require("../../function/roles");

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
        },
        {
            name: 'admin-use',
            description: 'Whether to use admin privileges for this action',
            required: false,
            type: 5
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
        let adminUse = options.getBoolean('admin-use') || false;
        let balance = await getPoints(member.id)

        await addToGame(userToGive.id);

        if(adminUse && !await isAdmin(member.id)) {
            const embed = new EmbedBuilder()
                .setDescription(`You do not have permission to use admin privileges for this action!`)
                .setColor("Red");
            return await interaction.reply({embeds: [embed], ephemeral: true});
        }

        if(userToGive.id === member.id) {
            const embed = new EmbedBuilder()
                .setDescription(`You cannot give points to yourself!`)
                .setColor("Red");
            return await interaction.reply({embeds: [embed], ephemeral: true});
        }

        if(userToGive.bot) {
            const embed = new EmbedBuilder()
                .setDescription(`You cannot give points to bots!`)
                .setColor("Red");
            return await interaction.reply({embeds: [embed], ephemeral: true});
        }

        if(userToGive.id === '102756256556519424') {
            const embed = new EmbedBuilder()
                .setDescription(`You cannot give points to Lofn!`)
                .setColor("Red");
            return await interaction.reply({embeds: [embed], ephemeral: true});
        }

        if(amount <= 0) {
            const embed = new EmbedBuilder()
                .setDescription(`You cannot give 0 or negative cumcoins!`)
                .setColor("Red");
            return await interaction.reply({embeds: [embed], ephemeral: true});
        }

        if(amount <= balance){
            await removePoints(member.id, amount);
            await givePoints(userToGive.id, parseInt(amount))

            const embed = new EmbedBuilder()
                .setTitle(`Points given away`)
                .setDescription(`${member} just gave \`${amount} cumcoins\` to ${userToGive}!`)
                .setThumbnail('https://static1.e621.net/data/sample/81/19/811998584bb06c7b5ac501d6b6e9d747.jpg')
                .setColor(0x00008B)

            await interaction.reply({embeds: [embed], content: `${userToGive}`})

            const serverBtn = new ButtonBuilder()
                .setLabel(`${guild.name}`)
                .setStyle(ButtonStyle.Link)
                .setURL(`${interaction.channel.url}`)

            const row = new ActionRowBuilder().addComponents(serverBtn);
            

            const dmEmbed = new EmbedBuilder()
                .setTitle(`You received cumcoins!`)
                .setDescription(`You have received \`${amount} cumcoins\` from ${member.user.username}!`)
                .setThumbnail('https://static1.e621.net/data/sample/81/19/811998584bb06c7b5ac501d6b6e9d747.jpg')
                .setColor(0x00008B)

            await userToGive.send({embeds: [dmEmbed], components: [row]}).catch(err => {
                console.error(`Could not send DM to ${userToGive.username}:`, err);
            });

        } else if(adminUse) {
            // Admin override, allow giving even if balance is insufficient
            await givePoints(userToGive.id, parseInt(amount));
            const embed = new EmbedBuilder()
                .setTitle(`Points given away`)
                .setDescription(`${member} just gave \`${amount} cumcoins\` to ${userToGive} (admin override)!`)
                .setThumbnail('https://static1.e621.net/data/sample/81/19/811998584bb06c7b5ac501d6b6e9d747.jpg')
                .setColor(0x00008B)
            await interaction.reply({embeds: [embed], content: `${userToGive}`});

            const serverBtn = new ButtonBuilder()
                .setLabel(`${guild.name}`)
                .setStyle(ButtonStyle.Link)
                .setURL(`${interaction.channel.url}`)

            const row = new ActionRowBuilder().addComponents(serverBtn);
            

            const dmEmbed = new EmbedBuilder()
                .setTitle(`You received cumcoins!`)
                .setDescription(`You have received \`${amount} cumcoins\` from ${member.user.username}!`)
                .setThumbnail('https://static1.e621.net/data/sample/81/19/811998584bb06c7b5ac501d6b6e9d747.jpg')
                .setColor(0x00008B)

            await userToGive.send({embeds: [dmEmbed], components: [row]}).catch(err => {
                console.error(`Could not send DM to ${userToGive.username}:`, err);
            });
        } else {
            const embed = new EmbedBuilder()
                .setDescription(`You don't have enough cumcoins to give! You only have \`${balance} cumcoins\``)
                .setColor("Red")
            await interaction.reply({embeds: [embed], ephemeral: true})
        }

    }
}