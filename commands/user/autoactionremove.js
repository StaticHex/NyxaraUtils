const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeautoaction')
    .setDescription('Remove the autoaction role check and action for this server.'),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)
    ) {
      return await interaction.reply({
        content: '❌ You need Administrator or Manage Roles permission to use this command.',
        ephemeral: true
      });
    }

    const guildId = interaction.guild.id;

    try {
      const settings = await ServerSettings.findOne({ guildId });

      if (!settings || !settings.autoAction) {
        return await interaction.reply({ content: '❌ No active autoaction configuration found for this server.', ephemeral: true });
      }

      await ServerSettings.findOneAndUpdate(
        { guildId },
        { $unset: { autoAction: '' } }
      );

      const successEmbed = new EmbedBuilder()
        .setTitle('✅ AutoAction Removed')
        .setDescription('The autoaction role check and action have been removed from this server.')
        .setColor(0x00FF00)
        .setTimestamp();

      return await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (err) {
      console.error(err);
      return await interaction.reply({ content: '❌ Failed to remove autoaction due to an error.', ephemeral: true });
    }
  }
};