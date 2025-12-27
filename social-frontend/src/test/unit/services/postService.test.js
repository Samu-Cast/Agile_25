//Test per verificare che le operazioni sui post funzionino correttamente
//Importa le funzioni da testare dal file postService
import { createPost, toggleSavePost, addComment, getComments } from '../../../services/postService';

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
                    entityId: 'user123'
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
                    parentComment: null
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
