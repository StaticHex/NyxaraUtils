const { Interaction } = require("discord.js");

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isCommand()) return;

    client.interactionCount = client.interactionCount || 0;
    client.interactionCount++;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      console.error(error);
      // Avoid double reply error
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true
        }).catch(() => {});
      } else {
        await interaction.reply({
          content: 'There was an error while executing this command!',
          ephemeral: true
        }).catch(() => {});
      }
    }
  },
};