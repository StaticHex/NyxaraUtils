const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('domainexpansion')
    .setDescription('Ready to expand your domain! TRY ME.')
    .addIntegerOption(option =>
      option.setName('ammount')  // <-- your preferred name
        .setDescription('Max expansion is 60')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(60)),

  async execute(interaction) {
    const member = interaction.member;
    const ammount = interaction.options.getInteger('ammount'); // <-- use ammount here too

    if (!member.moderatable) {
      return interaction.reply({ content: 'you cant expand your domain :(', ephemeral: true });
    }

    const durationMs = ammount * 60 * 1000;

    await member.timeout(durationMs, `Invoked Domain Expansion: Shadow's Silence for ${ammount} minute(s)`);

    const embed = new EmbedBuilder()
      .setColor('DarkPurple')
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
  .setColor('DarkPurple')
  .setTitle('🌑 Domain Expansion 🌑')
  .setDescription(
    `*“From whisper to void, I summon the dusk,*\n` +
    `*Where breath is forgotten, and time dares not trust.*\n` +
    `*Let sound be stolen, and light retreat,*\n` +
    `*Within my shadow, all silence meets.”*\n\n` +
    `**🎭 Enter... *Shadow's Silence!* 🎭**\n\n` +
    `🌑 **${interaction.user.username}**, your Domain Expansion has been unleashed... ` +
    `Welcome to *Shadow's Silence* for **${ammount}**.`
  );

await interaction.reply({ embeds: [replyEmbed], ephemeral: false });


  }
};
