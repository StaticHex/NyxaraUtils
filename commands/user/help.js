const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show help information and commands'),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    const helpEmbed = new EmbedBuilder()
      .setTitle('Help Menu')
      .setDescription('Click the buttons below to see more info.')
      .setColor(0x5865F2)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('help_commands')
        .setLabel('User Commands')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('help_teamcmds')
        .setLabel('Team Commands')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [helpEmbed], components: [row], ephemeral: true });

    const collector = interaction.channel.createMessageComponentCollector({
      filter: i => i.user.id === interaction.user.id,
      time: 300000 // 5 minutes
    });

    collector.on('collect', async i => {
      if (i.customId === 'help_commands') {
        const commandsEmbed = new EmbedBuilder()
          .setTitle('User Commands')
          .setDescription(
            '`/help` - Display a list of available commands\n' +
            '`/setmodchannel` - Set the current channel as the moderation log channel\n' +
            '`/autoaction` - Configure automatic actions for events\n' +
            '`/configlookup` - Look up server configuration settings\n' +
            '`/say` - Make the bot say a message\n' +
            '`/userlookup` - Get information about a user\n' +
            '`/support` - Get support server invite\n\n-'
          )
          .setColor(0x000000);
        await i.update({ embeds: [commandsEmbed], components: [row] });
      } else if (i.customId === 'help_teamcmds') {
        const teamcommandsEmbed = new EmbedBuilder()
          .setTitle('Team Commands')
          .setDescription(
            '`/starlinkannounce` - Send a Starlink-related announcement\n' +
            '`/viewservers` - View all servers the bot is in\n' +
            '`/addadmin` - Grant administrator privileges to a user\n' +
            '`/removeadmin` - Revoke administrator privileges from a user\n' +
            '`/blacklistlookup` - Check if a user or server is blacklisted\n' +
            '`/blacklist` - Add a user to the bot\'s blacklist\n' +
            '`/unblacklist` - Remove a user from the bot\'s blacklist\n' +
            '`/blacklistserver` - Add a server to the bot\'s blacklist\n' +
            '`/unblacklistserver` - Remove a server from the bot\'s blacklist\n\n-'
          )
          .setColor(0x21394f);
        await i.update({ embeds: [teamcommandsEmbed], components: [row] });
      }
    });

    collector.on('end', async () => {
      const disabledRow = new ActionRowBuilder().addComponents(
        row.components.map(btn => ButtonBuilder.from(btn).setDisabled(true))
      );
      await interaction.editReply({ components: [disabledRow] }).catch(() => {});
    });
  }
};
