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
      return interaction.reply({ content: '❌ You don\'t have permission.', flags: 64 });
    }

    const user = interaction.options.getUser('user');

    try {
      const result = await Admin.findOneAndDelete({ userId: user.id });

      if (!result) {
        return interaction.reply({ content: `ℹ️ ${user.tag} is not an admin.`, flags: 64 });
      }

      return interaction.reply({ content: `✅ Removed ${user.tag} from the admin list.` });
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Failed to remove admin.', flags: 64 });
      }
    }
  }
};
