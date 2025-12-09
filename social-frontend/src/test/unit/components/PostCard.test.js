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
        { uid: 'user456', nickname: 'Author' }
    ]))
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
        title: 'Test Post',
        content: 'This is a test post',
        image: null,
        votes: 10, //10 voti positivi
        comments: 5, //5 commenti
        userVote: 0 //L'utente non ha ancora votato
    };

    //Funzioni finte per tracciare le azioni dell'utente
    const mockOnVote = jest.fn(); //Funzione chiamata quando si vota
    const mockOnComment = jest.fn(); //Funzione chiamata quando si commenta
    const mockOnToggleSave = jest.fn(); //Funzione chiamata quando si salva/rimuove

    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockClear();
    });

    //Test: verifica che il post venga mostrato correttamente
    it('dovrebbe renderizzare post correttamente', () => {
        //Mostra il componente PostCard con i dati del post
        render(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                onComment={mockOnComment}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Verifica che il titolo del post sia presente
        expect(screen.getByText('Test Post')).toBeInTheDocument();
        //Verifica che il contenuto del post sia presente
        expect(screen.getByText('This is a test post')).toBeInTheDocument();
        //Verifica che il nome dell'autore sia presente
        expect(screen.getByText('Author')).toBeInTheDocument();
        //Verifica che il numero di voti sia presente
        expect(screen.getByText('10')).toBeInTheDocument();
        //Verifica che il numero di commenti sia presente
        expect(screen.getByText(/5 Comments/i)).toBeInTheDocument();
    });

    //Test: verifica che cliccando upvote venga chiamata la funzione corretta
    it('dovrebbe chiamare onVote quando si clicca upvote', () => {
        //Mostra il componente PostCard
        render(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Trova il bottone upvote (primo bottone nella lista)
        const upvoteBtn = screen.getAllByRole('button')[0];
        //Simula un click sul bottone upvote
        fireEvent.click(upvoteBtn);

        //Verifica che la funzione onVote sia stata chiamata con i parametri corretti
        expect(mockOnVote).toHaveBeenCalledWith('post123', 'up');
    });

    //Test: verifica che cliccando downvote venga chiamata la funzione corretta
    it('dovrebbe chiamare onVote quando si clicca downvote', () => {
        //Mostra il componente PostCard
        render(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Trova il bottone downvote (secondo bottone nella lista)
        const downvoteBtn = screen.getAllByRole('button')[1];
        //Simula un click sul bottone downvote
        fireEvent.click(downvoteBtn);

        //Verifica che la funzione onVote sia stata chiamata con i parametri corretti
        expect(mockOnVote).toHaveBeenCalledWith('post123', 'down');
    });

    //Test: verifica che lo stato salvato/non salvato venga mostrato correttamente
    it('dovrebbe mostrare stato salvato correttamente', () => {
        //Mostra il componente PostCard con post non salvato
        const { rerender } = render(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Verifica che il testo "Salva" sia presente (post non salvato)
        expect(screen.getByText(/Salva/i)).toBeInTheDocument();

        //Ri-mostra il componente con post salvato
        rerender(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={true}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Verifica che il testo "Salvato" sia presente (post salvato)
        expect(screen.getByText(/Salvato/i)).toBeInTheDocument();
    });

    //Test: verifica che i commenti possano essere espansi e collassati
    it('dovrebbe espandere/collassare commenti', async () => {
        //Configura fetch per ritornare una lista vuota di commenti
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => []
        });

        //Mostra il componente PostCard
        render(
            <PostCard
                post={mockPost}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
            />
        );

        //Trova il bottone per mostrare i commenti
        const commentsBtn = screen.getByText(/5 Comments/i);
        //Simula un click sul bottone commenti
        fireEvent.click(commentsBtn);

        //Aspetta che fetch venga chiamato per caricare i commenti
        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                'http://localhost:3001/api/posts/post123/comments'
            );
        });
    });

    //Test: verifica che l'immagine del post venga mostrata se presente
    it('dovrebbe mostrare immagine se presente', () => {
        //Crea un post con immagine
        const postWithImage = { ...mockPost, image: 'https://example.com/img.jpg' };
        //Mostra il componente PostCard con il post che ha immagine
        render(
            <PostCard
                post={postWithImage}
                user={{ uid: 'user123' }}
                onVote={mockOnVote}
                isSaved={false}
                onToggleSave={mockOnToggleSave}
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
