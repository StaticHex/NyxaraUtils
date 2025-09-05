const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const TimerRole = require('../../utils/timerole_s');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removetimerole')
    .setDescription('Manually remove a timed role from a user.')
    .addUserOption(opt =>
      opt.setName('target')
        .setDescription('The user to remove the role from')
        .setRequired(true))
    .addRoleOption(opt =>
      opt.setName('role')
        .setDescription('The role to remove')
        .setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      if (
        !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles) &&
        !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)
      ) {
        return await interaction.editReply({
          content: '❌ You need Manage Roles or Administrator permission to use this command.'
        });
      }

      if (!interaction.client.timerRoleManager) {
        return await interaction.editReply({
          content: '❌ Timer system not active. Try again later.'
        });
      }

      const target = interaction.options.getMember('target');
      const role = interaction.options.getRole('role');

      if (!target || !target.roles.cache.has(role.id)) {
        return await interaction.editReply({ content: '❌ User does not have that role.' });
      }

      const timer = await TimerRole.findOne({
        guildId: interaction.guild.id,
        userId: target.id,
        roleId: role.id
      });

      if (!timer) {
        return await interaction.editReply({ content: '❌ No active timer found for that role.' });
      }

      // Remove role and cancel timer
      await target.roles.remove(role, 'Manual removal of timed role');
      await TimerRole.deleteOne({
        guildId: interaction.guild.id,
        userId: target.id,
        roleId: role.id
      });

      const key = interaction.client.timerRoleManager.key(interaction.guild.id, target.id, role.id);
      const timeout = interaction.client.timerRoleManager.timers.get(key);
      if (timeout) clearTimeout(timeout);
      interaction.client.timerRoleManager.timers.delete(key);

      try {
        await target.send(`Your role **${role.name}** was removed early in **${interaction.guild.name}** by a moderator.`);
      } catch {}

      await interaction.editReply({
        content: `✅ Timed role **${role.name}** removed from ${target.user.tag}.`
      });

    } catch (err) {
      console.error('❌ Error in /removetimerole:', err);

      if (interaction.deferred || interaction.replied) {
        return await interaction.followUp({
          content: '❌ Something went wrong while removing the timed role.',
          ephemeral: true
        }).catch(() => {});
      }

      return await interaction.reply({
        content: '❌ Something went wrong while removing the timed role.',
        ephemeral: true
      }).catch(() => {});
    }
  }
};
