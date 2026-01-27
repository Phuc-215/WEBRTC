import Logger from '../utils/logger.js';

class RoomUI {
    constructor() {
        // Cache DOM elements
        this.elements = {
            loginSection: document.getElementById('login-section'),
            roomSection: document.getElementById('room-section'),
            roomName: document.getElementById('roomName'),
            memberList: document.getElementById('memberList'),
            connectionStatus: document.getElementById('connectionStatus'),
            startCallBtn: document.getElementById('startCallBtn'),
            hangupBtn: document.getElementById('hangupBtn'),
            leaveBtn: document.getElementById('leaveBtn'),
            statsSection: document.getElementById('stats-section'),
            statsContent: document.getElementById('stats-content')
        };
        
        this.members = [];
        
        // Verify all elements exist
        this.verifyElements();
    }
    
    /**
     * Verify that all required DOM elements exist
     */
    verifyElements() {
        const missing = [];
        
        Object.entries(this.elements).forEach(([key, element]) => {
            if (!element) {
                missing.push(key);
            }
        });
        
        if (missing.length > 0) {
            Logger.error('Missing DOM elements:', missing.join(', '));
            console.error('Make sure your HTML has these elements with correct IDs');
        }
    }
    
    /**
     * Show room section and hide login
     */
    showRoom(roomId) {
        if (!this.elements.loginSection || !this.elements.roomSection) {
            Logger.error('Cannot show room - sections not found');
            return;
        }
        
        this.elements.loginSection.style.display = 'none';
        this.elements.roomSection.style.display = 'block';
        
        if (this.elements.roomName) {
            this.elements.roomName.textContent = roomId;
        }
        
        Logger.info('Room UI displayed');
    }
    
    /**
     * Show login section and hide room
     */
    showLogin() {
        if (!this.elements.loginSection || !this.elements.roomSection) {
            Logger.error('Cannot show login - sections not found');
            return;
        }
        
        this.elements.loginSection.style.display = 'block';
        this.elements.roomSection.style.display = 'none';
        
        // Reset room info
        if (this.elements.roomName) {
            this.elements.roomName.textContent = '';
        }
        if (this.elements.memberList) {
            this.elements.memberList.textContent = '';
        }
        
        Logger.info('Login UI displayed');
    }
    
    /**
     * Update member list display
     */
    updateMembers(members) {
        this.members = members;
        
        if (this.elements.memberList) {
            this.elements.memberList.textContent = members.join(', ');
        }
        
        Logger.info(`Member list updated: ${members.join(', ')}`);
    }
    
    /**
     * Get current members
     */
    getMembers() {
        return this.members;
    }
    
    /**
     * Update connection status display
     */
    updateConnectionStatus(status, color = '#48bb78') {
        if (this.elements.connectionStatus) {
            this.elements.connectionStatus.textContent = status;
            this.elements.connectionStatus.style.color = color;
        }
    }
    
    /**
     * Show call started state
     */
    showCallStarted() {
        if (this.elements.startCallBtn) {
            this.elements.startCallBtn.style.display = 'none';
        }
        
        if (this.elements.hangupBtn) {
            this.elements.hangupBtn.style.display = 'inline-block';
        }
        
        this.updateConnectionStatus('In Call', '#48bb78');
        Logger.info('UI updated: Call started');
    }
    
    /**
     * Show call ended state
     */
    showCallEnded() {
        if (this.elements.startCallBtn) {
            this.elements.startCallBtn.style.display = 'inline-block';
        }
        
        if (this.elements.hangupBtn) {
            this.elements.hangupBtn.style.display = 'none';
        }
        
        this.updateConnectionStatus('Not Connected', '#666');
        Logger.info('UI updated: Call ended');
    }
    
    /**
     * Show/hide stats section
     */
    toggleStats(show) {
        if (this.elements.statsSection) {
            this.elements.statsSection.style.display = show ? 'block' : 'none';
        }
    }
    
    /**
     * Update stats content (replace existing content)
     */
    updateStats(statsHTML) {
        if (this.elements.statsContent) {
            this.elements.statsContent.innerHTML = statsHTML;
        }
    }
    
    /**
     * Append stats to existing content
     */
    appendStats(statsHTML) {
        if (this.elements.statsContent) {
            this.elements.statsContent.innerHTML += statsHTML;
        }
    }
    
    /**
     * Clear all stats
     */
    clearStats() {
        if (this.elements.statsContent) {
            this.elements.statsContent.innerHTML = '';
        }
    }
    
    /**
     * Enable/disable all buttons
     */
    setButtonsEnabled(enabled) {
        const buttons = [
            this.elements.startCallBtn,
            this.elements.hangupBtn,
            this.elements.leaveBtn
        ];
        
        buttons.forEach(button => {
            if (button) {
                button.disabled = !enabled;
            }
        });
        
        Logger.debug(`Buttons ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Show loading state on button
     */
    setButtonLoading(buttonElement, loading, originalText = '') {
        if (!buttonElement) return;
        
        if (loading) {
            buttonElement.dataset.originalText = buttonElement.textContent;
            buttonElement.textContent = '⏳ Loading...';
            buttonElement.disabled = true;
        } else {
            buttonElement.textContent = originalText || buttonElement.dataset.originalText || 'Action';
            buttonElement.disabled = false;
        }
    }
    
    /**
     * Show error message
     */
    showError(message) {
        // Using native alert for simplicity
        // You can replace with custom modal/toast
        alert(`❌ Error: ${message}`);
        Logger.error(message);
    }
    
    /**
     * Show success message
     */
    showSuccess(message) {
        // Using console for now
        // You can implement custom toast notification
        Logger.success(message);
    }
    
    /**
     * Show warning message
     */
    showWarning(message) {
        Logger.warn(message);
    }
    
    /**
     * Add notification to UI (custom implementation)
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '15px 20px',
            borderRadius: '8px',
            backgroundColor: type === 'error' ? '#f56565' : 
                           type === 'success' ? '#48bb78' : 
                           type === 'warning' ? '#ed8936' : '#4299e1',
            color: 'white',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '9999',
            animation: 'slideInRight 0.3s ease-out'
        });
        
        // Add to body
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Update call duration (optional feature)
     */
    updateCallDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const duration = `${minutes}:${secs.toString().padStart(2, '0')}`;
        
        // You can add a duration display element in HTML
        const durationElement = document.getElementById('callDuration');
        if (durationElement) {
            durationElement.textContent = duration;
        }
    }
    
    /**
     * Reset UI to initial state
     */
    reset() {
        this.showLogin();
        this.members = [];
        this.clearStats();
        this.toggleStats(false);
        this.updateConnectionStatus('Not Connected', '#666');
        this.setButtonsEnabled(true);
        
        Logger.info('UI reset to initial state');
    }
    
    /**
     * Get DOM element by ID (helper)
     */
    getElement(id) {
        return document.getElementById(id);
    }
    
    /**
     * Check if in room
     */
    isInRoom() {
        return this.elements.roomSection && 
               this.elements.roomSection.style.display !== 'none';
    }
}

export default RoomUI;
