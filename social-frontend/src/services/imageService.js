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

/**
 * Valida che il file sia un video
 * @param {File} file - File da validare
 * @returns {boolean} - true se è un video valido
 */
export const validateVideo = (file) => {
    const validTypes = ['video/mp4', 'video/mov', 'video/quicktime', 'video/webm'];
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (!validTypes.includes(file.type)) {
        alert('Formato video non supportato. Usa MP4, MOV o WebM.');
        return false;
    }

    if (file.size > maxSize) {
        alert('Il video è troppo grande. Massimo 50MB.');
        return false;
    }

    return true;
};

/**
 * Valida che il file sia un'immagine o un video
 * @param {File} file - File da validare
 * @returns {boolean} - true se è un media valido
 */
export const validateMedia = (file) => {
    if (file.type.startsWith('image/')) {
        return validateImage(file);
    } else if (file.type.startsWith('video/')) {
        return validateVideo(file);
    } else {
        alert('Formato file non supportato. Usa immagini (JPG, PNG, GIF, WebP) o video (MP4, MOV, WebM).');
        return false;
    }
};

/**
 * Carica un video tramite backend API
 * @param {File} file - File video da caricare
 * @param {string} folder - Cartella dove salvare (es. 'posts')
 * @returns {Promise<string>} - URL del video caricato
 */
export const uploadVideo = async (file, folder = 'posts') => {
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
        console.error('Errore nel caricamento del video:', error);
        throw error;
    }
};

/**
 * Carica più file (immagini e/o video) in batch
 * @param {Array<File>} files - Array di file da caricare
 * @param {string} folder - Cartella dove salvare
 * @returns {Promise<Array<string>>} - Array di URL dei file caricati
 */
export const uploadMultipleMedia = async (files, folder = 'posts') => {
    try {
        const uploadPromises = files.map(file => {
            if (file.type.startsWith('image/')) {
                return uploadImage(file, folder);
            } else if (file.type.startsWith('video/')) {
                return uploadVideo(file, folder);
            } else {
                throw new Error(`Unsupported file type: ${file.type}`);
            }
        });

        const urls = await Promise.all(uploadPromises);
        return urls;
    } catch (error) {
        console.error('Errore nel caricamento multiplo:', error);
        throw error;
    }
};

const imageService = { uploadImage, validateImage, validateVideo, validateMedia, uploadVideo, uploadMultipleMedia };
export default imageService;

