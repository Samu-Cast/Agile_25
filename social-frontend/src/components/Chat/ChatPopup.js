import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { searchUsers } from '../../services/userService';
import '../../styles/components/Chat.css'; // We'll create this next

export const ChatPopup = () => {
    const { isChatOpen, isMinimized, viewState, toggleChat, setIsMinimized } = useChat();

    // If completely hidden (e.g. not logged in), return null. 
    // But we usually want the minimized bubble to be visible or handled by Header.
    // The requirement says "finestrella che si alza da in basso a destra". 
    // Usually this implies a permanent bubble or bar.

    if (!isChatOpen && isMinimized) return null; // Controlled by Header for now, or we can make it permanent.

    // Actually, usually "minimized" means just the header bar is visible at bottom right.
    // "Closed" means gone.
    // Let's assume toggleChat switches between Open (Expanded) and Minimized (Bar only) or Closed.

    return (
        <div className={`chat-popup ${isMinimized ? 'minimized' : 'expanded'}`}>
            <div className="chat-header" onClick={() => setIsMinimized(!isMinimized)}>
                <span className="chat-title">Messaggi</span>
                <div className="chat-controls">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        title={isMinimized ? "Espandi" : "Riduci"}
                    >
                        {isMinimized ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                        ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        )}
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toggleChat(); // This toggles open/closed state in context
                        }}
                        title="Chiudi"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <div className="chat-body">
                    {viewState === 'LIST' ? <ChatList /> : <ChatWindow />}
                </div>
            )}
        </div>
    );
};

// --- Subcomponents ---

const ChatList = () => {
    const { chats, openChat, startChatWithUser, loadingChats } = useChat();
    const { currentUser } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        if (query.length > 1) {
            setIsSearching(true);
            const results = await searchUsers(query);
            setSearchResults(results.filter(u => u.uid !== currentUser.uid));
            setIsSearching(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleUserSelect = (uid) => {
        startChatWithUser(uid);
        setSearchQuery('');
        setSearchResults([]);
    };

    return (
        <div className="chat-list-container">
            <div className="chat-search-bar">
                <input
                    type="text"
                    placeholder="Cerca utente..."
                    value={searchQuery}
                    onChange={handleSearch}
                />
            </div>

            {searchQuery.length > 0 ? (
                <div className="chat-search-results">
                    {searchResults.map(user => (
                        <div key={user.uid} className="chat-list-item" onClick={() => handleUserSelect(user.uid)}>
                            <img src={user.profilePic || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} alt="" />
                            <div className="chat-info">
                                <span className="chat-name">{user.nickname || user.name}</span>
                            </div>
                        </div>
                    ))}
                    {searchResults.length === 0 && !isSearching && <div className="no-results">Nessun utente trovato</div>}
                </div>
            ) : (
                <div className="chat-history-list">
                    {loadingChats && <div className="loading">Caricamento...</div>}
                    {!loadingChats && chats.length === 0 && <div className="empty-chat">Nessuna chat recente</div>}
                    {chats.map(chat => {
                        // Resolve other user
                        const otherUid = chat.participants.find(p => p !== currentUser.uid);
                        const details = chat.participantDetails?.[otherUid] || {};

                        return (
                            <div key={chat.id} className="chat-list-item" onClick={() => openChat(chat.id)}>
                                <img src={details.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png"} alt="" />
                                <div className="chat-info">
                                    <span className="chat-name">{details.nickname || details.name || 'Utente'}</span>
                                    <span className="chat-preview">{chat.lastMessage?.text || 'Nuova chat'}</span>
                                </div>
                                <span className="chat-time">
                                    {chat.updatedAt ? new Date(chat.updatedAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

const ChatWindow = () => {
    const { activeChatId, messagesCache, chats, handleSendMessage, goBackToList } = useChat();
    const { currentUser } = useAuth();
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const messages = useMemo(() => messagesCache[activeChatId] || [], [messagesCache, activeChatId]);
    const chat = chats.find(c => c.id === activeChatId);
    const chatDataUpdatedAt = chat?.updatedAt;

    useEffect(() => {
        scrollToBottom();
    }, [messages, chatDataUpdatedAt]);

    // Resolve other user name for header
    const otherUid = chat?.participants.find(p => p !== currentUser.uid);
    const otherUser = chat?.participantDetails?.[otherUid] || {};

    const onSend = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        handleSendMessage(newMessage);
        setNewMessage('');
    };

    return (
        <div className="chat-window-container">
            <div className="chat-window-header">
                <button className="back-btn" onClick={goBackToList}>←</button>
                <span className="chat-partner-name">{otherUser.nickname || otherUser.name || 'Chat'}</span>
            </div>

            <div className="chat-messages-area">
                {messages.map(msg => {
                    const isMe = msg.senderId === currentUser.uid;
                    return (
                        <div key={msg.id} className={`message-bubble ${isMe ? 'sent' : 'received'} ${msg.pending ? 'pending' : ''}`}>
                            {msg.text}
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-area" onSubmit={onSend}>
                <input
                    type="text"
                    placeholder="Scrivi un messaggio..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit">➤</button>
            </form>
        </div>
    );
};
