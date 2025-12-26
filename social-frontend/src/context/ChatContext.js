import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getUserChats, getChatMessages, sendMessage, initChat } from '../services/chatService';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
    const { currentUser } = useAuth();

    // UI State
    const [isChatOpen, setIsChatOpen] = useState(false); // Controls if the popup is visible (or minimized)
    const [viewState, setViewState] = useState('LIST'); // 'LIST' or 'CHAT'
    const [isMinimized, setIsMinimized] = useState(true); // Start minimized

    // Data State
    const [chats, setChats] = useState([]); // List of summary chats
    const [activeChatId, setActiveChatId] = useState(null);
    const [messagesCache, setMessagesCache] = useState({}); // { chatId: [messages] }
    const [loadingChats, setLoadingChats] = useState(false);

    // Initial load of chat list (only once when user logs in or manually refreshes)
    // We do NOT poll this constantly to save reads.
    useEffect(() => {
        if (currentUser) {
            loadChats();
        } else {
            setChats([]);
            setMessagesCache({});
        }
    }, [currentUser]);

    const loadChats = async () => {
        if (!currentUser) return;
        setLoadingChats(true);
        try {
            const data = await getUserChats(currentUser.uid);
            setChats(data);
        } catch (error) {
            console.error("Failed to load chats", error);
        } finally {
            setLoadingChats(false);
        }
    };

    const toggleChat = () => {
        if (isMinimized) {
            setIsMinimized(false);
            setIsChatOpen(true);
            // If we have no chats loaded, maybe retry? But useEffect should handle it.
        } else {
            setIsMinimized(true);
            setIsChatOpen(false);
        }
    };

    const openChat = async (chatId) => {
        setActiveChatId(chatId);
        setViewState('CHAT');
        setIsMinimized(false);
        setIsChatOpen(true);

        // Check cache before fetching
        if (!messagesCache[chatId]) {
            try {
                const msgs = await getChatMessages(chatId);
                // Reverse to show oldest first if API returns newest first
                // API returns limit 20 desc. So [newest, ..., oldest].
                // We want to display oldest at top usually? Or standard chat UI is bottom-up.
                // Let's store as is and handle in UI, or reverse here.
                setMessagesCache(prev => ({
                    ...prev,
                    [chatId]: msgs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
                }));
            } catch (error) {
                console.error("Failed to load messages", error);
            }
        }
    };

    const startChatWithUser = async (targetUid) => {
        if (!currentUser) return;
        try {
            const chat = await initChat(currentUser.uid, targetUid);
            // Add to list if not present
            setChats(prev => {
                const exists = prev.find(c => c.id === chat.id);
                if (exists) return prev;
                return [chat, ...prev];
            });
            openChat(chat.id);
        } catch (error) {
            console.error("Failed to start chat", error);
        }
    };

    const handleSendMessage = async (text) => {
        if (!activeChatId || !currentUser) return;

        // Optimistic update
        const tempId = Date.now().toString();
        const newMessage = {
            id: tempId,
            text,
            senderId: currentUser.uid,
            createdAt: new Date().toISOString(),
            pending: true
        };

        setMessagesCache(prev => ({
            ...prev,
            [activeChatId]: [...(prev[activeChatId] || []), newMessage]
        }));

        try {
            const serverMessage = await sendMessage(activeChatId, currentUser.uid, text);

            // Replace temp message with server message
            setMessagesCache(prev => ({
                ...prev,
                [activeChatId]: prev[activeChatId].map(m => m.id === tempId ? serverMessage : m)
            }));

            // Update last message in chat list
            setChats(prev => prev.map(c => {
                if (c.id === activeChatId) {
                    return {
                        ...c,
                        lastMessage: {
                            text,
                            senderId: currentUser.uid,
                            createdAt: new Date().toISOString()
                        },
                        updatedAt: new Date().toISOString()
                    };
                }
                return c;
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))); // Move to top

        } catch (error) {
            console.error("Failed to send message", error);
            // Remove temp message or show error state
            setMessagesCache(prev => ({
                ...prev,
                [activeChatId]: prev[activeChatId].filter(m => m.id !== tempId)
            }));
        }
    };

    const goBackToList = () => {
        setViewState('LIST');
        setActiveChatId(null);
    };

    return (
        <ChatContext.Provider value={{
            isChatOpen,
            isMinimized,
            viewState,
            chats,
            activeChatId,
            messagesCache,
            loadingChats,
            toggleChat,
            openChat,
            startChatWithUser,
            handleSendMessage,
            goBackToList,
            setIsMinimized
        }}>
            {children}
        </ChatContext.Provider>
    );
};
