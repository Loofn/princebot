const client = require('..');
const con = require('./db')


async function checkCreatedChannels() {
    try {
        const guild = client.guilds.cache.get('1231299437519966269');

        const res = await new Promise((resolve, reject) => {
            con.query('SELECT * FROM muzzled', (err, res) => {
                if (err) reject(err);
                else resolve(res);
            });
        });

        for (let i = 0; i < res.length; i++) {
            const member = await guild.members.fetch(res[i].user).catch(() => null);

            if (!member) {

                await guild.members.ban(res[i].user, { reason: 'User left the server while muzzled' }).catch(console.error);

                const channel = guild.channels.cache.get(res[i].channel);
                if (channel) {
                    await channel.delete().catch(console.error);
                    await new Promise((resolve, reject) => {
                        con.query(`DELETE FROM muzzled WHERE user='${res[i].user}'`, (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
                }
            }
        }
    } catch (error) {
        console.error('Error in checkCreatedChannels:', error);
    }
}

module.exports = {
    checkCreatedChannels
}