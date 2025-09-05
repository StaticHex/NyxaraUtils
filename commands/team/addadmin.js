const { SlashCommandBuilder } = require('discord.js');
const Admin = require('../../utils/Admin');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addadmin')
    .setDescription('Add a user as a blacklist admin.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to add as admin')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (interaction.user.id !== config.ownerId) {
      return interaction.reply({ content: '❌ You don\'t have permission.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');

    try {
      const existing = await Admin.findOne({ userId: user.id });
      if (existing) {
        return interaction.reply({ content: `${user.tag} is already an admin.`, ephemeral: true });
      }

      await Admin.create({ userId: user.id });
      return interaction.reply({ content: `✅ Added ${user.tag} as a blacklist admin.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Failed to add admin.', ephemeral: true });
      }
    }
  }
};
