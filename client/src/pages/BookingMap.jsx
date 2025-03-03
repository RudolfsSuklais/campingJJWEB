import React, { useState, useEffect } from "react";
import "./BookingMap.css";
import campsiteImage from "../assets/jjweb-land.png";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import customParseFormat from "dayjs/plugin/customParseFormat";
import toast from "react-hot-toast";

dayjs.extend(customParseFormat);

const MapSelect = () => {
    const dateTimeFormat = "DD/MM/YYYY HH:mm";
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [scale, setScale] = useState(1);
    const [startDateTime, setStartDateTime] = useState(null);
    const [endDateTime, setEndDateTime] = useState(null);
    const [confirmedReservations, setConfirmedReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isError, setIsError] = useState(false);
    const [errorCooldown, setErrorCooldown] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchAreas = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/areas");
                const data = await response.json();
                // Sort areas by id or any other property
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
            setTimeout(() => {
                setIsError(false);
            }, 3000);
        }
    }, [isError]);

    useEffect(() => {
        if (startDateTime && endDateTime) {
            const fetchConfirmedReservations = async () => {
                setLoading(true);
                setError("");
                try {
                    const response = await fetch(
                        `http://localhost:5000/api/confirmed-reservations?startDateTime=${startDateTime}&endDateTime=${endDateTime}`
                    );

                    if (!response.ok) {
                        throw new Error(`Server Error: ${response.status}`);
                    }

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

    useEffect(() => {
        const updateScale = () => {
            const zoomLevel = window.visualViewport?.scale || 1;
            setScale(1 / zoomLevel);
        };
        window.addEventListener("resize", updateScale);
        window.visualViewport?.addEventListener("resize", updateScale);
        return () => {
            window.removeEventListener("resize", updateScale);
            window.visualViewport?.removeEventListener("resize", updateScale);
        };
    }, []);

    return (
        <div className="campsite-map-container">
            <h2>Select a Campsite Area</h2>
            <div className="date-selection">
                <label>
                    Arrival Date and Time:
                    <DatePicker
                        format={dateTimeFormat}
                        showTime={{
                            format: "HH", // Only show hours
                            hourStep: 1, // Allow selection of hours in steps of 1
                        }}
                        value={startDateTime ? dayjs(startDateTime) : null}
                        onChange={(date, dateString) => {
                            // Convert the selected date to ISO format
                            const isoDate = dayjs(
                                dateString,
                                dateTimeFormat
                            ).toISOString();
                            setStartDateTime(isoDate);
                        }}
                        disabledDate={(current) =>
                            (current && current < dayjs().startOf("day")) ||
                            (endDateTime &&
                                current >= dayjs(endDateTime).endOf("day"))
                        }
                        allowClear={false}
                    />
                </label>
                <label>
                    Departure Date and Time:
                    <DatePicker
                        format={dateTimeFormat}
                        showTime={{
                            format: "HH", // Only show hours
                            hourStep: 1, // Allow selection of hours in steps of 1
                        }}
                        value={endDateTime ? dayjs(endDateTime) : null}
                        onChange={(date, dateString) => {
                            // Convert the selected date to ISO format
                            const isoDate = dayjs(
                                dateString,
                                dateTimeFormat
                            ).toISOString();
                            setEndDateTime(isoDate);
                        }}
                        disabledDate={
                            (current) =>
                                (current && current < dayjs().startOf("day")) || // Disable past dates
                                (current &&
                                    startDateTime &&
                                    current <=
                                        dayjs(startDateTime).endOf("day")) // Disable start date and earlier
                        }
                        allowClear={false}
                    />
                </label>
            </div>
            {loading && <p>Loading availability...</p>}
            {error && <p className="error">{error}</p>}
            <div
                className="map-wrapper"
                style={{ transform: `scale(${scale})` }}
            >
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
                        const points = area.coords.split(/[ ,]/).map(Number);
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
                                    } ${!isAvailable ? "disabled" : ""}`}
                                    onClick={() => handleAreaClick(area.id)}
                                    onMouseEnter={() =>
                                        setSelectedArea(area.id)
                                    }
                                    onMouseLeave={() => setSelectedArea(null)}
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
        </div>
    );
};

export default MapSelect;
