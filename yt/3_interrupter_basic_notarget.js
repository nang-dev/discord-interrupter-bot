const Discord = require("discord.js");
const config = require("./config.json");
// https://discord.com/api/oauth2/authorize?client_id=873064186438115409&permissions=3147776&scope=bot

// 3

const client = new Discord.Client();
let channel;

client.on('message', async message => {
	// Join the same voice channel of the author of the message
	if (message.content === 'start' && message.member.voice.channel) {
		connection = await message.member.voice.channel.join();
        channel = message.channel;
        //dispatcher = connection.play('passion.mp3');
	}
});

client.on('guildMemberSpeaking', async (member, speaking) => {
    console.log("Speaking")
    dispatcher = connection.play('../sounds/passion.mp3');
    if (dispatcher && !speaking.bitfield) {
        dispatcher = dispatcher.destroy()
    }
});

client.login(config.BOT_TOKEN);
