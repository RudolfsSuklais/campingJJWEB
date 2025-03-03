import { Navigate } from "react-router-dom";
import { useAccess } from "../context/AccessContext";

const ProtectedRoute = ({ children }) => {
    const { hasAccess } = useAccess();

    return hasAccess ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
