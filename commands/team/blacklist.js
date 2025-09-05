const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Blacklist = require('../../utils/blacklistmongo');
const isAdmin = require('../../utils/isAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('Blacklist a user from using the bot. (BOT OWNER)')
    .addUserOption(option => option.setName('user').setDescription('The user to blacklist.').setRequired(true))
    .addStringOption(option => option.setName('reason').setDescription('The reason for blacklisting the user.').setRequired(false))
    .addStringOption(option => option.setName('appeal').setDescription('Set the appeal status.').addChoices(
      { name: 'No Appeal', value: 'NO APPEAL' },
      { name: 'Yes Appealable', value: 'YES APPEALABLE' }
    ).setRequired(false)),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!(await isAdmin(interaction.user.id))) {
      return await interaction.reply({ content: '❌ You don\'t have permission to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    if (user.id === interaction.user.id) {
      return await interaction.reply({ content: '❌ You cannot blacklist yourself.', ephemeral: true });
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const appealStatus = interaction.options.getString('appeal') || 'NO APPEAL';

    try {
      await Blacklist.findOneAndUpdate(
        { userId: user.id },
        { reason, appealStatus },
        { upsert: true }
      );

      const embed = new EmbedBuilder()
        .setTitle('User Blacklisted')
        .setColor(0xff0000)
        .addFields(
          { name: 'User', value: user.tag, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Appeal Status', value: appealStatus, inline: true }
        )
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Failed to blacklist the user due to an error.', ephemeral: true });
      }
    }
  },
};



