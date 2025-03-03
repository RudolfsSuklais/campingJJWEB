import React, { useEffect, useState } from "react";
import { useNavigate, Route } from "react-router-dom";
import { useBooking } from "../context/BookingContext";
import toast from "react-hot-toast";
import "./Booking.css";
import PricingTable from "../components/PricingTable";

function PricingPage() {
    const { isAdults, setIsAdults } = useBooking();
    const [totalPrice, setTotalPrice] = useState(
        localStorage.getItem("totalPrice") || 0
    );
    const [adults, setAdults] = useState(localStorage.getItem("adults") || 0);
    const [children, setChildren] = useState(
        localStorage.getItem("children") || 0
    );
    const [tents, setTents] = useState(localStorage.getItem("tents") || 0);
    const [camperVans, setCamperVans] = useState(
        localStorage.getItem("camperVans") || 0
    );
    const [carsInTeritory, setCarsInTeritory] = useState(
        localStorage.getItem("carsInTeritory") || 0
    );
    const [additionalFirewood, setAdditionalFirewood] = useState(
        localStorage.getItem("additionalFirewood") || 0
    );
    const [carTrailer, setCarTrailer] = useState(
        localStorage.getItem("carTrailer") || 0
    );
    const [isElectricityChecked, setIsElectricityChecked] = useState(
        localStorage.getItem("electricity") === "true"
    );
    const [isOutdoorShowerChecked, setIsOutdoorShowerChecked] = useState(
        localStorage.getItem("outdoorShower") === "true"
    );

    const [selectedArea, setSelectedArea] = useState(null);

    const ADULT_PRICE = 7;
    const CHILD_PRICE = 4;
    const TENT_PRICE = 3;
    const CAMPER_VAN_PRICE = 5;
    const CAR_PRICE = 3;
    const CAR_TRAILER_PRICE = 9;
    const FIREWOOD_PRICE = 5;
    const ELECTRICITY_PRICE = 6;
    const OUTDOOR_SHOWER_PRICE = 2;

    const navigate = useNavigate();

    useEffect(() => {
        setIsAdults(2);
    }, [setIsAdults]);

    useEffect(() => {
        setSelectedArea(localStorage.getItem("selectedArea"));
    }, []);

    useEffect(() => {
        const savedPrice = localStorage.getItem("totalPrice");
        if (savedPrice) {
            setTotalPrice(Number(savedPrice));
        }
        const adults = localStorage.getItem("adults");
        if (adults) {
            setAdults(Number(adults));
        }
        const children = localStorage.getItem("children");
        if (children) {
            setChildren(Number(children));
        }
        const tents = localStorage.getItem("tents");
        if (tents) {
            setTents(Number(tents));
        }
        const camperVans = localStorage.getItem("camperVans");
        if (camperVans) {
            setCamperVans(Number(camperVans));
        }
        const carTrailer = localStorage.getItem("carTrailer");
        if (carTrailer) {
            setCarTrailer(Number(carTrailer));
        }
        const carsInTeritory = localStorage.getItem("carsInTeritory");
        if (carsInTeritory) {
            setCarsInTeritory(Number(carsInTeritory));
        }
        const firewood = localStorage.getItem("additionalFirewood");
        if (firewood) {
            setAdditionalFirewood(Number(firewood));
        }
        const electricity = localStorage.getItem("electricity");
        if (electricity) {
            setIsElectricityChecked(electricity === "true");
        }
        const outdoorShower = localStorage.getItem("outdoorShower");
        if (outdoorShower) {
            setIsOutdoorShowerChecked(outdoorShower === "true");
        }
    }, []);

    useEffect(() => {
        localStorage.setItem("totalPrice", totalPrice);
        localStorage.setItem("adults", adults);
        localStorage.setItem("children", children);
        localStorage.setItem("tents", tents);
        localStorage.setItem("camperVans", camperVans);
        localStorage.setItem("carsInTeritory", carsInTeritory);
        localStorage.setItem("additionalFirewood", additionalFirewood);
        localStorage.setItem("carTrailer", carTrailer);
        localStorage.setItem("electricity", isElectricityChecked);
        localStorage.setItem("outdoorShower", isOutdoorShowerChecked);
    }, [
        totalPrice,
        adults,
        children,
        tents,
        camperVans,
        carsInTeritory,
        additionalFirewood,
        carTrailer,
        isElectricityChecked,
        isOutdoorShowerChecked,
    ]);

    const updatePrice = (type, change) => {
        let priceChange = 0;
        switch (type) {
            case "adults":
                setAdults((prev) => {
                    const newAdults = prev + change;
                    setIsAdults(newAdults);
                    return newAdults;
                });
                priceChange = change * ADULT_PRICE;
                break;
            case "children":
                setChildren((prev) => prev + change);
                priceChange = change * CHILD_PRICE;
                break;
            case "tents":
                setTents((prev) => prev + change);
                priceChange = change * TENT_PRICE;
                break;
            case "camperVans":
                setCamperVans((prev) => prev + change);
                priceChange = change * CAMPER_VAN_PRICE;
                break;
            case "carTrailer":
                setCarTrailer((prev) => prev + change);
                priceChange = change * CAR_TRAILER_PRICE;
                break;
            case "carsInTeritory":
                setCarsInTeritory((prev) => prev + change);
                priceChange = change * CAR_PRICE;
                break;
            case "additionalFirewood":
                setAdditionalFirewood((prev) => prev + change);
                priceChange = change * FIREWOOD_PRICE;
                break;
            default:
                break;
        }
        setTotalPrice((prev) => prev + priceChange);
    };

    const handleElectricityChange = () => {
        setIsElectricityChecked((prev) => {
            const newCheckedState = !prev;
            setTotalPrice((prevTotal) =>
                newCheckedState
                    ? prevTotal + ELECTRICITY_PRICE
                    : prevTotal - ELECTRICITY_PRICE
            );
            return newCheckedState;
        });
    };

    const handleOutdoorShowerChange = () => {
        setIsOutdoorShowerChecked((prev) => {
            const newCheckedState = !prev;
            setTotalPrice((prevTotal) =>
                newCheckedState
                    ? prevTotal + OUTDOOR_SHOWER_PRICE
                    : prevTotal - OUTDOOR_SHOWER_PRICE
            );
            return newCheckedState;
        });
    };

    const handleSubmit = (e, setIsBooking) => {
        if (adults === 0) {
            toast.error("Please select at least 1 adult");
            return;
        }
        navigate("/booking-contact");
        e.preventDefault();
    };

    return (
        <>
            <section className="pricingPage">
                {/* Pricing Calculator Section */}
                <div className="pricingPageCalc">
                    <div className="pricingCard">
                        <h2>Calculate Your Stay</h2>
                        <p className="selectedAreaText">
                            <strong>Selected area: </strong> {selectedArea}
                        </p>
                        <div className="pricingCardAmount">
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-person"></i>
                                    Adults
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            adults > 0 &&
                                            updatePrice("adults", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{adults}</p>
                                    <button
                                        onClick={() => updatePrice("adults", 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-child-reaching"></i>
                                    Children
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            children > 0 &&
                                            updatePrice("children", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{children}</p>
                                    <button
                                        onClick={() =>
                                            updatePrice("children", 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-tent"></i>
                                    Tents
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            tents > 0 &&
                                            updatePrice("tents", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{tents}</p>
                                    <button
                                        onClick={() => updatePrice("tents", 1)}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-car"></i>
                                    Cars in Territory
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            carsInTeritory > 0 &&
                                            updatePrice("carsInTeritory", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{carsInTeritory}</p>
                                    <button
                                        onClick={() =>
                                            updatePrice("carsInTeritory", 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-caravan"></i>
                                    Camper Vans
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            camperVans > 0 &&
                                            updatePrice("camperVans", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{camperVans}</p>
                                    <button
                                        onClick={() =>
                                            updatePrice("camperVans", 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-trailer"></i>
                                    Car + Trailer
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            carTrailer > 0 &&
                                            updatePrice("carTrailer", -1)
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{carTrailer}</p>
                                    <button
                                        onClick={() =>
                                            updatePrice("carTrailer", 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper electric">
                                <h4>
                                    <i className="fa-solid fa-bolt"></i>
                                    Electricity
                                </h4>
                                <div className="amount">
                                    <input
                                        type="checkbox"
                                        checked={isElectricityChecked}
                                        onChange={handleElectricityChange}
                                    />
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper electric">
                                <h4>
                                    <i className="fa-solid fa-shower"></i>
                                    Outdoor Shower
                                </h4>
                                <div className="amount">
                                    <input
                                        type="checkbox"
                                        checked={isOutdoorShowerChecked}
                                        onChange={handleOutdoorShowerChange}
                                    />
                                </div>
                            </div>
                            <hr />
                            <div className="amountWrapper">
                                <h4>
                                    <i className="fa-solid fa-tree"></i>
                                    Additional Firewood
                                </h4>
                                <div className="amount">
                                    <button
                                        onClick={() =>
                                            additionalFirewood > 0 &&
                                            updatePrice(
                                                "additionalFirewood",
                                                -1
                                            )
                                        }
                                    >
                                        -
                                    </button>
                                    <p>{additionalFirewood}</p>
                                    <button
                                        onClick={() =>
                                            updatePrice("additionalFirewood", 1)
                                        }
                                    >
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>
                        <p className="totalPrice">
                            Total Price Per Night: <span>{totalPrice} €</span>
                        </p>
                        <div className="pricingPageBtn">
                            <button onClick={handleSubmit}>Book Now</button>
                        </div>
                    </div>
                </div>
                <PricingTable />
            </section>
        </>
    );
}

export default PricingPage;
