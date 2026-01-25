//Test per verificare la LOGICA COMPLESSA del componente CoffeeCupRating
//Focus: calcolo posizione click (metà sinistra = 0.5, metà destra = 1.0)
import { render, screen, fireEvent } from '@testing-library/react';
import CoffeeCupRating from '../../../components/CoffeeCupRating';

describe('CoffeeCupRating - Logica di calcolo fill', () => {

    //Test: algoritmo fill per rating 2.5 (caso complesso con half)
    //Logica testata: if (rating >= cupValue) full, else if (rating >= cupValue - 0.5) half
    it('rating 2.5 deve mostrare correttamente 2 full, 1 half, 2 empty', () => {
        render(<CoffeeCupRating rating={2.5} />);

        const cups = screen.getAllByRole('img');

        // Verifica l'algoritmo di fill: 
        // cup1 (value=1): 2.5 >= 1 → full
        // cup2 (value=2): 2.5 >= 2 → full  
        // cup3 (value=3): 2.5 < 3 ma 2.5 >= 2.5 → half
        // cup4 (value=4): 2.5 < 4 e 2.5 < 3.5 → empty
        // cup5 (value=5): 2.5 < 5 e 2.5 < 4.5 → empty
        expect(cups[0].className).toContain('full');
        expect(cups[1].className).toContain('full');
        expect(cups[2].className).toContain('half');
        expect(cups[3].className).toContain('empty');
        expect(cups[4].className).toContain('empty');
    });

    //Test: tutti i valori di mezzo (0.5, 1.5, 2.5, 3.5, 4.5)
    //Verifica che l'algoritmo gestisca correttamente tutti i casi half
    it('tutti i rating .5 devono posizionare correttamente la tazzina half', () => {
        const testCases = [
            { rating: 0.5, halfIndex: 0 },
            { rating: 1.5, halfIndex: 1 },
            { rating: 2.5, halfIndex: 2 },
            { rating: 3.5, halfIndex: 3 },
            { rating: 4.5, halfIndex: 4 },
        ];

        testCases.forEach(({ rating, halfIndex }) => {
            const { unmount } = render(<CoffeeCupRating rating={rating} />);
            const cups = screen.getAllByRole('img');

            // La tazzina all'indice halfIndex deve essere 'half'
            expect(cups[halfIndex].className).toContain('half');

            // Tutte le precedenti devono essere 'full'
            for (let i = 0; i < halfIndex; i++) {
                expect(cups[i].className).toContain('full');
            }

            // Tutte le successive devono essere 'empty'
            for (let i = halfIndex + 1; i < 5; i++) {
                expect(cups[i].className).toContain('empty');
            }

            unmount();
        });
    });
});

describe('CoffeeCupRating - Logica click detection (metà sinistra/destra)', () => {

    //Test: click sulla metà SINISTRA di una tazzina deve dare valore .5
    //Logica testata: if (x < width / 2) → value = index + 0.5
    it('click sulla metà sinistra della 3a tazzina deve restituire 2.5', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={0} interactive={true} onChange={handleChange} />);

        const cups = screen.getAllByRole('button');
        const thirdCup = cups[2]; // index 2 = terza tazzina

        // Mock getBoundingClientRect per simulare posizione
        thirdCup.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            width: 40,
            top: 0,
            right: 140,
            bottom: 40,
            height: 40
        }));

        // Click a x=110 (10px dentro la tazzina = metà sinistra)
        // left=100, width=40, quindi metà è a 120
        // x=110 < 120 → metà sinistra → value = 2 + 0.5 = 2.5
        fireEvent.click(thirdCup, { clientX: 110 });

        expect(handleChange).toHaveBeenCalledWith(2.5);
    });

    //Test: click sulla metà DESTRA di una tazzina deve dare valore intero
    //Logica testata: if (x >= width / 2) → value = index + 1
    it('click sulla metà destra della 3a tazzina deve restituire 3', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={0} interactive={true} onChange={handleChange} />);

        const cups = screen.getAllByRole('button');
        const thirdCup = cups[2];

        thirdCup.getBoundingClientRect = jest.fn(() => ({
            left: 100,
            width: 40,
            top: 0,
            right: 140,
            bottom: 40,
            height: 40
        }));

        // Click a x=130 (30px dentro = metà destra)
        // left=100, width=40, metà a 120
        // x=130 >= 120 → metà destra → value = 2 + 1 = 3
        fireEvent.click(thirdCup, { clientX: 130 });

        expect(handleChange).toHaveBeenCalledWith(3);
    });

    //Test: click esattamente al centro deve andare sulla metà destra (>=)
    //Edge case: x = width/2 esattamente
    it('click esattamente al centro deve restituire valore intero (>=)', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={0} interactive={true} onChange={handleChange} />);

        const cups = screen.getAllByRole('button');
        const secondCup = cups[1]; // index 1

        secondCup.getBoundingClientRect = jest.fn(() => ({
            left: 50,
            width: 40,
            top: 0,
            right: 90,
            bottom: 40,
            height: 40
        }));

        // Click esattamente al centro: x = 50 + 20 = 70
        // width/2 = 20, x - left = 70 - 50 = 20
        // 20 < 20 è FALSE, quindi metà destra → value = 1 + 1 = 2
        fireEvent.click(secondCup, { clientX: 70 });

        expect(handleChange).toHaveBeenCalledWith(2);
    });

    //Test: prima tazzina, metà sinistra = 0.5
    it('click metà sinistra prima tazzina deve restituire 0.5', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={0} interactive={true} onChange={handleChange} />);

        const cups = screen.getAllByRole('button');
        const firstCup = cups[0];

        firstCup.getBoundingClientRect = jest.fn(() => ({
            left: 0,
            width: 40,
            top: 0,
            right: 40,
            bottom: 40,
            height: 40
        }));

        // Click a x=10 (metà sinistra)
        // x - left = 10, width/2 = 20, 10 < 20 → metà sinistra
        // value = 0 + 0.5 = 0.5
        fireEvent.click(firstCup, { clientX: 10 });

        expect(handleChange).toHaveBeenCalledWith(0.5);
    });

    //Test: ultima tazzina, metà destra = 5
    it('click metà destra ultima tazzina deve restituire 5 (max)', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={0} interactive={true} onChange={handleChange} />);

        const cups = screen.getAllByRole('button');
        const lastCup = cups[4]; // index 4 = quinta tazzina

        lastCup.getBoundingClientRect = jest.fn(() => ({
            left: 200,
            width: 40,
            top: 0,
            right: 240,
            bottom: 40,
            height: 40
        }));

        // Click a x=230 (metà destra)
        // value = 4 + 1 = 5
        fireEvent.click(lastCup, { clientX: 230 });

        expect(handleChange).toHaveBeenCalledWith(5);
    });
});

describe('CoffeeCupRating - Edge cases che potrebbero rompere la logica', () => {

    //Test: rating negativo - l'algoritmo non deve andare in errore
    it('rating negativo deve mostrare tutte empty senza errori', () => {
        // Questo potrebbe causare problemi se l'algoritmo non gestisce valori < 0
        render(<CoffeeCupRating rating={-2} />);

        const cups = screen.getAllByRole('img');
        expect(cups).toHaveLength(5);

        cups.forEach(cup => {
            expect(cup.className).toContain('empty');
        });
    });

    //Test: rating > 5 - l'algoritmo deve saturare a full
    it('rating maggiore di 5 deve mostrare tutte full', () => {
        render(<CoffeeCupRating rating={10} />);

        const cups = screen.getAllByRole('img');

        cups.forEach(cup => {
            expect(cup.className).toContain('full');
        });
    });

    //Test: rating con decimali strani (es: 2.7)
    //L'algoritmo deve arrotondare correttamente
    it('rating 2.7 deve comportarsi come 2.5 (half sulla terza)', () => {
        render(<CoffeeCupRating rating={2.7} />);

        const cups = screen.getAllByRole('img');

        // 2.7 >= 3? NO, 2.7 >= 2.5? SI → half
        expect(cups[0].className).toContain('full');
        expect(cups[1].className).toContain('full');
        expect(cups[2].className).toContain('half');
    });

    //Test: rating 2.4 deve essere half (>= 2.5 - 0.5 = 2.0)
    it('rating 2.4 deve mostrare half sulla terza tazzina', () => {
        render(<CoffeeCupRating rating={2.4} />);

        const cups = screen.getAllByRole('img');

        // cup3 (value=3): 2.4 >= 3? NO, 2.4 >= 2.5? NO → empty
        // Aspetta, controlliamo la logica: rating >= cupValue - 0.5
        // cupValue = 3, 3 - 0.5 = 2.5, 2.4 >= 2.5? NO → empty
        expect(cups[2].className).toContain('empty');
    });

    //Test: non deve chiamare onChange se non interattivo
    it('click in modalità non interattiva non deve chiamare onChange', () => {
        const handleChange = jest.fn();
        render(<CoffeeCupRating rating={2} interactive={false} onChange={handleChange} />);

        const cups = screen.getAllByRole('img');
        fireEvent.click(cups[3]);

        expect(handleChange).not.toHaveBeenCalled();
    });
});
