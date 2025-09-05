const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const ServerBlacklist = require('../utils/blacklistserver_mongo');

const SUPPORT_INVITE = 'https://discord.gg/aq2drsa3Uq';

module.exports = {
  name: 'guildCreate',
  async execute(guild) { // Removed unused 'client' parameter
    const found = await ServerBlacklist.findOne({ serverId: guild.id });
    if (!found) return;

    const owner = await guild.fetchOwner().catch(() => null);
    const { reason, blacklistedBy, appealable, appealDate } = found;

    const embed = new EmbedBuilder()
      .setTitle('🚫-Blacklisted Server-🚫')
      .setColor('#ca0017')
      .addFields(
        { name: '— Server Name', value: guild.name || 'Unknown', inline: false },
        { name: '— Reason', value: reason || 'No reason provided', inline: false },
        { name: '— Blacklisted By', value: blacklistedBy ? `<@${blacklistedBy}>` : 'Unknown', inline: true },
        { name: '— Appealable?', value: appealable ? 'Yes' : 'No', inline: true },
        { name: '— Appeal Date', value: appealDate || 'N/A', inline: true },
        {
          name: '— Appeal Instructions',
          value: `If this is a mistake, appeal in our support server: [Support Server](${SUPPORT_INVITE})`,
          inline: false
        }
      )
      .setFooter({ text: `The bot will leave this server shortly.` })
      .setTimestamp();

    // Try to DM the owner
    if (owner) {
      owner.send({ embeds: [embed] }).catch(() => {});
    }

    let sent = false;
    // Try to send in the system channel if possible
    if (
      guild.systemChannel &&
      guild.systemChannel.permissionsFor(guild.members.me)?.has([
        PermissionsBitField.Flags.SendMessages,
        PermissionsBitField.Flags.EmbedLinks
      ])
    ) {
      try {
        await guild.systemChannel.send({ embeds: [embed] });
        sent = true;
      } catch {}
    }

    // Fallback: find the first text channel with permissions
    if (!sent) {
      const fallbackChannel = guild.channels.cache.find(
        c =>
          c.type === ChannelType.GuildText &&
          c.permissionsFor(guild.members.me)?.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks
          ])
      );
      if (fallbackChannel) {
        fallbackChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    // Optional: Log the blacklist leave for audit
    console.log(`[BLACKLIST] Left blacklisted server: ${guild.name} (${guild.id})`);

    setTimeout(() => {
      guild.leave().catch(() => {});
    }, 5000);
  }
};
