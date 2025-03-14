import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

    // Function to handle login
    const login = () => {
        setIsAdminLoggedIn(true);
    };

    // Function to handle logout
    const logout = () => {
        setIsAdminLoggedIn(false);
    };

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("Checking admin authentication...");
                const response = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/check-auth`,
                    {
                        withCredentials: true, // Include cookies
                    }
                );
                console.log("Check-auth response:", response.data);

                if (response.status === 200) {
                    setIsAdminLoggedIn(true);
                } else {
                    setIsAdminLoggedIn(false);
                }
            } catch (error) {
                console.error("Auth check failed:", error);
                setIsAdminLoggedIn(false);
            }
        };

        checkAuth();
    }, []);

    return (
        <AuthContext.Provider value={{ isAdminLoggedIn, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
