const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Get a link to the support server'),

  async execute(interaction) {
         const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;
    const SUPPORT_INVITE = 'https://discord.gg/aq2drsa3Uq';

    await interaction.reply({
      content: `Need help? Join the support server:\n🔗 ${SUPPORT_INVITE}`,
      ephemeral: false
    });
  }
};
