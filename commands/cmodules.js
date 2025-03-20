// Import necessary modules from Discord.js and others
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const idclass = require('../idclass');
//const fetch = require('node-fetch'); // Added for GET requests
// With this (no imports needed):
globalThis.fetch = fetch;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cmodules')
        .setDescription('Create an embed with a logo and a button')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Provide the title for the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Provide the description for the embed')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('logo')
                .setDescription('Provide the URL for the logo image')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('link')
                .setDescription('Provide the URL for the button link')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('button_name')
                .setDescription('Provide the name for the button')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('color')
                .setDescription('Provide the hex color code for the embed (e.g., #00FFFF)')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('Select the channel to send the embed to')
                .setRequired(true)),

    async execute(interaction) {
        // Check permissions
        const allowedRoleIDs = [idclass.RoleDev, idclass.RoleModuleCreator];
        if (!interaction.member || !interaction.member.roles.cache.some(role => allowedRoleIDs.includes(role.id))) {
            return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
        }

        // Extract options
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        const logo = interaction.options.getString('logo');
        const link = interaction.options.getString('link');
        const buttonName = interaction.options.getString('button_name');
        const color = interaction.options.getString('color');
        const channel = interaction.options.getChannel('channel');

        // Build embed and button
        const embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(description)
            .setThumbnail(logo)
            .setColor(color);

        const button = new ButtonBuilder()
            .setLabel(buttonName)
            .setStyle(ButtonStyle.Link)
            .setURL(link);

        const row = new ActionRowBuilder().addComponents(button);

        try {
            // Send embed to channel
            await channel.send({ embeds: [embed], components: [row] });
           // await interaction.reply({ content: `Embed sent to ${channel}!`, ephemeral: true });

            // Make GET request to external API
            const manifestUrl = encodeURIComponent(link);
            const token = idclass.modulelib_token; // Ensure this exists in idclass.js
            const apiUrl = `https://sora.jm26.net/api/modules/add?manifestUrl=${manifestUrl}&token=${token}`;

            const response = await fetch(apiUrl);
            if (!response.ok) console.log(`API Error: ${response.status} ${response.statusText}`);
            
            const data = await response.json();
            await interaction.followUp({ 
                content: `✅ Module added to Module Library! API Response: ${JSON.stringify(data)}`, 
                ephemeral: true 
            });

        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('API Error')) {
                await interaction.followUp({ 
                    content: `❌ API Failed: ${error.message.replace('API Error: ', '')}`, 
                    ephemeral: true 
                });
            } else {
                await interaction.reply({ 
                    content: 'Failed to send embed. Check permissions/channel.', 
                    ephemeral: true 
                });
            }
        }
    },
};
