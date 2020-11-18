const Discord = require('discord.js');

const client = new Discord.Client();

const prefix = '-';


client.once('ready', () => {
    console.log('Ring ding dong~ Accord is live!');

});

client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'ping') {
        message.channel.send('pong!');
    }
});






client.login('Nzc4MzcyNDQyMzcyNTcxMTM2.X7RB0w.p8KT3IUjuu2PVsDNiDx4U8Ecg00');