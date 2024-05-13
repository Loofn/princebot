const { EmbedBuilder } = require("discord.js");


const noPerms = new EmbedBuilder()
    .setTitle(`Nuh uh.. you lack perms dude...`)
    .setDescription(`Unfortunately you are now permitted to do this.`)
    .setColor("Red");

const cantPunishStaff = new EmbedBuilder()
    .setTitle(`Nuh uh... you can't punish staff!`)
    .setDescription(`You are unable to punish staff members, if there is an issue, contact Admins or Owners of the community.`)
    .setColor("Red");

const mustVerify = new EmbedBuilder()
    .setTitle(`Nuh uh... you must be age verified!`)
    .setDescription(`Please age verify yourself first using command \`/ageverify\`.`)
    .setColor("Red");


module.exports = {
    noPerms,
    cantPunishStaff,
    mustVerify
}