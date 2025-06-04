/**
 * UserContext is a global state manager for user authentication.
 *
 * It allows the entire React app to:
 * - Know if a user is currently logged in
 * - Access user data (like name, email, etc.)
 * - Show or hide components based on login status
 * - Handle login and logout actions
 * - Wait for session check before rendering the app (using the loading flag)
 *
 * This avoids the need to pass user state manually through props across components.
 * Instead, any component can use the `useUser()` hook to access or update user-related data.
 *
 * It acts as a central brain for managing user sessions and permissions.
 */


import { useState, useEffect } from 'react';
import { UserContext } from './UserContext';
import API from '../api/api';

export default function UserProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loggedIn, setLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const userInfo = await API.getCurrentUser();
                setUser(userInfo);
                setLoggedIn(true);
            } catch {
                setUser(null);
                setLoggedIn(false);
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
    }, []);

    const loginSuccessful = (userData) => {
        setUser(userData);
        setLoggedIn(true);
    };

    const handleLogout = async () => {
        await API.logout();
        setUser(null);
        setLoggedIn(false);
    };

    return (
        <UserContext.Provider value={{ user, loggedIn, loading, loginSuccessful, handleLogout }}>
            {children}
        </UserContext.Provider>
    );
}