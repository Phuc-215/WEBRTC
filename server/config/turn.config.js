require('dotenv').config();

module.exports = {
    stunServers: [
      {
        urls: "stun:stun.relay.metered.ca:80",
      },
    ],
    
    turnServers: [
      {
        urls: `turn:${process.env.TURN_HOST}:80`,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
      {
        urls: `turn:${process.env.TURN_HOST}:80?transport=tcp`,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
      {
        urls: `turn:${process.env.TURN_HOST}:443`,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
      {
        urls: `turn:${process.env.TURN_HOST}:443?transport=tcp`,
        username: process.env.TURN_USERNAME,
        credential: process.env.TURN_CREDENTIAL,
      },
    ],
    
    getIceServers() {
        return [...this.stunServers, ...this.turnServers];
    },
    
    // Provider info
    provider: 'Metered.ca (Free Tier)',
    freeNode: 'global.relay.metered.ca',
};
