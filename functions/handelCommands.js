const { REST } = require("@discordjs/rest");
const { Routes } = require('discord-api-types/v9');
const fs = require('fs');
const path = require('path');
const Blacklist = require('../utils/blacklistmongo');

const clientId = '1388569472993857556';

module.exports = (client) => {
  client.handleCommands = async (commandFolders, commandsPath) => {
    client.commandArray = [];

    client.checkBlacklist = async (interaction) => {
      const userId = interaction.user?.id || interaction.member?.user?.id;
      try {
        const entry = await Blacklist.findOne({ userId });
        if (entry) {
          const reason = entry.reason || 'No reason provided';

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
        return true;
      }
    };

    for (const folder of commandFolders) {
      const commandFiles = fs
        .readdirSync(`${commandsPath}/${folder}`)
        .filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(`../commands/${folder}/${file}`);
        client.commands.set(command.data.name, command);
        client.commandArray.push(command.data.toJSON());
      }
    }

    const rest = new REST({ version: '9' }).setToken(process.env.token);

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
