import React, { useState, useEffect } from "react";
import "./BookingMap.css";
import campsiteImage from "../assets/jjweb-land.png";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { MobileDateTimePicker } from "@mui/x-date-pickers/MobileDateTimePicker";
import { useMediaQuery } from "@mui/material";
import toast from "react-hot-toast";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

dayjs.extend(customParseFormat);

const BookingMap = () => {
    const dateTimeFormat = "DD/MM/YYYY HH:mm";
    const [areas, setAreas] = useState([]);
    const [selectedArea, setSelectedArea] = useState(null);
    const [startDateTime, setStartDateTime] = useState(
        localStorage.getItem("startDateTime") || null
    );
    const [endDateTime, setEndDateTime] = useState(
        localStorage.getItem("endDateTime") || null
    );
    const [confirmedReservations, setConfirmedReservations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isError, setIsError] = useState(false);
    const [errorCooldown, setErrorCooldown] = useState(false);

    const navigate = useNavigate();
    const isMobile = useMediaQuery("(max-width:600px)");

    // Fetch areas
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

    // Handle errors
    useEffect(() => {
        if (isError) {
            setTimeout(() => setIsError(false), 3000);
        }
    }, [isError]);

    // Fetch confirmed reservations
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

    // Check if an area is available
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

    // Handle area click
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

    // Handle start date change
    const handleStartDateChange = (date) => {
        const isoDate = date.toISOString();
        setStartDateTime(isoDate);

        // Reset end date if start date is after end date
        if (endDateTime && dayjs(isoDate).isAfter(dayjs(endDateTime))) {
            setEndDateTime(null);
        }
    };

    // Handle end date change
    const handleEndDateChange = (date) => {
        const isoDate = date.toISOString();
        setEndDateTime(isoDate);
    };

    // Disabled dates and times logic
    const today = dayjs().startOf("day");
    const oneYearFromToday = today.add(1, "year");

    // Min time for start date: current time + 2 hours
    const minStartTime = dayjs().add(2, "hour");

    return (
        <div className="campsite-map-container">
            <h2>Select a Campsite Area</h2>
            <div className="date-selection">
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <label>
                        Arrival Date and Time:
                        {isMobile ? (
                            <MobileDateTimePicker
                                format={dateTimeFormat}
                                value={
                                    startDateTime ? dayjs(startDateTime) : null
                                }
                                onChange={handleStartDateChange}
                                minDate={today} // Min date: today
                                maxDate={oneYearFromToday} // Max date: 1 year from today
                                timeSteps={{ hour: 1, minutes: 0 }} // Restrict to hours only
                                views={["year", "month", "day", "hours"]} // Show only hours in the time picker
                                ampm={false} // Use 24-hour format
                            />
                        ) : (
                            <DateTimePicker
                                format={dateTimeFormat}
                                value={
                                    startDateTime ? dayjs(startDateTime) : null
                                }
                                onChange={handleStartDateChange}
                                minDate={today} // Min date: today
                                maxDate={oneYearFromToday} // Max date: 1 year from today
                                timeSteps={{ hour: 1, minutes: 0 }} // Restrict to hours only
                                views={["year", "month", "day", "hours"]} // Show only hours in the time picker
                                ampm={false} // Use 24-hour format
                            />
                        )}
                    </label>
                    <label>
                        Departure Date and Time:
                        {isMobile ? (
                            <MobileDateTimePicker
                                format={dateTimeFormat}
                                value={endDateTime ? dayjs(endDateTime) : null}
                                onChange={handleEndDateChange}
                                minDate={
                                    startDateTime
                                        ? dayjs(startDateTime).add(1, "day") // Min date: start date + 1 day
                                        : today
                                }
                                maxDate={oneYearFromToday} // Max date: 1 year from today
                                timeSteps={{ hour: 1, minutes: 0 }} // Restrict to hours only
                                views={["year", "month", "day", "hours"]} // Show only hours in the time picker
                                ampm={false} // Use 24-hour format
                            />
                        ) : (
                            <DateTimePicker
                                format={dateTimeFormat}
                                value={endDateTime ? dayjs(endDateTime) : null}
                                onChange={handleEndDateChange}
                                minDate={
                                    startDateTime
                                        ? dayjs(startDateTime).add(1, "day") // Min date: start date + 1 day
                                        : today
                                }
                                maxDate={oneYearFromToday} // Max date: 1 year from today
                                timeSteps={{ hour: 1, minutes: 0 }} // Restrict to hours only
                                views={["year", "month", "day", "hours"]} // Show only hours in the time picker
                                ampm={false} // Use 24-hour format
                            />
                        )}
                    </label>
                </LocalizationProvider>
            </div>
            {loading && <p>Loading availability...</p>}
            {error && <p className="error">{error}</p>}
            <TransformWrapper>
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
                            preserveAspectRatio="xMidYMid meet">
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
                                            dominantBaseline="middle">
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

export default BookingMap;
