const { SlashCommandBuilder } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('optout')
    .setDescription('Opt-out of Starlink ban collection and announcements.'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ Only administrators can opt-out of Starlink ban collection.',
        ephemeral: true
      });
    }

    await ServerSettings.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { banCollectionOptIn: false },
      { upsert: true }
    );

    return interaction.reply({
      content: '🚫 This server has opted-out of Starlink ban collection. No announcements or reports will be received.',
      ephemeral: true
    });
  }
};
