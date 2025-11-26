import { db } from '../firebase';
import {
    collection,
    addDoc,
    getDocs,
    query,
    orderBy,
    serverTimestamp,
    Timestamp,
    doc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    getDoc
} from 'firebase/firestore';

// Reference alla collection "posts"
const postsCollection = collection(db, 'posts');

/**
 * Crea un nuovo post su Firestore
 * @param {Object} postData - Dati del post { title, content, author, imageUrl }
 * @returns {Promise<string>} - ID del post creato
 */
export const createPost = async (postData) => {
    try {
        const newPost = {
            title: postData.title,
            content: postData.content,
            author: postData.author || 'u/anonymous',
            imageUrl: postData.imageUrl || null,
            votes: 0,
            coffees: 0,
            comments: 0,
            createdAt: serverTimestamp(),
            tags: postData.tags || [],
            votedBy: {},
            coffeeBy: []
        };

        const docRef = await addDoc(postsCollection, newPost);
        console.log('Post creato con ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error('Errore nella creazione del post:', error);
        throw error;
    }
};

/**
 * Recupera tutti i post da Firestore ordinati per data
 * @returns {Promise<Array>} - Array di post
 */
export const getPosts = async () => {
    try {
        const q = query(postsCollection, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const posts = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            posts.push({
                id: doc.id,
                ...data,
                time: formatTimestamp(data.createdAt)
            });
        });

        return posts;
    } catch (error) {
        console.error('Errore nel recupero dei post:', error);
        throw error;
    }
};

/**
 * Aggiorna i voti di un post (un utente può votare una sola volta)
 * @param {string} postId - ID del post
 * @param {string} userId - ID dell'utente
 * @param {number} value - Valore del voto (+1 o -1)
 */
export const updateVotes = async (postId, userId, value) => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post non trovato');
        }

        const postData = postSnap.data();
        const votedBy = postData.votedBy || {};
        const currentVote = votedBy[userId];

        // Calcola la differenza nei voti
        let voteChange = 0;

        if (currentVote === value) {
            // L'utente ha cliccato sullo stesso voto - rimuovi il voto
            delete votedBy[userId];
            voteChange = -value;
        } else if (currentVote) {
            // L'utente cambia il voto (da up a down o viceversa)
            votedBy[userId] = value;
            voteChange = value - currentVote;
        } else {
            // Nuovo voto
            votedBy[userId] = value;
            voteChange = value;
        }

        await updateDoc(postRef, {
            votes: increment(voteChange),
            votedBy: votedBy
        });

        return { success: true, newVote: votedBy[userId] };
    } catch (error) {
        console.error('Errore nell\'aggiornamento dei voti:', error);
        throw error;
    }
};

/**
 * Aggiungi o rimuovi un caffè (un utente può dare un caffè una sola volta)
 * @param {string} postId - ID del post
 * @param {string} userId - ID dell'utente
 */
export const toggleCoffee = async (postId, userId) => {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);

        if (!postSnap.exists()) {
            throw new Error('Post non trovato');
        }

        const postData = postSnap.data();
        const coffeeBy = postData.coffeeBy || [];
        const hasGivenCoffee = coffeeBy.includes(userId);

        if (hasGivenCoffee) {
            // Rimuovi il caffè
            await updateDoc(postRef, {
                coffees: increment(-1),
                coffeeBy: arrayRemove(userId)
            });
            return { success: true, hasGivenCoffee: false };
        } else {
            // Aggiungi il caffè
            await updateDoc(postRef, {
                coffees: increment(1),
                coffeeBy: arrayUnion(userId)
            });
            return { success: true, hasGivenCoffee: true };
        }
    } catch (error) {
        console.error('Errore nel toggle del caffè:', error);
        throw error;
    }
};

/**
 * Formatta un timestamp Firestore in stringa leggibile (es. "2h ago")
 */
const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Just now';

    const now = new Date();
    const postDate = timestamp instanceof Timestamp
        ? timestamp.toDate()
        : new Date(timestamp);

    const diffMs = now - postDate;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks}w ago`;
};

export const updateRating = async (postId, userId, rating) => {
    if (rating < 0 || rating > 5) {
        throw new Error('Rating must be between 0 and 5');
    }
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) {
            throw new Error('Post not found');
        }
        const postData = postSnap.data();
        const ratingBy = postData.ratingBy || {};
        ratingBy[userId] = rating;
        await updateDoc(postRef, { ratingBy });
        return { success: true, ratingBy };
    } catch (error) {
        console.error('Error updating rating:', error);
        throw error;
    }
};

export const getComments = async (postId) => {
    try {
        const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`);
        if (!response.ok) {
            throw new Error('Failed to fetch comments');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching comments:", error);
        throw error;
    }
};

export const addComment = async (postId, commentData) => {
    try {
        const response = await fetch(`http://localhost:3001/api/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(commentData),
        });
        if (!response.ok) {
            throw new Error('Failed to add comment');
        }
        return await response.json();
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export default { createPost, getPosts, updateVotes, toggleCoffee, updateRating, getComments, addComment };
