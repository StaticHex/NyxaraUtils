const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const TimerRoleManager = require('../time/TimerRoleManager');
const { createStarlinkStatusEmbed } = require('../botstatus/StarlinkStatus');
const persist = require('../botstatus/persist');

module.exports = {
    name: 'ready',
    once: true,
    async execute(client) {
  client.timerRoleManager = new TimerRoleManager(client);
client.timerRoleManager.loadTimers();
    console.log('⏱️ Timer roles loaded.');


            client.user.setPresence({
                activities: [{ name: `💯your pathway to optimized server daily interactions`, type: ActivityType.Custom }],
                status: 'online',
              });
              
 const guildId = '1388646102898573455';
    const channelId = '1391870848046076087';

    if (typeof client.interactionCount !== 'number') client.interactionCount = 0;

    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) {
      console.error('Guild not found.');
      return;
    }

    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) {
      console.error('Channel not found or not text-based.');
      return;
    }

    const storedMessageId = await persist.get('statusMessageId');

    if (storedMessageId) {
      try {
        const oldMessage = await channel.messages.fetch(storedMessageId);
        if (oldMessage) {
          await oldMessage.edit({ embeds: [createStarlinkStatusEmbed(client)] });
          console.log('Updated existing status message.');
        }
      } catch {
        const newMsg = await channel.send({ embeds: [createStarlinkStatusEmbed(client)] });
        await persist.set('statusMessageId', newMsg.id);
        console.log('Sent new status message and saved ID.');
      }
    } else {
      const newMsg = await channel.send({ embeds: [createStarlinkStatusEmbed(client)] });
      await persist.set('statusMessageId', newMsg.id);
      console.log('Sent new status message and saved ID.');
    }

    setInterval(async () => {
      const messageId = await persist.get('statusMessageId');
      if (!messageId) return;

      try {
        const message = await channel.messages.fetch(messageId);
        if (message) {
          await message.edit({ embeds: [createStarlinkStatusEmbed(client)] });
        }
      } catch (err) {
        console.error('Failed to update status message:', err);
      }
    }, 60_000);
  }
};