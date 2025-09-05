const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerBlacklist = require('../../utils/blacklistserver_mongo');
const isAdmin = require('../../utils/isAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unblacklistserver')
    .setDescription('Remove a server from the blacklist')
    .addStringOption(opt =>
      opt.setName('serverid')
        .setDescription('The ID of the server to unblacklist')
        .setRequired(true)
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!(await isAdmin(interaction.user.id))) {
      return await interaction.reply({ content: '❌ You don\'t have permission to use this command.', ephemeral: true });
    }

    const serverId = interaction.options.getString('serverid');

    try {
      const existing = await ServerBlacklist.findOne({ serverId });
      if (!existing) {
        return await interaction.reply({
          content: `✅ Server \`${serverId}\` is not on the blacklist.`,
          ephemeral: true
        });
      }

      await ServerBlacklist.deleteOne({ serverId });

      const embed = new EmbedBuilder()
        .setTitle('✅ Server Unblacklisted ✅')
        .setColor(0x00FF00)
        .setDescription(`Server ID: \`${serverId}\` has been removed from the blacklist.`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error(err);
      return await interaction.reply({
        content: '❌ An error occurred while unblacklisting the server.',
        ephemeral: true
      });
    }
  }
};
