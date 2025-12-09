import { getUser, createUserProfile, updateUserProfile } from "../services/userService";

export const syncUserWithFirestore = async (firebaseUser) => {
    if (!firebaseUser) return;

    try {
        const existingUser = await getUser(firebaseUser.uid);

        const baseData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || null,
            displayName: firebaseUser.displayName || "",
            photoURL: firebaseUser.photoURL || "",
            provider: firebaseUser.providerData[0]?.providerId || "password",
            lastLogin: new Date(),
        };

        // Se NON esiste, creiamo il profilo base
        if (!existingUser) {
            await createUserProfile(firebaseUser.uid, {
                ...baseData,
                role: 'Appassionato', // Default role
                profilePic: firebaseUser.photoURL || "https://cdn-icons-png.flaticon.com/512/847/847969.png", // Default avatar
                name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
                nickname: firebaseUser.email?.split('@')[0] || "User", // Add nickname default
                bio: "Coffee lover ☕",
                createdAt: new Date(),
                stats: { posts: 0, followers: 0, following: 0 },
            });
            return;
        }

        // Se esiste, aggiorniamo SOLO ciò che serve
        await updateUserProfile(firebaseUser.uid, baseData);
    } catch (error) {
        console.error("Error syncing user with backend:", error);
    }
};
