//Test per verificare che il componente StarRating (valutazione a stelle) funzioni correttamente
//Importa le funzioni per testare i componenti React
import { render, screen, fireEvent } from '@testing-library/react';
//Importa il componente StarRating da testare
import StarRating from '../../../components/StarRating';

//Gruppo di test per il componente StarRating
describe('StarRating Component', () => {
    //Funzione finta per tracciare quando l'utente cambia la valutazione
    const mockOnRatingChange = jest.fn();

    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        mockOnRatingChange.mockClear();
    });

    //Test: verifica che vengano mostrate 5 stelle
    test('renders 5 stars', () => {
        //Mostra il componente StarRating
        const { container } = render(<StarRating postId="123" />);
        //Trova tutte le stelle usando la classe CSS 'star'
        const stars = container.getElementsByClassName('star');
        //Verifica che ci siano esattamente 5 stelle
        expect(stars.length).toBe(5);
    });

    //Test: verifica che la media delle valutazioni venga calcolata e mostrata correttamente
    test('displays correct average rating', () => {
        //Mappa finta delle valutazioni degli utenti
        //user1 ha dato 5 stelle, user2 ha dato 3 stelle
        const userRatingMap = { 'user1': 5, 'user2': 3 };
        //Mostra il componente StarRating con le valutazioni
        render(<StarRating postId="123" userRatingMap={userRatingMap} />);
        //La media dovrebbe essere (5+3)/2 = 4.0
        //Verifica che il testo "4.0 ☕" sia presente
        expect(screen.getByText(/4.0 ☕/i)).toBeInTheDocument();
    });

    //Test: verifica che cliccando una stella venga chiamata la funzione corretta per utenti loggati
    test('calls onRatingChange when clicked by logged in user', () => {
        //Mostra il componente StarRating con un utente loggato
        render(
            <StarRating
                postId="123"
                currentUserId="user1"
                onRatingChange={mockOnRatingChange}
            />
        );

        //Trova tutte le stelle
        const stars = document.getElementsByClassName('star');
        //Simula un click sulla quinta stella (indice 4, perché si parte da 0)
        fireEvent.click(stars[4]);

        //Verifica che la funzione onRatingChange sia stata chiamata con i parametri corretti
        //ID del post e valutazione 5 stelle
        expect(mockOnRatingChange).toHaveBeenCalledWith("123", 5);
    });

    //Test: verifica che venga mostrato un alert quando un utente non loggato prova a votare
    test('shows alert when clicked by non-logged in user', () => {
        //Crea una versione finta di alert per tracciare quando viene chiamato
        const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => { });
        //Mostra il componente StarRating senza utente loggato (currentUserId undefined)
        render(
            <StarRating
                postId="123"
                currentUserId={undefined}
                onRatingChange={mockOnRatingChange}
            />
        );

        //Trova tutte le stelle
        const stars = document.getElementsByClassName('star');
        //Simula un click sulla terza stella (indice 2)
        fireEvent.click(stars[2]);

        //Verifica che alert sia stato chiamato con il messaggio corretto
        expect(alertMock).toHaveBeenCalledWith('Devi essere loggato per valutare!');
        //Verifica che onRatingChange NON sia stato chiamato (utente non loggato)
        expect(mockOnRatingChange).not.toHaveBeenCalled();

        //Ripristina la funzione alert originale
        alertMock.mockRestore();
    });
});
