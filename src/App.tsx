import { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import AudioVisualizer from './components/AudioVisualizer';
import LiveTranscript from './components/LiveTranscript';
import AIAnswer from './components/AIAnswer';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { generateAnswer } from './services/gemini';
import { Mic, MicOff, Loader2 } from 'lucide-react';

// Mic Button Component (Shared)
const MicButton = ({
  size = 'large',
  isListening,
  isGenerating,
  onClick
}: {
  size?: 'large' | 'medium',
  isListening: boolean,
  isGenerating: boolean,
  onClick: () => void
}) => {
  const isLarge = size === 'large';
  const buttonSize = isLarge ? 'w-20 h-20' : 'w-16 h-16';
  const iconSize = isLarge ? 32 : 24;

  return (
    <button
      onClick={onClick}
      disabled={isGenerating}
      className={`${buttonSize} rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 disabled:opacity-50 ${isGenerating
        ? 'bg-gray-600 cursor-wait'
        : isListening
          ? 'bg-red-500 shadow-red-500/50 animate-pulse'
          : 'bg-gradient-to-br from-indigo-500 to-purple-600 shadow-indigo-500/40 hover:scale-105'
        }`}
    >
      {isGenerating ? (
        <Loader2 size={iconSize} className="text-white animate-spin" />
      ) : isListening ? (
        <MicOff size={iconSize} className="text-white" />
      ) : (
        <Mic size={iconSize} className="text-white" />
      )}
    </button>
  );
};

function App() {
  const { isListening, transcript, startListening, stopListening, resetTranscript, hasSupport } = useSpeechRecognition();
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const [answer, setAnswer] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const transcriptRef = useRef(transcript);

  // Keep ref in sync for event handlers
  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  const handleGenerateAnswer = async (text: string) => {
    if (!apiKey || !text.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateAnswer(apiKey, text);
      setAnswer(result);
    } catch (err: any) {
      console.error(err);
      setAnswer(`Error: ${err.message || "Failed to generate answer."}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMicClick = () => {
    if (isListening) {
      // User clicked STOP
      stopListening();

      // Use transcript from ref to ensure we have latest content
      const currentText = transcriptRef.current;
      if (currentText && currentText.trim().length > 0) {
        handleGenerateAnswer(currentText);
      }
    } else {
      // User clicked START
      resetTranscript();
      setAnswer('');
      startListening();
    }
  };

  if (!hasSupport) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <p className="text-center text-lg">Please use Chrome for Web Speech API support.</p>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="max-w-md p-8 border border-red-500/30 rounded-2xl bg-red-900/10 text-center">
          <h2 className="text-xl text-red-400 font-bold mb-4">Missing API Key</h2>
          <p className="text-gray-400">Set VITE_GEMINI_API_KEY in .env and restart</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      {/* ============ MOBILE VIEW ============ */}
      <div className="md:hidden flex flex-col gap-5 w-full pb-36">
        {/* Status */}
        <div className={`text-center py-4 px-4 rounded-xl font-medium text-sm transition-all ${isGenerating
          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
          : isListening
            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
            : 'bg-white/5 text-gray-500 border border-white/10'
          }`}>
          {isGenerating
            ? '✨ Generating answer...'
            : isListening
              ? '🎙️ Listening... Tap to stop & get answer'
              : '🎤 Tap mic to start'}
        </div>

        {/* Transcript */}
        <LiveTranscript transcript={transcript} isListening={isListening} />

        {/* Answer */}
        <AIAnswer answer={answer} isLoading={isGenerating} />

        {/* Floating Mic Button */}
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
          <MicButton
            size="large"
            isListening={isListening}
            isGenerating={isGenerating}
            onClick={handleMicClick}
          />
        </div>
      </div>

      {/* ============ DESKTOP VIEW ============ */}
      <div className="hidden md:flex md:flex-col gap-8 w-full">
        {/* Top Section with Visualizer and Mic */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <AudioVisualizer isListening={isListening} />
          </div>
          <div className="glass-panel p-8 flex flex-col items-center justify-center gap-4">
            <MicButton
              size="large"
              isListening={isListening}
              isGenerating={isGenerating}
              onClick={handleMicClick}
            />
            <p className={`text-center text-sm font-medium transition-colors ${isGenerating
              ? 'text-purple-400'
              : isListening
                ? 'text-red-400'
                : 'text-gray-500'
              }`}>
              {isGenerating
                ? 'Generating...'
                : isListening
                  ? 'Click to stop & answer'
                  : 'Click to start'}
            </p>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-2 gap-8 flex-1" style={{ minHeight: '400px' }}>
          <LiveTranscript transcript={transcript} isListening={isListening} />
          <AIAnswer answer={answer} isLoading={isGenerating} />
        </div>
      </div>
    </Layout>
  );
}

export default App;
