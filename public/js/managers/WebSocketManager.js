import Logger from '../utils/logger.js';

class WebSocketManager {
    constructor() {
        this.ws = null;
        this.url = null;
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
    }
    
    /**
     * Connect to WebSocket server
     */
    connect(url) {
        return new Promise((resolve, reject) => {
            this.url = url;
            Logger.info('Connecting to WebSocket...');
            
            try {
                this.ws = new WebSocket(url);
                
                this.ws.onopen = () => {
                    Logger.success('WebSocket connected');
                    this.reconnectAttempts = 0;
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        Logger.debug(`Received message: ${data.type}`);
                        this.handleMessage(data);
                    } catch (error) {
                        Logger.error('Error parsing message:', error);
                    }
                };
                
                this.ws.onerror = (error) => {
                    Logger.error('WebSocket error:', error);
                    reject(error);
                };
                
                this.ws.onclose = () => {
                    Logger.warn('WebSocket closed');
                    this.handleClose();
                };
                
            } catch (error) {
                Logger.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Handle incoming message
     */
    handleMessage(data) {
        const handler = this.messageHandlers.get(data.type);
        if (handler) {
            handler(data);
        } else {
            Logger.warn(`No handler for message type: ${data.type}`);
        }
    }
    
    /**
     * Register message handler
     */
    on(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
        Logger.debug(`Registered handler for: ${messageType}`);
    }
    
    /**
     * Send message to server
     */
    send(data) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            Logger.debug(`Sent message: ${data.type}`);
            return true;
        } else {
            Logger.error('WebSocket is not open');
            return false;
        }
    }
    
    /**
     * Handle WebSocket close
     */
    handleClose() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            Logger.info(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            setTimeout(() => {
                this.connect(this.url).catch(err => {
                    Logger.error('Reconnection failed:', err);
                });
            }, this.reconnectDelay);
        } else {
            Logger.error('Max reconnection attempts reached');
        }
    }
    
    /**
     * Close connection
     */
    close() {
        if (this.ws) {
            this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnect
            this.ws.close();
            this.ws = null;
            Logger.info('WebSocket connection closed');
        }
    }
    
    /**
     * Check if connected
     */
    isConnected() {
        return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
}

export default WebSocketManager;