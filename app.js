/* 
 * app.js is the main file for the Interrupter's functionality
 *
 * The bot will listen to events from Discord and talk over user with
 * the role "Target"
 * 
 * Made by: @nathan-149
*/

const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();
const targetRoleName = "Target";
var interrupterMap = new Map();
var fs = require('fs');
var soundFolder = fs.readdirSync('./sounds');
var validSounds = new Set();

class Interrupter {
    constructor(guild, targetRole) {
        this.guild = guild;
        this.targetRole = targetRole;
        this.connection = null;
        this.dispatcher = null;
        this.currChannelID = null;
        this.sound = 'passion'
    }

    async voiceStateUpdateHandler(oldState, newState) { 
         if (this.targetRole == undefined) {
            let aState = (oldState === null) ? newState : oldState;
            this.targetRole = aState.guild.roles.cache.find((role) => {
                return role.name == targetRoleName;
            });
            console.log(this.targetRole);
        }
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
            console.log('User joined channel', oldState.channelID, newState.channelID);
            let member = newState.member;
            if (member.roles.cache.has(this.targetRole.id)) {
                console.log("Resetting new channel");
                this.currChannelID = newState.channelID;
                let channel = client.channels.cache.get(newState.channelID);
                this.connection = await channel.join();
            }
        } else {
            console.log('User moved channels from ', oldState.channelID, ' to ', newState.channelID);
            let member = newState.member;
            if (member.roles.cache.has(this.targetRole.id)) {
                this.currChannelID = newState.channelID;
                client.channels.cache.get(this.currChannelID).leave();
                let channel = client.channels.cache.get(newState.channelID);
                this.connection = await channel.join();
            }
        }
    }
    async guildMemberSpeakingHandler(member, speaking) {
        console.log("Interrupting")
        if (member.roles.cache.has(this.targetRole.id)) {
            let currSound = './sounds/' + this.sound + '.mp3';
            console.log(currSound);
            this.dispatcher = this.connection.play(currSound);
            // Replay audio if necessary
            this.dispatcher.on('finish', () => {
                this.dispatcher = this.connection.play(currSound);
            });
            if (this.dispatcher && !speaking.bitfield) {
                this.dispatcher = this.dispatcher.destroy()
            }
        }
    }
    async commandHandler(channel, commands) {
        switch(commands[0]) {
            case "changeSound":
                this.changeSoundCommandHandler(channel, commands.splice(1));
                break;
            case "help":
                channel.send('Hi! Im the Interrupter Bot. Add a role named "Target"' +
                             'and I will talk over the user that has the role.\n' +
                             'Valid commands: \n' +
                             'changeSound [' + [...validSounds].join('/') + ']\n' +
                             'help'
                            );
                break;
            default:
                console.log("Not a valid command");
        }
    }
    async changeSoundCommandHandler(channel, sound) {
        if (validSounds.has(String(sound))) {
            this.sound = sound;
            channel.send('Changed sound to: ' + sound);
        } else {
            channel.send('Invalid sound: ' + sound + '\n' + 
                         'Valid Sounds:\n' + [...validSounds].join(', '));
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
        let interrupter = new Interrupter(guild, targetRole);
        interrupterMap.set(guildID, interrupter);
    }
    for (let i = 0; i < soundFolder.length; i++) {
        validSounds.add(soundFolder[i].split('.')[0]);
    }
    console.log("Setup Complete")
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
client.on("guildCreate", async guild => {
    console.log("Joined a new guild: " + guild.name);
    let targetRole = guild.roles.cache.find((role) => {
        return role.name == targetRoleName;
    });
    console.log("new target: " + targetRole);
    let interrupter = new Interrupter(guild.id, targetRole);
    interrupterMap.set(guild.id, interrupter);
})

//Event: Removed from a server
client.on("guildDelete", async guild => {
    console.log("Left a guild: " + guild.name);
    interrupterMap.delete(guild.id);
    console.log(interrupterMap);
})

//Event: Client sends message
client.on("message", async message => {
    let messageArr = message.toString().split(" ");
    if(messageArr[0] !== "!interrupter" || messageArr.length < 2) return; 
    let interrupter = interrupterMap.get(message.guild.id);
    interrupter.commandHandler(message.channel, messageArr.splice(1));
})

client.login(process.env.BOT_TOKEN)
process.on('unhandledRejection', console.log)