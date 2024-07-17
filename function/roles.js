const client = require('..')

async function isStaff(userId){
    if(await isMod(userId) || await isAdmin(userId) || await isTrialMod(userId)){
        return true;
    } else {
        return false;
    }
}

async function isMod(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = await guild.members.fetch(userId, {force: true, cache: true});
    if(member.roles.cache.get('1231405365674115112')){
        return true;
    } else {
        return false;
    }
}

async function isTrialMod(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = await guild.members.fetch(userId, {force: true, cache: true});
    if(member.roles.cache.get('1231615507485163611')){
        return true;
    } else {
        return false;
    }
}

async function isAdmin(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = await guild.members.fetch(userId, {force: true, cache: true});
    if(member.roles.cache.get('1231405230906671185') || member.roles.cache.get('1248723094542090300')){
        return true;
    } else {
        return false;
    }
}

async function isVIP(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = await guild.members.fetch(userId, {force: true, cache: true});
    if(member.roles.cache.get('1231405772391321683')){
        return true;
    } else {
        return false;
    }
}

async function isVerified(userId){
    const guild = client.guilds.cache.get('1231299437519966269');
    const member = await guild.members.fetch(userId, {force: true, cache: true});
    if(member.roles.cache.get('1231617460797571192')){
        return true;
    } else {
        return false;
    }
}

module.exports = {
    isAdmin,
    isMod,
    isTrialMod,
    isStaff,
    isVIP,
    isVerified
}