const { Client, GatewayIntentBits,Partials,ActivityType, EmbedBuilder, PermissionsBitField, Permissions, MessageManager, Embed, Collection } = require(`discord.js`);
const fs = require('fs');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
       GatewayIntentBits.GuildModeration,   
        GatewayIntentBits.GuildMembers,     
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,  
    ],
    partials: [
        Partials.Channel,
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Reaction
        
    ],
});
const { autoActionCheck, interactionHandler } = require('./events/check');

client.commands = new Collection();

const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('✅ Connected to MongoDB');
    client.login(process.env.token)
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
});
client.once('ready', () => {
  autoActionCheck(client);
});

client.on('interactionCreate', interactionHandler);
const functions = fs.readdirSync("./functions").filter(file => file.endsWith(".js"));
const eventFiles = fs.readdirSync("./events").filter(file => file.endsWith(".js"));
const commandFolders = fs.readdirSync("./commands");

(async () => {
    for (file of functions) {
        require(`./functions/${file}`)(client);
    }
    client.handleEvents(eventFiles, "./events");
    client.handleCommands(commandFolders, "./commands");
})();

