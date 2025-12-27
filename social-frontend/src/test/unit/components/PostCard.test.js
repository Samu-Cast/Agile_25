//Test per verificare che il componente PostCard (card del post) funzioni correttamente
//Importa le funzioni per testare i componenti React
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
//Importa il componente PostCard da testare
import PostCard from '../../../components/PostCard';

//Crea una versione finta del contesto di autenticazione
jest.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ currentUser: { uid: 'user123', displayName: 'Test User' } })
}));

//Crea una versione finta del servizio utente
jest.mock('../../../services/userService', () => ({
    getUsersByUids: jest.fn(() => Promise.resolve([
        { uid: 'user456', nickname: 'Author', profilePic: null }
    ])),
    getUser: jest.fn(() => Promise.resolve({ uid: 'user123', nickname: 'Test User' }))
}));

//Mock dei servizi per evitare chiamate reali al backend
jest.mock('../../../services/postService', () => ({
    updateVotes: jest.fn(() => Promise.resolve()),
    toggleSavePost: jest.fn(() => Promise.resolve()),
    getComments: jest.fn(() => Promise.resolve([])),
    addComment: jest.fn(() => Promise.resolve({ id: 'comment1', text: 'Test comment' }))
}));

//Crea una versione finta di fetch per simulare le chiamate al server
global.fetch = jest.fn();

//Gruppo di test per il componente PostCard
describe('PostCard Component', () => {
    //Dati finti di un post da usare nei test
    const mockPost = {
        id: 'post123',
        authorName: 'Author',
        author: 'Author',
        time: '2 hours ago',
        content: 'This is a test post',
        image: null,
        votes: 10, //10 voti positivi
        comments: 5, //5 commenti
        userVote: 0, //L'utente non ha ancora votato
        isSaved: false //Post non salvato
    };

    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
        // Mock default per fetch (usato da CommentSection per caricare utenti)
        global.fetch.mockResolvedValue({
            ok: true,
            json: async () => ({ uid: 'user123', displayName: 'Test User', photoURL: null })
        });
    });

    //Test: verifica che il post venga mostrato correttamente
    it('dovrebbe renderizzare post correttamente', () => {
        //Mostra il componente PostCard con i dati del post
        render(
            <PostCard
                post={mockPost}
                currentUser={{ uid: 'user123' }}
                isLoggedIn={true}
            />
        );

        //Verifica che il contenuto del post sia presente
        expect(screen.getByText('This is a test post')).toBeInTheDocument();
        //Verifica che il nome dell'autore sia presente
        expect(screen.getByText('Author')).toBeInTheDocument();
        //Verifica che il numero di voti sia presente
        expect(screen.getByText('10')).toBeInTheDocument();
        //Verifica che il numero di commenti sia presente
        expect(screen.getByText(/5 Comments/i)).toBeInTheDocument();
    });

    //Test: verifica che cliccando upvote il conteggio aumenti
    it('dovrebbe aumentare il voto quando si clicca upvote', () => {
        //Mostra il componente PostCard
        render(
            <PostCard
                post={mockPost}
                currentUser={{ uid: 'user123' }}
                isLoggedIn={true}
            />
        );

        //Trova il bottone upvote
        const upvoteBtn = screen.getByText('▲');
        //Simula un click sul bottone upvote
        fireEvent.click(upvoteBtn);

        //Verifica che il conteggio voti sia aumentato a 11 (ottimistic update)
        expect(screen.getByText('11')).toBeInTheDocument();
    });

    //Test: verifica che cliccando downvote il conteggio diminuisca
    it('dovrebbe diminuire il voto quando si clicca downvote', () => {
        //Mostra il componente PostCard
        render(
            <PostCard
                post={mockPost}
                currentUser={{ uid: 'user123' }}
                isLoggedIn={true}
            />
        );

        //Trova il bottone downvote
        const downvoteBtn = screen.getByText('▼');
        //Simula un click sul bottone downvote
        fireEvent.click(downvoteBtn);

        //Verifica che il conteggio voti sia diminuito a 9 (ottimistic update)
        expect(screen.getByText('9')).toBeInTheDocument();
    });

    //Test: verifica che lo stato salvato/non salvato venga gestito correttamente
    it('dovrebbe gestire il salvataggio del post', () => {
        //Mostra il componente PostCard con post non salvato
        render(
            <PostCard
                post={mockPost}
                currentUser={{ uid: 'user123' }}
                isLoggedIn={true}
            />
        );

        //Verifica che il testo "Salva" sia presente (post non salvato)
        const saveBtn = screen.getByText(/Salva/i);
        expect(saveBtn).toBeInTheDocument();

        //Clicca sul bottone "Salva" per salvare il post
        fireEvent.click(saveBtn);

        //Verifica che il testo sia cambiato a "Salvato" (ottimistic update)
        expect(screen.getByText(/Salvato/i)).toBeInTheDocument();
    });



    //Test: verifica che l'immagine del post venga mostrata se presente
    it('dovrebbe mostrare immagine se presente', () => {
        //Crea un post con immagine
        const postWithImage = { ...mockPost, image: 'https://example.com/img.jpg' };
        //Mostra il componente PostCard con il post che ha immagine
        render(
            <PostCard
                post={postWithImage}
                currentUser={{ uid: 'user123' }}
                isLoggedIn={true}
            />
        );

        //Trova l'immagine usando il testo alternativo
        const img = screen.getByAltText('Post content');
        //Verifica che l'immagine sia presente
        expect(img).toBeInTheDocument();
        //Verifica che l'immagine abbia l'URL corretto
        expect(img).toHaveAttribute('src', 'https://example.com/img.jpg');
    });
});
