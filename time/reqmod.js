const { ServerSettings } = require('../utils/db');

module.exports = async function requireModChannel(interaction) {
  const guildId = interaction.guildId;
  const settings = await ServerSettings.findOne({ guildId });

  if (!settings || !settings.modChannelId) {
    // Use reply if not already replied/deferred, otherwise use editReply
    const errorMsg = {
      content: '❌ This command requires a mod channel to be set. Use </setmodchannel:1388580546216726542> to set one first.',
      ephemeral: true
    };
    if (interaction.replied || interaction.deferred) {
      await interaction.editReply(errorMsg);
    } else {
      await interaction.reply(errorMsg);
    }
    return null;
  }

  return settings;
};
