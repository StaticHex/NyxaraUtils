const { ServerSettings } = require('../utils/db');

module.exports = async function requireModChannel(interaction) {
  const guildId = interaction.guildId;
  const settings = await ServerSettings.findOne({ guildId });

  if (!settings || !settings.modChannelId) {
    await interaction.editReply({
      content: '❌ This command requires a mod channel to be set. Use </setmodchannel:1388580546216726542> to set one first.',
      ephemeral: true
    });
    return null;
  }

  return settings;
};
