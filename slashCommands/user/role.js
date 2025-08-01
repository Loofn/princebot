const fetch = require("node-fetch");
const { isVerified, isAdmin, isBooster } = require("../../function/roles");
const { mustVerify } = require("../../data/embeds");
const { ApplicationCommandType, EmbedBuilder, AttachmentBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const moment = require('moment');
const { getDominantColorFromURL, isHexColor } = require("../../function/utils");
const con = require('../../function/db');
const queryAsync = require("../../function/queryAsync");
const { getPoints, removePoints } = require("../../function/furrygame");
const { removeItemFromUser, hasItem } = require("../../function/inventory");

module.exports = {
    name: 'customrole',
    description: 'Create and modify your custom role.',
    cooldown: 3000,
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: 'create',
            description: 'Create a custom role',
            type: 1, // Subcommand
            options: [
                {
                    name: 'name',
                    description: 'Name of the custom role',
                    type: 3, // String
                    required: true
                },
                {
                    name: 'color',
                    description: 'Color of the custom role (hex code)',
                    type: 3, // String
                    required: true
                }
            ],
        },
        {
            name: 'modify',
            description: 'Modify your custom role',
            type: 1, // Subcommand
        },
        {
            name: 'admin',
            description: 'Admin commands for custom roles',
            type: 2, // Subcommand group
            options: [
                {
                    name: 'add',
                    description: 'Add existing custom role to a user',
                    type: 1, // Subcommand
                    options: [
                        {
                            name: 'user',
                            description: 'User to add custom role to',
                            type: 6, // User
                            required: true
                        },
                        {
                            name: 'role',
                            description: 'Custom role to add',
                            type: 8, // Role
                            required: true
                        }
                    ]
                },
                {
                    name: 'delete',
                    description: 'Delete a custom role',
                    type: 1, // Subcommand
                    options: [
                        {
                            name: 'user',
                            description: 'User whose custom role to delete',
                            type: 6, // User
                            required: true
                        }
                    ]
                },
                {
                    name: 'list',
                    description: 'List all custom roles',
                    type: 1, // Subcommand
                },
                {
                    name: 'suspend',
                    description: 'Suspend a user\'s custom role until they modify it',
                    type: 1, // Subcommand
                    options: [
                        {
                            name: 'user',
                            description: 'User to suspend',
                            type: 6, // User
                            required: true
                        },
                        {
                            name: 'reason',
                            description: 'Reason for suspension',
                            type: 3, // String
                            required: true
                        }
                    ]
                },
            ]
        }
    ],

    run: async (client, interaction) => {
        const { member, channelId, guildId, applicationId, 
            commandName, deferred, replied, ephemeral, 
            options, id, createdTimestamp, guild
        } = interaction; 

        const subCmd = options.getSubcommand();
        const subCmdGroup = options.getSubcommandGroup();
        const getRole = await getCustomRole(member.id);
        const balance = await getPoints(member.id);
        const highestRole = guild.roles.cache.get('1398386756822499390');

        if(subCmdGroup === 'admin' && !isAdmin(member.id)){
            return await interaction.reply({
                content: "You do not have permission to use this command.",
                ephemeral: true
            });
        }

        // Check if user is verified
        if(!await isVerified(member.id)){
            return await interaction.reply({
                embeds: [mustVerify],
                ephemeral: true
            });
        }

        const prices = {
            'create': 20000, // Price to create a custom role
            'modify': 5000, // Price to modify a custom role
        }

        const boosterDiscount = (await isBooster(member.id)) ? 0.1 : 1; // 90% discount for boosters

        // Admin commands
        if(subCmdGroup === 'admin'){
            if(subCmd === 'add'){
                const targetUser = options.getUser('user');
                const targetRole = options.getRole('role');
                const targetRoleId = targetRole.id;

                if(!targetUser || !targetRole){
                    return await interaction.reply({
                        content: "You need to specify a user and a role to add.",
                        ephemeral: true
                    });
                }

                // Add role to user if they don't have it
                const targetMember = guild.members.cache.get(targetUser.id);
                if(targetMember && !targetMember.roles.cache.has(targetRoleId)){
                    await targetMember.roles.add(targetRoleId);
                }

                await queryAsync(con, `INSERT INTO user_roles_custom (user, role) VALUES (?, ?) ON DUPLICATE KEY UPDATE role=?`, [targetUser.id, targetRoleId, targetRoleId]);

                await interaction.reply({
                    content: `Custom role **${targetRole.name}** has been added to ${targetUser}.`,
                    ephemeral: true
                });
            } else if(subCmd === 'delete'){
                const targetUser = options.getUser('user');
                const getTargetRole = await getCustomRole(targetUser.id);

                // Check if user has a custom role
                if(!getTargetRole){
                    return await interaction.reply({
                        content: "User does not have a custom role.",
                        ephemeral: true
                    });
                }

                // Get the actual role object
                const roleToDelete = guild.roles.cache.get(getTargetRole.role);
                const roleName = roleToDelete ? roleToDelete.name : 'Unknown Role';

                // Delete the custom role from the database
                await queryAsync(con, `DELETE FROM user_roles_custom WHERE user = ?`, [targetUser.id]);
                
                // Delete the role from Discord if it exists
                if(roleToDelete) {
                    await roleToDelete.delete().catch(console.error);
                }

                await interaction.reply({
                    content: `Custom role **${roleName}** has been deleted from ${targetUser}.`,
                    ephemeral: true
                });

                const embed = new EmbedBuilder()
                .setTitle(`Your custom role has been deleted by an admin`)
                .setDescription(`Your custom role has been deleted by an admin. If you want to create a new one, use \`/customrole create\`.`)
                .setColor("Red")
                .setFooter({ text: `Role deleted by ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

                targetUser.send({ embeds: [embed] }).catch(console.error);
            } else if(subCmd === 'list'){
                // List all custom roles
                con.query(`SELECT * FROM user_roles_custom`, async (err, res) => {
                    if (err) {
                        console.error('Database error:', err);
                        return await interaction.reply({ content: 'An error occurred while accessing the database.', ephemeral: true });
                    }
                    if (res.length === 0) {
                        return await interaction.reply({ content: 'No custom roles found.', ephemeral: true });
                    }

                    const rolesList = res.map(role => `<@${role.user}> - <@&${role.role}>`).join('\n');
                    const embed = new EmbedBuilder()
                        .setTitle('Custom Roles List')
                        .setDescription(rolesList)
                        .setColor("Blue");

                    return await interaction.reply({ embeds: [embed] });
                });
            }
        }

        if(subCmd === 'create'){
            if(getRole){
                return await interaction.reply({
                    content: "You already have a custom role. Use `/customrole modify` to change it.",
                    ephemeral: true
                });

            }
            const roleName = options.getString('name');
            const roleColor = options.getString('color');

            let price = prices.create * boosterDiscount;
            let couponUsed = false;
            
            // Check if user has a role creation coupon
            const hasCoupon = await checkUserCoupon(member.id, 'role_creation_coupon');
            if(hasCoupon){
                price = 0; // 100% discount
                couponUsed = true;
            }
            
            if(balance < price){
                return await interaction.reply({
                    content: `You need ${price} cumcoins to create a custom role, but you only have ${balance}.`,
                    ephemeral: true
                });
            }

            // Validate color format
            if(!isHexColor(roleColor)){
                return await interaction.reply({
                    content: "Invalid color format. Please provide a valid hex color code (e.g., #FF5733).",
                    ephemeral: true
                });
            }

            // Create the custom role
            const role = await guild.roles.create({
                name: roleName,
                colors: [roleColor],
                reason: `Custom role bought and created by ${member.user.tag}`,
                hoist: false,
                mentionable: false,
                position: highestRole.position - 1 // Position below the highest non-staff role
            });

            // Add the role to the user
            await member.roles.add(role);

            // Insert into database
            await queryAsync(con, `
                INSERT INTO user_roles_custom (user, role) VALUES (?, ?)
            `, [member.id, role.id]);

            // If coupon was used, remove it from inventory
            if(couponUsed){
                await useCoupon(member.id, 'role_creation_coupon');
            }

            // Deduct cumcoins (will be 0 if coupon was used)
            if(price > 0){
                await removePoints(member.id, price);
            }
            
            const embed = new EmbedBuilder()
                .setTitle('Custom Role Created!')
                .setDescription(`Your custom role **${role}** has been created successfully!${couponUsed ? ' (Used Role Creation Coupon)' : ''}`)
                .setColor(roleColor)
                .addFields(
                    { name: 'Role Color', value: roleColor, inline: true },
                    { name: 'Price Paid', value: couponUsed ? 'FREE (Coupon)' : `${price} cumcoins`, inline: true }
                )
                .setFooter({ text: `Role created by ${member.user.tag}`, iconURL: member.user.displayAvatarURL() });

            return await interaction.reply({ embeds: [embed] });
        } else if(subCmd === 'modify'){
            if(!getRole){
                return await interaction.reply({
                    content: "You don't have a custom role to modify. Use `/customrole create` to create one.",
                    ephemeral: true
                });
            }

            let price = prices.modify * boosterDiscount;
            let couponUsed = false;
            
            // Check if user has a role modification coupon
            const hasCoupon = await checkUserCoupon(member.id, 'role_modification_coupon');
            if(hasCoupon){
                price = 0; // 100% discount
                couponUsed = true;
            }
            
            if(balance < price){
                return await interaction.reply({
                    content: `You need ${price} cumcoins to modify your custom role, but you only have ${balance}.`,
                    ephemeral: true
                });
            }

            // Modify the role
            const role = guild.roles.cache.get(getRole.role);
            if(!role){
                return await interaction.reply({
                    content: "Your custom role no longer exists. Please create a new one.",
                    ephemeral: true
                });
            }

            let modifyEmbed = new EmbedBuilder()
                .setTitle('Modify Your Custom Role')
                .setDescription(`You can modify your custom role ${role}. Please select what you want to modify.\n\n` +
                    `**Current Role Name:** ${role.name}\n` +
                    `**Current Role Color:** ${role.color}\n` +
                    `**Price to Modify:** ${couponUsed ? 'FREE (Coupon)' : `${price} cumcoins${(await isBooster(member.id)) ? ' (after booster discount)' : ''}`}`
                )
                .setColor(role.color)
                .setFooter({ text: `Role ID: ${role.id}`, iconURL: member.user.displayAvatarURL() });

            const modifyNameBtn = new StringSelectMenuBuilder()
                .setCustomId('modify_role_select')
                .setPlaceholder('Modify Role')
                .addOptions(
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Change Role Name')
                        .setEmoji('✏️')
                        .setValue('role_change_name'),
                    new StringSelectMenuOptionBuilder()
                        .setLabel('Change Role Color')
                        .setEmoji('🎨')
                        .setValue('role_change_color')
                );

            const row = new ActionRowBuilder()
                .addComponents(modifyNameBtn);

            const response = await interaction.reply({ embeds: [modifyEmbed], components: [row] });
            const filter = i => i.user.id === member.id;

            try {
                const confirmation = await response.awaitMessageComponent({ filter, time: 60000 });
                    // Handle the confirmation
                    if(confirmation.customId === 'modify_role_select'){
                        const selectedOption = confirmation.values[0];
                        if(selectedOption === 'role_change_name'){
                            // Handle changing role name
                            const changeModal = new ModalBuilder()
                                .setCustomId('change_role_name_modal')
                                .setTitle('Change Custom Role Name')
                            
                            const nameInput = new TextInputBuilder()
                                .setCustomId('new_role_name')
                                .setLabel('Enter the new name for your custom role:')
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(20)
                                .setRequired(true);

                            const nameRow = new ActionRowBuilder().addComponents(nameInput);
                            changeModal.addComponents(nameRow);
                            await confirmation.showModal(changeModal);
                            
                            try {
                                const nameResponse = await confirmation.awaitModalSubmit({
                                    filter: i => i.user.id === member.id,
                                    time: 60000
                                });

                                // Change the role name
                                const newRoleName = nameResponse.fields.getTextInputValue('new_role_name');
                                await role.setName(newRoleName);

                                modifyEmbed.setDescription(`Your custom role has been renamed to **${newRoleName}**.`);
                                
                                // If coupon was used, remove it from inventory
                                if(couponUsed){
                                    await useCoupon(member.id, 'role_modification_coupon');
                                }
                                
                                // Deduct cumcoins and update (will be 0 if coupon was used)
                                if(price > 0){
                                    await removePoints(member.id, price);
                                }
                                modifyEmbed.setFooter({ text: `Role modified by ${member.user.tag}${couponUsed ? ' (Used Coupon)' : ''}`, iconURL: member.user.displayAvatarURL() });
                                return await nameResponse.update({ embeds: [modifyEmbed], components: [] });
                            } catch (modalError) {
                                if (modalError.code === 'InteractionCollectorError') {
                                    return await confirmation.editReply({ 
                                        content: 'You did not provide a new role name in time. The role modification has been cancelled.', 
                                        embeds: [], 
                                        components: [] 
                                    });
                                }
                                throw modalError;
                            }
                        } else if(selectedOption === 'role_change_color'){
                            // Handle changing role color
                            const changeModal = new ModalBuilder()
                                .setCustomId('change_role_color_modal')
                                .setTitle('Change Custom Role Color')

                            const colorInput = new TextInputBuilder()
                                .setCustomId('new_role_color')
                                .setLabel('Enter the new color for your custom role (hex code):')
                                .setStyle(TextInputStyle.Short)
                                .setMaxLength(7) // Hex color length
                                .setRequired(true);

                            const colorRow = new ActionRowBuilder().addComponents(colorInput);
                            changeModal.addComponents(colorRow);
                            await confirmation.showModal(changeModal);
                            
                            try {
                                const colorResponse = await confirmation.awaitModalSubmit({
                                    filter: i => i.user.id === member.id,
                                    time: 60000
                                });

                                const newColor = colorResponse.fields.getTextInputValue('new_role_color');
                                
                                // Validate hex color
                                if(!isHexColor(newColor)){
                                    return await colorResponse.update({
                                        content: "Invalid color format. Please provide a valid hex color code (e.g., #FF5733).",
                                        embeds: [],
                                        components: []
                                    });
                                }
                                
                                await role.setColor(newColor);
                                modifyEmbed.setDescription(`Your custom role color has been changed to **${newColor}**.`);
                                modifyEmbed.setColor(newColor);
                                
                                // If coupon was used, remove it from inventory
                                if(couponUsed){
                                    await useCoupon(member.id, 'role_modification_coupon');
                                }
                                
                                // Deduct cumcoins and update (will be 0 if coupon was used)
                                if(price > 0){
                                    await removePoints(member.id, price);
                                }
                                modifyEmbed.setFooter({ text: `Role modified by ${member.user.tag}${couponUsed ? ' (Used Coupon)' : ''}`, iconURL: member.user.displayAvatarURL() });
                                return await colorResponse.update({ embeds: [modifyEmbed], components: [] });
                            } catch (modalError) {
                                if (modalError.code === 'InteractionCollectorError') {
                                    return await confirmation.editReply({ 
                                        content: 'You did not provide a new role color in time. The role modification has been cancelled.', 
                                        embeds: [], 
                                        components: [] 
                                    });
                                }
                                throw modalError;
                            }
                        }
                    }
                } catch (error) {
                    if (error.code === 'InteractionCollectorError') {
                        // Handle timeout - disable the components and update the message
                        const disabledRow = new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('modify_role_select_disabled')
                                    .setPlaceholder('Selection timed out')
                                    .setDisabled(true)
                                    .addOptions(
                                        new StringSelectMenuOptionBuilder()
                                            .setLabel('Timed out')
                                            .setValue('timeout')
                                    )
                            );
                        
                        modifyEmbed.setDescription('Role modification timed out. Please try again if you want to modify your role.');
                        return await interaction.editReply({ 
                            embeds: [modifyEmbed], 
                            components: [disabledRow] 
                        });
                    }
                    console.error('Error waiting for confirmation:', error);
                }
        }
    }
}

async function getCustomRole(userId){
    return new Promise((resolve, reject) => {
        queryAsync(con, `
            SELECT * FROM user_roles_custom WHERE user = ?
        `, [userId])
        .then(res => {
            if(res.length > 0){
                resolve(res[0])
            } else {
                resolve(false)
            }
        }).catch(err => {
            console.error('Error fetching custom role:', err);
            resolve(false);
        });
    });
}

async function checkUserCoupon(userId, couponId) {
    return await hasItem(userId, couponId, 1);
}

async function useCoupon(userId, couponId) {
    return await removeItemFromUser(userId, couponId, 1);
}