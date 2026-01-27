import Logger from '../utils/logger.js';

class VideoGrid {
    constructor(gridElementId) {
        this.gridElement = document.getElementById(gridElementId);
        this.localVideoId = 'localVideo';
        this.remoteVideos = new Map(); // peerId -> video element
    }
    
    /**
     * Set local video stream
     */
    setLocalStream(stream) {
        const localVideo = document.getElementById(this.localVideoId);
        if (localVideo) {
            localVideo.srcObject = stream;
            this.updateVideoStatus(this.localVideoId, '🟢 Streaming');
            Logger.success('Local video stream set');
        }
    }
    
    /**
     * Add remote video for peer
     */
    addRemoteVideo(peerId, stream) {
        Logger.info(`Adding video for ${peerId}`);
        
        // Check if video already exists
        if (this.remoteVideos.has(peerId)) {
            Logger.warn(`Video for ${peerId} already exists, updating stream`);
            const video = this.remoteVideos.get(peerId).querySelector('video');
            video.srcObject = stream;
            this.updateVideoStatus(`video-${peerId}`, '🟢 Connected');
            return;
        }
        
        // Create video wrapper
        const wrapper = document.createElement('div');
        wrapper.className = 'video-wrapper';
        wrapper.id = `video-${peerId}`;
        
        // Create video element
        const video = document.createElement('video');
        video.autoplay = true;
        video.playsinline = true;
        video.srcObject = stream;
        
        // Create label
        const label = document.createElement('div');
        label.className = 'video-label';
        label.innerHTML = `
            <span class="name">${peerId}</span>
            <span class="status" id="status-${peerId}">🟢 Connected</span>
        `;
        
        wrapper.appendChild(video);
        wrapper.appendChild(label);
        this.gridElement.appendChild(wrapper);
        
        this.remoteVideos.set(peerId, wrapper);
        Logger.success(`Video added for ${peerId}`);
    }
    
    /**
     * Remove remote video
     */
    removeRemoteVideo(peerId) {
        const wrapper = this.remoteVideos.get(peerId);
        if (wrapper) {
            // Stop all tracks
            const video = wrapper.querySelector('video');
            if (video && video.srcObject) {
                video.srcObject.getTracks().forEach(track => track.stop());
            }
            
            wrapper.remove();
            this.remoteVideos.delete(peerId);
            Logger.info(`Video removed for ${peerId}`);
        }
    }
    
    /**
     * Update video status label
     */
    updateVideoStatus(videoId, status) {
        const statusElement = document.getElementById(`status-${videoId.replace('video-', '')}`);
        if (statusElement) {
            statusElement.textContent = status;
        }
    }
    
    /**
     * Clear all remote videos
     */
    clearRemoteVideos() {
        Logger.info('Clearing all remote videos');
        this.remoteVideos.forEach((wrapper, peerId) => {
            this.removeRemoteVideo(peerId);
        });
    }
    
    /**
     * Update connection status for peer
     */
    updateConnectionStatus(peerId, state) {
        const statusMap = {
            'new': '🆕 New',
            'connecting': '🔄 Connecting',
            'connected': '🟢 Connected',
            'disconnected': '⚠️ Disconnected',
            'failed': '❌ Failed',
            'closed': '🔒 Closed'
        };
        
        const status = statusMap[state] || state;
        this.updateVideoStatus(`video-${peerId}`, status);
    }
    
    /**
     * Get number of remote videos
     */
    getRemoteVideoCount() {
        return this.remoteVideos.size;
    }
}

export default VideoGrid;