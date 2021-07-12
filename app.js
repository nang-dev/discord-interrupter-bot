const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();
const targetRoleName = "Target";
let interrupterMap = new Map();

class Interrupter {
    constructor(guild, targetRole) {
        this.guild = guild;
        this.targetRole = targetRole;
        this.connection = null;
        this.dispatcher = null;
        this.currChannelID = null;
    }

    async voiceStateUpdateHandler(oldState, newState) {
        if (newState.channelID === null) { 
            console.log('User left channel', oldState.channelID);
            let member = oldState.member;
            if (member.roles.cache.has(this.targetRole.id)) {
                let channel = client.channels.cache.get(this.currChannelID);
                console.log(channel);
                if (channel) {
                    await channel.leave();
                }
                this.currChannelID = null;
            }
        }
        else if (oldState.channelID === null) {
            console.log('user joined channel', oldState.channelID, newState.channelID);
            let member = newState.member;
            if (member.roles.cache.has(this.targetRole.id)) {
                console.log("Resetting new channel");
                this.currChannelID = newState.channelID;
                let channel = client.channels.cache.get(newState.channelID);
                this.connection = await channel.join();
            }
        } else {
            console.log('user moved channels', oldState.channelID, newState.channelID);
            let member = newState.member;
            if (member.roles.cache.has(this.targetRole.id)) {
                console.log("Resetting new channel");
                this.currChannelID = newState.channelID;
                client.channels.cache.get(this.currChannelID).leave();
                let channel = client.channels.cache.get(newState.channelID);
                this.connection = await channel.join();
            }
        }
    }
    guildMemberSpeakingHandler(member, speaking) {
        console.log("Speaking")
        if (member.roles.cache.has(this.targetRole.id)) {
            this.dispatcher = this.connection.play('./passion.mp3');
            this.dispatcher.on('finish', () => {
                console.log("replay");
                this.dispatcher = this.connection.play('./passion.mp3');
            });
            if (this.dispatcher && !speaking.bitfield) {
                this.dispatcher = this.dispatcher.destroy()
            }
        }
    }
}

// Event: Init ready
client.on('ready', () => { 
    console.log('Bot is ready');
    let guilds = client.guilds.cache.map(guild => guild.id);
    for (let i = 0; i < guilds.length; i++) {
        let guildID = guilds[i];
        let guild = client.guilds.cache.get(guilds[i]);
        let targetRole = guild.roles.cache.find((role) => {
            return role.name == targetRoleName;
        });
        let interrupter = new Interrupter(guildID, targetRole);
        interrupterMap.set(guildID, interrupter);
    }
    console.log("Done!")
});

// Event: User changes channel
client.on('voiceStateUpdate', async (oldState, newState) => {
    let interrupter;
    console.log("voiceStateUpdate");
    if (oldState != null) {
        interrupter = interrupterMap.get(oldState.guild.id);
    } else {
        interrupter = interrupterMap.get(newState.guild.id);
    }
    interrupter.voiceStateUpdateHandler(oldState, newState);
});

// Event: User speaking
client.on('guildMemberSpeaking', async (member, speaking) => {
    console.log("guildMemberSpeaking");
    let interrupter = interrupterMap.get(member.guild.id);
    interrupter.guildMemberSpeakingHandler(member, speaking);
});

// Event: Joined a server
client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    let targetRole = guild.roles.cache.find((role) => {
        return role.name == targetRoleName;
    });
    let interrupter = new Interrupter(guild.id, targetRole);
    interrupterMap.set(guild.id, interrupter);
})

//Event: Removed from a server
client.on("guildDelete", guild => {
    console.log("Left a guild: " + guild.name);
    interrupterMap.delete(guild.id);
    console.log(interrupterMap);
})

// todo: command to change mp3

client.login(process.env.BOT_TOKEN)
process.on('unhandledRejection', console.log)