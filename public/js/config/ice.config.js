export const ICE_CONFIG = {
    iceServers: [
        { urls: 'stun:stun.relay.metered.ca:80' },
        {
            urls: `turn:${process.env.TURN_HOST}`,
            username: "86d5854119ef7a0d093d655a",
            credential: "igfkkKW85At1BeDP",
        },
        {
            urls: `turn:${process.env.TURN_HOST}?transport=tcp`,
            username: "86d5854119ef7a0d093d655a",
            credential: "igfkkKW85At1BeDP",
        },
        {
            urls: `turn:${process.env.TURN_HOST}`,
            username: "86d5854119ef7a0d093d655a",
            credential: "igfkkKW85At1BeDP",
        },
        {
            urls: `turn:${process.env.TURN_HOST}?transport=tcp`,
            username: "86d5854119ef7a0d093d655a",
            credential: "igfkkKW85At1BeDP",
        },
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
