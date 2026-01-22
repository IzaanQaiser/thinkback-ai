import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Send, Sparkles, ExternalLink, Loader2 } from 'lucide-react';
import Kbd from './Kbd';

// Types
interface Entry {
    id: string;
    url: string;
    title: string;
    notes?: string;
    summary?: string;
    tags?: string[];
    favorite?: boolean;
    created_at?: string;
    category_ids?: string[];
    thumbnail?: string;
    platform?: string;
    channel?: string;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    entries?: Entry[];
}

interface SemanticSearchChatProps {
    onEntryClick: (entry: Entry) => void;
    getIdToken: () => Promise<string | null>;
    isMac: boolean;
}

// API function for chat
async function sendChatMessage(
    idToken: string,
    message: string,
    history: { role: string; content: string }[]
): Promise<{ response: string; entries: Entry[]; tool_used: string | null }> {
    const API_URL = import.meta.env.VITE_API_URL;

    const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send message');
    }

    return response.json();
}

const SemanticSearchChat: React.FC<SemanticSearchChatProps> = ({
    onEntryClick,
    getIdToken,
    isMac,
}) => {
    // State
    const [isExpanded, setIsExpanded] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isExpanded]);

    // Handle click outside to collapse
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isExpanded && messages.length === 0) {
                    setIsExpanded(false);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isExpanded, messages.length]);

    // Handle keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifier = isMac ? e.metaKey : e.ctrlKey;
            if (isModifier && e.key === 'k') {
                e.preventDefault();
                setIsExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 100);
            }
            if (e.key === 'Escape' && isExpanded) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMac, isExpanded]);

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleClose = () => {
        setIsExpanded(false);
        setMessages([]);
        setInputValue('');
        setError(null);
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setError(null);

        // Add user message
        const newUserMessage: ChatMessage = { role: 'user', content: userMessage };
        setMessages(prev => [...prev, newUserMessage]);

        setIsLoading(true);

        try {
            const idToken = await getIdToken();
            if (!idToken) {
                throw new Error('Not authenticated');
            }

            // Build history from previous messages
            const history = messages.map(m => ({ role: m.role, content: m.content }));

            const result = await sendChatMessage(idToken, userMessage, history);

            // Add assistant response
            const assistantMessage: ChatMessage = {
                role: 'assistant',
                content: result.response,
                entries: result.entries,
            };
            setMessages(prev => [...prev, assistantMessage]);

        } catch (err) {
            console.error('Chat error:', err);
            setError((err as Error).message || 'Failed to get response');
        } finally {
            setIsLoading(false);
        }
    };

    // Platform icon helper
    const getPlatformColor = (platform?: string): string => {
        if (!platform) return '#6B7280';
        const p = platform.toLowerCase();
        if (p.includes('youtube')) return '#FF0000';
        if (p.includes('instagram')) return '#E1306C';
        if (p.includes('tiktok')) return '#000000';
        if (p.includes('reddit')) return '#FF4500';
        if (p.includes('twitter') || p.includes('x')) return '#000000';
        if (p.includes('linkedin')) return '#0077B5';
        return '#6B7280';
    };

    const formatPlatform = (platform?: string): string => {
        if (!platform) return 'Unknown';
        const p = platform.toLowerCase();
        if (p.includes('youtube')) return 'YouTube';
        if (p.includes('instagram')) return 'Instagram';
        if (p.includes('tiktok')) return 'TikTok';
        if (p.includes('reddit')) return 'Reddit';
        if (p.includes('twitter') || p.includes('x')) return 'X';
        if (p.includes('linkedin')) return 'LinkedIn';
        return platform;
    };

    return (
        <div
            ref={containerRef}
            className={`relative transition-all duration-300 ease-out ${isExpanded
                    ? 'bg-white dark:bg-dark-900 rounded-2xl shadow-2xl border border-dark-200/80 dark:border-dark-700/60'
                    : ''
                }`}
            style={{
                height: isExpanded ? '450px' : 'auto',
            }}
        >
            {/* Collapsed State - Search Bar */}
            {!isExpanded && (
                <div
                    onClick={handleExpand}
                    className="relative bg-dark-100/50 dark:bg-dark-800/50 border border-dark-200/80 dark:border-dark-700/60 rounded-full shadow-lg flex items-center pr-4 cursor-pointer hover:bg-dark-200/50 dark:hover:bg-dark-700/50 transition-colors"
                >
                    <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-dark-500 dark:text-dark-400" size={20} />
                    <div className="w-full py-3 pl-12 sm:pl-14 pr-16 text-dark-500 dark:text-dark-400">
                        Ask AI to find anything...
                    </div>
                    <Kbd className="hidden sm:block">{isMac ? '⌘' : 'Ctrl'}+K</Kbd>
                </div>
            )}

            {/* Expanded State - Chat Interface */}
            {isExpanded && (
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-dark-200/50 dark:border-dark-700/50">
                        <div className="flex items-center gap-2">
                            <Sparkles size={20} className="text-primary-500" />
                            <span className="font-medium text-dark-900 dark:text-white">AI Search</span>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-1.5 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                        >
                            <X size={18} className="text-dark-500 dark:text-dark-400" />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.length === 0 && !isLoading && (
                            <div className="text-center py-8">
                                <Sparkles size={32} className="text-primary-500 mx-auto mb-3" />
                                <p className="text-dark-600 dark:text-dark-300 mb-2">
                                    Ask me to find anything in your vault
                                </p>
                                <p className="text-sm text-dark-500 dark:text-dark-400">
                                    Try: "Find that cooking video" or "What did I save from TikTok last week?"
                                </p>
                            </div>
                        )}

                        {messages.map((message, index) => (
                            <div
                                key={index}
                                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${message.role === 'user'
                                            ? 'bg-primary-500 text-white'
                                            : 'bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white'
                                        }`}
                                >
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>

                                    {/* Entry Cards */}
                                    {message.entries && message.entries.length > 0 && (
                                        <div className="mt-3 space-y-2">
                                            {message.entries.map((entry) => (
                                                <button
                                                    key={entry.id}
                                                    onClick={() => onEntryClick(entry)}
                                                    className="w-full text-left bg-white dark:bg-dark-700 rounded-xl p-3 hover:bg-dark-50 dark:hover:bg-dark-600 transition-colors border border-dark-200/50 dark:border-dark-600/50"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        {/* Thumbnail */}
                                                        {entry.thumbnail && (
                                                            <div className="w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-dark-200 dark:bg-dark-600">
                                                                <img
                                                                    src={entry.thumbnail}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-dark-900 dark:text-white text-sm line-clamp-1">
                                                                {entry.title || 'Untitled'}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span
                                                                    className="text-xs font-medium"
                                                                    style={{ color: getPlatformColor(entry.platform) }}
                                                                >
                                                                    {formatPlatform(entry.platform)}
                                                                </span>
                                                                {entry.channel && (
                                                                    <span className="text-xs text-dark-500 dark:text-dark-400 truncate">
                                                                        • {entry.channel}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <ExternalLink size={14} className="text-dark-400 flex-shrink-0 mt-1" />
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-dark-100 dark:bg-dark-800 rounded-2xl px-4 py-3">
                                    <Loader2 size={18} className="animate-spin text-primary-500" />
                                </div>
                            </div>
                        )}

                        {/* Error message */}
                        {error && (
                            <div className="text-center py-2">
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="p-4 border-t border-dark-200/50 dark:border-dark-700/50">
                        <div className="flex items-center gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                placeholder="Ask anything about your saved content..."
                                className="flex-1 bg-dark-100/50 dark:bg-dark-800/50 border border-dark-200/80 dark:border-dark-700/60 rounded-full px-4 py-2.5 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                                disabled={isLoading}
                            />
                            <button
                                type="submit"
                                disabled={isLoading || !inputValue.trim()}
                                className="p-2.5 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default SemanticSearchChat;
