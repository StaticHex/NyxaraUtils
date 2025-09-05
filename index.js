const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

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

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log('✅ Connected to MongoDB');
    client.login(process.env.TOKEN); // Use uppercase TOKEN
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
    for (const file of functions) { // Use 'const' in for loop
        try {
            require(`./functions/${file}`)(client);
        } catch (err) {
            console.error(`Failed to load function file ${file}:`, err);
        }
    }
    try {
        await client.handleEvents(eventFiles, "./events");
        await client.handleCommands(commandFolders, "./commands");
    } catch (err) {
        console.error('Error during handler registration:', err);
    }
})();

