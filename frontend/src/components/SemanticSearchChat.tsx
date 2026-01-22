import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Send, Sparkles, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
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

// API function for streaming chat
async function* streamChatMessage(
    idToken: string,
    message: string,
    history: { role: string; content: string }[]
): AsyncGenerator<{ type: 'token' | 'entries' | 'done' | 'error'; content?: string; entries?: Entry[]; tool_used?: string | null; message?: string }> {
    const API_URL = import.meta.env.VITE_API_URL;

    const response = await fetch(`${API_URL}/api/chat/stream`, {
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

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));
                    yield data;
                } catch {
                    // Ignore malformed JSON
                }
            }
        }
    }
}

const SemanticSearchChat: React.FC<SemanticSearchChatProps> = ({
    onEntryClick,
    getIdToken,
    isMac,
}) => {
    // State
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClosing, setIsClosing] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [streamingContent, setStreamingContent] = useState('');

    // Refs
    const inputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, streamingContent]);

    // Focus input when expanded
    useEffect(() => {
        if (isExpanded && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isExpanded]);

    // Prevent body scroll when expanded
    useEffect(() => {
        if (isExpanded) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isExpanded]);

    // Handle keyboard shortcut (Cmd/Ctrl + K)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isModifier = isMac ? e.metaKey : e.ctrlKey;
            if (isModifier && e.key === 'k') {
                e.preventDefault();
                if (!isExpanded) {
                    setIsExpanded(true);
                }
            }
            if (e.key === 'Escape' && isExpanded && !isClosing) {
                handleClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMac, isExpanded, isClosing]);

    const handleExpand = () => {
        setIsExpanded(true);
    };

    const handleClose = () => {
        setIsClosing(true);
        // Wait for animation to complete before fully closing
        setTimeout(() => {
            setIsExpanded(false);
            setIsClosing(false);
            setMessages([]);
            setInputValue('');
            setError(null);
            setStreamingContent('');
        }, 300);
    };

    const handleBackdropClick = (e: React.MouseEvent) => {
        // Only close if clicking the backdrop itself, not the chat container
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!inputValue.trim() || isLoading) return;

        const userMessage = inputValue.trim();
        setInputValue('');
        setError(null);
        setStreamingContent('');

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

            let accumulatedContent = '';
            let receivedEntries: Entry[] = [];

            // Stream the response
            for await (const event of streamChatMessage(idToken, userMessage, history)) {
                if (event.type === 'token' && event.content) {
                    accumulatedContent += event.content;
                    setStreamingContent(accumulatedContent);
                } else if (event.type === 'entries' && event.entries) {
                    receivedEntries = event.entries;
                } else if (event.type === 'done') {
                    // Finalize the message
                    const assistantMessage: ChatMessage = {
                        role: 'assistant',
                        content: accumulatedContent,
                        entries: receivedEntries,
                    };
                    setMessages(prev => [...prev, assistantMessage]);
                    setStreamingContent('');
                } else if (event.type === 'error' && event.message) {
                    throw new Error(event.message);
                }
            }

        } catch (err) {
            console.error('Chat error:', err);
            setError((err as Error).message || 'Failed to get response');
            setStreamingContent('');
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

    // Full-screen overlay content - rendered via Portal
    const overlayContent = (
        <div
            className={`fixed inset-0 flex items-center justify-center p-4 sm:p-8
                ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={handleBackdropClick}
            style={{
                zIndex: 99999,
                backgroundColor: 'rgba(0, 0, 0, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
            }}
        >
            <div
                className={`w-full max-w-3xl h-[85vh] bg-white dark:bg-dark-900 rounded-3xl shadow-2xl border border-dark-200/50 dark:border-dark-700/50 flex flex-col overflow-hidden
                    ${isClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-dark-200/50 dark:border-dark-700/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-primary-500/10">
                            <Sparkles size={22} className="text-primary-500" />
                        </div>
                        <div>
                            <span className="font-semibold text-lg text-dark-900 dark:text-white">AI Search</span>
                            <p className="text-xs text-dark-500 dark:text-dark-400">Search your saved content with natural language</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 rounded-full hover:bg-dark-100 dark:hover:bg-dark-800 transition-colors"
                    >
                        <X size={20} className="text-dark-500 dark:text-dark-400" />
                    </button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {messages.length === 0 && !isLoading && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4">
                                <Sparkles size={32} className="text-primary-500" />
                            </div>
                            <p className="text-dark-700 dark:text-dark-200 font-medium mb-2">
                                Ask me to find anything in your vault
                            </p>
                            <p className="text-sm text-dark-500 dark:text-dark-400 max-w-md mx-auto">
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
                                className={`max-w-[85%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-dark-100 dark:bg-dark-800 text-dark-900 dark:text-white'
                                    }`}
                            >
                                {message.role === 'user' ? (
                                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                ) : (
                                    <div className="text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-code:bg-dark-200 dark:prose-code:bg-dark-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none">
                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                    </div>
                                )}

                                {/* Entry Cards */}
                                {message.entries && message.entries.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                        {message.entries.map((entry) => (
                                            <button
                                                key={entry.id}
                                                onClick={() => {
                                                    onEntryClick(entry);
                                                    handleClose();
                                                }}
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

                    {/* Streaming response */}
                    {isLoading && streamingContent && (
                        <div className="flex justify-start">
                            <div className="max-w-[85%] bg-dark-100 dark:bg-dark-800 rounded-2xl px-4 py-3 text-dark-900 dark:text-white">
                                <div className="text-sm prose prose-sm dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2 prose-code:bg-dark-200 dark:prose-code:bg-dark-700 prose-code:px-1 prose-code:py-0.5 prose-code:rounded max-w-none">
                                    <ReactMarkdown>{streamingContent}</ReactMarkdown>
                                    <span className="inline-block w-2 h-4 ml-0.5 bg-primary-500 animate-pulse align-middle" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading indicator (before any content) */}
                    {isLoading && !streamingContent && (
                        <div className="flex justify-start">
                            <div className="bg-dark-100 dark:bg-dark-800 rounded-2xl px-4 py-3">
                                <span className="text-sm font-medium animate-shimmer">
                                    Thinking...
                                </span>
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
                <form onSubmit={handleSubmit} className="p-5 border-t border-dark-200/50 dark:border-dark-700/50 bg-dark-50/50 dark:bg-dark-800/30">
                    <div className="flex items-center gap-3">
                        <input
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask anything about your saved content..."
                            className="flex-1 bg-white dark:bg-dark-800 border border-dark-200/80 dark:border-dark-700/60 rounded-full px-5 py-3 text-dark-900 dark:text-white placeholder-dark-500 dark:placeholder-dark-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 text-sm"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !inputValue.trim()}
                            className="p-3 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-primary-500/25"
                        >
                            <Send size={20} />
                        </button>
                    </div>
                    <p className="text-xs text-dark-400 dark:text-dark-500 mt-3 text-center">
                        Press <Kbd className="text-xs">{isMac ? '⌘' : 'Ctrl'}+K</Kbd> to open • <Kbd className="text-xs">Esc</Kbd> to close
                    </p>
                </form>
            </div>
        </div>
    );

    return (
        <>
            {/* Collapsed State - Search Bar Trigger */}
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

            {/* Full-Screen Overlay - Rendered via Portal to document.body */}
            {isExpanded && createPortal(overlayContent, document.body)}
        </>
    );
};

export default SemanticSearchChat;
