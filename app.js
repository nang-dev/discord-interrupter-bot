const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();
let connection, dispatcher, guild, targetRole, currChannelID;
let targetRoleName = "Target";

client.on('ready', () => { 
    console.log('Bot is ready');
    guild = client.guilds.cache.get("859279246390984706");
    targetRole = guild.roles.cache.find((role) => {
        return role.name == targetRoleName;
    });
});

client.on('voiceStateUpdate', async (oldState, newState) => {
    if (newState.channelID === null) { 
        console.log('User left channel', oldState.channelID);
        let member = oldState.member;
        if(member.roles.cache.has(targetRole.id)) {
            channel = client.channels.cache.get(currChannelID);
            if(channel) {
                await channel.leave();
            }
            currChannelID = null;
        }
    }
    else if(oldState.channelID === null) {
        console.log('user joined channel', oldState.channelID, newState.channelID);
        let member = newState.member;
        if(member.roles.cache.has(targetRole.id)) {
            console.log("Resetting new channel");
            currChannelID = newState.channelID;
            channel = client.channels.cache.get(newState.channelID);
            connection = await channel.join();
        }
    }
    else {
        console.log('user moved channels', oldState.channelID, newState.channelID);
        let member = newState.member;
        if(member.roles.cache.has(targetRole.id)) {
            console.log("Resetting new channel");
            currChannelID = newState.channelID;
            await client.channels.cache.get(currChannelID).leave();
            currChannelID = null;
            channel = client.channels.cache.get(newState.channelID);
            connection = await channel.join();
        }
    }
})

client.on('guildMemberSpeaking', async (member, speaking) => {
    console.log("Speaking")

    if(member.roles.cache.has(targetRole.id)) {
        dispatcher = connection.play('passion.mp3');
        dispatcher.on('finish', () => {
            console.log("replay");
            dispatcher = connection.play('passion.mp3');
        });
        if (dispatcher && !speaking.bitfield) {
            dispatcher = dispatcher.destroy()
        }
    }
});

client.login(process.env.BOT_TOKEN)
process.on('unhandledRejection', console.log)