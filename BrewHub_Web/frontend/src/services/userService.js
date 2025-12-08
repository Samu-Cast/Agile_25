import { db } from '../firebase';
import { collection, query, where, getDocs, documentId } from 'firebase/firestore';

/**
 * Search users by nickname or email.
 * Note: Firestore doesn't support native full-text search. 
 * This is a basic implementation that looks for exact matches or startsWith for nickname.
 * @param {string} queryText - The search text.
 * @returns {Promise<Array>} - List of found users.
 */
export const searchUsers = async (queryText, role = null) => {
    console.log("searchUsers called with:", queryText, "Role:", role);
    if (!queryText || queryText.length < 2) return [];

    const usersRef = collection(db, 'users');
    const results = [];

    try {
        // Helper function to execute query and add unique results
        const executeQuery = async (field, value) => {
            const q = query(
                usersRef,
                where(field, '>=', value),
                where(field, '<=', value + '\uf8ff')
            );
            const snap = await getDocs(q);
            snap.forEach(doc => {
                if (!results.find(u => u.uid === doc.id)) {
                    const userData = doc.data();
                    if (!role || userData.role === role) {
                        results.push({ uid: doc.id, ...userData });
                    }
                }
            });
        };

        // 1. Search by nickname (Exact)
        await executeQuery('nickname', queryText);

        // 2. Search by nickname (Capitalized - e.g. "mario" -> "Mario")
        const capitalized = queryText.charAt(0).toUpperCase() + queryText.slice(1).toLowerCase();
        if (capitalized !== queryText) {
            await executeQuery('nickname', capitalized);
        }

        // 3. Search by nickname (Lowercase - e.g. "Mario" -> "mario")
        const lower = queryText.toLowerCase();
        if (lower !== queryText && lower !== capitalized) {
            await executeQuery('nickname', lower);
        }

        // 4. Search by name (Exact)
        await executeQuery('name', queryText);

        // 5. Search by name (Capitalized)
        if (capitalized !== queryText) {
            await executeQuery('name', capitalized);
        }

        // 6. Search by name (Lowercase)
        if (lower !== queryText && lower !== capitalized) {
            await executeQuery('name', lower);
        }

        // 7. Search by email (Exact match only)
        const qEmail = query(usersRef, where('email', '==', queryText));
        const emailSnap = await getDocs(qEmail);
        emailSnap.forEach(doc => {
            if (!results.find(u => u.uid === doc.id)) {
                const userData = doc.data();
                if (!role || userData.role === role) {
                    results.push({ uid: doc.id, ...userData });
                }
            }
        });

    } catch (error) {
        console.error("Error searching users:", error);
    }

    return results;
};

/**
 * Get user details for a list of UIDs.
 * @param {Array<string>} uids - List of user IDs.
 * @returns {Promise<Array>} - List of user details.
 */
export const getUsersByUids = async (uids) => {
    console.log("getUsersByUids called with:", uids);
    if (!uids || uids.length === 0) return [];

    const usersRef = collection(db, 'users');
    const users = [];

    try {
        // Firestore 'in' query is limited to 10 items.
        // For larger lists, we'd need to batch or fetch individually.
        // For this prototype, we'll assume < 10 or just fetch individually if needed.

        // Let's fetch individually for simplicity and robustness against the 10 limit for now, 
        // or use 'in' chunks. Let's use 'in' for chunks of 10.

        const chunks = [];
        for (let i = 0; i < uids.length; i += 10) {
            chunks.push(uids.slice(i, i + 10));
        }

        for (const chunk of chunks) {
            const q = query(usersRef, where(documentId(), 'in', chunk));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                users.push({ uid: doc.id, ...doc.data() });
            });
        }

    } catch (error) {
        console.error("Error fetching users by UIDs:", error);
    }

    return users;
};
