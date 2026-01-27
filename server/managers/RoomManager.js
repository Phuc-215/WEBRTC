const logger = require('../utils/logger');

class RoomManager {
    constructor() {
        this.rooms = new Map(); // roomId -> Set<ws>
        this.clients = new Map(); // ws -> {name, roomId}
    }
    
    /**
     * Register a new client
     */
    register(ws, name) {
        if (this.clients.has(ws)) {
            logger.log('warn', `Client already registered: ${name}`);
            return { success: false, error: 'Already registered' };
        }
        
        this.clients.set(ws, { name, roomId: null });
        logger.log('success', `Registered: ${name}`);
        return { success: true, name };
    }
    
    /**
     * Add client to a room
     */
    joinRoom(ws, roomId) {
        const client = this.clients.get(ws);
        if (!client) {
            logger.log('error', 'Client not registered');
            return { success: false, error: 'Not registered' };
        }
        
        // Leave current room if any
        if (client.roomId) {
            this.leaveRoom(ws);
        }
        
        // Create room if not exists
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
            logger.log('info', `Created new room: ${roomId}`);
        }
        
        // Add to room
        this.rooms.get(roomId).add(ws);
        client.roomId = roomId;
        
        logger.log('success', `${client.name} joined room: ${roomId}`);
        
        return { 
            success: true, 
            roomId, 
            members: this.getRoomMembers(roomId) 
        };
    }
    
    /**
     * Remove client from current room
     */
    leaveRoom(ws) {
        const client = this.clients.get(ws);
        if (!client || !client.roomId) {
            return null;
        }
        
        const roomId = client.roomId;
        const name = client.name;
        
        // Remove from room
        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(ws);
            
            // Clean up empty room
            if (room.size === 0) {
                this.rooms.delete(roomId);
                logger.log('info', `Deleted empty room: ${roomId}`);
            }
        }
        
        client.roomId = null;
        logger.log('info', `${name} left room: ${roomId}`);
        
        return { 
            roomId, 
            name, 
            remainingMembers: this.getRoomMembers(roomId) 
        };
    }
    
    /**
     * Get all members in a room
     */
    getRoomMembers(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        
        const members = [];
        room.forEach(ws => {
            const client = this.clients.get(ws);
            if (client) members.push(client.name);
        });
        return members;
    }
    
    /**
     * Get WebSocket by client name in a room
     */
    getClientByName(roomId, name) {
        const room = this.rooms.get(roomId);
        if (!room) return null;
        
        for (const ws of room) {
            const client = this.clients.get(ws);
            if (client && client.name === name) {
                return ws;
            }
        }
        return null;
    }
    
    /**
     * Get all clients in a room (except specified one)
     */
    getRoomClients(roomId, excludeWs = null) {
        const room = this.rooms.get(roomId);
        if (!room) return [];
        
        const clients = [];
        room.forEach(ws => {
            if (ws !== excludeWs) {
                clients.push(ws);
            }
        });
        return clients;
    }
    
    /**
     * Handle client disconnect
     */
    disconnect(ws) {
        const client = this.clients.get(ws);
        if (client) {
            logger.log('info', `Client disconnecting: ${client.name}`);
            this.leaveRoom(ws);
        }
        this.clients.delete(ws);
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            totalClients: this.clients.size,
            totalRooms: this.rooms.size,
            rooms: Array.from(this.rooms.keys()).map(roomId => ({
                roomId,
                memberCount: this.rooms.get(roomId).size,
                members: this.getRoomMembers(roomId)
            }))
        };
    }
}

module.exports = new RoomManager();