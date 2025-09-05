const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('domainexpansion')
    .setDescription('Ready to expand your domain! TRY ME.')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Max expansion size is 1000')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(1000)
    ),

  async execute(interaction) {
    const member = interaction.member;
    const amount = interaction.options.getInteger('amount');

    if (!member.moderatable) {
      return interaction.reply({ content: 'You can\'t expand your domain :(', ephemeral: true });
    }

    const durationMs = amount * 60 * 1000;

    try {
      await member.timeout(durationMs, `Invoked Domain Expansion: Shadow's Silence for ${amount} minute(s)`);
    } catch (err) {
      return interaction.reply({ content: 'Failed to expand your domain. Missing permissions?', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(0x6f42c1)
      .setTitle('**🌑 Domain Expansion 🌑**')
      .setDescription(
        '*“From whisper to void, I summon the dusk,*\n' +
        '*Where breath is forgotten, and time dares not trust.*\n' +
        '*Let sound be stolen, and light retreat,*\n' +
        '*Within my shadow, all silence meets.”*\n\n' +
        '**🎭 Enter... *Shadow\'s Silence!* 🎭**'
      )
      .setImage('https://i.imgur.com/5CzwWjP.gif');

    try {
      await member.send({ embeds: [embed] });
    } catch (err) {
      console.warn(`Failed to DM ${member.user.tag}: ${err.message}`);
    }

    const replyEmbed = new EmbedBuilder()
      .setColor(0x6f42c1)
      .setTitle('🌑 Domain Expansion 🌑')
      .setDescription(
        `*“From whisper to void, I summon the dusk,*\n` +
        `*Where breath is forgotten, and time dares not trust.*\n` +
        `*Let sound be stolen, and light retreat,*\n` +
        `*Within my shadow, all silence meets.”*\n\n` +
        `**🎭 Enter... *Shadow's Silence!* 🎭**\n\n` +
        `🌑 **${interaction.user.username}**, your Domain Expansion has been unleashed... ` +
        `Welcome to *Shadow's Silence* for **${amount} minute(s)**.`
      );

    await interaction.reply({ embeds: [replyEmbed], ephemeral: false });
  }
};
