const { SlashCommandBuilder, EmbedBuilder, ActivityType, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userlookup')
    .setDescription('Displays detailed user information')
    .addUserOption(opt => opt.setName('target').setDescription('User to lookup').setRequired(true)),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    const member = interaction.options.getMember('target');
    if (!member) return interaction.reply({ content: 'User not found in this server.', ephemeral: true });

    const user = member.user;
    const mutualGuilds = interaction.client.guilds.cache.filter(g => g.members.cache.has(user.id));

    const generatePage = async (page) => {
      const embed = new EmbedBuilder()
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setColor(0x3399ff)
        .setTimestamp();

      if (page === 'basic') {
        const userFlags = (await user.fetchFlags()).toArray();
        // Pseudo-names for HypeSquad flags
        const flagNames = {
          Staff: 'Discord Staff',
          Partner: 'Partner',
          HypeSquadOnlineHouse1: 'HypeSquad Brilliance',
          HypeSquadOnlineHouse2: 'HypeSquad Bravery',
          HypeSquadOnlineHouse3: 'HypeSquad Balance',
          BugHunterLevel1: 'Bug Hunter Level 1',
          BugHunterLevel2: 'Bug Hunter Level 2',
          PremiumEarlySupporter: 'Early Supporter',
          TeamPseudoUser: 'Team User',
          CertifiedModerator: 'Certified Moderator',
          BotHTTPInteractions: 'Bot HTTP Interactions',
          ActiveDeveloper: 'Active Developer'
        };
        const flagEmojis = {
          Staff: '🛠️',
          Partner: '🔗',
          HypeSquadOnlineHouse1: '💎',
          HypeSquadOnlineHouse2: '🦁',
          HypeSquadOnlineHouse3: '⚖️',
          BugHunterLevel1: '🐛',
          BugHunterLevel2: '🐞',
          PremiumEarlySupporter: '💖',
          TeamPseudoUser: '🤖',
          CertifiedModerator: '🛡️',
          BotHTTPInteractions: '⚙️',
          ActiveDeveloper: '🌟'
        };
        const displayFlags = userFlags.length > 0
          ? userFlags.map(flag =>
              `${flagEmojis[flag] || '❓'} \`${flagNames[flag] || flag.replace(/([A-Z])/g, ' $1').trim()}\``
            ).join('\n')
          : '✨ None';

        const banner = user.bannerURL({ dynamic: true, size: 512 });
        const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 512 });

        embed
          .setTitle(`🧾 **${user.username}'s Basic Info**`)
          .setColor('#6b3fcf')
          .setDescription(`Here's a quick look at **${user.username}**'s core Discord profile details.`)
          .setThumbnail(avatarUrl)
          .addFields(
            { name: '👤 Username', value: `\`${user.tag}\``, inline: true },
            { name: '🆔 User ID', value: `\`${user.id}\``, inline: true },
            { name: '🤖 Bot Account?', value: user.bot ? '✅ **Yes**' : '❌ **No**', inline: true },
            {
              name: '🗓️ Account Created',
              value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>\n(<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
              inline: false
            },
            { name: '🖼️ Avatar', value: `[View Avatar](${avatarUrl})`, inline: true },
            { name: '🎨 Banner', value: banner ? `[View Banner](${banner})` : '`None`', inline: true },
            { name: '🏅 Public Flags', value: displayFlags, inline: false }
          )
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();
      } else if (page === 'server') {
        const dangerousPerms = [
          'Administrator', 'BanMembers', 'KickMembers', 'ManageGuild',
          'ManageRoles', 'ManageChannels', 'ManageMessages',
          'MentionEveryone', 'ManageWebhooks', 'ManageNicknames',
          'ModerateMembers'
        ];

        const memberPerms = member.permissions.toArray();
        const grantedPerms = memberPerms.length > 0
          ? memberPerms.map(p => `\`${p.replace(/([A-Z])/g, ' $1').trim()}\``).join(', ')
          : '`None`';

        const dangerousGranted = memberPerms.filter(perm => dangerousPerms.includes(perm))
          .map(perm => `⚠️ **\`${perm.replace(/([A-Z])/g, ' $1').trim()}\`**`)
          .join('\n') || '✅ `None granted`';

        const isOwner = member.id === interaction.guild.ownerId;
        const botMember = interaction.guild.members.me;

        const kickable = botMember.permissions.has('KickMembers') && member.kickable;
        const bannable = botMember.permissions.has('BanMembers') && member.bannable;

        const memberRoles = member.roles.cache
          .filter(r => r.name !== '@everyone')
          .sort((a, b) => b.position - a.position)
          .map(r => `<@&${r.id}>`);

        embed
          .setTitle(`🏠 **${member.user.username}'s Server Info in ${interaction.guild.name}**`)
          .setColor('#7289DA')
          .setDescription(`Details about **${member.user.username}** within the **${interaction.guild.name}** server.`)
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .addFields([
            { name: '✏️ Nickname', value: `\`${member.nickname || 'None'}\``, inline: true },
            { name: '🚀 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>\n(<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`, inline: true },
            { name: '👑 Server Owner?', value: isOwner ? '✅ **Yes**' : '❌ **No**', inline: true },
            {
              name: `🎭 Roles (${memberRoles.length})`,
              value: memberRoles.length > 0
                ? memberRoles.join(', ').substring(0, 1024)
                : '`None`',
              inline: false
            },
            {
              name: '🔑 Permissions Granted',
              value: grantedPerms.length < 1024 ? grantedPerms : '`Too many to display...`',
              inline: false
            },
            {
              name: '🚨 Dangerous Permissions',
              value: dangerousGranted.length < 1024 ? dangerousGranted : '`Too many to display...`',
              inline: false
            },
            { name: '⚔️ Has Administrator?', value: member.permissions.has('Administrator') ? '✅ **Yes**' : '❌ **No**', inline: true },
            { name: '🦶 Kickable by Bot?', value: kickable ? '✅ **Yes**' : '❌ **No**', inline: true },
            { name: '🔨 Bannable by Bot?', value: bannable ? '✅ **Yes**' : '❌ **No**', inline: true }
          ])
          .setFooter({ text: `Requested by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
          .setTimestamp();
      } else if (page === 'mutual') {
        const mutualList = mutualGuilds.map(g => `• **${g.name}** (\`${g.id}\`)`).join('\n') || '`None`';
        embed
          .setTitle(`🌐 **Mutual Servers with ${user.username}**`)
          .setColor('#77ff77')
          .setDescription(`These are the servers **${user.username}** and I share:\n\n${mutualList.length < 2048 ? mutualList : '`Too many mutual servers to display...`'}`)
          .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 128 }))
          .setFooter({ text: `Total Mutual Servers: ${mutualGuilds.length}` })
          .setTimestamp();

      } else if (page === 'activity') {
        const presence = member.presence;

        if (!presence) {
          embed.setTitle(`📊 Activity & Status for ${member.user.tag}`)
            .setDescription('This user is currently **offline** or their presence is not accessible to the bot. Ensure `GuildPresences` intent is enabled.')
            .setColor(0xCC0000);
          return embed;
        }

        const status = presence.status;
        const clientStatus = presence.clientStatus
          ? Object.keys(presence.clientStatus).map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(', ')
          : 'Unknown';

        const activities = presence.activities || [];
        let customStatusText = 'None';
        const otherActivitiesArray = [];
        const customActivity = activities.find(a => a.type === 4);

        if (customActivity) {
          let emojiPart = '';
          if (customActivity.emoji) {
            if (customActivity.emoji.id) {
              emojiPart = `<:${customActivity.emoji.name}:${customActivity.emoji.id}> `;
            } else {
              emojiPart = `${customActivity.emoji.name} `;
            }
          }
          if (customActivity.state) {
            customStatusText = `${emojiPart}${customActivity.state}`;
          } else if (emojiPart) {
            customStatusText = `${emojiPart}No status set`;
          } else {
            customStatusText = 'None';
          }
        }

        activities.forEach(activity => {
          if (activity.type === ActivityType.CustomStatus) return;

          let activityString = '';
          switch (activity.type) {
            case ActivityType.Playing:
              activityString = `Playing **${activity.name}**`;
              if (activity.details) activityString += `\n*${activity.details}*`;
              if (activity.state) activityString += `\n*${activity.state}*`;
              break;
            case ActivityType.Streaming:
              activityString = `Streaming **${activity.name}** on ${activity.url ? `[Twitch/YouTube](${activity.url})` : 'Twitch/YouTube'}`;
              if (activity.details) activityString += `\n*${activity.details}*`;
              if (activity.state) activityString += `\n*${activity.state}*`;
              break;
            case ActivityType.Listening:
              activityString = `Listening to **${activity.name}**`;
              if (activity.details) activityString += `\n*${activity.details}*`;
              if (activity.state) activityString += `\n*${activity.state}*`;
              break;
            case ActivityType.Watching:
              activityString = `Watching **${activity.name}**`;
              if (activity.details) activityString += `\n*${activity.details}*`;
              if (activity.state) activityString += `\n*${activity.state}*`;
              break;
            case ActivityType.Competing:
              activityString = `Competing in **${activity.name}**`;
              if (activity.details) activityString += `\n*${activity.details}*`;
              if (activity.state) activityString += `\n*${activity.state}*`;
              break;
            default:
              activityString = ` **${activity.name || 'N/A'}**`;
          }
          otherActivitiesArray.push(activityString);
        });

        const activityText = otherActivitiesArray.length > 0 ? otherActivitiesArray.join('\n\n') : 'None';
        const displayStatus = typeof status === 'string' ? status.toUpperCase() : 'UNKNOWN';

        embed.setTitle(`📊 Activity & Status for ${member.user.tag}`)
          .addFields(
            { name: 'Online Status', value: `\`${displayStatus}\``, inline: true },
            { name: 'Client', value: `\`${clientStatus}\``, inline: true },
            { name: 'Custom Status', value: customStatusText, inline: false },
            { name: 'Activities', value: activityText, inline: false }
          )
          .setColor("#ff6b6b")
          .setTimestamp();
      }
      return embed;
    };

    const menu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('page_select')
        .setPlaceholder('Select a page')
        .addOptions([
          { label: 'Basic Info', value: 'basic', emoji: '🧾' },
          { label: 'Server Info', value: 'server', emoji: '🏠' },
          { label: 'Mutual Servers', value: 'mutual', emoji: '🌐' },
          { label: 'Activity & Status', value: 'activity', emoji: '📊' }
        ])
    );

    const initialEmbed = await generatePage('basic');

    const msg = await interaction.reply({ embeds: [initialEmbed], components: [menu], fetchReply: true });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: "These menus aren't for you!", ephemeral: true });
      }
      const selected = i.values[0];
      const newEmbed = await generatePage(selected);
      await i.update({ embeds: [newEmbed], components: [menu] });
    });

    collector.on('end', () => {
      msg.edit({ components: [] }).catch(() => { });
    });
  },
};
