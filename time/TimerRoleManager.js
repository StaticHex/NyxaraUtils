const TimerRole = require('../utils/timerole_s');
const sendModLogEmbed = require('./log');
const MAX_TIMEOUT = 2_147_483_647; // max 32-bit signed int timeout (~24.8 days)

class TimerRoleManager {
  constructor(client) {
    this.client = client;
    this.timers = new Map();
  }

  key(guildId, userId, roleId) {
    return `${guildId}_${userId}_${roleId}`;
  }

  async loadTimers() {
    const now = new Date();
    const timers = await TimerRole.find({ expiresAt: { $gt: now } });

    for (const timer of timers) {
      this.scheduleTimer(timer.guildId, timer.userId, timer.roleId, timer.expiresAt);
    }
  }

  scheduleTimer(guildId, userId, roleId, expiresAt) {
    const key = this.key(guildId, userId, roleId);

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    let delay = expiresAt.getTime() - Date.now();

    if (delay <= 0) {
      this.removeRole(guildId, userId, roleId);
      return;
    }

    if (delay > MAX_TIMEOUT) delay = MAX_TIMEOUT;

    const timeout = setTimeout(async () => {
      const now = Date.now();
      if (now >= expiresAt.getTime()) {
        try {
          await this.removeRole(guildId, userId, roleId);
        } catch (err) {
          console.error('Failed to remove expired role:', err);
        } finally {
          this.timers.delete(key);
        }
      } else {
        // Not expired yet, schedule again with remaining time
        this.scheduleTimer(guildId, userId, roleId, expiresAt);
      }
    }, delay);

    this.timers.set(key, timeout);
  }

  async removeRole(guildId, userId, roleId) {
    try {
      const guild = await this.client.guilds.fetch(guildId);
      if (!guild) return;

      const member = await guild.members.fetch(userId);
      if (!member) return;

      if (!member.roles.cache.has(roleId)) {
        const auditLogs = await guild.fetchAuditLogs({ type: 25, limit: 5 });
        const entry = auditLogs.entries.find(e =>
          e.target.id === userId &&
          e.changes?.some(change =>
            change.key === '$remove' &&
            change.new?.some(r => r.id === roleId)
          )
        );

        if (entry) {
          const executor = await guild.members.fetch(entry.executor.id).catch(() => null);
          const isGuildOwner = executor?.id === guild.ownerId;
          const isAdmin = executor?.permissions.has('Administrator');

          if (isGuildOwner || isAdmin) {
            await TimerRole.deleteOne({ guildId, userId, roleId });
            console.log(`[TimerRole] Role manually removed by owner/admin (${executor.user.tag}). Timer cancelled.`);

            await sendModLogEmbed(this.client, guildId, 'ADMIN_BYPASS', {
              userId,
              roleId,
              bypassedBy: executor.id
            });
            return;
          }
        }

        const role = guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.add(role, 'Timer still active — restoring role');
          try {
            await member.send(`You cannot remove the role **${role.name}** in **${guild.name}** while the timer is active.`);
          } catch {}
        }

        await sendModLogEmbed(this.client, guildId, 'TIMER_READD', {
          userId,
          roleId
        });

        return;
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      await member.roles.remove(roleId, 'Timerole expired');
      await TimerRole.deleteOne({ guildId, userId, roleId });

      try {
        const roleName = guild.roles.cache.get(roleId)?.name || 'a role';
        await member.send(`Your role **${roleName}** was removed in **${guild.name}** because the assigned time expired.`);
      } catch {}

      await sendModLogEmbed(this.client, guildId, 'TIMER_EXPIRED', {
        userId,
        roleId
      });

    } catch (err) {
      console.error('Error removing role for timerole expiration:', err);
    }
  }

  async handleRoleRemoval(oldMember, newMember) {
    const removedRoles = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
    if (removedRoles.size === 0) return;

    const guild = newMember.guild;
    const guildId = guild.id;
    const userId = newMember.id;

    for (const removedRole of removedRoles.values()) {
      const timer = await TimerRole.findOne({ guildId, userId, roleId: removedRole.id });
      if (!timer) continue;

      const auditLogs = await guild.fetchAuditLogs({
        type: 25,
        limit: 5
      });

      const entry = auditLogs.entries.find(e =>
        e.target.id === userId &&
        e.changes?.some(change =>
          change.key === '$remove' &&
          change.new?.some(r => r.id === removedRole.id)
        )
      );

      let executor = null;
      if (entry) {
        executor = await guild.members.fetch(entry.executor.id).catch(() => null);
      }

      if (!executor) {
        executor = newMember;
      }

      const removerIsOwner = executor.id === guild.ownerId;
      const removerHasAdmin = executor.permissions.has('Administrator');

      if (removerIsOwner || removerHasAdmin) {
        await TimerRole.deleteOne({ guildId, userId, roleId: removedRole.id });
        console.log(`Timer cleared: ${removedRole.name} was manually removed by server owner or admin (${executor.user.tag}).`);

        await sendModLogEmbed(this.client, guildId, 'ADMIN_BYPASS', {
          userId,
          roleId: removedRole.id,
          bypassedBy: executor.id
        });
      } else {
        try {
          await newMember.roles.add(removedRole, 'Role removed but timer still active – re-adding');
          try {
            await newMember.send(`You cannot remove the role **${removedRole.name}** in **${guild.name}** while the timer is active.`);
          } catch {}

          await sendModLogEmbed(this.client, guildId, 'TIMER_READD', {
            userId,
            roleId: removedRole.id
          });
        } catch (err) {
          console.error(`❌ Failed to re-add role ${removedRole.name} to ${newMember.user.tag}:`, err);
        }
      }
    }
  }
}

module.exports = TimerRoleManager;