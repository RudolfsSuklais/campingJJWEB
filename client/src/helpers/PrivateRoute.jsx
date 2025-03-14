import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const { isAdminLoggedIn } = useAuth();

    return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
};

export default PrivateRoute; // Ensure default export
