import Logger from './logger.js';

class StatsAnalyzer {
    /**
     * Analyze RTCPeerConnection statistics
     */
    async analyze(pc, peerId) {
        try {
            const stats = await pc.getStats();
            const analysis = {
                peerId,
                timestamp: new Date().toISOString(),
                candidates: {},
                connection: {},
                media: {}
            };
            
            stats.forEach(report => {
                // Candidate pair (shows active connection)
                if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                    analysis.connection = {
                        state: report.state,
                        localCandidateId: report.localCandidateId,
                        remoteCandidateId: report.remoteCandidateId,
                        bytesSent: report.bytesSent,
                        bytesReceived: report.bytesReceived,
                        currentRoundTripTime: report.currentRoundTripTime
                    };
                }
                
                // Local candidates
                if (report.type === 'local-candidate') {
                    analysis.candidates.local = {
                        type: report.candidateType,
                        protocol: report.protocol,
                        address: report.address || report.ip,
                        port: report.port
                    };
                }
                
                // Remote candidates
                if (report.type === 'remote-candidate') {
                    analysis.candidates.remote = {
                        type: report.candidateType,
                        protocol: report.protocol,
                        address: report.address || report.ip,
                        port: report.port
                    };
                }
                
                // Media stats
                if (report.type === 'inbound-rtp' && report.kind === 'video') {
                    analysis.media.video = {
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        bytesReceived: report.bytesReceived,
                        frameWidth: report.frameWidth,
                        frameHeight: report.frameHeight,
                        framesPerSecond: report.framesPerSecond
                    };
                }
            });
            
            return analysis;
        } catch (error) {
            Logger.error('Error analyzing stats:', error);
            return null;
        }
    }
    
    /**
     * Check if connection is using TURN relay
     */
    async isUsingTurn(pc) {
        const stats = await pc.getStats();
        let usingRelay = false;
        
        stats.forEach(report => {
            if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                stats.forEach(candidate => {
                    if (candidate.id === report.localCandidateId || 
                        candidate.id === report.remoteCandidateId) {
                        if (candidate.candidateType === 'relay') {
                            usingRelay = true;
                        }
                    }
                });
            }
        });
        
        return usingRelay;
    }
    
    /**
     * Format stats for display
     */
    formatStats(analysis) {
        if (!analysis) return 'No stats available';
        
        let output = `
<div class="stat-item">
    <strong>Peer:</strong> ${analysis.peerId}<br>
    <strong>Time:</strong> ${new Date(analysis.timestamp).toLocaleTimeString()}
</div>`;
        
        if (analysis.candidates.local) {
            const c = analysis.candidates.local;
            output += `
<div class="stat-item">
    <strong>Local Candidate:</strong><br>
    Type: ${c.type} | Protocol: ${c.protocol}<br>
    Address: ${c.address}:${c.port}
    ${c.type === 'relay' ? '<br>🔄 <strong>Using TURN Relay!</strong>' : ''}
</div>`;
        }
        
        if (analysis.candidates.remote) {
            const c = analysis.candidates.remote;
            output += `
<div class="stat-item">
    <strong>Remote Candidate:</strong><br>
    Type: ${c.type} | Protocol: ${c.protocol}<br>
    Address: ${c.address}:${c.port}
</div>`;
        }
        
        if (analysis.connection.currentRoundTripTime) {
            output += `
<div class="stat-item">
    <strong>RTT:</strong> ${(analysis.connection.currentRoundTripTime * 1000).toFixed(2)} ms<br>
    <strong>Sent:</strong> ${(analysis.connection.bytesSent / 1024).toFixed(2)} KB<br>
    <strong>Received:</strong> ${(analysis.connection.bytesReceived / 1024).toFixed(2)} KB
</div>`;
        }
        
        return output;
    }
}

export default new StatsAnalyzer();