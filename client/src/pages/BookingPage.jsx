import React, { useEffect, useState } from "react";
import "./BookingPage.css";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { LoadingOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import dayjs from "dayjs";
import validator from "validator"; // For input validation
import DOMPurify from "dompurify"; // For sanitizing HTML inputs

function BookingPage() {
    const [selectedArea, setSelectedArea] = useState(null);
    const [totalPrice, setTotalPrice] = useState(0);
    const [adults, setAdults] = useState(0);
    const [children, setChildren] = useState(0);
    const [tents, setTents] = useState(0);
    const [camperVans, setCamperVans] = useState(0);
    const [carsInTeritory, setCarsInTeritory] = useState(0);
    const [additionalFirewood, setAdditionalFirewood] = useState(0);
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [defaultPrice, setDefaultPrice] = useState(totalPrice);
    const [electricity, setElectricity] = useState(false);
    const [outdoorShower, setOutdoorShower] = useState(false);
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        lastName: "",
        phone: "",
        email: "",
        message: "",
        registrationNumber: "",
        companyName: "",
        vatNumber: "",
        bankAccount: "",
        legalAddress: "",
        postalCode: "",
        streetHouseName: "",
        houseNumber: "",
        flatNumber: "",
    });

    const [isFormSubmitted, setIsFormSubmitted] = useState(false);
    const [counter, setCounter] = useState(10);
    const [duration, setDuration] = useState(0);
    const [pricePerNight, setPricePerNight] = useState(0);
    const [paymentType, setPaymentType] = useState("cash");

    const navigate = useNavigate();

    // Retrieve dates from localStorage
    useEffect(() => {
        const savedStartDateTime = localStorage.getItem("startDateTime");
        const savedEndDateTime = localStorage.getItem("endDateTime");
        if (savedStartDateTime && savedEndDateTime) {
            setStartDateTime(savedStartDateTime);
            setEndDateTime(savedEndDateTime);
        }
    }, []);

    // Function to format ISO date to a user-friendly format
    const formatDateForDisplay = (isoDate) => {
        return dayjs(isoDate).format("DD/MM/YYYY HH:mm");
    };

    const calculateTotalPrice = () => {
        if (!startDateTime || !endDateTime) return 0;

        const start = new Date(startDateTime);
        const end = new Date(endDateTime);
        const durationInDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
        setDuration(durationInDays);

        if (durationInDays < 1) return 0;

        const total = totalPrice * durationInDays;
        setPricePerNight(totalPrice);
        return total;
    };

    const handleRedirect = () => {
        navigate("/");
    };

    useEffect(() => {
        setSelectedArea(localStorage.getItem("selectedArea") || null);
    }, []);

    useEffect(() => {
        const savedPrice = localStorage.getItem("totalPrice");
        if (savedPrice) setTotalPrice(Number(savedPrice));
        setAdults(Number(localStorage.getItem("adults")) || 0);
        setChildren(Number(localStorage.getItem("children")) || 0);
        setTents(Number(localStorage.getItem("tents")) || 0);
        setCamperVans(Number(localStorage.getItem("camperVans")) || 0);
        setCarsInTeritory(Number(localStorage.getItem("carsInTeritory")) || 0);
        setAdditionalFirewood(
            Number(localStorage.getItem("additionalFirewood")) || 0
        );
        setElectricity(localStorage.getItem("electricity") === "true");
        setOutdoorShower(localStorage.getItem("outdoorShower") === "true");
    }, []);

    useEffect(() => {
        if (startDateTime && endDateTime) {
            const price = calculateTotalPrice();
            setDefaultPrice(price);
        }
    }, [
        startDateTime,
        endDateTime,
        adults,
        children,
        tents,
        camperVans,
        carsInTeritory,
        additionalFirewood,
        electricity,
        outdoorShower,
    ]);

    useEffect(() => {
        let timer;
        if (isFormSubmitted && counter > 0) {
            timer = setInterval(() => setCounter((prev) => prev - 1), 1000);
        } else if (counter === 0) {
            navigate("/");
        }

        return () => clearInterval(timer);
    }, [isFormSubmitted, counter, navigate]);

    const handlePaymentTypeChange = (event) => {
        setPaymentType(event.target.value);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    // Validate and sanitize inputs before submission
    const validateAndSanitizeInputs = () => {
        const {
            name,
            lastName,
            phone,
            email,
            message,
            registrationNumber,
            companyName,
            vatNumber,
            bankAccount,
            legalAddress,
            postalCode,
            streetHouseName,
            houseNumber,
            flatNumber,
        } = formData;

        // Validate required fields
        if (!name || !lastName || !phone || !email) {
            throw new Error("All required fields must be filled.");
        }

        // Validate email
        if (!validator.isEmail(email)) {
            throw new Error("Invalid email address.");
        }

        // Validate phone number
        if (!validator.isMobilePhone(phone, "any")) {
            throw new Error("Invalid phone number.");
        }

        // Sanitize all text inputs
        const sanitizedData = {
            name: DOMPurify.sanitize(name),
            lastName: DOMPurify.sanitize(lastName),
            phone: DOMPurify.sanitize(phone),
            email: DOMPurify.sanitize(email),
            message: DOMPurify.sanitize(message),
            registrationNumber: DOMPurify.sanitize(registrationNumber),
            companyName: DOMPurify.sanitize(companyName),
            vatNumber: DOMPurify.sanitize(vatNumber),
            bankAccount: DOMPurify.sanitize(bankAccount),
            legalAddress: DOMPurify.sanitize(legalAddress),
            postalCode: DOMPurify.sanitize(postalCode),
            streetHouseName: DOMPurify.sanitize(streetHouseName),
            houseNumber: DOMPurify.sanitize(houseNumber),
            flatNumber: DOMPurify.sanitize(flatNumber),
        };

        return sanitizedData;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        window.scrollTo(0, 0);

        try {
            // Validate and sanitize inputs
            const sanitizedData = validateAndSanitizeInputs();

            const finalFormData = {
                ...sanitizedData,
                startDateTime,
                endDateTime,
                adults,
                children,
                tents,
                camperVans,
                carsInTeritory,
                electricity,
                outdoorShower,
                additionalFirewood,
                totalPrice: calculateTotalPrice(),
                pricePerNight,
                duration,
                selectedArea,
                paymentType,
            };

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/send-email`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(finalFormData),
                }
            );

            if (!response.ok) {
                throw new Error("Error submitting form.");
            }

            toast.success("Your form was submitted successfully!");
            setIsFormSubmitted(true);
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChangeDatesAreaButton = () => {
        localStorage.clear();
        setStartDateTime(null);
        setEndDateTime(null);
        setAdults(0);
        setChildren(0);
        setTents(0);
        setCamperVans(0);
        setCarsInTeritory(0);
        setAdditionalFirewood(0);
        setElectricity(false);
        setOutdoorShower(false);
        setSelectedArea(null);
        navigate("/booking-map");
    };

    const handleChangeButton = () => {
        navigate("/booking");
    };

    return (
        <div className="contact-page">
            {!isFormSubmitted ? (
                <form onSubmit={handleSubmit}>
                    <div className="contact-form-wrapper">
                        {loading ? (
                            <div className="loading-overlay">
                                <Spin
                                    size="large"
                                    indicator={
                                        <LoadingOutlined
                                            spin
                                            style={{
                                                fontSize: 48,
                                                color: "#1b1b1b",
                                            }}
                                        />
                                    }
                                />
                            </div>
                        ) : (
                            <>
                                <h1>Booking</h1>
                                <div className="contact-form-left-right-wrapper">
                                    <div className="contact-form-left">
                                        {/* Display formatted dates */}
                                        <div className="selected-dates">
                                            <p>
                                                <strong>Start Date:</strong>{" "}
                                                {startDateTime
                                                    ? formatDateForDisplay(
                                                          startDateTime
                                                      )
                                                    : "N/A"}
                                            </p>
                                            <p>
                                                <strong>End Date:</strong>{" "}
                                                {endDateTime
                                                    ? formatDateForDisplay(
                                                          endDateTime
                                                      )
                                                    : "N/A"}
                                            </p>
                                            <p>
                                                <strong>Selected area:</strong>{" "}
                                                {selectedArea}
                                            </p>

                                            <button
                                                className="change-dates-area-btn"
                                                onClick={
                                                    handleChangeDatesAreaButton
                                                }
                                            >
                                                Change dates or area
                                            </button>
                                        </div>

                                        <div className="type-of-payment">
                                            <h3>Type of payment:</h3>

                                            <div className="type-of-payment-radio">
                                                <label htmlFor="cash">
                                                    Cash{" "}
                                                    <i>
                                                        (no more than 5 minimal
                                                        wages)
                                                    </i>
                                                    :
                                                </label>
                                                <input
                                                    type="radio"
                                                    name="paymentType"
                                                    id="cash"
                                                    value="cash"
                                                    checked={
                                                        paymentType === "cash"
                                                    } // Updated to use paymentType
                                                    onChange={
                                                        handlePaymentTypeChange
                                                    }
                                                />
                                            </div>

                                            <div className="type-of-payment-radio">
                                                <label htmlFor="invoice">
                                                    Invoice:
                                                </label>
                                                <input
                                                    type="radio"
                                                    name="paymentType"
                                                    id="invoice"
                                                    value="invoice"
                                                    checked={
                                                        paymentType ===
                                                        "invoice"
                                                    }
                                                    onChange={
                                                        handlePaymentTypeChange
                                                    }
                                                />
                                            </div>

                                            <div className="type-of-payment-radio">
                                                <label htmlFor="legalEntity">
                                                    Pay as a Legal Entity:
                                                </label>
                                                <input
                                                    type="radio"
                                                    name="paymentType"
                                                    id="legalEntity"
                                                    value="legalEntity"
                                                    checked={
                                                        paymentType ===
                                                        "legalEntity"
                                                    }
                                                    onChange={
                                                        handlePaymentTypeChange
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                required
                                                placeholder=" "
                                                value={formData.name}
                                                onChange={handleChange}
                                                maxLength={30}
                                                onKeyDown={(e) => {
                                                    if (
                                                        !/^[a-zA-ZÀ-ž]$/.test(
                                                            e.key
                                                        ) &&
                                                        e.key !== "Backspace" &&
                                                        e.key !== " "
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <span className="floating-placeholder">
                                                Name<span> *</span>
                                            </span>
                                        </div>

                                        <div className="input-container">
                                            <input
                                                type="text"
                                                id="lastName"
                                                name="lastName"
                                                required
                                                placeholder=" "
                                                value={formData.lastName}
                                                onChange={handleChange}
                                                maxLength={30}
                                                onKeyDown={(e) => {
                                                    if (
                                                        !/^[a-zA-ZÀ-ž]$/.test(
                                                            e.key
                                                        ) &&
                                                        e.key !== "Backspace" &&
                                                        e.key !== " "
                                                    ) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                            />
                                            <span className="floating-placeholder">
                                                Last Name<span> *</span>
                                            </span>
                                        </div>

                                        <div className="input-container">
                                            <input
                                                type="tel"
                                                id="phone"
                                                name="phone"
                                                required
                                                placeholder=" "
                                                value={formData.phone}
                                                onChange={handleChange}
                                                maxLength={12}
                                                onKeyDown={(e) => {
                                                    const { value } = e.target;

                                                    if (
                                                        /^\d$/.test(e.key) ||
                                                        [
                                                            "Backspace",
                                                            "Delete",
                                                            "ArrowLeft",
                                                            "ArrowRight",
                                                            "Tab",
                                                        ].includes(e.key)
                                                    ) {
                                                        return;
                                                    }

                                                    if (
                                                        e.key === "+" &&
                                                        value.length === 0
                                                    ) {
                                                        return;
                                                    }

                                                    e.preventDefault();
                                                }}
                                            />
                                            <span className="floating-placeholder">
                                                Phone<span> *</span>
                                            </span>
                                        </div>

                                        <div className="input-container">
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                required
                                                placeholder=" "
                                                value={formData.email}
                                                onChange={handleChange}
                                                maxLength={50}
                                            />
                                            <span className="floating-placeholder">
                                                Email Address<span> *</span>
                                            </span>
                                        </div>
                                        {paymentType === "legalEntity" && (
                                            <div className="legal-entity">
                                                <h3>
                                                    Information about company
                                                </h3>
                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="registrationNumber"
                                                        name="registrationNumber"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.registrationNumber
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={11}
                                                        onKeyDown={(e) => {
                                                            const { value } =
                                                                e.target;

                                                            if (
                                                                /^\d$/.test(
                                                                    e.key
                                                                ) ||
                                                                [
                                                                    "Backspace",
                                                                    "Delete",
                                                                    "ArrowLeft",
                                                                    "ArrowRight",
                                                                    "Tab",
                                                                ].includes(
                                                                    e.key
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            e.preventDefault();
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Registration number
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="companyName"
                                                        name="companyName"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.companyName
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={50}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                !/^[a-zA-ZÀ-ž]$/.test(
                                                                    e.key
                                                                ) &&
                                                                e.key !==
                                                                    "Backspace" &&
                                                                e.key !== " "
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Company name
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="vatNumber"
                                                        name="vatNumber"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.vatNumber
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={30}
                                                        onKeyDown={(e) => {
                                                            const { value } =
                                                                e.target;

                                                            if (
                                                                /^\d$/.test(
                                                                    e.key
                                                                ) ||
                                                                [
                                                                    "Backspace",
                                                                    "Delete",
                                                                    "ArrowLeft",
                                                                    "ArrowRight",
                                                                    "Tab",
                                                                ].includes(
                                                                    e.key
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            e.preventDefault();
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        VAT number
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="bankAccount"
                                                        name="bankAccount"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.bankAccount
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={30}
                                                        onKeyDown={(e) => {
                                                            const { value } =
                                                                e.target;

                                                            if (
                                                                /^\d$/.test(
                                                                    e.key
                                                                ) ||
                                                                [
                                                                    "Backspace",
                                                                    "Delete",
                                                                    "ArrowLeft",
                                                                    "ArrowRight",
                                                                    "Tab",
                                                                ].includes(
                                                                    e.key
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            e.preventDefault();
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Bank Account
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <h3>Legal Address</h3>
                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="legalAddress"
                                                        name="legalAddress"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.legalAddress
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={30}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                !/^[a-zA-ZÀ-ž]$/.test(
                                                                    e.key
                                                                ) &&
                                                                e.key !==
                                                                    "Backspace" &&
                                                                e.key !== " "
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        City / County / Parish /
                                                        Village<span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="postalCode"
                                                        name="postalCode"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.postalCode
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={10}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Postal Code
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="streetHouseName"
                                                        name="streetHouseName"
                                                        required
                                                        placeholder=" "
                                                        value={
                                                            formData.streetHouseName
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={30}
                                                        onKeyDown={(e) => {
                                                            if (
                                                                !/^[a-zA-ZÀ-ž]$/.test(
                                                                    e.key
                                                                ) &&
                                                                e.key !==
                                                                    "Backspace" &&
                                                                e.key !== " "
                                                            ) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Street / House name
                                                        <span> *</span>
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="houseNumber"
                                                        name="houseNumber"
                                                        placeholder=" "
                                                        value={
                                                            formData.houseNumber
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={10}
                                                        onKeyDown={(e) => {
                                                            const { value } =
                                                                e.target;

                                                            if (
                                                                /^\d$/.test(
                                                                    e.key
                                                                ) ||
                                                                [
                                                                    "Backspace",
                                                                    "Delete",
                                                                    "ArrowLeft",
                                                                    "ArrowRight",
                                                                    "Tab",
                                                                ].includes(
                                                                    e.key
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            e.preventDefault();
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        House number
                                                    </span>
                                                </div>

                                                <div className="input-container">
                                                    <input
                                                        type="text"
                                                        id="flatNumber"
                                                        name="flatNumber"
                                                        placeholder=" "
                                                        value={
                                                            formData.flatNumber
                                                        }
                                                        onChange={handleChange}
                                                        maxLength={10}
                                                        onKeyDown={(e) => {
                                                            const { value } =
                                                                e.target;

                                                            if (
                                                                /^\d$/.test(
                                                                    e.key
                                                                ) ||
                                                                [
                                                                    "Backspace",
                                                                    "Delete",
                                                                    "ArrowLeft",
                                                                    "ArrowRight",
                                                                    "Tab",
                                                                ].includes(
                                                                    e.key
                                                                )
                                                            ) {
                                                                return;
                                                            }

                                                            e.preventDefault();
                                                        }}
                                                    />
                                                    <span className="floating-placeholder">
                                                        Flat number
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                        <div className="input-container">
                                            <textarea
                                                id="message"
                                                name="message"
                                                placeholder=" "
                                                value={formData.message}
                                                onChange={handleChange}
                                                maxLength={500}
                                            ></textarea>
                                            <span className="floating-placeholder-textarea">
                                                Message
                                            </span>
                                        </div>
                                    </div>

                                    <div className="contact-form-right">
                                        <label htmlFor="adults">Adults:</label>
                                        <input
                                            type="number"
                                            id="adults"
                                            name="adults"
                                            value={adults}
                                            readOnly
                                        />
                                        <label htmlFor="children">
                                            Children:
                                        </label>
                                        <input
                                            type="number"
                                            id="children"
                                            name="children"
                                            value={children}
                                            readOnly
                                        />
                                        <label htmlFor="tents">Tents:</label>
                                        <input
                                            type="number"
                                            id="tents"
                                            name="tents"
                                            value={tents}
                                            readOnly
                                        />
                                        <label htmlFor="camperVans">
                                            Camper Vans:
                                        </label>
                                        <input
                                            type="number"
                                            id="camperVans"
                                            name="camperVans"
                                            value={camperVans}
                                            readOnly
                                        />
                                        <label htmlFor="carsInTeritory">
                                            Cars in Teritory:
                                        </label>
                                        <input
                                            type="number"
                                            id="carsInTeritory"
                                            name="carsInTeritory"
                                            value={carsInTeritory}
                                            readOnly
                                        />
                                        <label htmlFor="electricity">
                                            Electricity:
                                        </label>
                                        <input
                                            type="text"
                                            id="electricity"
                                            name="electricity"
                                            value={electricity ? "Yes" : "No"}
                                            readOnly
                                        />
                                        <label htmlFor="outdoorShower">
                                            Outdoor Shower:
                                        </label>
                                        <input
                                            type="text"
                                            id="outdoorShower"
                                            name="outdoorShower"
                                            value={outdoorShower ? "Yes" : "No"}
                                            readOnly
                                        />
                                        <label htmlFor="additionalFirewood">
                                            Additional Firewood:
                                        </label>
                                        <input
                                            type="number"
                                            id="additionalFirewood"
                                            name="additionalFirewood"
                                            value={additionalFirewood}
                                            readOnly
                                        />
                                        <label htmlFor="totalPrice">
                                            Total Price:
                                        </label>
                                        <input
                                            type="text"
                                            id="totalPrice"
                                            name="totalPrice"
                                            value={`${
                                                defaultPrice || totalPrice
                                            }.00 €`}
                                            readOnly
                                        />
                                        <button
                                            className="change-button"
                                            onClick={handleChangeButton}
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>

                                <div className="contact-form-btn">
                                    <button type="submit" disabled={loading}>
                                        {loading ? "Submitting..." : "Submit"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </form>
            ) : (
                <div className="success-message">
                    <h1>Success!</h1>
                    <p>Your form has been successfully submitted.</p>
                    <p>Redirecting to home in {counter} seconds...</p>
                    <button onClick={handleRedirect}>
                        <i class="fa-solid fa-arrow-left"></i> Back to Home
                    </button>
                </div>
            )}
        </div>
    );
}

export default BookingPage;
