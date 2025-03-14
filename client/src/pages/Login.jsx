import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css"; // Import the custom CSS file

const LoginPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/login`,
                {
                    method: "POST",
                    body: JSON.stringify({ username, password }),
                    headers: { "Content-Type": "application/json" },
                    credentials: "include", // Include cookies
                }
            );
            const data = await response.json();
            console.log("Login Response:", data); // Log the response

            if (response.ok) {
                console.log("Login successful, redirecting to dashboard");
                navigate("/admin/dashboard"); // Redirect to admin dashboard
            } else {
                console.log("Login failed:", data.message);
                alert("Invalid credentials");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("An error occurred during login");
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h2>Admin Login</h2>
                <form className="login-form" onSubmit={handleLogin}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
