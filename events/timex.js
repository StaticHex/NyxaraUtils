module.exports = {
  name: 'guildMemberUpdate',

  // Handles timed role removal logic on member role updates
  async execute(oldMember, newMember) {
    if (!oldMember.client.timerRoleManager) return;

    try {
      await oldMember.client.timerRoleManager.handleRoleRemoval(oldMember, newMember);
    } catch (err) {
      console.error('Error in timerRoleManager.handleRoleRemoval:', err);
    }
  }
};
