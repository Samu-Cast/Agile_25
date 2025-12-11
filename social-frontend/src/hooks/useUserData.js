import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getUser, getRoleProfile } from "../services/userService";

export const useUserData = () => {
    const { currentUser } = useAuth();
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        if (!currentUser) {
            setUserData(null);
            return;
        }

        const fetchUser = async () => {
            const user = await getUser(currentUser.uid);
            setUserData(user);
        };

        fetchUser();
    }, [currentUser]);

    return userData;
};

export const useRoleData = (user) => {
    const [roleData, setRoleData] = useState(null);

    useEffect(() => {
        if (!user || !user.role || user.role === 'Appassionato') {
            setRoleData(null);
            return;
        }

        const collectionName = user.role === 'Bar' ? 'bars' : (user.role === 'Torrefazione' ? 'roasters' : null);
        if (!collectionName) return;

        const fetchRoleData = async () => {
            const data = await getRoleProfile(collectionName, user.uid);
            setRoleData(data);
        };

        fetchRoleData();
    }, [user]);

    return roleData;
};
