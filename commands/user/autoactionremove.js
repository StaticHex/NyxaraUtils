const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeautoaction')
    .setDescription('Remove the autoaction role check and action for this server.'),

  async execute(interaction) {
       const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;
      if (!interaction.member.permissions.has('Administrator') &&
      !interaction.member.permissions.has('ManageRoles')) {
    return interaction.reply({
      content: '❌ You need Administrator or Manage Roles permission to use this command.',
      ephemeral: true
    });
  }
    const guildId = interaction.guild.id;

    const settings = await ServerSettings.findOne({ guildId });

    if (!settings || !settings.autoAction) {
      return interaction.reply({ content: '❌ No active autoaction configuration found for this server.', ephemeral: true });
    }

    await ServerSettings.findOneAndUpdate(
      { guildId },
      { $unset: { autoAction: '' } }
    );

    const successEmbed = new EmbedBuilder()
      .setTitle('✅ AutoAction Removed')
      .setDescription('The autoaction role check and action have been removed from this server.')
      .setColor('Green')
      .setTimestamp();

    await interaction.reply({ embeds: [successEmbed], ephemeral: true });
  }
};