import { useEffect, useState } from "react";
import { onSnapshot, doc, collection, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";

export const useUserData = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            setUserData(null);
            return;
        }

        const userRef = doc(db, "users", currentUser.uid);

        const unsubUser = onSnapshot(userRef, async (userSnap) => {
            const user = userSnap.data();
            if (!user) return;

            let extraData = {};

            // Fetch associated data based on role
            if (user.role === 'Barista') {
                const q = query(collection(db, "bars"), where("ownerUid", "==", currentUser.uid));
                // We use onSnapshot for the extra data too, but for simplicity in this hook structure
                // we might just fetch it once or set up a nested listener. 
                // Nested listeners can be tricky with cleanup. 
                // Let's try to keep it simple: fetch once here, or set up a separate effect?
                // A separate effect is better but we need the role first.
                // For now, let's just do a one-time fetch or a simple subscription if possible.
                // Actually, let's just return the user data first, and let a separate hook or component handle the specific data 
                // OR merge it here if we want a unified "Profile Data" object.
                // Given the requirement, merging it here makes the Profile component cleaner.

                // Let's use a simple getDocs for now to avoid complex nested subscriptions in this iteration,
                // or better, set up a secondary listener.
            }

            setUserData(user);
        });

        return () => unsubUser();
    }, [currentUser]);

    return userData;
};

// Helper hook for role data could be better
export const useRoleData = (user) => {
    const [roleData, setRoleData] = useState(null);

    useEffect(() => {
        if (!user || !user.role || user.role === 'Appassionato') {
            setRoleData(null);
            return;
        }

        const collectionName = user.role === 'Bar' ? 'bars' : (user.role === 'Torrefazione' ? 'roasteries' : null);
        if (!collectionName) return;

        const q = query(collection(db, collectionName), where("ownerUid", "==", user.uid));
        const unsub = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                setRoleData({ ...snapshot.docs[0].data(), id: snapshot.docs[0].id });
            } else {
                setRoleData(null); // No associated profile yet
            }
        });

        return () => unsub();
    }, [user]);

    return roleData;
};
