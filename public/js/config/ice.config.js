export const ICE_CONFIG = {
    iceServers: [
        // STUN servers (free, for NAT traversal)
        { 
            urls: 'stun:stun.l.google.com:19302' 
        },
        { 
            urls: 'stun:stun1.l.google.com:19302' 
        },
        
        // TURN server from ExpressTurn (free tier)
        {
            urls: [
                'turn:free.expressturn.com:3478?transport=udp',
                'turn:free.expressturn.com:3478?transport=tcp',
                'turns:free.expressturn.com:5349?transport=tcp'
            ],
            username: '000000002084847116',
            credential: 'bAgOXm2yT6fIQb8VMx+pLN/vIBE='
        }
    ],
    
    // ICE configuration
    iceCandidatePoolSize: 10,
    iceTransportPolicy: 'all' // 'all' or 'relay' (force TURN)
};

// For testing: Force TURN relay (bypass P2P)
export const FORCE_TURN_CONFIG = {
    iceServers: ICE_CONFIG.iceServers,
    iceTransportPolicy: 'relay' // This forces all traffic through TURN
};

// Configuration info
export const TURN_INFO = {
    provider: 'ExpressTurn (Free Tier)',
    server: 'free.expressturn.com',
    ports: {
        turn: 3478,
        turns: 5349
    },
    username: 'efPU52K4SLOQ34W2QY',
    expiryNote: 'Credentials may expire - check expressturn.com dashboard'
};
