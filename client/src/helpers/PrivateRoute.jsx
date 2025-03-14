import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
    const { isAdminLoggedIn } = useAuth();
    console.log("PrivateRoute - isAdminLoggedIn:", isAdminLoggedIn);

    return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
};

export default PrivateRoute;
