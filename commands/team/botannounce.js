const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { ServerSettings } = require('../../utils/db');
const traphouse = require('../../ownerids');

const ANNOUNCE_COLOR = 0xffffff;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('starlink')
    .setDescription('Starlink global announcement system')
    .addSubcommand(sub =>
      sub.setName('announce')
        .setDescription('Send announcement to opted-in servers with a mod channel')
        .addStringOption(opt =>
          opt.setName('title')
            .setDescription('Title of the announcement')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Message body to send')
            .setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub.setName('announceall')
        .setDescription('Send announcement to **all** servers with a mod channel (ignores opt-in)')
        .addStringOption(opt =>
          opt.setName('title')
            .setDescription('Title of the announcement')
            .setRequired(true)
        )
        .addStringOption(opt =>
          opt.setName('message')
            .setDescription('Message body to send')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!traphouse.ownerIds.includes(interaction.user.id)) {
      return await interaction.reply({ content: '❌ You don\'t have permission.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');

    const embed = new EmbedBuilder()
      .setTitle(`📢 ${title}`)
      .setDescription(message)
      .setColor(ANNOUNCE_COLOR)
      .setFooter({ text: 'Bot Announcement' })
      .setTimestamp();

    let settings;
    try {
      if (sub === 'announce') {
        settings = await ServerSettings.find({
          modChannelId: { $exists: true, $ne: null },
          banCollectionOptIn: true
        });
      } else if (sub === 'announceall') {
        settings = await ServerSettings.find({
          modChannelId: { $exists: true, $ne: null }
        });
      }
    } catch (err) {
      console.error(err);
      return await interaction.reply({ content: '❌ Failed to fetch server settings.', ephemeral: true });
    }

    if (!settings || settings.length === 0) {
      return await interaction.reply({ content: 'No servers found to send the announcement.', ephemeral: true });
    }

    await interaction.reply({ content: 'Sending announcement...', ephemeral: true });

    let sentCount = 0;

    for (const setting of settings) {
      const guild = interaction.client.guilds.cache.get(setting.guildId);
      if (!guild) continue;

      const channel = guild.channels.cache.get(setting.modChannelId);
      if (!channel || !channel.viewable || !channel.permissionsFor(guild.members.me).has('SendMessages')) {
        continue;
      }

      try {
        await channel.send({ embeds: [embed] });
        sentCount++;
      } catch (err) {
        console.error(`Failed to send to ${guild.name} (${guild.id}):`, err);
      }
    }

    await interaction.editReply({
      content: `✅ Announcement sent to ${sentCount} server${sentCount === 1 ? '' : 's'}.`
    });
  }
};
