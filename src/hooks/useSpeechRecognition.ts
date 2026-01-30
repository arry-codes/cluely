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

    // Robust state tracking
    const finalTranscriptRef = useRef('');

    // Helper to check for mobile
    const isMobile = typeof window !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const hasSupport = Boolean(SpeechRecognition);

    const createRecognition = useCallback(() => {
        if (!SpeechRecognition) return null;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        // Android/Mobile often sends duplicate interim results
        recognition.onresult = (event: any) => {
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    // Robust deduplication: check if this final result is already at end of our stored text
                    const newFinal = result[0].transcript.trim();
                    const currentStored = finalTranscriptRef.current.trim();

                    if (!currentStored.endsWith(newFinal)) {
                        finalTranscriptRef.current += ' ' + newFinal;
                        finalTranscriptRef.current = finalTranscriptRef.current.trim();
                    }
                } else {
                    interimTranscript += result[0].transcript;
                }
            }

            // Simple deduplication for display
            const finalDisplay = finalTranscriptRef.current;

            // On mobile, interim often repeats the end of final. 
            // Clean display by checking overlap
            let cleanInterim = interimTranscript;
            if (isMobile && finalDisplay.endsWith(cleanInterim.trim())) {
                cleanInterim = '';
            }

            setTranscript((finalDisplay + ' ' + cleanInterim).trim());
        };

        recognition.onerror = (event: any) => {
            console.error('Speech error:', event.error);
            if (event.error === 'not-allowed') {
                isListeningRef.current = false;
                setIsListening(false);
            }
        };

        recognition.onend = () => {
            if (isListeningRef.current && recognitionRef.current) {
                try {
                    // Small delay before restart on mobile prevents some issues
                    setTimeout(() => {
                        try {
                            if (isListeningRef.current) recognitionRef.current.start();
                        } catch (e) { }
                    }, isMobile ? 100 : 0);
                } catch (e) { }
            }
        };

        return recognition;
    }, [isMobile]);

    const startListening = useCallback(() => {
        if (!SpeechRecognition) return;

        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch (e) { }
        }

        const recognition = createRecognition();
        if (!recognition) return;

        recognitionRef.current = recognition;
        isListeningRef.current = true;
        // Don't clear transcript on start listening for continuity if wanted
        // but app logic usually clears it. We just reset the ref logic here.
        // finalTranscriptRef.current = ''; 
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

    useEffect(() => {
        return () => {
            isListeningRef.current = false;
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch (e) { }
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
