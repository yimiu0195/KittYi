require('dotenv').config();

function isAuthorized(interaction) {
    const userId = interaction.user?.id;
    const isOwner = userId === process.env.OWNER_ID;
    const isAdmin = interaction.member?.permissions?.has?.('Administrator');

    const allowedIds = process.env.ALLOWED_USER_IDS?.split(',') || [];
    const isExplicitlyAllowed = allowedIds.includes(userId);
    
    return isOwner || isAdmin || isExplicitlyAllowed;
}

module.exports = {
    isAuthorized,
};
// utils/auth.js
// This module exports a function to check if a user is authorized to perform actions in the bot.
// It checks if the user is the owner, has admin permissions, or is in a list of explicitly allowed users.
// It uses environment variables to manage the owner ID and allowed user IDs.