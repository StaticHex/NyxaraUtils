const { SlashCommandBuilder } = require('discord.js');
const WarnRecord = require('../../utils/warnings');
const isAdmin = require('../../utils/isAdmin');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removewarn')
    .setDescription('Remove a warning from a user by case ID')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('User to remove the warning from')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('caseid')
        .setDescription('Case ID of the warning to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
if (!(await isAdmin(interaction.user.id))) {
  return interaction.reply({ content: '❌ You don\'t have permission to use this command.', ephemeral: true });
    }

    const user = interaction.options.getUser('user');
    const caseId = interaction.options.getString('caseid');
    const guildId = interaction.guild.id;

    const warning = await WarnRecord.findOne({ guildId, userId: user.id, caseId });

    if (!warning) {
      return interaction.reply({ content: `⚠️ No warning found with case ID \`${caseId}\` for ${user.tag}.`, ephemeral: true });
    }

    await WarnRecord.deleteOne({ _id: warning._id });

    return interaction.reply({ content: `✅ Warning \`${caseId}\` removed for ${user.tag}.`, ephemeral: true });
  }
};
