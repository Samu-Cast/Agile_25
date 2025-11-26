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
    getDoc,
    where,
    collectionGroup
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

// ... existing imports ...

export const addComment = async (postId, commentData) => {
    try {
        // Use subcollection to match backend
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const newComment = {
            text: commentData.text,
            uid: commentData.authorUid, // Use uid to match backend
            parentComment: null,
            createdAt: serverTimestamp()
        };
        const docRef = await addDoc(commentsRef, newComment);
        return { id: docRef.id, ...newComment };
    } catch (error) {
        console.error("Error adding comment:", error);
        throw error;
    }
};

export const getComments = async (postId) => {
    try {
        // Use subcollection
        const commentsRef = collection(db, 'posts', postId, 'comments');
        const q = query(commentsRef, orderBy("createdAt", "asc")); // Backend uses asc
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting comments:", error);
        return [];
    }
};

export const getUserComments = async (userId) => {
    try {
        // Use backend API to ensure consistency
        const response = await fetch(`http://localhost:3001/api/comments?uid=${userId}`);
        if (!response.ok) {
            console.log("Comments API returned:", response.status);
            return [];
        }
        const comments = await response.json();
        return comments;
    } catch (error) {
        console.error("Error getting user comments:", error);
        return [];
    }
};

export const getUserVotedPosts = async (userId, voteType) => {
    try {
        // Backend only supports "likes" (upvotes). voteType 1 = like.
        if (voteType !== 1) return [];

        // Use collectionGroup on 'likes' subcollection
        // Requires 'uid' to be stored in the like document (which we just added to backend)
        const q = query(collectionGroup(db, 'likes'), where("uid", "==", userId));
        const querySnapshot = await getDocs(q);

        // We need to fetch the actual posts. 
        // The parent of the like doc is the 'likes' collection, parent of that is the post doc.
        const postPromises = querySnapshot.docs.map(doc => getDoc(doc.ref.parent.parent));
        const postDocs = await Promise.all(postPromises);

        return postDocs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error getting user voted posts:", error);
        return [];
    }
};

export const getUserPosts = async (userId) => {
    try {
        // Use backend API to ensure consistency
        const response = await fetch(`http://localhost:3001/api/posts?uid=${userId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch user posts');
        }
        const posts = await response.json();
        return posts;
    } catch (error) {
        console.error("Error getting user posts:", error);
        return [];
    }
};

export const getUserSavedPosts = async (userId) => {
    try {
        const savedRef = collection(db, 'users', userId, 'savedPosts');
        const q = query(savedRef, orderBy('savedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        const postPromises = querySnapshot.docs.map(docSnap => getDoc(doc(db, 'posts', docSnap.id)));
        const postDocs = await Promise.all(postPromises);

        return postDocs
            .filter(docSnap => docSnap.exists())
            .map(docSnap => ({
                id: docSnap.id,
                ...docSnap.data(),
                time: formatTimestamp(docSnap.data().createdAt)
            }));
    } catch (error) {
        console.error("Error getting saved posts:", error);
        return [];
    }
};

export const getUserSavedGuides = async (userId) => {
    try {
        // Assuming a similar structure for guides
        const savedRef = collection(db, 'users', userId, 'savedGuides');
        const q = query(savedRef, orderBy('savedAt', 'desc'));
        const querySnapshot = await getDocs(q);

        // Mocking guide data fetch since we don't have a guides collection yet
        // In a real app, we would fetch from 'guides' collection
        return querySnapshot.docs.map(docSnap => ({
            id: docSnap.id,
            ...docSnap.data(), // Expecting guide data to be duplicated here or fetched
            // For now, let's return what's in the saved doc, or mock if empty
            title: docSnap.data().title || "Guide Title",
            image: docSnap.data().image || "https://via.placeholder.com/400",
            type: "Guide"
        }));
    } catch (error) {
        console.error("Error getting saved guides:", error);
        return [];
    }
};

export default { createPost, getPosts, updateVotes, toggleCoffee, updateRating, addComment, getComments, getUserComments, getUserVotedPosts, getUserPosts, getUserSavedPosts, getUserSavedGuides };
