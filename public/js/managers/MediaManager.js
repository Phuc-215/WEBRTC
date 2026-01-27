import Logger from '../utils/logger.js';

class MediaManager {
    constructor() {
        this.localStream = null;
        this.mediaConstraints = {
            video: {
                width: { ideal: 1280, max: 1920 },
                height: { ideal: 720, max: 1080 },
                frameRate: { ideal: 30, max: 30 }
            },
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            }
        };
    }
    
    /**
     * Get user media (camera and microphone)
     */
    async getUserMedia(constraints = this.mediaConstraints) {
        try {
            Logger.info('Requesting user media...');
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            Logger.success('User media acquired');
            Logger.info(`Video tracks: ${this.localStream.getVideoTracks().length}`);
            Logger.info(`Audio tracks: ${this.localStream.getAudioTracks().length}`);
            
            return this.localStream;
            
        } catch (error) {
            Logger.error('Error getting user media:', error);
            
            // Provide user-friendly error messages
            if (error.name === 'NotAllowedError') {
                throw new Error('Camera/microphone permission denied');
            } else if (error.name === 'NotFoundError') {
                throw new Error('No camera or microphone found');
            } else if (error.name === 'NotReadableError') {
                throw new Error('Camera/microphone is already in use');
            } else {
                throw new Error('Failed to access camera/microphone');
            }
        }
    }
    
    /**
     * Stop local stream
     */
    stopLocalStream() {
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                track.stop();
                Logger.debug(`Stopped ${track.kind} track`);
            });
            this.localStream = null;
            Logger.info('Local stream stopped');
        }
    }
    
    /**
     * Mute/unmute audio
     */
    toggleAudio(enabled) {
        if (this.localStream) {
            this.localStream.getAudioTracks().forEach(track => {
                track.enabled = enabled;
            });
            Logger.info(`Audio ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Enable/disable video
     */
    toggleVideo(enabled) {
        if (this.localStream) {
            this.localStream.getVideoTracks().forEach(track => {
                track.enabled = enabled;
            });
            Logger.info(`Video ${enabled ? 'enabled' : 'disabled'}`);
        }
    }
    
    /**
     * Get local stream
     */
    getLocalStream() {
        return this.localStream;
    }
    
    /**
     * Check if media is available
     */
    hasLocalStream() {
        return this.localStream !== null;
    }
}

export default MediaManager;