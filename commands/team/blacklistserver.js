const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ServerBlacklist = require('../../utils/blacklistserver_mongo');
const isAdmin = require('../../utils/isAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklistserver')
    .setDescription('Blacklist a server from using the bot')
    .addStringOption(opt =>
      opt.setName('serverid')
        .setDescription('ID of the server to blacklist')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason')
        .setDescription('Reason for blacklisting')
        .setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('appealable')
        .setDescription('Is the server appealable?')
        .setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('appealdate')
        .setDescription('Date when appeal is allowed (MM/DD/YYYY)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!(await isAdmin(interaction.user.id))) {
      return await interaction.reply({ content: '❌ You don\'t have permission to use this command.', ephemeral: true });
    }

    const serverId = interaction.options.getString('serverid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const appealable = interaction.options.getBoolean('appealable') ?? false;
    const appealDate = interaction.options.getString('appealdate');

    if (appealDate && !/^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/.test(appealDate)) {
      return await interaction.reply({ content: '❌ Invalid appeal date format. Use MM/DD/YYYY.', ephemeral: true });
    }

    try {
      const existing = await ServerBlacklist.findOne({ serverId });
      if (existing) {
        return await interaction.reply({ content: `⚠️ Server is already blacklisted.`, ephemeral: true });
      }

      await ServerBlacklist.create({
        serverId,
        reason,
        blacklistedBy: interaction.user.id,
        appealable,
        appealDate
      });

      const embed = new EmbedBuilder()
        .setTitle('🚫 Server Blacklisted')
        .setColor(0xFF0000)
        .addFields(
          { name: 'Server ID', value: serverId },
          { name: 'Reason', value: reason },
          { name: 'Blacklisted By', value: `<@${interaction.user.id}>` },
          { name: 'Appealable?', value: appealable ? 'Yes' : 'No' },
          { name: 'Appeal Date', value: appealDate || 'N/A' }
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      console.error(err);
      return await interaction.reply({ content: '❌ Failed to blacklist the server due to an error.', ephemeral: true });
    }
  }
};
