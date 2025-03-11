import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./AdminDashboard.css";
import { Tabs, Spin } from "antd";
import toast from "react-hot-toast";
import { AgGridReact } from "ag-grid-react";
import { ClientSideRowModelModule } from "ag-grid-community"; // Import the required module
import { ModuleRegistry } from "ag-grid-community"; // Import ModuleRegistry
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register the required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [tempReservations, setTempReservations] = useState([]);
    const [confirmedReservations, setConfirmedReservations] = useState([]);
    const [searchText, setSearchText] = useState("");
    const [archivedReservations, setArchivedReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState({});

    useEffect(() => {
        const fetchTemporaryReservations = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/temp-reservations`
                );
                const data = await response.json();
                console.log("Fetched temporary reservations:", data);
                setTempReservations(data);
            } catch (error) {
                console.error("Failed to fetch temporary reservations:", error);
            }
        };

        const fetchConfirmedReservations = async () => {
            try {
                const response = await fetch(
                    `${
                        import.meta.env.VITE_BACKEND_URL
                    }/api/reservations-confirmed`
                );
                const data = await response.json();
                console.log("Fetched confirmed reservations:", data);
                setConfirmedReservations(data);
            } catch (error) {
                console.error("Failed to fetch confirmed reservations:", error);
            }
        };

        const fetchArchivedReservations = async () => {
            try {
                const response = await fetch(
                    `${
                        import.meta.env.VITE_BACKEND_URL
                    }/api/archived-reservations`
                );
                const data = await response.json();
                console.log("Fetched archived reservations:", data);
                setArchivedReservations(data);
            } catch (error) {
                console.error("Failed to fetch archived reservations:", error);
            }
        };

        fetchArchivedReservations();
        fetchTemporaryReservations();
        fetchConfirmedReservations();
    }, []);

    const checkForOverlap = (newReservation, confirmedReservations) => {
        const newStart = new Date(newReservation.startDateTime);
        const newEnd = new Date(newReservation.endDateTime);

        return confirmedReservations.some((res) => {
            if (res.selectedArea === newReservation.selectedArea) {
                const existingStart = new Date(res.startDateTime);
                const existingEnd = new Date(res.endDateTime);

                return (
                    (newStart >= existingStart && newStart < existingEnd) ||
                    (newEnd > existingStart && newEnd <= existingEnd) ||
                    (newStart <= existingStart && newEnd >= existingEnd)
                );
            }
            return false;
        });
    };

    const handleConfirm = async (id) => {
        try {
            setLoadingReservations((prev) => ({ ...prev, [id]: true }));
            const reservationToConfirm = tempReservations.find(
                (res) => res._id === id
            );

            if (!reservationToConfirm) {
                throw new Error("Reservation not found.");
            }

            const isOverlap = checkForOverlap(
                reservationToConfirm,
                confirmedReservations
            );

            if (isOverlap) {
                toast.error(
                    "This reservation overlaps with an existing confirmed reservation for the same area."
                );
                return;
            }

            const confirmResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/confirm-reservation/${id}`,
                { method: "POST" }
            );

            if (!confirmResponse.ok) {
                throw new Error("Failed to confirm reservation.");
            }

            const confirmedReservationResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/confirmed-reservations/${id}`
            );
            const confirmedReservationData =
                await confirmedReservationResponse.json();

            if (!confirmedReservationData) {
                throw new Error("Confirmed reservation not found.");
            }

            if (confirmedReservationData.paymentType === "invoice") {
                const pdfResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/send-pdf/${id}`,
                    { method: "POST" }
                );

                if (!pdfResponse.ok) {
                    throw new Error("Failed to send PDF.");
                }
            }

            if (confirmedReservationData.paymentType === "legalEntity") {
                const pdfResponse = await fetch(
                    `${
                        import.meta.env.VITE_BACKEND_URL
                    }/api/send-pdf-legal/${id}`,
                    { method: "POST" }
                );

                if (!pdfResponse.ok) {
                    throw new Error("Failed to send PDF.");
                }
            }

            const confirmedReservationsResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/reservations-confirmed`
            );
            const confirmedReservationsData =
                await confirmedReservationsResponse.json();
            setConfirmedReservations(confirmedReservationsData);

            setTempReservations((prevReservations) =>
                prevReservations.filter((res) => res._id !== id)
            );
            toast.success("Reservation confirmed successfully!");
        } catch (error) {
            console.error("Error confirming reservation:", error);
            toast.error("An error occurred while confirming the reservation.");
        } finally {
            setLoadingReservations((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleDecline = async (id) => {
        try {
            setLoadingReservations((prev) => ({ ...prev, [id]: true }));
            const sendEmailResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/send-decline-email/${id}`,
                { method: "POST" }
            );

            const deleteResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/delete-temp-reservation/${id}`,
                { method: "DELETE" }
            );

            if (!deleteResponse.ok) {
                throw new Error("Failed to delete reservation.");
            }

            setTempReservations((prevReservations) =>
                prevReservations.filter((res) => res._id !== id)
            );

            toast.success("Reservation declined successfully!");
        } catch (error) {
            console.error("Error declining reservation:", error);
            toast.error("An error occurred while declining the reservation.");
        } finally {
            setLoadingReservations((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    const formatDateForDisplay = (isoDate) => {
        if (!isoDate) return "N/A";
        return dayjs(isoDate).format("DD/MM/YYYY HH:mm");
    };

    const formatReservations = (reservations) => {
        return reservations.map((res) => ({
            ...res,
            startDateTime: formatDateForDisplay(res.startDateTime),
            endDateTime: formatDateForDisplay(res.endDateTime),
        }));
    };

    const formattedTempReservations = formatReservations(tempReservations);
    const formattedConfirmedReservations = formatReservations(
        confirmedReservations
    );
    const formattedArchivedReservations =
        formatReservations(archivedReservations);

    // AG Grid Column Definitions
    const tempReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1 },
        { field: "phone", headerName: "Phone", flex: 1 },
        { field: "startDateTime", headerName: "Start Date", flex: 1 },
        { field: "endDateTime", headerName: "End Date", flex: 1 },
        { field: "totalPrice", headerName: "Total Price (€)", flex: 1 },
        {
            field: "actions",
            headerName: "Actions",
            cellRenderer: (params) => {
                const isLoading = loadingReservations[params.data._id] || false;

                return isLoading ? (
                    <Spin size="small" />
                ) : (
                    <>
                        <button
                            className="confirm-button"
                            onClick={() => handleConfirm(params.data._id)}
                        >
                            Confirm
                        </button>
                        <button
                            className="decline-button"
                            onClick={() => handleDecline(params.data._id)}
                        >
                            Decline
                        </button>
                    </>
                );
            },
        },
    ];

    const confirmedReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1 },
        { field: "phone", headerName: "Phone", flex: 1 },
        { field: "startDateTime", headerName: "Start Date", flex: 1 },
        { field: "endDateTime", headerName: "End Date", flex: 1 },
        { field: "totalPrice", headerName: "Total Price (€)", flex: 1 },
    ];

    const archivedReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1 },
        { field: "email", headerName: "Email", flex: 1 },
        { field: "phone", headerName: "Phone", flex: 1 },
        { field: "startDateTime", headerName: "Start Date", flex: 1 },
        { field: "endDateTime", headerName: "End Date", flex: 1 },
        { field: "totalPrice", headerName: "Total Price (€)", flex: 1 },
    ];

    const items = [
        {
            key: "1",
            label: "Temporary Reservations",
            children: (
                <div className="data-grid-container ag-theme-alpine">
                    <h2>Temporary Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedTempReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columnDefs={tempReservationsColumns}
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                        rowSelection="single"
                        onRowClicked={(event) => console.log(event.data)}
                    />
                </div>
            ),
        },
        {
            key: "2",
            label: "Confirmed Reservations",
            children: (
                <div className="data-grid-container ag-theme-alpine">
                    <h2>Confirmed Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedConfirmedReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columnDefs={confirmedReservationsColumns}
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                    />
                </div>
            ),
        },
        {
            key: "3",
            label: "Archived Reservations",
            children: (
                <div className="data-grid-container ag-theme-alpine">
                    <h2>Archived Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedArchivedReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columnDefs={archivedReservationsColumns}
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                    />
                </div>
            ),
        },
    ];

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <button className="logout-button" onClick={handleLogout}>
                Logout
            </button>

            <Tabs defaultActiveKey="1" items={items} />
        </div>
    );
};

export default AdminDashboard;
