import React from "react";
import "./PricingTable.css";

function PricingTable() {
    return (
        <div className="pricing-table">
            <h2>Pricing Table (Per Night)</h2>
            <ul>
                <li>
                    <i className="fa-solid fa-person"></i>
                    Adults <span>7€</span>
                </li>
                <li>
                    <i className="fa-solid fa-child-reaching"></i>
                    Children (up to 10 years) <span>4€</span>
                </li>
                <li>
                    <i className="fa-solid fa-tent"></i>
                    Tent Place <span>3€</span>
                </li>
                <li>
                    <i className="fa-solid fa-car"></i>
                    Car in Territory <span>3€</span>
                </li>
                <li>
                    <i className="fa-solid fa-caravan"></i>
                    Camper Van <span>5€</span>
                </li>
                <li>
                    <i className="fa-solid fa-trailer"></i>
                    Car + Trailer <span>9€</span>
                </li>
                <li>
                    <i className="fa-solid fa-bolt"></i>
                    Electricity <span>6€</span>
                </li>
                <li>
                    <i className="fa-solid fa-shower"></i>
                    Outdoor Shower <span>2€</span>
                </li>
                <li>
                    <i className="fa-solid fa-tree"></i>
                    Additional Firewood <span>5€</span>
                </li>
            </ul>
            <div className="please-note">
                <h3>Please Note:</h3>
                <ul>
                    <li>Additional firewood is a 30L bag of firewood.</li>
                </ul>
            </div>
        </div>
    );
}

export default PricingTable;
