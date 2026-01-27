require('dotenv').config();

module.exports = {
    stunServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
    ],
    
    // ExpressTurn TURN servers
    turnServers: [
        {
            urls: [
                'turn:free.expressturn.com:3478?transport=udp',
                'turn:free.expressturn.com:3478?transport=tcp',
                'turns:free.expressturn.com:5349?transport=tcp'
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
