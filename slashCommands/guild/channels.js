const { ApplicationCommandType, PermissionOverwrites, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const { isAdmin } = require("../../function/roles");
const { noPerms } = require("../../data/embeds");
const emojiRegex = require('emoji-regex');

module.exports = {
    name: 'channels',
    description: 'Manage channels.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'fix',
            description: 'Fix channel naming scheme',
            type: 1,
            options: [
                {
                    name: 'channel',
                    description: 'Channel to fix',
                    type: 7,
                    channel_types: [0],
                    required: true
                },
                {
                    name: 'emoji',
                    description: 'Icon for the channel name',
                    type: 3,
                    required: true
                }
            ]
        },
        {
            name: 'create',
            description: 'Create new channel',
            type: 1,
            options: [
                {
                    name: 'channel_name',
                    description: 'Name for the new channel',
                    type: 3,
                    required: true
                },
                {
                    name: 'emoji',
                    description: 'Icon for the channel name',
                    type: 3,
                    required: true
                },
                {
                    name: 'category',
                    description: 'Which category should channel be created at? (default: cmd category)',
                    type: 7,
                    channel_types: [4]
                }
            ]
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp 
        } = interaction; 
        const { guild } = member;

        const subCmd = options.getSubcommand();

        if(await isAdmin(member.id)){

            if(subCmd === 'fix'){
                const editCh = options.getChannel('channel');
                const emoji = options.getString('emoji');
                const oldName = editCh.name;
                const regex = /┆(.+)$/;
                const match = oldName.match(regex);
                const regexedName = match ? match[1] : ''

                const emojis = extractEmojis(emoji);

                const newName = `«${emoji}»┆` + replaceWithSpecialLetters(regexedName);

                editCh.edit({
                    name: newName,
                    reason: 'Naming scheme fixed'
                })

                await interaction.reply({content: `Naming scheme was fixed for the channel ${editCh}!`, ephemeral: true})
            }

            if(subCmd === 'create'){
                const category = options.getChannel('category') ? options.getChannel('category').id : interaction.channel.parentId;
                const name = replaceWithSpecialLetters(options.getString('channel_name'));
                const emoji = options.getString('emoji');
                guild.channels.create({
                    name: `«${emoji}»┆${name}`,
                    parent: category,
                    PermissionOverwrites: [
                        {
                            id: member.id,
                            allow: [PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages]
                        }
                    ]
                }).then(async newChannel => {

                    const embed = new EmbedBuilder()
                        .setDescription(`New channel created as per request: ${newChannel}.`)
                        .setColor("LightGrey")

                    await interaction.reply({embeds: [embed], ephemeral: true})
                })
            }
        } else {
            await interaction.reply({embeds: [noPerms], ephemeral: true})
        }
    }

}


const specialLettersMap = {
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 
    'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 
    'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 
    'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
    '-': '_'
};

function replaceWithSpecialLetters(input) {
    return input
        // Replace hyphens with underscores
        .replace(/-/g, '_')
        // Replace the first letter of each word with its special letter
        .replace(/\b\w/g, char => {
            // Convert the character to uppercase
            const upperChar = char.toUpperCase();
            // Return the special letter if it's in the map, otherwise return the original character
            return specialLettersMap[upperChar] || char;
        });
}

function containsEmoji(str) {
    const emojiRegex = /(\p{Emoji_Presentation}|\p{Extended_Pictographic})/gu;
    return emojiRegex.test(str);
}

function extractEmojis(str) {
    const regex = emojiRegex();
    const emojis = [];
    let match;

    while ((match = regex.exec(str)) !== null) {
        emojis.push(match[0]);
    }

    return emojis;
}