import React, { useEffect, useRef } from 'react';
import { Type } from 'lucide-react';

interface LiveTranscriptProps {
    transcript: string;
    isListening: boolean;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ transcript, isListening }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcript]);

    return (
        <div className="w-full glass-panel p-4 sm:p-6 flex flex-col gap-3 min-h-[150px] sm:min-h-[200px]">
            <div className="flex items-center gap-2 text-indigo-300 border-b border-white/5 pb-2 sm:pb-3">
                <Type size={16} />
                <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Live Transcript</h2>
            </div>

            <div
                ref={containerRef}
                className="flex-1 overflow-y-auto max-h-[200px] text-lg leading-relaxed text-gray-200 font-light scrollbar-hide"
            >
                {transcript ? (
                    <p>
                        {transcript}
                        {isListening && <span className="inline-block w-1.5 h-4 ml-1 bg-indigo-400 animate-pulse align-middle" />}
                    </p>
                ) : (
                    <p className="text-gray-600 italic">
                        Waiting for speech...
                    </p>
                )}
            </div>
        </div>
    );
};

export default LiveTranscript;
