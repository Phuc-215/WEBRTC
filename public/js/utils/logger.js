class Logger {
    constructor() {
        this.debugMode = true; // Set to false in production
    }
    
    debug(message, ...args) {
        if (this.debugMode) {
            console.log(`🔍 [DEBUG] ${message}`, ...args);
        }
    }
    
    info(message, ...args) {
        console.log(`ℹ️ [INFO] ${message}`, ...args);
    }
    
    success(message, ...args) {
        console.log(`✅ [SUCCESS] ${message}`, ...args);
    }
    
    error(message, ...args) {
        console.error(`❌ [ERROR] ${message}`, ...args);
    }
    
    warn(message, ...args) {
        console.warn(`⚠️ [WARN] ${message}`, ...args);
    }
    
    connection(peerId, state) {
        const emoji = {
            'new': '🆕',
            'connecting': '🔄',
            'connected': '✅',
            'disconnected': '⚠️',
            'failed': '❌',
            'closed': '🔒'
        };
        console.log(`${emoji[state] || '📡'} Connection with ${peerId}: ${state}`);
    }
    
    ice(peerId, state) {
        const emoji = {
            'new': '🆕',
            'checking': '🔍',
            'connected': '✅',
            'completed': '🎉',
            'failed': '❌',
            'disconnected': '⚠️',
            'closed': '🔒'
        };
        console.log(`${emoji[state] || '🧊'} ICE with ${peerId}: ${state}`);
    }
}

export default new Logger();
