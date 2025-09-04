const { SlashCommandBuilder } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('optin')
    .setDescription('Opt-in to Starlink ban collection and announcements.'),

  async execute(interaction) {
    if (!interaction.member.permissions.has('Administrator')) {
      return interaction.reply({
        content: '❌ Only administrators can opt-in to Starlink ban collection.',
        ephemeral: true
      });
    }

    await ServerSettings.findOneAndUpdate(
      { guildId: interaction.guild.id },
      { banCollectionOptIn: true },
      { upsert: true }
    );

    return interaction.reply({
      content: '✅ This server has opted-in to Starlink ban collection and will receive announcements and join reports.',
      ephemeral: true
    });
  }
};
