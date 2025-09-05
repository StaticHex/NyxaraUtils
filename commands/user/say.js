const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a message with optional formatting and attachments')
    .addStringOption(opt =>
      opt.setName('content').setDescription('The message you want to send').setRequired(true))
    .addBooleanOption(opt =>
      opt.setName('embed').setDescription('Send this message as an embed'))
    .addBooleanOption(opt =>
      opt.setName('anonymous').setDescription('Hide your identity'))
    .addStringOption(opt =>
      opt.setName('color').setDescription('Embed color (hex like #7289da or common names like red, blue)'))
    .addAttachmentOption(opt => opt.setName('file1').setDescription('File to attach (1)'))
    .addAttachmentOption(opt => opt.setName('file2').setDescription('File to attach (2)'))
    .addAttachmentOption(opt => opt.setName('file3').setDescription('File to attach (3)'))
    .addAttachmentOption(opt => opt.setName('file4').setDescription('File to attach (4)')),

  async execute(interaction) {
    const isBlacklisted = await interaction.client.checkBlacklist(interaction);
    if (isBlacklisted) return;

    // Defer reply as ephemeral to hide "thinking..." in channel
    await interaction.deferReply({ ephemeral: true });

    const content = interaction.options.getString('content');
    const useEmbed = interaction.options.getBoolean('embed') ?? false;
    const anonymous = interaction.options.getBoolean('anonymous') ?? false;
    const colorInput = interaction.options.getString('color');

    // Gather attachments and filter by size
    const attachments = [
      interaction.options.getAttachment('file1'),
      interaction.options.getAttachment('file2'),
      interaction.options.getAttachment('file3'),
      interaction.options.getAttachment('file4'),
    ].filter(Boolean);

    const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
    const tooBigFiles = attachments.filter(file => file.size > MAX_FILE_SIZE);
    const validFiles = attachments.filter(file => file.size <= MAX_FILE_SIZE);

    if (tooBigFiles.length > 0) {
      const errorMessage = tooBigFiles
        .map(f => `❌ \`${f.name}\` is too big to upload.`)
        .join('\n');
      await interaction.editReply({ content: errorMessage, ephemeral: true });
      return;
    }

    // Categorize files
    const imageFiles = validFiles.filter(a => a.contentType?.startsWith('image/'));
    const videoFiles = validFiles.filter(a => a.contentType?.startsWith('video/'));
    const otherFiles = validFiles.filter(a =>
      !a.contentType?.startsWith('image/') &&
      !a.contentType?.startsWith('video/')
    );

    if (useEmbed) {
      let embedColor = Colors.Default;
      if (colorInput) {
        if (/^#?[0-9A-F]{6}$/i.test(colorInput)) {
          embedColor = parseInt(colorInput.replace('#', ''), 16);
        } else {
          const discordColor = Colors[colorInput.toUpperCase()];
          embedColor = discordColor || Colors.Default;
        }
      }

      const embed = new EmbedBuilder()
        .setDescription(content)
        .setColor(embedColor)
        .setTimestamp();

      if (!anonymous) {
        embed.setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL()
        });
      }

      // Only set the first image as embed image, do NOT attach it as a file to avoid duplicate
      let filesToSend = [...otherFiles, ...videoFiles];
      if (imageFiles.length > 0) {
        embed.setImage(imageFiles[0].url);
        // Attach any additional images as files
        filesToSend = filesToSend.concat(imageFiles.slice(1).map(f => f.url));
      }

      const fileLinks = otherFiles.concat(videoFiles).map(f => `[${f.name}](${f.url})`);
      if (fileLinks.length > 0) {
        embed.addFields({ name: 'Attachments', value: fileLinks.join('\n') });
      }

      await interaction.channel.send({
        embeds: [embed],
        files: filesToSend
      });

    } else {
      const formatted = anonymous
        ? content
        : `**${interaction.user.tag} says:**\n${content}`;

      await interaction.channel.send({
        content: formatted,
        files: validFiles.map(f => f.url)
      });
    }

    // Delete the ephemeral reply as soon as possible for stealth
    await interaction.deleteReply().catch(() => {});
  }
};
