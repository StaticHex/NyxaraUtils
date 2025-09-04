const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, EmbedBuilder } = require('discord.js');
const { ServerSettings } = require('../utils/db');

function convertToMs(timeAmount, timeUnit) {
  switch (timeUnit) {
    case 'minutes': return timeAmount * 60 * 1000;
    case 'hours': return timeAmount * 60 * 60 * 1000;
    case 'days': return timeAmount * 24 * 60 * 60 * 1000;
    case 'months': return timeAmount * 30 * 24 * 60 * 60 * 1000;
    default: return timeAmount * 60 * 1000;
  }
}

async function autoActionCheck(client) {
  try {
    const settingsList = await ServerSettings.find({ 'autoAction.bindRoleId': { $exists: true } });

    for (const settings of settingsList) {
      const guild = client.guilds.cache.get(settings.guildId);
      if (!guild) continue;

      const { bindRoleId, checkRoleId, timeAmount, timeUnit, action } = settings.autoAction;
      if (!bindRoleId || !checkRoleId || !action) continue;

      const delayMs = convertToMs(timeAmount, timeUnit);

      setTimeout(() => {
        autoActionCheckForGuild(client, settings.guildId);
        setInterval(() => autoActionCheckForGuild(client, settings.guildId), delayMs);
      }, delayMs);

    }
  } catch (err) {
    console.error('AutoAction: Error during scheduled check:', err);
  }
}

async function autoActionCheckForGuild(client, guildId) {
  await runAutoActionForGuild(client, guildId);
}

async function runAutoActionForGuild(client, guildId) {
  const settings = await ServerSettings.findOne({ guildId });
  if (!settings || !settings.autoAction) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const { bindRoleId, checkRoleId, timeAmount, timeUnit, action } = settings.autoAction;
  const delayMs = convertToMs(timeAmount, timeUnit);

  try {
    await guild.members.fetch().catch(() => {});

    const bindRole = guild.roles.cache.get(bindRoleId);
    const checkRole = guild.roles.cache.get(checkRoleId);
    if (!bindRole || !checkRole) return;

    const membersToMonitor = guild.members.cache.filter(member => member.roles.cache.has(bindRole.id));
    const reason = settings.autoAction?.defaultReason || 'Failed role check after monitoring period (AutoAction).';

    for (const member of membersToMonitor.values()) {
      const freshMember = await guild.members.fetch(member.id).catch(() => null);
      if (!freshMember || freshMember.user.bot || freshMember.id === guild.ownerId) continue;

      if (
        freshMember.roles.cache.has(bindRole.id) &&
        !freshMember.roles.cache.has(checkRole.id)
      ) {
        if (action === 'kick') {
          await freshMember.kick(reason);
          console.log(`AutoAction: Kicked ${freshMember.user.tag} in ${guild.name}.`);
        } else if (action === 'ban') {
          await freshMember.ban({ reason });
          console.log(`AutoAction: Banned ${freshMember.user.tag} in ${guild.name}.`);
        } else if (action === 'modalert') {
          if (!settings.modChannelId) {
            console.warn(`AutoAction: No mod channel configured for guild ${guild.name}.`);
            continue;
          }
          const modChannel = guild.channels.cache.get(settings.modChannelId);
          if (!modChannel || !modChannel.isTextBased()) {
            console.warn(`AutoAction: Mod channel invalid or missing for guild ${guild.name}.`);
            continue;
          }

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`autoaction_kick_${freshMember.id}_${checkRole.id}`)
              .setLabel('Kick')
              .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
              .setCustomId(`autoaction_ban_${freshMember.id}_${checkRole.id}`)
              .setLabel('Ban')
              .setStyle(ButtonStyle.Danger),

            new ButtonBuilder()
              .setCustomId(`autoaction_moreinfo_${freshMember.id}_${checkRole.id}`)
              .setLabel('More Info')
              .setStyle(ButtonStyle.Primary)
          );

          await modChannel.send({
            embeds: [{
              title: '🚨 AutoAction: Role Check Failed',
              description: `**User:** ${freshMember.user.tag} (\`${freshMember.id}\`)
              **Missing Role:** **${checkRole.name}**
              **Action:** Manual moderation required.`,
              color: 0xff000d,
              timestamp: new Date()
            }],
            components: [row]
          });

          console.log(`AutoAction: Sent mod alert for ${freshMember.user.tag} in ${guild.name}.`);
        }
      }
    }
  } catch (err) {
    if (
      err.code === 50013 &&
      err.message?.includes('Missing Permissions') &&
      err.url?.includes(`/bans/${guild.ownerId}`)
    ) {
      console.warn(`AutoAction: Tried to ban/kick the guild owner in ${guild.name} — skipping.`);
    } else {
      console.error(`AutoAction: Failed to perform action in guild ${guild.name}:`, err);
    }
  }
}


async function interactionHandler(interaction) {
  if (interaction.isButton()) {
    const { customId, guild } = interaction;

    if (!customId.startsWith('autoaction_')) return;

    const [_, action, targetUserId] = customId.split('_');
    if (!action || !targetUserId) return;

    const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
    if (!targetMember) {
      await interaction.reply({ content: `❌ User not found in this guild.`, ephemeral: true });
      return;
    }

    if (action === 'kick' || action === 'ban') {
      if (
    (action === 'kick' && !interaction.member.permissions.has('KickMembers')) ||
    (action === 'ban' && !interaction.member.permissions.has('BanMembers'))
  ) {
    return interaction.reply({ content: `❌ You don’t have permission to ${action} members.`, ephemeral: true });
  }

      const modal = new ModalBuilder()
        .setCustomId(`autoaction_reason_${action}_${targetUserId}`)
        .setTitle(`${action.charAt(0).toUpperCase() + action.slice(1)} Reason`);

      const reasonInput = new TextInputBuilder()
        .setCustomId('reasonInput')
        .setLabel('Please enter the reason')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Enter reason for moderation action...')
        .setRequired(true)
        .setMaxLength(512);

      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }
    else if (action === 'moreinfo') {
      const embed = new EmbedBuilder()
        .setTitle(`User Info: ${targetMember.user.tag}`)
        .setThumbnail(targetMember.user.displayAvatarURL())
        .addFields(
          { name: 'User ID', value: targetMember.id, inline: true },
          { name: 'Username', value: targetMember.user.username, inline: true },
          { name: 'Discriminator', value: `#${targetMember.user.discriminator}`, inline: true },
          { name: 'Joined Server', value: `<t:${Math.floor(targetMember.joinedTimestamp / 1000)}:R>`, inline: true },
          { name: 'Created Account', value: `<t:${Math.floor(targetMember.user.createdTimestamp / 1000)}:R>`, inline: true },
          { name: 'Roles', value: targetMember.roles.cache.map(r => r.name).join(', ').slice(0, 1024) || 'None' }
        )
        .setColor('Blue')
        .setTimestamp();

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  }
  else if (interaction.isModalSubmit()) {
    const { customId, guild } = interaction;

    if (!customId.startsWith('autoaction_reason_')) return;

    const [, , action, targetUserId] = customId.split('_');

    const reason = interaction.fields.getTextInputValue('reasonInput').trim();

    const targetMember = await guild.members.fetch(targetUserId).catch(() => null);
    if (!targetMember) {
      await interaction.reply({ content: `❌ User not found in this guild.`, ephemeral: true });
      return;
    }

    try {
      if (action === 'kick') {
        await targetMember.kick(reason);
        await interaction.reply({ content: `✅ Kicked ${targetMember.user.tag} with reason: ${reason}`, ephemeral: true });
      }
      else if (action === 'ban') {
        await targetMember.ban({ reason });
        await interaction.reply({ content: `✅ Banned ${targetMember.user.tag} with reason: ${reason}`, ephemeral: true });
      }
      else {
        await interaction.reply({ content: `❌ Unknown action: ${action}`, ephemeral: true });
      }
    } catch (error) {
      console.error(`Failed to ${action} ${targetMember.user.tag}:`, error);
      await interaction.reply({ content: `❌ Failed to ${action} user: ${error.message}`, ephemeral: true });
    }
  }
}

module.exports = {
  autoActionCheck,
  autoActionCheckForGuild,
  interactionHandler,
};
