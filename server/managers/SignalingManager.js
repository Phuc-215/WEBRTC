const roomManager = require('./RoomManager');
const logger = require('../utils/logger');

class SignalingManager {
    /**
     * Handle incoming WebSocket message
     */
    handleMessage(ws, data) {
        logger.log('debug', `Received: ${data.type} from ${data.sender || data.name || 'unknown'}`);
        
        try {
            switch(data.type) {
                case 'register':
                    this.handleRegister(ws, data);
                    break;
                    
                case 'joinRoom':
                    this.handleJoinRoom(ws, data);
                    break;
                    
                case 'leaveRoom':
                    this.handleLeaveRoom(ws, data);
                    break;
                    
                case 'offer':
                case 'answer':
                case 'candidate':
                    this.forwardSignaling(ws, data);
                    break;
                    
                default:
                    logger.log('warn', `Unknown message type: ${data.type}`);
            }
        } catch (error) {
            logger.log('error', `Error handling message: ${error.message}`);
        }
    }
    
    /**
     * Handle register message
     */
    handleRegister(ws, data) {
        const result = roomManager.register(ws, data.name);
        
        if (result.success) {
            this.sendToClient(ws, {
                type: 'registered',
                success: true,
                name: data.name
            });
        } else {
            this.sendToClient(ws, {
                type: 'error',
                message: result.error
            });
        }
    }
    
    /**
     * Handle joinRoom message
     */
    handleJoinRoom(ws, data) {
        const result = roomManager.joinRoom(ws, data.roomId);
        
        if (result.success) {
            // Broadcast updated member list to all in room
            this.broadcastMemberList(data.roomId);
        } else {
            this.sendToClient(ws, {
                type: 'error',
                message: result.error
            });
        }
    }
    
    /**
     * Handle leaveRoom message
     */
    handleLeaveRoom(ws, data) {
        const result = roomManager.leaveRoom(ws);
        
        if (result) {
            // Notify others that this member left
            this.broadcastToRoom(result.roomId, {
                type: 'memberLeft',
                roomId: result.roomId,
                name: result.name
            }, ws);
            
            // Update member list for remaining clients
            if (result.remainingMembers.length > 0) {
                this.broadcastMemberList(result.roomId);
            }
        }
    }
    
    /**
     * Forward signaling messages (offer/answer/candidate)
     */
    forwardSignaling(ws, data) {
        const targetWs = roomManager.getClientByName(data.roomId, data.target);
        
        if (targetWs && targetWs.readyState === 1) { // WebSocket.OPEN
            this.sendToClient(targetWs, data);
            logger.log('debug', `Forwarded ${data.type}: ${data.sender} → ${data.target}`);
        } else {
            logger.log('warn', `Target not found or not connected: ${data.target}`);
        }
    }
    
    /**
     * Broadcast member list to all clients in room
     */
    broadcastMemberList(roomId) {
        const members = roomManager.getRoomMembers(roomId);
        
        this.broadcastToRoom(roomId, {
            type: 'roomMembers',
            roomId,
            members
        });
        
        logger.log('info', `Broadcasted member list to room ${roomId}: [${members.join(', ')}]`);
    }
    
    /**
     * Broadcast message to all clients in room
     */
    broadcastToRoom(roomId, message, excludeWs = null) {
        const clients = roomManager.getRoomClients(roomId, excludeWs);
        const messageStr = JSON.stringify(message);
        
        clients.forEach(ws => {
            if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(messageStr);
            }
        });
    }
    
    /**
     * Send message to specific client
     */
    sendToClient(ws, message) {
        if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(JSON.stringify(message));
        }
    }
    
    /**
     * Handle client disconnect
     */
    handleDisconnect(ws) {
        const result = roomManager.leaveRoom(ws);
        
        if (result) {
            // Notify others
            this.broadcastToRoom(result.roomId, {
                type: 'memberLeft',
                roomId: result.roomId,
                name: result.name
            }, ws);
        }
        
        roomManager.disconnect(ws);
    }
}

module.exports = new SignalingManager();
