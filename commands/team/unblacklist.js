const { SlashCommandBuilder } = require('discord.js');
const Blacklist = require('../../utils/blacklistmongo');
const isAdmin = require('../../utils/isAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unblacklist')
    .setDescription('Remove a user from the blacklist. (BOT OWNER)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('The user to unblacklist.')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!(await isAdmin(interaction.user.id))) {
      return await interaction.reply({ content: '❌ You don\'t have permission to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    if (!user) {
      return await interaction.reply({ content: "⚠️ Invalid user provided.", ephemeral: true });
    }

    try {
      const result = await Blacklist.findOneAndDelete({ userId: user.id });

      if (!result) {
        return await interaction.reply({
          content: `ℹ️ User ${user.tag} is not blacklisted.`,
          ephemeral: true
        });
      }

      return await interaction.reply({
        content: `✅ User ${user.tag} has been removed from the blacklist.`,
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: "❌ An error occurred while unblacklisting the user.",
        ephemeral: true
      });
    }
  }
};
