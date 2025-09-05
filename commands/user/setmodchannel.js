const { SlashCommandBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmodchannel')
    .setDescription('Set the moderation alert channel for this server')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('Channel to send moderation alerts to')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true)
    ),

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

    const channel = interaction.options.getChannel('channel');
    const guildId = interaction.guild.id;

    try {
      await ServerSettings.findOneAndUpdate(
        { guildId },
        { modChannelId: channel.id },
        { upsert: true, new: true }
      );

      return await interaction.reply({ content: `✅ Mod alert channel set to <#${channel.id}>`, ephemeral: true });
    } catch (err) {
      console.error(err);
      if (!interaction.replied && !interaction.deferred) {
        return await interaction.reply({ content: `❌ Failed to set channel.`, ephemeral: true });
      }
    }
  },
};
