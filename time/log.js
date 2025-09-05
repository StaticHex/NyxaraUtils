const { EmbedBuilder } = require('discord.js');
const { ServerSettings } = require('../utils/db');

async function sendModLogEmbed(client, guildId, type, data = {}) {
  try {
    const settings = await ServerSettings.findOne({ guildId });
    if (!settings?.modChannelId) {
      console.warn(`[sendModLogEmbed] No modChannelId set for guild ${guildId}.`);
      return;
    }

    const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      console.warn(`[sendModLogEmbed] Guild not found: ${guildId}`);
      return;
    }

    const channel = guild.channels.cache.get(settings.modChannelId) || await guild.channels.fetch(settings.modChannelId).catch(() => null);
    if (!channel?.isTextBased()) {
      console.warn(`[sendModLogEmbed] Mod channel not found or not text-based: ${settings.modChannelId} in guild ${guildId}`);
      return;
    }

    const embed = new EmbedBuilder().setTimestamp();

    switch (type) {
      case 'ROLE_ASSIGNED':
        embed
          .setTitle('✅ Temporary Role Assigned')
          .setDescription([
            `**User:** <@${data.userId}>`,
            `**Role:** <@&${data.roleId}>`,
            `**Duration:** ${data.duration}`,
            `**Reason:** ${data.reason || 'No reason provided'}`,
            `**Assigned by:** <@${data.assignedBy}>`
          ].join('\n'))
          .setColor(0x57F287);
        break;

      case 'TIMER_EXPIRED':
        embed
          .setTitle('⏳ Timer Expired')
          .setDescription([
            `**User:** <@${data.userId}>`,
            `**Role:** <@&${data.roleId}>`,
            `**Removed automatically when timer expired.**`
          ].join('\n'))
          .setColor(0xED4245);
        break;

      case 'ADMIN_BYPASS':
        embed
          .setTitle('🛡️ Admin Bypassed Timer')
          .setDescription([
            `**User:** <@${data.userId}>`,
            `**Role:** <@&${data.roleId}>`,
            `**Admin:** <@${data.bypassedBy}>`,
            `**Reason:** Manual role removal. Timer deleted.`
          ].join('\n'))
          .setColor(0xFEE75C);
        break;

      case 'TIMER_READD':
        embed
          .setTitle('🔄 Timer Active — Re-adding Role')
          .setDescription([
            `**User:** <@${data.userId}>`,
            `**Role:** <@&${data.roleId}>`,
            `**Reason:** Role was removed before timer expired.`
          ].join('\n'))
          .setColor(0x5865F2);
        break;

      case 'MOD_CHANNEL_UPDATE':
        embed
          .setTitle('📢 Mod Channel Updated')
          .setDescription([
            `**New Channel:** <#${data.channelId}>`,
            `**Updated by:** <@${data.updatedBy}>`
          ].join('\n'))
          .setColor(0x2F3136);
        break;

      default:
        console.warn(`[sendModLogEmbed] Unknown log type: ${type}`);
        return;
    }

    await channel.send({ embeds: [embed] });

  } catch (err) {
    console.error(`[sendModLogEmbed] Failed to log "${type}" event:`, err);
  }
}

module.exports = sendModLogEmbed;
