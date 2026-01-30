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

export const useSpeechRecognition = (): SpeechRecognitionResult => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const isListeningRef = useRef(false);

    const hasSupport = Boolean(SpeechRecognition);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) return;

        // cleanup previous
        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let final = '';
            let interim = '';

            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) {
                    final += event.results[i][0].transcript;
                } else {
                    interim += event.results[i][0].transcript;
                }
            }
            // Simple concat: Previous Final + New Final + Interim
            // NOTE: We rely on the API returning the FULL session transcript if continuous=true works well.
            // However, some mobile browsers only return current segment.
            // So we implement the standard "append" strategy manually for robustness:

            // Actually, relying on state update for appending is risky with rapid events.
            // Best approach for React: Rebuild from event results if possible, 
            // but since results list grows, we can just use that.

            // Let's rely on the event.results array which accumulates in absolute continuous mode
            // This is the standard correct way:
            let fullTranscript = '';
            for (let i = 0; i < event.results.length; i++) {
                fullTranscript += event.results[i][0].transcript;
            }
            setTranscript(fullTranscript);
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
        setIsListening(true);

        try {
            recognition.start();
        } catch (e) {
            console.error(e);
        }
    }, []);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        if (recognitionRef.current) {
            // Abort basically resets the session history in the API object
            try { recognitionRef.current.abort(); } catch (e) { }
        }
    }, []);

    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                recognitionRef.current.abort();
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
