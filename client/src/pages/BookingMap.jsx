import React, { useState, useEffect } from "react";
import "./BookingMap.css";
import campsiteImage from "../assets/jjweb-land.png";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import toast from "react-hot-toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

dayjs.extend(customParseFormat);

const MapSelect = () => {
    const dateTimeFormat = "DD/MM/YYYY HH:mm";
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [confirmedReservations, setConfirmedReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isError, setIsError] = useState(false);
    const [errorCooldown, setErrorCooldown] = useState(false);
    const [isDateModalOpen, setIsDateModalOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/areas`
                );
                const data = await response.json();
                const sortedAreas = data.sort((a, b) => a.id - b.id);
                setAreas(sortedAreas);
            } catch (error) {
                console.error("Error fetching areas:", error);
            }
        };
        fetchAreas();
    }, []);

    useEffect(() => {
        if (isError) {
            setTimeout(() => setIsError(false), 3000);
        }
    }, [isError]);

    useEffect(() => {
        if (startDateTime && endDateTime) {
            const fetchConfirmedReservations = async () => {
                setLoading(true);
                setError("");
                try {
                    const response = await fetch(
                        `${
                            import.meta.env.VITE_BACKEND_URL
                        }/api/confirmed-reservations?startDateTime=${startDateTime}&endDateTime=${endDateTime}`
                    );
                    if (!response.ok)
                        throw new Error(`Server Error: ${response.status}`);
                    const data = await response.json();
                    setConfirmedReservations(data);
                } catch (error) {
                    console.error("Error fetching reservations:", error);
                    setError(error.message);
                } finally {
                    setLoading(false);
                }
            };
            fetchConfirmedReservations();
        }
    }, [startDateTime, endDateTime]);

    const isAreaAvailable = (areaId) => {
        if (!startDateTime || !endDateTime) return true;
        const selectedStart = dayjs(startDateTime);
        const selectedEnd = dayjs(endDateTime);
        return !confirmedReservations.some((reservation) => {
            const reservationStart = dayjs(reservation.startDateTime);
            const reservationEnd = dayjs(reservation.endDateTime);
            return (
                reservation.selectedArea === areaId &&
                selectedStart.isBefore(reservationEnd) &&
                selectedEnd.isAfter(reservationStart)
            );
        });
    };

    const handleAreaClick = (areaId) => {
        if (!startDateTime || !endDateTime) {
            if (!errorCooldown) {
                toast.error("Please select a start and end date and time.");
                setIsError(true);
                setErrorCooldown(true);
                setTimeout(() => setErrorCooldown(false), 5000);
            }
            return;
        }
        if (!isAreaAvailable(areaId)) {
            alert("This area is not available for the selected date and time.");
            return;
        }
        setSelectedArea(areaId);
        localStorage.setItem("selectedArea", areaId);
        localStorage.setItem("startDateTime", startDateTime);
        localStorage.setItem("endDateTime", endDateTime);
        navigate("/booking");
    };

    const openDateModal = () => setIsDateModalOpen(true);
    const closeDateModal = () => setIsDateModalOpen(false);

    return (
        <div className="campsite-map-container">
            <h2>Select a Campsite Area</h2>
            <div className="date-selection">
                <button onClick={openDateModal} className="mobile-date-button">
                    Select Dates
                </button>
                {isDateModalOpen && (
                    <div className="date-modal">
                        <div className="date-modal-content">
                            <label>
                                Arrival Date and Time:
                                <DatePicker
                                    format={dateTimeFormat}
                                    showTime={{ format: "HH", hourStep: 1 }}
                                    value={
                                        startDateTime
                                            ? dayjs(startDateTime)
                                            : null
                                    }
                                    onChange={(date, dateString) => {
                                        const isoDate = dayjs(
                                            dateString,
                                            dateTimeFormat
                                        ).toISOString();
                                        setStartDateTime(isoDate);
                                    }}
                                    disabledDate={(current) =>
                                        (current &&
                                            current < dayjs().startOf("day")) ||
                                        (endDateTime &&
                                            current >=
                                                dayjs(endDateTime).endOf("day"))
                                    }
                                    allowClear={false}
                                />
                            </label>
                            <label>
                                Departure Date and Time:
                                <DatePicker
                                    format={dateTimeFormat}
                                    showTime={{ format: "HH", hourStep: 1 }}
                                    value={
                                        endDateTime ? dayjs(endDateTime) : null
                                    }
                                    onChange={(date, dateString) => {
                                        const isoDate = dayjs(
                                            dateString,
                                            dateTimeFormat
                                        ).toISOString();
                                        setEndDateTime(isoDate);
                                    }}
                                    disabledDate={(current) =>
                                        (current &&
                                            current < dayjs().startOf("day")) ||
                                        (current &&
                                            startDateTime &&
                                            current <=
                                                dayjs(startDateTime).endOf(
                                                    "day"
                                                ))
                                    }
                                    allowClear={false}
                                />
                            </label>
                            <button onClick={closeDateModal}>Close</button>
                        </div>
                    </div>
                )}
            </div>
            {loading && <p>Loading availability...</p>}
            {error && <p className="error">{error}</p>}
            <TransformWrapper
                initialScale={1}
                minScale={1}
                maxScale={3}
                wheel={{ step: 0.1 }}
                doubleClick={{ disabled: true }}
                pinch={{ step: 0.1 }}
            >
                <TransformComponent>
                    <div className="map-wrapper">
                        <img
                            src={campsiteImage}
                            alt="Campsite Map"
                            className="map-image"
                        />
                        <svg
                            className="map-overlay"
                            viewBox="0 0 1764 1080"
                            preserveAspectRatio="xMidYMid meet"
                        >
                            {areas.map((area, index) => {
                                const points = area.coords
                                    .split(/[ ,]/)
                                    .map(Number);
                                let centroidX = 0,
                                    centroidY = 0;
                                for (let i = 0; i < points.length; i += 2) {
                                    centroidX += points[i];
                                    centroidY += points[i + 1];
                                }
                                centroidX /= points.length / 2;
                                centroidY /= points.length / 2;
                                const isAvailable = isAreaAvailable(area.id);
                                return (
                                    <g key={area.id}>
                                        <polygon
                                            points={area.coords}
                                            className={`area ${
                                                selectedArea === area.id
                                                    ? "highlighted"
                                                    : ""
                                            } ${
                                                !isAvailable ? "disabled" : ""
                                            }`}
                                            onClick={() =>
                                                handleAreaClick(area.id)
                                            }
                                            onMouseEnter={() =>
                                                setSelectedArea(area.id)
                                            }
                                            onMouseLeave={() =>
                                                setSelectedArea(null)
                                            }
                                        />
                                        <text
                                            x={centroidX}
                                            y={centroidY}
                                            className="area-number"
                                            textAnchor="middle"
                                            dominantBaseline="middle"
                                        >
                                            {index + 1}
                                        </text>
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                </TransformComponent>
            </TransformWrapper>
        </div>
    );
};

export default MapSelect;
