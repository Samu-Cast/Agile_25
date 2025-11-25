import { useEffect, useState } from "react";
import { onSnapshot, doc } from "firebase/firestore";
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

        const ref = doc(db, "users", currentUser.uid);

        const unsub = onSnapshot(ref, (snapshot) => {
            setUserData(snapshot.data());
        });

        return () => unsub();
    }, [currentUser]);

    return userData;
};
