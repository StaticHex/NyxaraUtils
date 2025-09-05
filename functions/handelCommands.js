const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v10'); // Use v10 for latest API
const fs = require('fs');
const path = require('path');
const Blacklist = require('../utils/blacklistmongo');

const clientId = '1388569472993857556';

module.exports = (client) => {
  // Ensure client.commands is initialized
  if (!client.commands) client.commands = new Map();

  client.handleCommands = async (commandFolders, commandsPath) => {
    client.commandArray = [];

    // Blacklist check utility
    client.checkBlacklist = async (interaction) => {
      const userId = interaction.user?.id || interaction.member?.user?.id;
      try {
        const entry = await Blacklist.findOne({ userId });
        if (entry) {
          const reason = entry.reason || 'No reason provided';
          console.log(`[BLACKLIST] Blocked user ${userId}: ${reason}`);

          if (!interaction.deferred && !interaction.replied) {
            await interaction.reply({
              content: `⛔ You are blacklisted from using this bot.\n**Reason:** ${reason}`,
              ephemeral: true
            });
          }
          return true;
        }
        return false;
      } catch (error) {
        console.error('MongoDB Error in checkBlacklist:', error);
        if (!interaction.deferred && !interaction.replied) {
          await interaction.reply({
            content: '❌ An error occurred while checking blacklist status.',
            ephemeral: true
          });
        }
        // Consider: return false here if you want to allow on DB error
        return true;
      }
    };

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(path.join(commandsPath, folder))
        .filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join('..', 'commands', folder, file));
        client.commands.set(command.data.name, command);
        client.commandArray.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

    try {
      console.log('🔄 Refreshing application (/) commands...');
      await rest.put(
        Routes.applicationCommands(clientId),
        { body: client.commandArray }
      );
      console.log('✅ Successfully reloaded application (/) commands.');
    } catch (error) {
      console.error('❌ Command registration error:', error);
    }
  };
};
