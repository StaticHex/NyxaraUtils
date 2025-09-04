const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configlookup')
    .setDescription('View the saved auto-action config and mod alert channel for this server'),

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
    try {
      const settings = await ServerSettings.findOne({ guildId: interaction.guild.id });

      if (!settings) {
        return interaction.reply({ content: '❌ No config found for this server.', ephemeral: true });
      }

      const { autoAction, modChannelId } = settings;

      if (
        !autoAction ||
        !autoAction.bindRoleId ||
        !autoAction.checkRoleId ||
        !autoAction.timeAmount ||
        !autoAction.timeUnit ||
        !autoAction.action
      ) {
        return interaction.reply({ content: '❌ Auto-action config not fully set up for this server.', ephemeral: true });
      }

      const bindRole = interaction.guild.roles.cache.get(autoAction.bindRoleId);
      const checkRole = interaction.guild.roles.cache.get(autoAction.checkRoleId);
      const modChannel = modChannelId ? interaction.guild.channels.cache.get(modChannelId) : null;

      const embed = new EmbedBuilder()
        .setTitle('Server Configuration')
        .addFields(
          { name: 'Monitored Role', value: bindRole ? bindRole.name : `Role not found (ID: ${autoAction.bindRoleId})`, inline: true },
          { name: 'Required Role', value: checkRole ? checkRole.name : `Role not found (ID: ${autoAction.checkRoleId})`, inline: true },
          { name: `Delay (${autoAction.timeUnit})`, value: `${autoAction.timeAmount}`, inline: true },
          { name: 'Action', value: autoAction.action, inline: true },
          { name: 'Mod Alert Channel', value: modChannel ? `<#${modChannel.id}>` : 'Not configured', inline: true }
        )
        .setColor(0xff000d)
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error fetching config:', error);
      return interaction.reply({ content: '❌ Error retrieving configuration.', ephemeral: true });
    }
  }
};
