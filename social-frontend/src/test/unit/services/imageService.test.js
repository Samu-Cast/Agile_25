//Test per verificare che il caricamento delle immagini funzioni correttamente
//Importa le funzioni da testare dal file imageService
import { validateImage, uploadImage } from '../../../services/imageService';

//Crea versioni finte di fetch e alert (già fatto in setupTests.js ma ridichiarato qui)
global.fetch = jest.fn();
global.alert = jest.fn();

//Gruppo di test per la funzione validateImage
describe('imageService - validateImage', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che un'immagine valida venga accettata
    it('dovrebbe accettare immagine valida (JPG, <5MB)', () => {
        //Crea un file finto di tipo JPG
        const validFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        //Imposta la dimensione del file a 2MB
        Object.defineProperty(validFile, 'size', { value: 2 * 1024 * 1024 });

        //Chiama la funzione validateImage con il file finto
        const result = validateImage(validFile);
        //Verifica che la funzione ritorni true (file valido)
        expect(result).toBe(true);
        //Verifica che non sia stato mostrato nessun alert di errore
        expect(global.alert).not.toHaveBeenCalled();
    });

    //Test: verifica che un file troppo grande venga rifiutato
    it('dovrebbe rifiutare file troppo grande (>5MB)', () => {
        //Crea un file finto di tipo JPG
        const largeFile = new File(['content'], 'large.jpg', { type: 'image/jpeg' });
        //Imposta la dimensione del file a 6MB (troppo grande)
        Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });

        //Chiama la funzione validateImage con il file troppo grande
        const result = validateImage(largeFile);
        //Verifica che la funzione ritorni false (file non valido)
        expect(result).toBe(false);
        //Verifica che sia stato mostrato l'alert con il messaggio corretto
        expect(global.alert).toHaveBeenCalledWith('Il file è troppo grande. Massimo 5MB.');
    });

    //Test: verifica che un tipo di file non supportato venga rifiutato
    it('dovrebbe rifiutare tipo file non supportato', () => {
        //Crea un file finto di tipo PDF (non supportato)
        const invalidFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
        //Imposta la dimensione del file a 1MB
        Object.defineProperty(invalidFile, 'size', { value: 1 * 1024 * 1024 });

        //Chiama la funzione validateImage con il file PDF
        const result = validateImage(invalidFile);
        //Verifica che la funzione ritorni false (file non valido)
        expect(result).toBe(false);
        //Verifica che sia stato mostrato l'alert con il messaggio corretto
        expect(global.alert).toHaveBeenCalledWith('Formato file non supportato. Usa JPG, PNG, GIF o WebP.');
    });

    //Test: verifica che tutti i formati supportati vengano accettati
    it('dovrebbe accettare tutti i formati supportati', () => {
        //Lista dei formati di immagine supportati
        const formats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        //Per ogni formato nella lista
        formats.forEach(type => {
            //Crea un file finto con quel formato
            const file = new File(['content'], `test.${type.split('/')[1]}`, { type });
            //Imposta la dimensione del file a 1MB
            Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 });

            //Chiama la funzione validateImage
            const result = validateImage(file);
            //Verifica che la funzione ritorni true per ogni formato
            expect(result).toBe(true);
        });
    });
});

//Gruppo di test per la funzione uploadImage
describe('imageService - uploadImage', () => {
    //Prima di ogni test, pulisce i dati del test precedente
    beforeEach(() => {
        jest.clearAllMocks();
    });

    //Test: verifica che il caricamento di un'immagine funzioni correttamente
    it('dovrebbe caricare immagine con successo', async () => {
        //Risposta finta del server con l'URL dell'immagine caricata
        const mockResponse = { url: 'https://example.com/uploaded.jpg' };
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        //Crea un file finto da caricare
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        //Chiama la funzione uploadImage
        const result = await uploadImage(file, 'posts');

        //Verifica che fetch sia stato chiamato con l'URL corretto
        expect(global.fetch).toHaveBeenCalledWith(
            'http://localhost:3001/api/upload',
            expect.objectContaining({
                method: 'POST',
                body: expect.any(FormData)
            })
        );
        //Verifica che la funzione ritorni l'URL dell'immagine caricata
        expect(result).toBe('https://example.com/uploaded.jpg');
    });

    //Test: verifica che gli errori di caricamento vengano gestiti correttamente
    it('dovrebbe gestire errore di upload', async () => {
        //Configura fetch per ritornare una risposta di errore
        global.fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
            json: async () => ({ error: 'Upload failed' })
        });

        //Crea un file finto da caricare
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        //Verifica che la funzione lanci un errore con il messaggio corretto
        await expect(uploadImage(file, 'posts')).rejects.toThrow('Upload failed');
    });

    //Test: verifica che i dati inviati al server siano corretti
    it('dovrebbe inviare FormData con file e folder corretti', async () => {
        //Configura fetch per ritornare una risposta positiva
        global.fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({ url: 'test.jpg' })
        });

        //Crea un file finto da caricare
        const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
        //Chiama la funzione uploadImage con la cartella 'profiles'
        await uploadImage(file, 'profiles');

        //Recupera i dati inviati a fetch
        const callArgs = global.fetch.mock.calls[0];
        const formData = callArgs[1].body;

        //Verifica che i dati siano nel formato FormData
        expect(formData).toBeInstanceOf(FormData);
        //Verifica che il file sia stato aggiunto correttamente
        expect(formData.get('file')).toBe(file);
        //Verifica che la cartella sia stata specificata correttamente
        expect(formData.get('folder')).toBe('profiles');
    });
});