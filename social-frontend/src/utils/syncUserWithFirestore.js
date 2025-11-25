import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase";

export const syncUserWithFirestore = async (firebaseUser) => {
    if (!firebaseUser) return;

    const ref = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);

    const baseData = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || null,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        provider: firebaseUser.providerData[0]?.providerId || "password",
        lastLogin: new Date(),
    };

    // Se NON esiste, creiamo il profilo base
    if (!snap.exists()) {
        await setDoc(ref, {
            ...baseData,
            createdAt: new Date(),
            stats: { posts: 0, followers: 0, following: 0 },
        });
        return;
    }

    // Se esiste, aggiorniamo SOLO ciò che serve
    await setDoc(ref, baseData, { merge: true });
};
