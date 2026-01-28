require('dotenv').config();

module.exports = {
    stunServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    
    turnServers: [
        {
            urls: [
                `turn:${process.env.TURN_HOST}?transport=udp`,
                `turn:${process.env.TURN_HOST}?transport=tcp`,
            ],
            username: process.env.TURN_USERNAME,
            credential: process.env.TURN_PASSWORD
        }
    ],
    
    getIceServers() {
        return [...this.stunServers, ...this.turnServers];
    },
    
    // Provider info
    provider: 'ExpressTurn',
    freeNode: 'free.expressturn.com'
};
