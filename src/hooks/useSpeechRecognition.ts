import { useState, useRef, useCallback, useEffect } from 'react';

interface SpeechRecognitionResult {
    transcript: string;
    isListening: boolean;
    hasSupport: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

const SpeechRecognition = typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

// Detect mobile
const isMobile = typeof window !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

export const useSpeechRecognition = (): SpeechRecognitionResult => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);

    // For mobile: track last processed result index
    const lastResultIndexRef = useRef(0);
    const accumulatedTextRef = useRef('');

    const hasSupport = Boolean(SpeechRecognition);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) return;

        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = !isMobile; // Disable interim on mobile to reduce confusion
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            if (isMobile) {
                // MOBILE: Only process final results, append new ones only
                for (let i = lastResultIndexRef.current; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        const newText = event.results[i][0].transcript;
                        accumulatedTextRef.current += newText + ' ';
                        lastResultIndexRef.current = i + 1;
                    }
                }
                setTranscript(accumulatedTextRef.current.trim());
            } else {
                // DESKTOP: Standard approach - read all results
                let fullTranscript = '';
                for (let i = 0; i < event.results.length; i++) {
                    fullTranscript += event.results[i][0].transcript;
                }
                setTranscript(fullTranscript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech error:', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                isListeningRef.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current) {
                try { recognition.start(); } catch (e) { }
            }
        };

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        lastResultIndexRef.current = 0;
        accumulatedTextRef.current = '';
        setIsListening(true);

        try {
            recognition.start();
            console.log('🎤 Started listening (mobile:', isMobile, ')');
        } catch (e) {
            console.error(e);
        }
    }, []);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        accumulatedTextRef.current = '';
        lastResultIndexRef.current = 0;
        if (recognitionRef.current) {
            try { recognitionRef.current.abort(); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try { recognitionRef.current.abort(); } catch (e) { }
            }
        };
    }, []);

    return {
        transcript,
        isListening,
        hasSupport,
        startListening,
        stopListening,
        resetTranscript,
    };
};
