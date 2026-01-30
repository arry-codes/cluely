import React from 'react';

interface AudioVisualizerProps {
    isListening: boolean;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isListening }) => {
    // Simulate bars for visualization
    const bars = Array.from({ length: 20 });

    return (
        <div className="w-full h-32 glass-panel flex flex-col items-center justify-center p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 pointer-events-none" />

            <div className="flex items-end justify-center gap-1.5 h-16 w-full z-10 transition-all duration-300">
                {bars.map((_, i) => (
                    <div
                        key={i}
                        className="w-1.5 bg-gradient-to-t from-indigo-400 to-cyan-300 rounded-full transition-all duration-100 ease-in-out"
                        style={{
                            height: isListening ? `${Math.max(15, Math.random() * 100)}%` : '10%',
                            opacity: isListening ? 1 : 0.3,
                            animationDelay: `${i * 0.05}s`
                        }}
                    />
                ))}
            </div>

            <div className={`mt-4 text-xs font-medium uppercase tracking-wider transition-colors ${isListening ? 'text-green-400' : 'text-gray-500'
                }`}>
                {isListening ? 'Listening via Microphone...' : 'Microphone Idle'}
            </div>
        </div>
    );
};

export default AudioVisualizer;
