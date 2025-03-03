import React from "react";
import PricingTable from "../components/PricingTable";
import "./PricingPage.css";
import { useNavigate } from "react-router-dom";
import { useAccess } from "../context/AccessContext";

function PricingPage() {
    const navigate = useNavigate();
    const { setHasAccess } = useAccess();
    const handleBookingClick = () => {
        setHasAccess(true);
        navigate("/booking-map");
    };
    return (
        <div className="pricing-page">
            <PricingTable />
            <button onClick={handleBookingClick}>Book Your Stay</button>
        </div>
    );
}

export default PricingPage;
