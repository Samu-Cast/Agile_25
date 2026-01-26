import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MediaGallery from '../../../components/MediaGallery';

// Mock scrollTo perché JSDOM non lo supporta
beforeAll(() => {
    Element.prototype.scrollTo = jest.fn();
});

describe('MediaGallery', () => {
    //test per mediaUrls vuoto
    it('Non renderizza nulla se mediaUrls è vuoto', () => {
        const { container } = render(<MediaGallery mediaUrls={[]} />);
        expect(container.firstChild).toBeNull();
    });

    //test per controllare se è un video (per tutti i formati di video)
    test.each([
        ['video.mp4'],
        ['video.mov'],
        ['video.webm']
    ])('Renderizza un video se mediaUrls contiene %s', (videoUrl) => {
        const { container } = render(<MediaGallery mediaUrls={[videoUrl]} />);
        expect(container.querySelector('video')).toBeInTheDocument();
        expect(container.querySelector('.next')).not.toBeInTheDocument();
        expect(container.querySelector('.prev')).not.toBeInTheDocument();
    });

    //test per verificare se mediaUrls contiene un'immagine
    it('Renderizza un immagine se mediaUrls contiene un immagine', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg']} />);
        expect(container.querySelector('img')).toBeInTheDocument();
        expect(container.querySelector('.next')).not.toBeInTheDocument();
        expect(container.querySelector('.prev')).not.toBeInTheDocument();
    });

    //test per verificare se renderizza correttamente il pulsante per andare avanti con due immagini
    it('Rendirizza correttamente il pulsante per andare avanti', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg', 'image2.jpg']} />);
        expect(container.querySelector('.next')).toBeInTheDocument();
    });

    //test per verificare se renderizza correttamente il pulsante per andare avanti con due video
    test.each([
        ['video.mp4', 'video2.mp4'],
        ['video.mov', 'video2.mov'],
        ['video.webm', 'video2.webm']
    ])('Renderizza correttamente il pulsante per andare avanti se mediaUrls contiene due video %s', (videoUrl) => {
        const { container } = render(<MediaGallery mediaUrls={[videoUrl, videoUrl]} />);
        expect(container.querySelector('.next')).toBeInTheDocument();
        expect(container.querySelector('video')).toBeInTheDocument();
    });

    //test per verificare se renderizza correttamente il pulsante per andare indietro con due immagini (quindi anche con di più)
    it('Rendirizza correttamente il pulsante per andare indietro', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg', 'image2.jpg']} />);
        expect(container.querySelector('.prev')).toBeInTheDocument();
    });

    //test per verificare se renderizza correttamente il pulsante per andare indietro con due video (quindi anche con di più)
    test.each([
        ['video.mp4', 'video2.mp4'],
        ['video.mov', 'video2.mov'],
        ['video.webm', 'video2.webm']
    ])('Renderizza correttamente il pulsante per andare indietro se mediaUrls contiene due video %s', (videoUrl) => {
        const { container } = render(<MediaGallery mediaUrls={[videoUrl, videoUrl]} />);
        expect(container.querySelector('.prev')).toBeInTheDocument();
        expect(container.querySelector('video')).toBeInTheDocument();
    });

    //test per verificare il corretto scroll con il pulsante avanti (con immagini)
    it('Verifica il corretto scroll con il pulsante avanti', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg', 'image2.jpg']} />);
        fireEvent.click(container.querySelector('.next'));
        //verifica che il secondo indicatore abbia la classe 'active'
        const indicators = container.querySelectorAll('.indicator');
        expect(indicators[0].classList.contains('active')).toBe(false);
        expect(indicators[1].classList.contains('active')).toBe(true);
    });

    //test per verificare il corretto scroll con il pulsante avanti (con video)
    test.each([
        ['video.mp4', 'video2.mp4'],
        ['video.mov', 'video2.mov'],
        ['video.webm', 'video2.webm']
    ])('Verifica il corretto scroll con il pulsante avanti se mediaUrls contiene due video %s', (videoUrl) => {
        const { container } = render(<MediaGallery mediaUrls={[videoUrl, videoUrl]} />);
        fireEvent.click(container.querySelector('.next'));
        //verifica che il secondo indicatore abbia la classe 'active'
        const indicators = container.querySelectorAll('.indicator');
        expect(indicators[0].classList.contains('active')).toBe(false);
        expect(indicators[1].classList.contains('active')).toBe(true);
    });

    //test per verificare il corretto scroll con il pulsante indietro (con immagini)
    it('Verifica il corretto scroll con il pulsante indietro', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg', 'image2.jpg']} />);
        fireEvent.click(container.querySelector('.prev'));
        //verifica che il secondo indicatore abbia la classe 'active'
        const indicators = container.querySelectorAll('.indicator');
        expect(indicators[0].classList.contains('active')).toBe(false);
        expect(indicators[1].classList.contains('active')).toBe(true);
    });

    //test per verificare il corretto scroll con il pulsante indietro (con video)
    test.each([
        ['video.mp4', 'video2.mp4'],
        ['video.mov', 'video2.mov'],
        ['video.webm', 'video2.webm']
    ])('Verifica il corretto scroll con il pulsante indietro se mediaUrls contiene due video %s', (videoUrl) => {
        const { container } = render(<MediaGallery mediaUrls={[videoUrl, videoUrl]} />);
        fireEvent.click(container.querySelector('.prev'));
        //verifica che il secondo indicatore abbia la classe 'active'
        const indicators = container.querySelectorAll('.indicator');
        expect(indicators[0].classList.contains('active')).toBe(false);
        expect(indicators[1].classList.contains('active')).toBe(true);
    });


    //test per verificare il settaggio dell'index
    it('Verifica il corretto settaggio dell\'index', () => {
        const { container } = render(<MediaGallery mediaUrls={['image.jpg', 'image2.jpg']} />);
        fireEvent.click(container.querySelector('.next'));
        //verifica che il secondo indicatore abbia la classe 'active'
        const indicators = container.querySelectorAll('.indicator');
        expect(indicators[0].classList.contains('active')).toBe(false);
        expect(indicators[1].classList.contains('active')).toBe(true);
    });
    it('Aggiorna l\'indice quando si scorre il carousel', () => {
        const { container } = render(<MediaGallery mediaUrls={['img1.jpg', 'img2.jpg']} />);
        const carousel = container.querySelector('.media-carousel');
        // Simula lo scroll
        fireEvent.scroll(carousel);
        // Verifica che non generi errori
        expect(carousel).toBeInTheDocument();
    });
    it('Naviga cliccando direttamente su un indicatore', () => {
        const { container } = render(<MediaGallery mediaUrls={['img1.jpg', 'img2.jpg', 'img3.jpg']} />);
        const indicators = container.querySelectorAll('.indicator');
        // Clicca sul terzo indicatore
        fireEvent.click(indicators[2]);
        // Verifica che il terzo indicatore sia attivo
        expect(indicators[2].classList.contains('active')).toBe(true);
        expect(indicators[0].classList.contains('active')).toBe(false);
    });
});
