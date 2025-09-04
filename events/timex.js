module.exports = {
  name: 'guildMemberUpdate',

  async execute(oldMember, newMember) {
    if (!oldMember.client.timerRoleManager) return;

    await oldMember.client.timerRoleManager.handleRoleRemoval(oldMember, newMember);
  }
};
