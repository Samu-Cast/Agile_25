const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Carica un'immagine tramite backend API
 * @param {File} file - File immagine da caricare
 * @param {string} folder - Cartella dove salvare (es. 'posts')
 * @returns {Promise<string>} - URL dell'immagine caricata
 */
export const uploadImage = async (file, folder = 'posts') => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);

        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Upload failed');
        }

        const data = await response.json();
        return data.url;
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

