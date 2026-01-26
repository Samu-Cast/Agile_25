//Mock del ChatContext per i test
//Questo file simula il comportamento del ChatContext senza dipendenze esterne

import React from 'react';

//Crea un mock della funzione useChat che ritorna tutti i valori necessari
export const useChat = jest.fn(() => ({
    //UI State
    isChatOpen: false,
    isMinimized: true,
    viewState: 'LIST',

    //Data State
    chats: [],
    activeChatId: null,
    messagesCache: {},
    loadingChats: false,

    //Functions - tutte funzioni finte che non fanno nulla
    toggleChat: jest.fn(),
    openChat: jest.fn(),
    startChatWithUser: jest.fn(),
    handleSendMessage: jest.fn(),
    goBackToList: jest.fn(),
    setIsMinimized: jest.fn()
}));

//Mock del ChatProvider - accetta children e li ritorna senza wrapping
export const ChatProvider = ({ children }) => {
    return <>{children}</>;
};
