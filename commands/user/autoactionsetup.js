const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType
} = require('discord.js');
const { ServerSettings } = require('../../utils/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoaction')
    .setDescription('Set up a timed role check and select action by button.')
    .addRoleOption(opt =>
      opt.setName('bindrole').setDescription('Role to monitor').setRequired(true)
    )
    .addRoleOption(opt =>
      opt.setName('checkrole').setDescription('Role they must have after the wait time').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('time').setDescription('Time amount').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('unit')
        .setDescription('Time unit')
        .setRequired(true)
        .addChoices(
          { name: 'Minutes', value: 'minutes' },
          { name: 'Hours', value: 'hours' },
          { name: 'Days', value: 'days' },
          { name: 'Months', value: 'months' }
        )
    ),

  async execute(interaction) {
      if (!interaction.member.permissions.has('Administrator') &&
      !interaction.member.permissions.has('ManageRoles')) {
    return interaction.reply({
      content: '❌ You need Administrator or Manage Roles permission to use this command.',
      ephemeral: true
    });
  }
    const guild = interaction.guild;
    const user = interaction.user;

    const settings = await ServerSettings.findOne({ guildId: guild.id });
    if (!settings?.modChannelId) {
      const errorEmbed = new EmbedBuilder()
        .setTitle('⚠️ Missing Mod Channel')
        .setDescription('Please set the mod alert channel using </setmodchannel:1388580546216726542>.')
        .setColor('Red')
        .setTimestamp();

      return interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }

    const bindRole = interaction.options.getRole('bindrole');
    const checkRole = interaction.options.getRole('checkrole');
    const timeAmount = interaction.options.getInteger('time');
    const timeUnit = interaction.options.getString('unit');
    const defaultReason = 'User failed to meet role requirement in time.';

    // Convert to milliseconds
    let delayMs;
    switch (timeUnit) {
      case 'minutes': delayMs = timeAmount * 60 * 1000; break;
      case 'hours': delayMs = timeAmount * 60 * 60 * 1000; break;
      case 'days': delayMs = timeAmount * 24 * 60 * 60 * 1000; break;
      case 'months': delayMs = timeAmount * 30 * 24 * 60 * 60 * 1000; break;
      default: delayMs = timeAmount * 60 * 1000; break;
    }

    let currentReason = defaultReason;

    const getEmbed = () => new EmbedBuilder()
      .setTitle('📌 AutoAction Setup')
      .setDescription(
        `You are monitoring members with **${bindRole}**.\n` +
        `They must receive **${checkRole}** within **${timeAmount} ${timeUnit}**.\n\n` +
        `Choose the action to take **if they fail**:\n\n> Reason: \`${currentReason}\``
      )
      .setColor('Blue');

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('kick_custom')
        .setLabel('Kick (Custom Reason)')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('ban_custom')
        .setLabel('Ban (Custom Reason)')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('mod_alert')
        .setLabel('Mod Alert')
        .setStyle(ButtonStyle.Primary)
    );

    const row2 = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('kick_default')
        .setLabel('Kick (Default Reason)')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ban_default')
        .setLabel('Ban (Default Reason)')
        .setStyle(ButtonStyle.Secondary)
    );

    const reply = await interaction.reply({
      embeds: [getEmbed()],
      components: [row, row2],
      fetchReply: true
    });

    // Save config to DB
    await ServerSettings.findOneAndUpdate(
      { guildId: guild.id },
      {
        $set: {
          autoAction: {
            bindRoleId: bindRole.id,
            checkRoleId: checkRole.id,
            timeAmount,
            timeUnit,
            delayMs,
            initiatedBy: user.id,
            isActive: false,
            reason: defaultReason,
            createdAt: new Date()
          }
        }
      },
      { upsert: true }
    );

    // 🎯 Collect button presses
    const collector = reply.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000, // 5 mins
    });

    collector.on('collect', async (btn) => {
      if (btn.user.id !== user.id)
        return btn.reply({ content: '❌ This button is not for you.', ephemeral: true });

      // Disable buttons helper
      const disableAllButtons = () => {
        const disabledRow1 = new ActionRowBuilder().addComponents(
          row.components.map(c => c.setDisabled(true))
        );
        const disabledRow2 = new ActionRowBuilder().addComponents(
          row2.components.map(c => c.setDisabled(true))
        );
        return [disabledRow1, disabledRow2];
      };

      if (btn.customId === 'kick_custom' || btn.customId === 'ban_custom') {
        const action = btn.customId.split('_')[0];
        const modal = new ModalBuilder()
          .setCustomId(`modal_${action}`)
          .setTitle(`${action.toUpperCase()} Reason`)
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('reason')
                .setLabel('Reason for this action:')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );

        await btn.showModal(modal);

        try {
          const submitted = await btn.awaitModalSubmit({
            time: 60_000,
            filter: i => i.user.id === user.id && i.customId === `modal_${action}`,
          });

          currentReason = submitted.fields.getTextInputValue('reason');

          await ServerSettings.findOneAndUpdate(
            { guildId: guild.id },
            {
              $set: {
                'autoAction.action': action,
                'autoAction.reason': currentReason,
                'autoAction.isActive': true
              }
            }
          );

          // Update original message: new embed with updated reason + disabled buttons
          await submitted.update({
            embeds: [getEmbed()],
            components: disableAllButtons(),
            content: `✅ AutoAction set to **${action.toUpperCase()}** with reason:\n\`${currentReason}\``
          });

          collector.stop();

        } catch (err) {
          console.log('❌ No modal submitted in time.');
          return;
        }

      } else {
        // Default and mod alert buttons
        let action;
        let updateFields = {
          'autoAction.isActive': true
        };

        switch (btn.customId) {
          case 'kick_default':
            action = 'kick';
            updateFields['autoAction.action'] = action;
            updateFields['autoAction.reason'] = currentReason;
            break;
          case 'ban_default':
            action = 'ban';
            updateFields['autoAction.action'] = action;
            updateFields['autoAction.reason'] = currentReason;
            break;
          case 'mod_alert':
            action = 'modalert';
            updateFields['autoAction.action'] = action;
            break;
          default:
            return;
        }

        await ServerSettings.findOneAndUpdate(
          { guildId: guild.id },
          { $set: updateFields }
        );

        await btn.update({
          embeds: [getEmbed()],
          components: disableAllButtons(),
          content: `✅ AutoAction set to **${action.toUpperCase()}**${action === 'modalert' ? '.' : ` with reason:\n\`${currentReason}\``}`
        });

        collector.stop();
      }
    });

    collector.on('end', () => {
      // Optionally you can disable buttons here after collector ends
    });
  }
};
