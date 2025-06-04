/**
 * Why we separated the context and provider into two files:
 *
 * React Fast Refresh (used by Vite in development) only works reliably when a file exports
 * React components consistently. If a file exports both components and other things
 * like constants or custom hooks, Fast Refresh can break or fall back to a full page reload.
 *
 * To prevent this, we split the logic:
 * - `UserProvider.jsx` contains only the main React component (the provider)
 * - `UserContext.js` contains the context object and a custom hook (`useUser`)
 *
 * This structure:
 *  Keeps Fast Refresh working correctly during development
 *  Follows clean architecture and separation of concerns
 *  Makes it easier to maintain and reuse the context logic
 */
// src/context/UserContext.js



import { createContext, useContext } from 'react';

// Create the Context
export const UserContext = createContext();

// Custom hook to access the UserContext
export const useUser = () => useContext(UserContext);
