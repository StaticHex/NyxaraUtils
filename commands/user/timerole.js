const { SlashCommandBuilder } = require('discord.js');
const TimerRole = require('../../utils/timerole_s');
const requireModChannel = require('../../time/reqmod');

function parseFlexibleDuration(str) {
  const regex = /(\d+)(month|d|h|m)/gi;
  let totalMs = 0;
  let matched = false;

  let match;
  while ((match = regex.exec(str)) !== null) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    matched = true;

    switch (unit) {
      case 'm': totalMs += value * 60 * 1000; break; 
      case 'h': totalMs += value * 60 * 60 * 1000; break;
      case 'd': totalMs += value * 24 * 60 * 60 * 1000; break; 
      case 'month': totalMs += value * 30 * 24 * 60 * 60 * 1000; break; 
    }
  }

  return matched ? totalMs : null;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timerole')
    .setDescription('Assign roles to a user for a time, then remove them.')
    .addUserOption(opt => opt.setName('target').setDescription('User to assign roles to').setRequired(true))
    .addStringOption(opt => opt.setName('roles').setDescription('Role mentions or IDs, comma or space separated').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Time like 30m, 1h, 2d, 1month').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason').setRequired(false)),

  async execute(interaction) {
    try {
      const isBlacklisted = await interaction.client.checkBlacklist?.(interaction);
      if (isBlacklisted) return;
      await interaction.deferReply({ ephemeral: true });

      const settings = await requireModChannel(interaction);
      if (!settings) return;

      if (!interaction.member.permissions.has('ManageRoles') && !interaction.member.permissions.has('Administrator')) {
        return interaction.editReply({ content: '❌ You need Manage Roles or Administrator permission to use this command.' });
      }

      if (!interaction.client.timerRoleManager) {
        return interaction.editReply({ content: '❌ Timer system not active. Try again later.' });
      }



      const guild = interaction.guild;
      const target = interaction.options.getMember('target');
      const rolesInput = interaction.options.getString('roles');
      const durationStr = interaction.options.getString('duration');
      const reason = interaction.options.getString('reason') || 'No reason provided';


      const delayMs = parseFlexibleDuration(durationStr);
      if (!delayMs) {
        return interaction.editReply({ content: '❌ Invalid duration format. Use examples like 30m, 2h, 1d, 1month, etc.' });
      }

      if (!target) {
        return interaction.editReply({ content: '❌ Target user not found.' });
      }

      const roleIds = rolesInput.split(/[ ,]+/).map(r => r.replace(/[<@&>]/g, '')).filter(r => r.length > 0);
      const rolesToAssign = roleIds.map(id => guild.roles.cache.get(id)).filter(role => role);

      if (rolesToAssign.length === 0) {
        return interaction.editReply({ content: '❌ No valid roles found in your input.' });
      }

      for (const role of rolesToAssign) {
        if (interaction.member.roles.highest.position <= role.position && interaction.guild.ownerId !== interaction.user.id) {
          return interaction.editReply({ content: `❌ You cannot assign the role **${role.name}** — it's higher or equal to your highest role.` });
        }
        if (interaction.guild.members.me.roles.highest.position <= role.position) {
          return interaction.editReply({ content: `❌ I cannot assign the role **${role.name}** — it's higher or equal to my highest role.` });
        }
      }

      const assignedRoles = [];
      const expiresAt = new Date(Date.now() + delayMs);

      for (const role of rolesToAssign) {
        try {
          await target.roles.add(role, `Timerole assigned for ${durationStr}. Reason: ${reason}`);
         await TimerRole.create({
          guildId: guild.id,
         userId: target.id,
       roleId: role.id,
           expiresAt,
            reason,
              assignerId: interaction.user.id,
             active: true
            });



          interaction.client.timerRoleManager.scheduleTimer(guild.id, target.id, role.id, expiresAt);
          assignedRoles.push(role.name);
        } catch (err) {
          console.error(`Failed to assign role ${role.name} to ${target.user.tag}:`, err);
        }
      }

      if (assignedRoles.length === 0) {
        return interaction.editReply({ content: '❌ Failed to assign any roles. Check bot permissions.' });
      }

      try {
        await target.send(`You have been assigned the role(s) **${assignedRoles.join(', ')}** in **${guild.name}** for **${durationStr}**.\nReason: ${reason}`);
      } catch {}

      await interaction.editReply({
        content: `✅ Assigned role(s) **${assignedRoles.join(', ')}** to ${target.user.tag} for **${durationStr}**.`
      });

    } catch (err) {
      console.error('❌ Command failed:', err);

      if (interaction.deferred || interaction.replied) {
        return interaction.followUp({ content: '❌ Something went wrong while assigning the timerole.', ephemeral: true }).catch(() => {});
      }

      return interaction.reply({ content: '❌ Something went wrong while assigning the timerole.', ephemeral: true }).catch(() => {});
    }
  }
};
