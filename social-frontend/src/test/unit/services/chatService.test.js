import { initChat, getUserChats, getChatMessages, sendMessage } from '../../../services/chatService';

global.fetch = jest.fn();

describe('chatService', () => {
    beforeEach(() => {
        fetch.mockClear();
    });

    test('initChat calls correct endpoint', async () => {
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ id: 'chat1' })
        });

        const result = await initChat('user1', 'user2');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/chats/init'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ currentUid: 'user1', targetUid: 'user2' })
            })
        );
        expect(result).toEqual({ id: 'chat1' });
    });

    test('getUserChats calls correct endpoint', async () => {
        const mockChats = [{ id: 'chat1' }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockChats
        });

        const result = await getUserChats('user1');

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/chats/user/user1'));
        expect(result).toEqual(mockChats);
    });

    test('getChatMessages calls correct endpoint', async () => {
        const mockMessages = [{ id: 'msg1', text: 'hello' }];
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockMessages
        });

        const result = await getChatMessages('chat1');

        expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/chats/chat1/messages'));
        expect(result).toEqual(mockMessages);
    });

    test('sendMessage calls correct endpoint', async () => {
        const mockResponse = { success: true };
        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await sendMessage('chat1', 'user1', 'Hello');

        expect(fetch).toHaveBeenCalledWith(
            expect.stringContaining('/chats/chat1/messages'),
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ senderId: 'user1', text: 'Hello' })
            })
        );
        expect(result).toEqual(mockResponse);
    });

    test('handles errors gracefully', async () => {
        fetch.mockResolvedValueOnce({ ok: false });
        await expect(getUserChats('user1')).rejects.toThrow();
    });
});
