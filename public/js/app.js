import WebSocketManager from './managers/WebSocketManager.js';
import PeerManager from './managers/PeerManager.js';
import MediaManager from './managers/MediaManager.js';
import RoomUI from './ui/RoomUI.js';
import VideoGrid from './ui/VideoGrid.js';
import Logger from './utils/logger.js';
import StatsAnalyzer from './utils/stats.js';

// Initialize managers
const wsManager = new WebSocketManager();
const mediaManager = new MediaManager();
const peerManager = new PeerManager(wsManager, mediaManager);
const roomUI = new RoomUI();
const videoGrid = new VideoGrid('video-grid');

// Global state
let userName = null;
let roomId = null;
let isInCall = false;

// UI Elements
const nameInput = document.getElementById('nameInput');
const roomInput = document.getElementById('roomInput');
const joinBtn = document.getElementById('joinBtn');
const startCallBtn = document.getElementById('startCallBtn');
const hangupBtn = document.getElementById('hangupBtn');
const leaveBtn = document.getElementById('leaveBtn');

// Setup WebSocket message handlers
wsManager.on('registered', (data) => {
    Logger.success(`Registered as ${data.name}`);
});

wsManager.on('roomMembers', (data) => {
    Logger.info(`Room members updated: ${data.members.join(', ')}`);
    roomUI.updateMembers(data.members);
    
    // If in call and new member joins, create connection
    if (isInCall && data.members.length > roomUI.getMembers().length) {
        const newMembers = data.members.filter(m => m !== userName);
        peerManager.createConnectionsToMembers(newMembers);
    }
});

wsManager.on('memberLeft', (data) => {
    Logger.info(`${data.name} left the room`);
    peerManager.closePeer(data.name);
    videoGrid.removeRemoteVideo(data.name);
});

wsManager.on('offer', (data) => {
    peerManager.handleOffer(data);
});

wsManager.on('answer', (data) => {
    peerManager.handleAnswer(data);
});

wsManager.on('candidate', (data) => {
    peerManager.handleCandidate(data);
});

wsManager.on('error', (data) => {
    roomUI.showError(data.message);
});

// Setup peer manager callbacks
peerManager.onTrack((peerId, stream) => {
    videoGrid.addRemoteVideo(peerId, stream);
});

peerManager.onConnectionStateChange((peerId, state) => {
    videoGrid.updateConnectionStatus(peerId, state);
    
    // Log stats when connected
    if (state === 'connected') {
        setTimeout(async () => {
            const stats = await peerManager.logStats(peerId);
            if (stats) {
                const html = StatsAnalyzer.formatStats(stats);
                roomUI.appendStats(html);
                roomUI.toggleStats(true);
            }
        }, 2000);
    }
});

// Join Room button
joinBtn.onclick = async () => {
    userName = nameInput.value.trim();
    roomId = roomInput.value.trim();
    
    if (!userName || !roomId) {
        roomUI.showError('Please enter both name and room ID');
        return;
    }
    
    try {
        const wsUrl = window.location.protocol === 'https:' 
            ? `wss://${window.location.host}` 
            : `ws://${window.location.host}`;

        await wsManager.connect(wsUrl);        
        // Register user
        wsManager.send({
            type: 'register',
            name: userName
        });
        
        // Join room
        wsManager.send({
            type: 'joinRoom',
            roomId: roomId,
            name: userName
        });
        
        // Set user info for peer manager
        peerManager.setUserInfo(userName, roomId);
        
        // Show room UI
        roomUI.showRoom(roomId);
        
    } catch (error) {
        roomUI.showError('Failed to connect to server');
        Logger.error('Connection error:', error);
    }
};

// Start Group Call button
startCallBtn.onclick = async () => {
    try {
        Logger.info('Starting group call...');
        roomUI.setButtonsEnabled(false);
        
        // Get user media
        const stream = await mediaManager.getUserMedia();
        
        // Display local video
        videoGrid.setLocalStream(stream);
        
        // Create peer connections to all members
        const members = roomUI.getMembers();
        const otherMembers = members.filter(m => m !== userName);
        
        if (otherMembers.length === 0) {
            roomUI.showError('No other members in the room');
            roomUI.setButtonsEnabled(true);
            return;
        }
        
        await peerManager.createConnectionsToMembers(otherMembers);
        
        // Update UI
        isInCall = true;
        roomUI.showCallStarted();
        roomUI.setButtonsEnabled(true);
        
        Logger.success('Group call started');
        
    } catch (error) {
        roomUI.showError(error.message);
        roomUI.setButtonsEnabled(true);
        Logger.error('Error starting call:', error);
    }
};

// Hang Up button
hangupBtn.onclick = () => {
    Logger.info('Hanging up...');
    
    // Stop local stream
    mediaManager.stopLocalStream();
    
    // Close all peer connections
    peerManager.closeAll();
    
    // Clear remote videos
    videoGrid.clearRemoteVideos();
    
    // Clear local video
    const localVideo = document.getElementById('localVideo');
    localVideo.srcObject = null;
    videoGrid.updateVideoStatus('localVideo', '🔴 Not streaming');
    
    // Update UI
    isInCall = false;
    roomUI.showCallEnded();
    roomUI.clearStats();
    roomUI.toggleStats(false);
    
    Logger.success('Call ended');
};

// Leave Room button
leaveBtn.onclick = () => {
    Logger.info('Leaving room...');
    
    // Hang up if in call
    if (isInCall) {
        hangupBtn.click();
    }
    
    // Send leave message
    wsManager.send({
        type: 'leaveRoom',
        roomId: roomId
    });
    
    // Close WebSocket
    wsManager.close();
    
    // Reset UI
    roomUI.showLogin();
    videoGrid.clearRemoteVideos();
    
    // Reset state
    userName = null;
    roomId = null;
    isInCall = false;
    
    Logger.success('Left room');
};

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (isInCall) {
        mediaManager.stopLocalStream();
        peerManager.closeAll();
    }
    
    if (wsManager.isConnected()) {
        wsManager.send({
            type: 'leaveRoom',
            roomId: roomId
        });
        wsManager.close();
    }
});

Logger.success('Application initialized');