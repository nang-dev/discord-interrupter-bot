const Discord = require('discord.js');
require('dotenv').config();

const client = new Discord.Client();

let connection, dispatcher;

client.on('ready', () => {
    console.log('Bot is ready'); 
});

client.on('message', async message => {
	// Join the same voice channel of the author of the message
	if (message.content === 'start' && message.member.voice.channel) {
		connection = await message.member.voice.channel.join();
        //dispatcher = connection.play('passion.mp3');
	}
});

client.on('guildMemberSpeaking', async (_, speaking) => {
    console.log("Speaking")
    dispatcher = connection.play('passion.mp3');
    if (dispatcher && !speaking.bitfield) {
        dispatcher = dispatcher.destroy()
    }
});

client.login(process.env.BOT_TOKEN)

