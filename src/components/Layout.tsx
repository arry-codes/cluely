import React from 'react';
import { Radio } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col items-center p-5 md:p-10 relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/20 rounded-full blur-[100px] pointer-events-none" />

            {/* Header */}
            <header className="w-full max-w-5xl glass-panel p-4 md:p-5 mb-6 md:mb-8 flex justify-between items-center z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                        <Radio className="text-white w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                        Cluely<span className="text-gradient">.ai</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400 hidden sm:block">Live Interview Assistant</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="w-full max-w-5xl flex-1 flex flex-col gap-6 md:gap-8 z-10">
                {children}
            </main>

            {/* Footer */}
            <footer className="mt-8 text-center text-sm text-gray-500 z-10">
                <p>Powered by Google Gemini • Built with React & Vite</p>
            </footer>
        </div>
    );
};

export default Layout;
