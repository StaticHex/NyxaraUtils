const path = require('path');

module.exports = (client) => {
    client.handleEvents = async (eventFiles, eventsPath) => {
        for (const file of eventFiles) {
            try {
                // Use the provided path for flexibility
                const event = require(path.join(eventsPath, file));
                if (event.once) {
                    client.once(event.name, (...args) => event.execute(...args, client));
                } else {
                    client.on(event.name, (...args) => event.execute(...args, client));
                }
            } catch (err) {
                console.error(`Failed to load event file ${file}:`, err);
            }
        }
    };
};