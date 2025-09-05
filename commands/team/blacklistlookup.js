const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Blacklist = require('../../utils/blacklistmongo');
const isAdmin = require('../../utils/isAdmin');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklistlookup')
    .setDescription('Lookup blacklisted users or servers.')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('Lookup an ID')
        .setRequired(false)),
  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    if (!(await isAdmin(interaction.user.id))) {
      return interaction.reply({
        content: '❌ You don\'t have permission to use this command.',
        ephemeral: true
      });
    }

    const userId = interaction.options.getString('user_id');
    if (userId) {
      try {
        const row = await Blacklist.findOne({ userId });
        if (!row) return interaction.reply({ content: `No blacklist entry found for user ID: ${userId}`, ephemeral: true });

        let username = 'Unknown User';
        try {
          const user = await interaction.client.users.fetch(userId);
          username = user.tag;
        } catch {}

        const embed = new EmbedBuilder()
          .setTitle('Blacklist Information')
          .setColor(0xFF0000)
          .addFields(
            { name: 'Username', value: username, inline: true },
            { name: 'User ID', value: row.userId, inline: true },
            { name: 'Reason', value: row.reason || 'No reason provided', inline: false },
            { name: 'Appeal Status', value: row.appealStatus || 'NO APPEAL', inline: false }
          );

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (err) {
        console.error(err);
        return interaction.reply({ content: '❌ Error fetching blacklist info.', ephemeral: true });
      }
    }

    const createSelectMenu = () => new StringSelectMenuBuilder()
      .setCustomId('blacklist_menu')
      .setPlaceholder('Choose a blacklist category...')
      .addOptions(
        {
          label: 'Blacklisted Users',
          description: 'View all blacklisted users',
          value: 'users'
        },
        {
          label: 'Blacklisted Servers',
          description: 'View all blacklisted servers',
          value: 'servers'
        }
      );

    const menuRow = new ActionRowBuilder().addComponents(createSelectMenu());

    await interaction.reply({
      content: 'Select a blacklist category:',
      components: [menuRow],
      ephemeral: false
    });

    const menuCollector = interaction.channel.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 60000
    });

    menuCollector.on('collect', async select => {
      if (select.user.id !== interaction.user.id) {
        return select.reply({ content: 'This menu is not for you.', ephemeral: true });
      }

      if (select.values[0] === 'users') {
        let rows;
        try {
          rows = await Blacklist.find({});
        } catch (err) {
          console.error(err);
          return select.update({ content: '❌ Error fetching blacklist data.', components: [] });
        }
        if (!rows.length) return select.update({ content: 'No users are blacklisted.', components: [] });

        let page = 0;
        const pageSize = 1;
        const maxPages = Math.ceil(rows.length / pageSize);

        const generateEmbed = async (page) => {
          const row = rows[page];
          let username = 'Unknown User';
          let avatarURL = null;
          try {
            const user = await interaction.client.users.fetch(row.userId);
            username = user.tag;
            avatarURL = user.displayAvatarURL({ dynamic: true, size: 128 });
          } catch {}

          return new EmbedBuilder()
            .setTitle(`Blacklist Entry (${page + 1}/${maxPages})`)
            .setColor(0xFF0000)
            .setThumbnail(avatarURL)
            .addFields(
              { name: 'Username', value: username, inline: true },
              { name: 'User ID', value: row.userId, inline: true },
              { name: 'Reason', value: row.reason || 'No reason provided', inline: false },
              { name: 'Appeal Status', value: row.appealStatus || 'NO APPEAL', inline: false }
            );
        };

        await select.update({
          content: '',
          embeds: [await generateEmbed(page)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('prev').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(true),
              new ButtonBuilder().setCustomId('next').setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(maxPages <= 1),
              new ButtonBuilder().setCustomId('selectMenu').setLabel('↩️ Back').setStyle(ButtonStyle.Secondary)
            )
          ]
        });

        const buttonCollector = select.message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000
        });

        buttonCollector.on('collect', async i => {
          if (i.user.id !== interaction.user.id)
            return i.reply({ content: 'These buttons are not for you.', ephemeral: true });

          if (i.customId === 'selectMenu') {
            buttonCollector.stop();
            return i.update({
              content: 'Select a blacklist category:',
              embeds: [],
              components: [menuRow]
            });
          }

          if (i.customId === 'prev') page = Math.max(page - 1, 0);
          else if (i.customId === 'next') page = Math.min(page + 1, maxPages - 1);

          await i.update({
            embeds: [await generateEmbed(page)],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev').setLabel('◀️').setStyle(ButtonStyle.Primary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next').setLabel('▶️').setStyle(ButtonStyle.Primary).setDisabled(page === maxPages - 1),
                new ButtonBuilder().setCustomId('selectMenu').setLabel('↩️ Back').setStyle(ButtonStyle.Secondary)
              )
            ]
          });
        });

        buttonCollector.on('end', () => {
          select.message.edit({ components: [] }).catch(() => {});
        });

      } else if (select.values[0] === 'servers') {
        let ServerBlacklist;
        let rows;
        try {
          ServerBlacklist = require('../../utils/blacklistserver_mongo');
          rows = await ServerBlacklist.find({});
        } catch (err) {
          console.error(err);
          return select.update({ content: '❌ Error fetching server blacklist data.', components: [] });
        }
        if (!rows.length) {
          return select.update({
            content: '✅ No blacklisted servers found.',
            components: [],
            ephemeral: true
          });
        }

        let page = 0;
        const pageSize = 1;
        const maxPages = Math.ceil(rows.length / pageSize);

        const generateServerEmbed = async (page) => {
          const row = rows[page];
          let adminTag = 'Unknown';

          try {
            const user = await interaction.client.users.fetch(row.blacklistedBy);
            adminTag = user.tag;
          } catch {}

          return new EmbedBuilder()
            .setTitle(`Blacklisted Server (${page + 1}/${maxPages})`)
            .setColor(0xFF0000)
            .addFields(
              { name: 'Server ID', value: row.serverId, inline: true },
              { name: 'Reason', value: row.reason || 'No reason provided', inline: true },
              { name: 'Appealable?', value: row.appealable ? 'Yes' : 'No', inline: true },
              { name: 'Appeal Date', value: row.appealDate || 'N/A', inline: true },
              { name: 'Blacklisted By', value: adminTag, inline: true }
            )
            .setTimestamp();
        };

        await select.update({
          content: '',
          embeds: [await generateServerEmbed(page)],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('prev_server').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(true),
              new ButtonBuilder().setCustomId('next_server').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(maxPages <= 1),
              new ButtonBuilder().setCustomId('selectMenu').setLabel('↩️ Back').setStyle(ButtonStyle.Secondary)
            )
          ]
        });

        const serverCollector = select.message.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 60000
        });

        serverCollector.on('collect', async i => {
          if (i.user.id !== interaction.user.id)
            return i.reply({ content: 'These buttons are not for you.', ephemeral: true });

          if (i.customId === 'selectMenu') {
            serverCollector.stop();
            return i.update({
              content: 'Select a blacklist category:',
              embeds: [],
              components: [menuRow]
            });
          }

          if (i.customId === 'prev_server') page = Math.max(page - 1, 0);
          else if (i.customId === 'next_server') page = Math.min(page + 1, maxPages - 1);

          await i.update({
            embeds: [await generateServerEmbed(page)],
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('prev_server').setLabel('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
                new ButtonBuilder().setCustomId('next_server').setLabel('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page === maxPages - 1),
                new ButtonBuilder().setCustomId('selectMenu').setLabel('↩️ Back').setStyle(ButtonStyle.Secondary)
              )
            ]
          });
        });

        serverCollector.on('end', () => {
          select.message.edit({ components: [] }).catch(() => {});
        });
      }
    });

    menuCollector.on('end', () => {
      interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};