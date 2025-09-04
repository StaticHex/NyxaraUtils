const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resetconfig')
    .setDescription('Reset all UpLink configuration settings for this server.'),

  async execute(interaction) {
    const guildId = interaction.guild.id;
    const guildName = interaction.guild.name;

    if (interaction.user.id !== interaction.guild.ownerId) {
      return interaction.reply({
        content: '❌ Only the **server owner** can use this command.',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('⚠️ Reset UpLink Settings?')
      .setDescription(`Are you sure you want to reset settings for **${guildName}**?

This will reset:
• 🔁 Mod Channel → Default
• 🎭 Auto Role → Default
• 🛡️ Opt-in Status → Default`)
      .setColor('Red')
      .setFooter({ text: 'This action cannot be undone.' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_reset')
        .setLabel('✅ Confirm')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_reset')
        .setLabel('❌ Cancel')
        .setStyle(ButtonStyle.Secondary)
    );

    const msg = await interaction.reply({ embeds: [embed], components: [row], ephemeral: true, fetchReply: true });

    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: 'These buttons are not for you.', ephemeral: true });

      if (i.customId === 'cancel_reset') {
        await i.update({ content: '❌ Reset cancelled.', embeds: [], components: [] });
      }

      if (i.customId === 'confirm_reset') {
        await ServerSettings.findOneAndUpdate(
          { guildId },
          {
            $unset: {
              modChannelId: "",
              'autoAction.bindRoleId': "",
              'autoAction.checkRoleId': "",
              'autoAction.timeAmount': "",
              'autoAction.timeUnit': "",
              'autoAction.action': "",
              'autoAction.reason': ""
            },
            $set: {
              banCollectionOptIn: false,
            }
          },
          { upsert: true }
        );

        await i.update({
          content: `✅ Configuration for **${guildName}** has been reset to default settings.`,
          embeds: [],
          components: []
        });
      }
    });

    collector.on('end', async collected => {
      if (collected.size === 0) {
        await msg.edit({ content: '⌛ Confirmation timed out.', embeds: [], components: [] });
      }
    });
  }
};
