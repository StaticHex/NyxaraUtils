const { SlashCommandBuilder } = require('discord.js');
const Admin = require('../../utils/Admin');
const config = require('../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeadmin')
    .setDescription('Remove a user from the blacklist admin list.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove from admin list')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (interaction.user.id !== config.ownerId) {
      return await interaction.reply({ content: '❌ You don\'t have permission.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');

    try {
      const result = await Admin.findOneAndDelete({ userId: user.id });

      if (!result) {
        return await interaction.reply({ content: `ℹ️ ${user.tag} is not an admin.`, ephemeral: true });
      }

      return await interaction.reply({ content: `✅ Removed ${user.tag} from the admin list.`, ephemeral: true });
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ content: '❌ Failed to remove admin.', ephemeral: true });
      }
    }
  }
};
