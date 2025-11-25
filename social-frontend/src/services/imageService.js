import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Carica un'immagine su Firebase Storage
 * @param {File} file - File immagine da caricare
 * @param {string} folder - Cartella dove salvare (es. 'posts')
 * @returns {Promise<string>} - URL dell'immagine caricata
 */
export const uploadImage = async (file, folder = 'posts') => {
    try {
        // Genera un nome unico per il file
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const storageRef = ref(storage, `${folder}/${fileName}`);

        // Carica il file
        const snapshot = await uploadBytes(storageRef, file);
        console.log('Immagine caricata:', snapshot.metadata.name);

        // Ottieni l'URL pubblico
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error('Errore nel caricamento dell\'immagine:', error);
        throw error;
    }
};

/**
 * Valida che il file sia un'immagine
 * @param {File} file - File da validare
 * @returns {boolean} - true se è un'immagine valida
 */
export const validateImage = (file) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
        alert('Formato file non supportato. Usa JPG, PNG, GIF o WebP.');
        return false;
    }

    if (file.size > maxSize) {
        alert('Il file è troppo grande. Massimo 5MB.');
        return false;
    }

    return true;
};

export default { uploadImage, validateImage };
