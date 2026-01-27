import { ICE_CONFIG } from '../config/ice.config.js';
import Logger from '../utils/logger.js';
import StatsAnalyzer from '../utils/stats.js';

class PeerManager {
    constructor(wsManager, mediaManager) {
        this.wsManager = wsManager;
        this.mediaManager = mediaManager;
        this.peerConnections = new Map(); // peerId -> RTCPeerConnection
        this.userName = null;
        this.roomId = null;
        this.onTrackCallback = null;
        this.onConnectionStateCallback = null;
    }
    
    /**
     * Set user info
     */
    setUserInfo(userName, roomId) {
        this.userName = userName;
        this.roomId = roomId;
    }
    
    /**
     * Register callback for remote track
     */
    onTrack(callback) {
        this.onTrackCallback = callback;
    }
    
    /**
     * Register callback for connection state change
     */
    onConnectionStateChange(callback) {
        this.onConnectionStateCallback = callback;
    }
    
    /**
     * Create peer connection
     */
    async createPeerConnection(peerId, isOffer = false) {
        Logger.info(`Creating peer connection with ${peerId} (offer: ${isOffer})`);
        
        // Check if connection already exists
        if (this.peerConnections.has(peerId)) {
            Logger.warn(`Connection with ${peerId} already exists`);
            return this.peerConnections.get(peerId);
        }
        
        // Create RTCPeerConnection
        const pc = new RTCPeerConnection(ICE_CONFIG);
        this.peerConnections.set(peerId, pc);
        
        // Add local stream tracks
        const localStream = this.mediaManager.getLocalStream();
        if (localStream) {
            localStream.getTracks().forEach(track => {
                pc.addTrack(track, localStream);
                Logger.debug(`Added ${track.kind} track to peer ${peerId}`);
            });
        }
        
        // Handle remote track
        pc.ontrack = (event) => {
            Logger.success(`Received ${event.track.kind} track from ${peerId}`);
            if (this.onTrackCallback) {
                this.onTrackCallback(peerId, event.streams[0]);
            }
        };
        
        // Handle ICE candidate
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                Logger.debug(`Sending ICE candidate to ${peerId}`);
                this.wsManager.send({
                    type: 'candidate',
                    roomId: this.roomId,
                    sender: this.userName,
                    target: peerId,
                    candidate: event.candidate
                });
            } else {
                Logger.debug(`ICE gathering complete for ${peerId}`);
            }
        };
        
        // Handle connection state change
        pc.onconnectionstatechange = () => {
            Logger.connection(peerId, pc.connectionState);
            
            if (this.onConnectionStateCallback) {
                this.onConnectionStateCallback(peerId, pc.connectionState);
            }
            
            // Log stats when connected
            if (pc.connectionState === 'connected') {
                setTimeout(() => this.logStats(peerId), 2000);
            }
            
            // Clean up on failure
            if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
                this.closePeer(peerId);
            }
        };
        
        // Handle ICE connection state change
        pc.oniceconnectionstatechange = () => {
            Logger.ice(peerId, pc.iceConnectionState);
        };
        
        // Handle ICE gathering state change
        pc.onicegatheringstatechange = () => {
            Logger.debug(`ICE gathering state for ${peerId}: ${pc.iceGatheringState}`);
        };
        
        // Create offer if caller
        if (isOffer) {
            try {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                
                Logger.debug(`Sending offer to ${peerId}`);
                this.wsManager.send({
                    type: 'offer',
                    roomId: this.roomId,
                    sender: this.userName,
                    target: peerId,
                    offer: offer
                });
            } catch (error) {
                Logger.error(`Error creating offer for ${peerId}:`, error);
            }
        }
        
        return pc;
    }
    
    /**
     * Handle incoming offer
     */
    async handleOffer(data) {
        Logger.info(`Received offer from ${data.sender}`);
        
        try {
            // Create peer connection
            const pc = await this.createPeerConnection(data.sender, false);
            
            // Set remote description
            await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
            
            // Create answer
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            
            // Send answer
            Logger.debug(`Sending answer to ${data.sender}`);
            this.wsManager.send({
                type: 'answer',
                roomId: this.roomId,
                sender: this.userName,
                target: data.sender,
                answer: answer
            });
            
        } catch (error) {
            Logger.error(`Error handling offer from ${data.sender}:`, error);
        }
    }
    
    /**
     * Handle incoming answer
     */
    async handleAnswer(data) {
        Logger.info(`Received answer from ${data.sender}`);
        
        try {
            const pc = this.peerConnections.get(data.sender);
            if (pc) {
                await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                Logger.success(`Answer processed for ${data.sender}`);
            } else {
                Logger.error(`No peer connection found for ${data.sender}`);
            }
        } catch (error) {
            Logger.error(`Error handling answer from ${data.sender}:`, error);
        }
    }
    
    /**
     * Handle incoming ICE candidate
     */
    async handleCandidate(data) {
        Logger.debug(`Received ICE candidate from ${data.sender}`);
        
        try {
            const pc = this.peerConnections.get(data.sender);
            if (pc) {
                await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                Logger.debug(`ICE candidate added for ${data.sender}`);
            } else {
                Logger.warn(`No peer connection found for ${data.sender}`);
            }
        } catch (error) {
            Logger.error(`Error adding ICE candidate from ${data.sender}:`, error);
        }
    }
    
    /**
     * Create connections to all members
     */
    async createConnectionsToMembers(members) {
        Logger.info(`Creating connections to: ${members.join(', ')}`);
        
        for (const member of members) {
            if (member !== this.userName) {
                await this.createPeerConnection(member, true);
            }
        }
    }
    
    /**
     * Close connection with specific peer
     */
    closePeer(peerId) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            pc.close();
            this.peerConnections.delete(peerId);
            Logger.info(`Closed connection with ${peerId}`);
        }
    }
    
    /**
     * Close all peer connections
     */
    closeAll() {
        Logger.info('Closing all peer connections...');
        this.peerConnections.forEach((pc, peerId) => {
            pc.close();
            Logger.debug(`Closed connection with ${peerId}`);
        });
        this.peerConnections.clear();
    }
    
    /**
     * Get number of active connections
     */
    getConnectionCount() {
        return this.peerConnections.size;
    }
    
    /**
     * Log connection statistics
     */
    async logStats(peerId) {
        const pc = this.peerConnections.get(peerId);
        if (pc) {
            const analysis = await StatsAnalyzer.analyze(pc, peerId);
            Logger.info(`Stats for ${peerId}:`, analysis);
            
            const isUsingTurn = await StatsAnalyzer.isUsingTurn(pc);
            if (isUsingTurn) {
                Logger.success(`🔄 Connection with ${peerId} is using TURN relay!`);
            } else {
                Logger.info(`Direct P2P connection with ${peerId}`);
            }
            
            return analysis;
        }
        return null;
    }
}

export default PeerManager;
