import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./AdminDashboard.css";
import { Tabs, Spin } from "antd";
import toast from "react-hot-toast";
import { AgGridReact } from "ag-grid-react";
import { ClientSideRowModelModule } from "ag-grid-community";
import { ModuleRegistry } from "ag-grid-community";
import "ag-grid-community/styles/ag-grid.css";
import "ag-grid-community/styles/ag-theme-alpine.css";

// Register the required modules
ModuleRegistry.registerModules([ClientSideRowModelModule]);

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [tempReservations, setTempReservations] = useState([]);
    const [confirmedReservations, setConfirmedReservations] = useState([]);
    const [archivedReservations, setArchivedReservations] = useState([]);
    const [loadingReservations, setLoadingReservations] = useState({});
    const [quickFilterText, setQuickFilterText] = useState(""); // For AG Grid's quick filter

    useEffect(() => {
        const token = localStorage.getItem("adminToken");
        if (!token) {
            navigate("/admin/login");
            return;
        }

        const fetchData = async () => {
            try {
                const [tempRes, confirmedRes, archivedRes] = await Promise.all([
                    fetch(
                        `${
                            import.meta.env.VITE_BACKEND_URL
                        }/api/temp-reservations`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                    fetch(
                        `${
                            import.meta.env.VITE_BACKEND_URL
                        }/api/reservations-confirmed`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                    fetch(
                        `${
                            import.meta.env.VITE_BACKEND_URL
                        }/api/archived-reservations`,
                        {
                            headers: {
                                Authorization: `Bearer ${token}`,
                            },
                        }
                    ),
                ]);

                if (
                    tempRes.status === 401 ||
                    confirmedRes.status === 401 ||
                    archivedRes.status === 401
                ) {
                    localStorage.removeItem("adminToken");
                    navigate("/admin/login");
                    return;
                }

                const tempData = await tempRes.json();
                const confirmedData = await confirmedRes.json();
                const archivedData = await archivedRes.json();

                setTempReservations(tempData);
                setConfirmedReservations(confirmedData);
                setArchivedReservations(archivedData);
            } catch (error) {
                console.error("Failed to fetch reservations:", error);
            }
        };

        fetchData();
    }, [navigate]);

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

    const tempReservationsColumns = [
        { field: "name", headerName: "Name", minWidth: 50, maxWidth: 100 },
        { field: "email", headerName: "Email", minWidth: 200 },
        { field: "phone", headerName: "Phone", minWidth: 150 },
        { field: "startDateTime", headerName: "Start Date", minWidth: 180 },
        { field: "endDateTime", headerName: "End Date", minWidth: 180 },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",
            minWidth: 50,
            maxWidth: 100,
        },
        {
            field: "actions",
            headerName: "Actions",
            minWidth: 200, // Set enough space for buttons
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
        { field: "name", headerName: "Name", minWidth: 50, maxWidth: 100 },
        { field: "email", headerName: "Email" },
        { field: "phone", headerName: "Phone" },
        { field: "startDateTime", headerName: "Start Date" },
        { field: "endDateTime", headerName: "End Date" },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",
            minWidth: 50,
            maxWidth: 150,
        },
    ];

    const archivedReservationsColumns = [
        { field: "name", headerName: "Name", minWidth: 50, maxWidth: 100 },
        { field: "email", headerName: "Email" },
        { field: "phone", headerName: "Phone" },
        { field: "startDateTime", headerName: "Start Date" },
        { field: "endDateTime", headerName: "End Date" },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",

            maxWidth: 150,
        },
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
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedTempReservations}
                        columnDefs={tempReservationsColumns}
                        quickFilterText={quickFilterText} // Enable quick filter
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                        suppressHorizontalScroll={true} // Ensure horizontal scrolling
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                            quickFilter: true,
                            minWidth: 150, // Prevent columns from collapsing too much
                        }}
                        onGridReady={(params) => params.api.sizeColumnsToFit()} // Ensure columns are properly adjusted
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
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedConfirmedReservations}
                        columnDefs={confirmedReservationsColumns}
                        quickFilterText={quickFilterText} // Enable quick filter
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                        suppressHorizontalScroll={false} // Enable horizontal scroll
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                            quickFilter: true,
                        }}
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
                            value={quickFilterText}
                            onChange={(e) => setQuickFilterText(e.target.value)}
                        />
                    </div>
                    <AgGridReact
                        rowData={formattedArchivedReservations}
                        columnDefs={archivedReservationsColumns}
                        quickFilterText={quickFilterText} // Enable quick filter
                        domLayout="autoHeight"
                        pagination={true}
                        paginationPageSize={10}
                        suppressHorizontalScroll={false} // Enable horizontal scroll
                        defaultColDef={{
                            sortable: true,
                            filter: true,
                            resizable: true,
                        }}
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
