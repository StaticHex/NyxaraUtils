const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removemodchannel')
    .setDescription('Remove the currently set moderation alert channel for this server'),

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

      if (!settings || !settings.modChannelId) {
        return await interaction.reply({
          content: '⚠️ There is no mod channel set for this server.',
          ephemeral: true
        });
      }

      await ServerSettings.findOneAndUpdate(
        { guildId },
        { $unset: { modChannelId: "" } }
      );

      return await interaction.reply({
        content: '✅ Mod alert channel has been removed.',
        ephemeral: true
      });

    } catch (err) {
      console.error(err);
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({
          content: '❌ Failed to remove the mod channel.',
          ephemeral: true
        });
      }
    }
  },
};
