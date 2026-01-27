const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class Logger {
    /**
     * Log message with level
     */
    log(level, message) {
        const timestamp = new Date().toISOString();
        let color = colors.reset;
        let emoji = '';
        
        switch(level) {
            case 'error':
                color = colors.red;
                emoji = '❌';
                break;
            case 'warn':
                color = colors.yellow;
                emoji = '⚠️';
                break;
            case 'success':
                color = colors.green;
                emoji = '✅';
                break;
            case 'info':
                color = colors.blue;
                emoji = 'ℹ️';
                break;
            case 'debug':
                color = colors.cyan;
                emoji = '🔍';
                break;
            default:
                emoji = '📝';
        }
        
        console.log(`${color}${emoji} [${timestamp.substring(11, 19)}] ${message}${colors.reset}`);
    }
    
    error(message) {
        this.log('error', message);
    }
    
    warn(message) {
        this.log('warn', message);
    }
    
    success(message) {
        this.log('success', message);
    }
    
    info(message) {
        this.log('info', message);
    }
    
    debug(message) {
        if (process.env.DEBUG === 'true') {
            this.log('debug', message);
        }
    }
}

module.exports = new Logger();