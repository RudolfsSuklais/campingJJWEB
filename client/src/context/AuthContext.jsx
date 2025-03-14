import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                console.log("Checking admin authentication...");
                const response = axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/check-auth`,
                    {
                        credentials: "include",
                    }
                );
                const data = await response.json();
                console.log("Check-auth response:", data);

                if (response.ok) {
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
        <AuthContext.Provider value={{ isAdminLoggedIn, setIsAdminLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
