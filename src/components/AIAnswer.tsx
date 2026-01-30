import React from 'react';
import { Sparkles, Copy, Check } from 'lucide-react';

interface AIAnswerProps {
    answer: string;
    isLoading: boolean;
}

// Simple markdown parser for bold, italic, and bullet points
const parseMarkdown = (text: string): React.ReactNode[] => {
    if (!text) return [];

    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
        // Parse inline formatting
        const parseInline = (str: string): React.ReactNode[] => {
            const parts: React.ReactNode[] = [];
            let remaining = str;
            let key = 0;

            while (remaining.length > 0) {
                // Bold: **text** or __text__
                const boldMatch = remaining.match(/^\*\*(.+?)\*\*|^__(.+?)__/);
                if (boldMatch) {
                    parts.push(<strong key={key++} className="font-semibold text-white">{boldMatch[1] || boldMatch[2]}</strong>);
                    remaining = remaining.slice(boldMatch[0].length);
                    continue;
                }

                // Italic: *text* or _text_
                const italicMatch = remaining.match(/^\*([^*]+?)\*|^_([^_]+?)_/);
                if (italicMatch) {
                    parts.push(<em key={key++} className="italic text-gray-200">{italicMatch[1] || italicMatch[2]}</em>);
                    remaining = remaining.slice(italicMatch[0].length);
                    continue;
                }

                // Regular text until next special char
                const nextSpecial = remaining.search(/[*_]/);
                if (nextSpecial === -1) {
                    parts.push(remaining);
                    break;
                } else if (nextSpecial === 0) {
                    // Single special char, treat as text
                    parts.push(remaining[0]);
                    remaining = remaining.slice(1);
                } else {
                    parts.push(remaining.slice(0, nextSpecial));
                    remaining = remaining.slice(nextSpecial);
                }
            }

            return parts;
        };

        // Bullet points
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
            return (
                <div key={lineIndex} className="flex gap-3 ml-3 my-2">
                    <span className="text-indigo-400 mt-0.5">•</span>
                    <span className="flex-1">{parseInline(line.trim().slice(2))}</span>
                </div>
            );
        }

        // Numbered lists
        const numberedMatch = line.trim().match(/^(\d+)\.\s+(.+)/);
        if (numberedMatch) {
            return (
                <div key={lineIndex} className="flex gap-3 ml-3 my-2">
                    <span className="text-indigo-400 min-w-[1.5rem] mt-0.5">{numberedMatch[1]}.</span>
                    <span className="flex-1">{parseInline(numberedMatch[2])}</span>
                </div>
            );
        }

        // Empty line - bigger gap between sections
        if (line.trim() === '') {
            return <div key={lineIndex} className="h-4" />;
        }

        // Regular paragraph
        return <p key={lineIndex} className="my-3 leading-relaxed">{parseInline(line)}</p>;
    });
};

const AIAnswer: React.FC<AIAnswerProps> = ({ answer, isLoading }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        if (!answer) return;
        navigator.clipboard.writeText(answer);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="w-full h-full glass-panel p-4 sm:p-6 flex flex-col gap-3 min-h-[150px] sm:min-h-[200px] border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)]">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 sm:pb-3">
                <div className="flex items-center gap-2 text-cyan-400">
                    <Sparkles size={16} />
                    <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wide">Cluely Answer</h2>
                </div>
                {answer && (
                    <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                        title="Copy Answer"
                    >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto max-h-[350px] text-gray-100 leading-relaxed">
                {isLoading ? (
                    <div className="flex flex-col gap-3 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4"></div>
                        <div className="h-4 bg-white/10 rounded w-full"></div>
                        <div className="h-4 bg-white/10 rounded w-5/6"></div>
                    </div>
                ) : answer ? (
                    <div className="text-sm sm:text-base">
                        {parseMarkdown(answer)}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-600 text-sm">
                        <Sparkles className="w-8 h-8 opacity-20 mb-2" />
                        <p>AI insights will appear here...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AIAnswer;
