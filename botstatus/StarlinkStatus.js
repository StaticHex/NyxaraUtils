const { EmbedBuilder } = require('discord.js');

function createStarlinkStatusEmbed(client) {
  const now = Date.now();
  const startedAt = now - (client.uptime || 0);
  const unixTimestamp = Math.floor(startedAt / 1000);

  return new EmbedBuilder()
    .setTitle('Starlink - (Status)')
    .setDescription('Your pathway to optimized server daily interactions.')
    .setColor('#ffffff')
    .addFields(
      {
        name: '🕒 Uptime',
        value: `<t:${unixTimestamp}:R>`, 
        inline: true
      },
      { name: '🌐 Servers', value: `${client.guilds.cache.size}`, inline: true },
      { name: '⚡ Interactions Count', value: `${client.interactionCount || 0}`, inline: true }
    )
    .setTimestamp();
}

module.exports = { createStarlinkStatusEmbed };
