//Test per verificare che le operazioni sui post funzionino correttamente
//Importa le funzioni da testare dal file postService
import {
    createPost,
    getFeedPosts,
    getPosts,
    updateVotes,
    toggleCoffee,
    updateRating,
    toggleSavePost,
    addComment,
    getComments,
    getUserComments,
    getUserPosts,
    getUserSavedPosts,
    deletePost
} from '../../../services/postService';
import * as userService from '../../../services/userService';

//Crea una versione finta di fetch per simulare le chiamate al server
global.fetch = jest.fn();

//Gruppo di test per la funzione createPost
describe('postService - createPost', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che la creazione di un post funzioni correttamente
    it('dovrebbe creare post con successo', async () => {
        //Risposta finta del server con i dati del post creato
        const mockPost = { id: 'post123', text: 'Test post', uid: 'user123' };
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockPost
        });

        //Dati del post da creare
        const postData = { authorUid: 'user123', content: 'Test post', imageUrl: null };
        //Chiama la funzione createPost
        const result = await createPost(postData);

        //Verifica che fetch sia stato chiamato con i dati corretti
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts',
            expect.objectContaining({
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    uid: 'user123',
                    text: 'Test post',
                    imageUrl: null,
                    entityType: 'user',
                    entityId: 'user123',
                    taggedUsers: []
                })
            })
        );
        //Verifica che la funzione ritorni l'ID del post creato
        expect(result).toBe('post123');
    });

    //Test: verifica che gli errori di creazione vengano gestiti correttamente
    it('dovrebbe gestire errore di creazione', async () => {
        //Configura fetch per ritornare una risposta di errore
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 400
        });

        //Dati del post da creare
        const postData = { authorUid: 'user123', text: 'Test' };
        //Verifica che la funzione lanci un errore
        await expect(createPost(postData)).rejects.toThrow();
    });

});

//Gruppo di test per la funzione toggleSavePost
describe('postService - toggleSavePost', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il salvataggio di un post funzioni correttamente
    it('dovrebbe salvare post', async () => {
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Post saved' })
        });

        //Chiama la funzione per salvare il post (false = non è ancora salvato)
        await toggleSavePost('post123', 'user123', false);

        //Verifica che fetch sia stato chiamato con i dati corretti per salvare
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/save',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ uid: 'user123' })
            })
        );
    });

    //Test: verifica che la rimozione di un post salvato funzioni correttamente
    it('dovrebbe rimuovere post salvato', async () => {
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Post removed' })
        });

        //Chiama la funzione per rimuovere il post salvato (true = è già salvato)
        await toggleSavePost('post123', 'user123', true);

        //Verifica che fetch sia stato chiamato con i dati corretti per rimuovere
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/save',
            expect.objectContaining({
                method: 'DELETE',
                body: JSON.stringify({ uid: 'user123' })
            })
        );
    });
});

//Gruppo di test per la funzione addComment
describe('postService - addComment', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che l'aggiunta di un commento funzioni correttamente
    it('dovrebbe aggiungere commento', async () => {
        //Risposta finta del server con i dati del commento creato
        const mockComment = { id: 'comment123', text: 'Nice post!', uid: 'user456' };
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComment
        });

        //Dati del commento da aggiungere
        const commentData = { text: 'Nice post!', authorUid: 'user456', parentComment: null };
        //Chiama la funzione addComment
        const result = await addComment('post123', commentData);

        //Verifica che fetch sia stato chiamato con i dati corretti
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/comments',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({
                    text: 'Nice post!',
                    uid: 'user456',
                    parentComment: null,
                    mediaUrls: []
                })
            })
        );
        //Verifica che la funzione ritorni i dati del commento creato
        expect(result).toEqual(mockComment);
    });
});

//Gruppo di test per la funzione getComments
describe('postService - getComments', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il recupero dei commenti funzioni correttamente
    it('dovrebbe recuperare commenti', async () => {
        //Lista finta di commenti ritornata dal server
        const mockComments = [
            { id: 'c1', text: 'Comment 1', uid: 'user1' },
            { id: 'c2', text: 'Comment 2', uid: 'user2' }
        ];
        //Configura fetch per ritornare la lista di commenti
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComments
        });

        //Chiama la funzione getComments
        const result = await getComments('post123');

        //Verifica che fetch sia stato chiamato con l'URL corretto
        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/posts/post123/comments');
        //Verifica che la funzione ritorni la lista di commenti
        expect(result).toEqual(mockComments);
        //Verifica che ci siano 2 commenti nella lista
        expect(result.length).toBe(2);
    });

    //Test: verifica che un post senza commenti venga gestito correttamente
    it('dovrebbe gestire post senza commenti', async () => {
        //Configura fetch per ritornare una lista vuota
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        //Chiama la funzione getComments
        const result = await getComments('post123');
        //Verifica che la funzione ritorni una lista vuota
        expect(result).toEqual([]);
    });
});

//Gruppo di test per la funzione getFeedPosts
describe('postService - getFeedPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il recupero del feed con filtri multipli funzioni
    it('dovrebbe recuperare feed con filtri multipli', async () => {
        const mockPosts = [
            { id: 'p1', text: 'Post 1', uid: 'user1' },
            { id: 'p2', text: 'Post 2', uid: 'user2' }
        ];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockPosts
        });

        const params = { uid: 'user123', filter: 'followed', sort: 'popular', communityId: 'comm1' };
        const result = await getFeedPosts(params);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts?uid=user123&filter=followed&sort=popular&communityId=comm1'
        );
        expect(result).toEqual(mockPosts);
    });

    //Test: verifica paginazione con limit e lastCreatedAt
    it('dovrebbe gestire paginazione', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        const params = { limit: 10, lastCreatedAt: '2024-01-01T00:00:00Z' };
        await getFeedPosts(params);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts?limit=10&lastCreatedAt=2024-01-01T00%3A00%3A00Z'
        );
    });

    //Test: verifica risposta vuota
    it('dovrebbe gestire risposta vuota', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        const result = await getFeedPosts();
        expect(result).toEqual([]);
    });

    //Test: verifica gestione errore fetch
    it('dovrebbe gestire errore fetch', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500
        });

        await expect(getFeedPosts()).rejects.toThrow();
    });
});

//Gruppo di test per la funzione getPosts
describe('postService - getPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica mapping text → content e uid → author
    it('dovrebbe mappare correttamente i campi backend a frontend', async () => {
        const backendPosts = [
            { id: 'p1', text: 'Backend text', uid: 'user1', createdAt: '2024-01-01T10:00:00Z' }
        ];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => backendPosts
        });

        const result = await getPosts();

        expect(result[0].content).toBe('Backend text');
        expect(result[0].author).toBe('user1');
        expect(result[0].time).toBeDefined();
    });

    //Test: verifica mapping con createdAt mancante
    it('dovrebbe gestire createdAt mancante', async () => {
        const backendPosts = [{ id: 'p1', text: 'Test', uid: 'user1' }];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => backendPosts
        });

        const result = await getPosts();
        expect(result[0].time).toBe('Just now');
    });

    //Test: verifica gestione errore
    it('dovrebbe gestire errore fetch', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        await expect(getPosts()).rejects.toThrow();
    });
});

//Gruppo di test per la funzione updateVotes
describe('postService - updateVotes', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica upvote/downvote
    it('dovrebbe aggiornare voti con successo', async () => {
        const mockResponse = { message: 'Vote updated', voteChange: 1 };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await updateVotes('post123', 'user123', 1);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/like',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ uid: 'user123', value: 1 })
            })
        );
        expect(result).toEqual(mockResponse);
    });

    //Test: verifica gestione errore
    it('dovrebbe gestire errore di aggiornamento voti', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        await expect(updateVotes('post123', 'user123', 1)).rejects.toThrow();
    });
});

//Gruppo di test per la funzione toggleCoffee
describe('postService - toggleCoffee', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica aggiunta caffè (POST success)
    it('dovrebbe aggiungere caffè con successo', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Coffee added', coffeeCount: 5 })
        });

        const result = await toggleCoffee('post123', 'user123');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/coffee',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ uid: 'user123' })
            })
        );
        expect(result).toEqual({ success: true, hasGivenCoffee: true });
    });

    //Test: verifica rimozione caffè (DELETE dopo errore "already gave coffee")
    it('dovrebbe rimuovere caffè se già dato', async () => {
        // Prima chiamata POST fallisce con "already gave coffee"
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'User already gave coffee' })
        });
        // Seconda chiamata DELETE ha successo
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ message: 'Coffee removed' })
        });

        const result = await toggleCoffee('post123', 'user123');

        expect(global.fetch).toHaveBeenCalledTimes(2);
        expect(global.fetch).toHaveBeenNthCalledWith(2,
            'http://localhost:3001/api/posts/post123/coffee',
            expect.objectContaining({
                method: 'DELETE'
            })
        );
        expect(result).toEqual({ success: true, hasGivenCoffee: false });
    });

    //Test: verifica gestione errore generico
    it('dovrebbe gestire errore generico', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Server error' })
        });

        await expect(toggleCoffee('post123', 'user123')).rejects.toThrow();
    });
});

//Gruppo di test per la funzione updateRating
describe('postService - updateRating', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica rating success
    it('dovrebbe aggiornare rating con successo', async () => {
        const mockResponse = { message: 'Rating updated', ratingBy: { user123: 4.5 } };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await updateRating('post123', 'user123', 4.5);

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123/rating',
            expect.objectContaining({
                method: 'POST',
                body: JSON.stringify({ uid: 'user123', rating: 4.5 })
            })
        );
        expect(result).toEqual(mockResponse);
    });

    //Test: verifica gestione errore
    it('dovrebbe gestire errore di aggiornamento rating', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        await expect(updateRating('post123', 'user123', 4.5)).rejects.toThrow();
    });
});

//Gruppo di test per la funzione getUserComments
describe('postService - getUserComments', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica recupero commenti utente
    it('dovrebbe recuperare commenti utente', async () => {
        const mockComments = [
            { id: 'c1', text: 'Comment 1', uid: 'user123', postTitle: 'Post 1' },
            { id: 'c2', text: 'Comment 2', uid: 'user123', postTitle: 'Post 2' }
        ];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockComments
        });

        const result = await getUserComments('user123');

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/comments?uid=user123');
        expect(result).toEqual(mockComments);
    });

    //Test: verifica risposta vuota/errore
    it('dovrebbe ritornare array vuoto in caso di errore', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        const result = await getUserComments('user123');
        expect(result).toEqual([]);
    });
});

//Gruppo di test per la funzione getUserPosts
describe('postService - getUserPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica recupero post utente con mapping
    it('dovrebbe recuperare e mappare post utente', async () => {
        const backendPosts = [
            { id: 'p1', text: 'User post', uid: 'user123', createdAt: '2024-01-01T10:00:00Z' }
        ];
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => backendPosts
        });

        const result = await getUserPosts('user123');

        expect(global.fetch).toHaveBeenCalledWith('http://localhost:3001/api/posts?authorUid=user123');
        expect(result[0].content).toBe('User post');
        expect(result[0].time).toBeDefined();
    });

    //Test: verifica gestione errore
    it('dovrebbe ritornare array vuoto in caso di errore', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        const result = await getUserPosts('user123');
        expect(result).toEqual([]);
    });
});

//Gruppo di test per la funzione getUserSavedPosts
describe('postService - getUserSavedPosts', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica recupero saved posts tramite getUserSavedPostsDetails
    it('dovrebbe recuperare saved posts con mapping', async () => {
        const mockSavedPosts = [
            { id: 'p1', text: 'Saved post', uid: 'user456', createdAt: '2024-01-01T10:00:00Z' }
        ];

        // Mock della funzione userService.getUserSavedPostsDetails
        jest.spyOn(userService, 'getUserSavedPostsDetails').mockResolvedValueOnce(mockSavedPosts);

        const result = await getUserSavedPosts('user123');

        expect(userService.getUserSavedPostsDetails).toHaveBeenCalledWith('user123');
        expect(result[0].content).toBe('Saved post');
        expect(result[0].time).toBeDefined();
    });

    //Test: verifica gestione errore
    it('dovrebbe ritornare array vuoto in caso di errore', async () => {
        jest.spyOn(userService, 'getUserSavedPostsDetails').mockRejectedValueOnce(new Error('Fetch failed'));

        const result = await getUserSavedPosts('user123');
        expect(result).toEqual([]);
    });
});

//Gruppo di test per la funzione deletePost
describe('postService - deletePost', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica eliminazione post success
    it('dovrebbe eliminare post con successo', async () => {
        const mockResponse = { message: 'Post deleted' };
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        const result = await deletePost('post123', 'user123');

        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/posts/post123',
            expect.objectContaining({
                method: 'DELETE',
                body: JSON.stringify({ uid: 'user123' })
            })
        );
        expect(result).toEqual(mockResponse);
    });

    //Test: verifica gestione errore
    it('dovrebbe gestire errore di eliminazione', async () => {
        global.fetch.mockResolvedValueOnce({
            ok: false
        });

        await expect(deletePost('post123', 'user123')).rejects.toThrow();
    });
});
