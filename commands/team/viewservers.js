const {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  ComponentType
} = require('discord.js');
const traphouse = require('../../ownerids');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewservers')
    .setDescription('View all servers the bot is in (admin only).'),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist?.(interaction);
    if (isBlacklisted) return;

    if (!traphouse.ownerIds.includes(interaction.user.id)) {
      return interaction.reply({ content: '❌ You don\'t have permission.', ephemeral: true });
    }

    const guilds = [...interaction.client.guilds.cache.values()];
    if (!guilds.length) {
      return interaction.reply({ content: '🤖 Not in any servers.', ephemeral: true });
    }

    let index = 0;

    const getPage = (i) => {
      const guild = guilds[i];
      const embed = new EmbedBuilder()
        .setTitle(`🌐 Server ${i + 1} of ${guilds.length}`)
        .addFields(
          { name: 'Server Name', value: guild.name, inline: true },
          { name: 'Server ID', value: guild.id, inline: true },
          { name: 'Owner ID', value: guild.ownerId, inline: true },
          { name: 'Member Count', value: `${guild.memberCount}`, inline: true }
        )
        .setFooter({ text: `Use the buttons to navigate or remove the bot.` })
        .setColor('Blurple');

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_guild')
          .setLabel('◀')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(i === 0),

        new ButtonBuilder()
          .setCustomId('next_guild')
          .setLabel('▶')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(i === guilds.length - 1),

        new ButtonBuilder()
          .setCustomId(`remove_${guild.id}`)
          .setLabel(`Remove bot from ${guild.name}`)
          .setStyle(ButtonStyle.Danger)
      );

      return { embed, row };
    };

    const { embed, row } = getPage(index);
    const reply = await interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true,
      fetchReply: true
    });

    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== interaction.user.id) {
        return btn.reply({ content: '❌ Not your session.', ephemeral: true });
      }

      if (btn.customId === 'prev_guild') {
        index = Math.max(0, index - 1);
        const { embed, row } = getPage(index);
        return btn.update({ embeds: [embed], components: [row] });
      }

      if (btn.customId === 'next_guild') {
        index = Math.min(guilds.length - 1, index + 1);
        const { embed, row } = getPage(index);
        return btn.update({ embeds: [embed], components: [row] });
      }

      if (btn.customId.startsWith('remove_')) {
        const guildId = btn.customId.split('_')[1];
        const guild = interaction.client.guilds.cache.get(guildId);

        if (!guild) {
          return btn.reply({ content: '❌ The bot is not in that server anymore.', ephemeral: true });
        }

        try {
          await guild.leave();
          await btn.reply({ content: `✅ Successfully left **${guild.name}**.`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await btn.reply({ content: '❌ Failed to leave the server.', ephemeral: true });
        }
      }
    });

    collector.on('end', async () => {
      try {
        await reply.edit({ components: [] });
      } catch { }
    });
  }
};