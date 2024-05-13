const fs = require('fs');

const { PermissionsBitField } = require('discord.js');
const { Routes } = require('discord-api-types/v9');
const { REST } = require('@discordjs/rest');

const AsciiTable = require('ascii-table');
const table = new AsciiTable().setHeading('Slash Commands', 'Stats').setBorder('|', '=', "0", "0");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

const rest = new REST({ version: '9' }).setToken(TOKEN);

const DEBUG_MODE = true;

module.exports = (client) => {
    const slashCommands = [];

    fs.readdirSync('./slashCommands/').forEach(async dir => {
        const files = fs.readdirSync(`./slashCommands/${dir}/`).filter(file => file.endsWith('.js'));

        try {
            for(const file of files){
                const slashCommand = require(`../slashCommands/${dir}/${file}`);
                slashCommands.push({
                    name: slashCommand.name,
                    description: slashCommand.description,
                    type: slashCommand.type,
                    options: slashCommand.options ? slashCommand.options : null,
                    default_permission: slashCommand.default_permission ? slashCommand.default_permission : null,
                    default_member_permission: slashCommand.default_member_permission ? slashCommand.default_member_permissions : null
                });

                if(slashCommand.name){
                    client.slashCommands.set(slashCommand.name, slashCommand)
                    table.addRow(file.split('.js')[0], '✅')
                } else {
                    table.addRow(file.split('.js')[0], '❌')
                }
            }
        } catch (err) {
            console.log(err);
        }
    });

    console.log(table.toString());

    (async () => {
        try {
            if(DEBUG_MODE){
                await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: slashCommands })
                console.log("DEBUG DEBUG, ONLY UPDATING COMMANDS TO DEV SERVER!")
            } else {
                await rest.put(Routes.applicationCommands(CLIENT_ID), { body: slashCommands });
                console.log("UPDATING SLASH COMMANDS GLOBALLY, MAY TAKE FEW HOURS!")
            }

            console.log('Slash Commands * Registered');
        } catch (err) {
            console.log(err);
        }
    })();
}