const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  PermissionsBitField,
  ComponentType,
} = require('discord.js');
const TimerRole = require('../../utils/timerole_s');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timerolelookup')
    .setDescription('Look up active timed roles for a user')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('The user to look up')
        .setRequired(true)),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const timers = await TimerRole.find({ userId: target.id }).sort({ expiresAt: 1 });

    if (!timers.length) {
      return interaction.reply({
        content: `❌ ${target.tag} does not have any active timed roles.`,
        ephemeral: true
      });
    }

    const dangerousPerms = [
      PermissionsBitField.Flags.Administrator,
      PermissionsBitField.Flags.ManageRoles,
      PermissionsBitField.Flags.ManageGuild,
    ];

    let page = 0;

    const buildEmbed = async (i) => {
      const timer = timers[i];
      const role = interaction.guild.roles.cache.get(timer.roleId);
      const giver = await interaction.guild.members.fetch(timer.assignerId).catch(() => null);
      const remaining = timer.expiresAt - Date.now();

      const months = Math.floor(remaining / (1000 * 60 * 60 * 24 * 30));
      const weeks = Math.floor((remaining % (1000 * 60 * 60 * 24 * 30)) / (1000 * 60 * 60 * 24 * 7));
      const days = Math.floor((remaining % (1000 * 60 * 60 * 24 * 7)) / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

      let embedColor = 0x57F287; // green
      if (role && role.permissions.has(dangerousPerms, true)) {
        if (role.permissions.has(PermissionsBitField.Flags.Administrator)) {
          embedColor = 0xED4245; // red
        } else {
          embedColor = 0xFEE75C; // yellow
        }
      }

      return new EmbedBuilder()
        .setTitle(`⏱️ Timer for ${target.tag}`)
        .setColor(embedColor)
        .addFields(
          { name: 'Role Given', value: role ? `<@&${timer.roleId}>` : timer.roleId, inline: true },
          { name: 'Given By', value: giver ? `${giver.user.tag}` : timer.assignerId, inline: true },
          { name: 'Reason', value: timer.reason || 'No reason provided', inline: false },
          { name: 'Time Left', value: `${months}mo ${weeks}w ${days}d ${hours}h ${minutes}m`, inline: true },
          { name: 'Ends At', value: `<t:${Math.floor(timer.expiresAt.getTime() / 1000)}:F>`, inline: true }
        )
        .setFooter({ text: `Timer ${i + 1} of ${timers.length}` });
    };

    const buildRow = (i) => new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('◀')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(i === 0),
      new ButtonBuilder()
        .setCustomId('next')
        .setLabel('▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(i === timers.length - 1),
      new ButtonBuilder()
        .setCustomId('remove')
        .setLabel('🗑 Remove Timer')
        .setStyle(ButtonStyle.Danger)
    );

    let message = await interaction.reply({
      embeds: [await buildEmbed(page)],
      components: [buildRow(page)],
      ephemeral: true, // Make this ephemeral for privacy
      fetchReply: true
    });

    const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 120_000 });

    collector.on('collect', async (i) => {
      const buttonUser = await interaction.guild.members.fetch(i.user.id);
      const isTrueAdmin = buttonUser.permissions.has(PermissionsBitField.Flags.Administrator) || i.guild.ownerId === i.user.id;

      if (!isTrueAdmin) {
        return i.reply({ content: '❌ Only the server owner or a user with Administrator permission can use these buttons.', ephemeral: true });
      }

      if (i.customId === 'prev' && page > 0) page--;
      if (i.customId === 'next' && page < timers.length - 1) page++;

      if (i.customId === 'remove') {
        const removedTimer = timers[page];
        const role = interaction.guild.roles.cache.get(removedTimer.roleId);
        const member = await interaction.guild.members.fetch(removedTimer.userId).catch(() => null);

        if (member && role && member.roles.cache.has(role.id)) {
          try {
            await member.roles.remove(role, 'Timer manually removed by admin');
          } catch (err) {
            console.warn(`❌ Failed to remove role ${role.name} from ${member.user.tag}:`, err);
          }
        }

        await TimerRole.deleteOne({ _id: removedTimer._id });
        timers.splice(page, 1);
        if (page >= timers.length && page > 0) page--;

        if (timers.length === 0) {
          collector.stop();
          return i.update({
            content: '✅ Timer removed and role revoked. No more timers remain.',
            embeds: [],
            components: []
          });
        }
      }

      await i.update({ embeds: [await buildEmbed(page)], components: [buildRow(page)] });
    });

    collector.on('end', async () => {
      const disabledRow = buildRow(page);
      disabledRow.components.forEach(btn => btn.setDisabled(true));
      await message.edit({ components: [disabledRow] }).catch(() => {});
    });
  }
};
