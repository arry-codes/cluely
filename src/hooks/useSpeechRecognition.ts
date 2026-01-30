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
    const finalTranscriptRef = useRef('');

    const hasSupport = Boolean(SpeechRecognition);

    const createRecognition = useCallback(() => {
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            let interimTranscript = '';

            // Only process new results from resultIndex onwards
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    // Add final result to our stored final transcript
                    finalTranscriptRef.current += result[0].transcript + ' ';
                } else {
                    // Accumulate interim results
                    interimTranscript += result[0].transcript;
                }
            }

            // Combine stored final transcript with current interim
            setTranscript(finalTranscriptRef.current + interimTranscript);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech error:', event.error);
            if (event.error === 'not-allowed') {
                isListeningRef.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            // Auto-restart if still supposed to be listening
            if (isListeningRef.current && recognitionRef.current) {
                try {
                    recognitionRef.current.start();
                } catch (e) {
                    // Already started, ignore
                }
            }
        };

        return recognition;
    }, []);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) return;

        // Create fresh recognition instance
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
        }

        const recognition = createRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        finalTranscriptRef.current = ''; // Reset final transcript
        setIsListening(true);

        try {
            recognition.start();
            console.log('🎤 Started listening');
        } catch (e) {
            console.error('Failed to start:', e);
        }
    }, [createRecognition]);

    const stopListening = useCallback(() => {
        isListeningRef.current = false;
        setIsListening(false);

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('🛑 Stopped listening');
            } catch (e) { }
            recognitionRef.current = null;
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
        finalTranscriptRef.current = '';
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) { }
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
