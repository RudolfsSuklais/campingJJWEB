import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import "./AdminDashboard.css";
import { Tabs, Spin } from "antd";
import toast from "react-hot-toast";

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

        console.log(import.meta.env.VITE_BACKEND_URL);

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
            const existingStart = new Date(res.startDateTime);
            const existingEnd = new Date(res.endDateTime);

            return (
                (newStart >= existingStart && newStart < existingEnd) ||
                (newEnd > existingStart && newEnd <= existingEnd) ||
                (newStart <= existingStart && newEnd >= existingEnd)
            );
        });
    };

    const handleConfirm = async (id) => {
        try {
            // Set loading state for this reservation
            setLoadingReservations((prev) => ({ ...prev, [id]: true }));

            // Find the reservation to confirm
            const reservationToConfirm = tempReservations.find(
                (res) => res._id === id
            );

            if (!reservationToConfirm) {
                throw new Error("Reservation not found.");
            }

            // Check for overlapping dates
            const isOverlap = checkForOverlap(
                reservationToConfirm,
                confirmedReservations
            );

            if (isOverlap) {
                toast.error(
                    "This reservation overlaps with an existing confirmed reservation."
                );
                return;
            }

            // Step 1: Confirm the reservation
            const confirmResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/confirm-reservation/${id}`,
                { method: "POST" }
            );

            if (!confirmResponse.ok) {
                throw new Error("Failed to confirm reservation.");
            }

            // Step 2: Fetch the confirmed reservation to check the payment type
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

            console.log("payment type: ", confirmedReservationData.paymentType);

            // Step 3: If payment type is "invoice", send the PDF
            if (confirmedReservationData.paymentType === "invoice") {
                console.log("Sending PDF for reservation with ID:", id);
                const pdfResponse = await fetch(
                    `${import.meta.env.VITE_BACKEND_URL}/api/send-pdf/${id}`,
                    { method: "POST" }
                );

                if (!pdfResponse.ok) {
                    throw new Error("Failed to send PDF.");
                }
            }

            if (confirmedReservationData.paymentType === "legalEntity") {
                console.log("Sending PDF for reservation with ID:", id);
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

            // Step 4: Update the state
            const confirmedReservationsResponse = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/reservations-confirmed`
            );
            const confirmedReservationsData =
                await confirmedReservationsResponse.json();
            setConfirmedReservations(confirmedReservationsData);

            // Step 5: Remove the reservation from the temporary reservations list
            setTempReservations((prevReservations) =>
                prevReservations.filter((res) => res._id !== id)
            );
            toast.success("Reservation confirmed successfully!");
        } catch (error) {
            console.error("Error confirming reservation:", error);
            toast.error("An error occurred while confirming the reservation.");
        } finally {
            // Reset loading state for this reservation
            setLoadingReservations((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleDecline = async (id) => {
        try {
            // Set loading state for this reservation
            setLoadingReservations((prev) => ({ ...prev, [id]: true }));
            const sendEmailResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/send-decline-email/${id}`,
                { method: "POST" }
            );

            // Delete the reservation from the temporary reservations list
            const deleteResponse = await fetch(
                `${
                    import.meta.env.VITE_BACKEND_URL
                }/api/delete-temp-reservation/${id}`,
                { method: "DELETE" }
            );

            if (!deleteResponse.ok) {
                throw new Error("Failed to delete reservation.");
            }

            // Update the state
            setTempReservations((prevReservations) =>
                prevReservations.filter((res) => res._id !== id)
            );

            toast.success("Reservation declined successfully!");
        } catch (error) {
            console.error("Error declining reservation:", error);
            toast.error("An error occurred while declining the reservation.");
        } finally {
            // Reset loading state for this reservation
            setLoadingReservations((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("adminToken");
        navigate("/admin/login");
    };

    const formatDateForDisplay = (isoDate) => {
        if (!isoDate) return "N/A"; // Handle missing or invalid dates
        return dayjs(isoDate).format("DD/MM/YYYY HH:mm");
    };

    // Format the dates in the data before passing it to the DataGrid
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

    // Columns for Temporary Reservations (includes Confirm button)
    const tempReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1, minWidth: 100 },
        { field: "email", headerName: "Email", flex: 1, minWidth: 150 },
        { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
        {
            field: "startDateTime",
            headerName: "Start Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "endDateTime",
            headerName: "End Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",
            flex: 1,
            minWidth: 120,
        },
        {
            field: "actions",
            headerName: "Actions",
            flex: 1,
            minWidth: 120,
            renderCell: (params) => {
                const isLoading = loadingReservations[params.row._id] || false;

                return isLoading ? (
                    <Spin size="small" />
                ) : (
                    <>
                        <button
                            className="confirm-button"
                            onClick={() => handleConfirm(params.row._id)}
                        >
                            Confirm
                        </button>
                        <button
                            className="decline-button"
                            onClick={() => handleDecline(params.row._id)}
                        >
                            Decline
                        </button>
                    </>
                );
            },
        },
    ];

    // Columns for Confirmed Reservations (excludes Confirm button)
    const confirmedReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
        { field: "email", headerName: "Email", flex: 1, minWidth: 150 },
        { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
        {
            field: "startDateTime",
            headerName: "Start Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "endDateTime",
            headerName: "End Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",
            flex: 1,
            minWidth: 120,
        },
    ];

    const archivedReservationsColumns = [
        { field: "name", headerName: "Name", flex: 1, minWidth: 150 },
        { field: "email", headerName: "Email", flex: 1, minWidth: 150 },
        { field: "phone", headerName: "Phone", flex: 1, minWidth: 120 },
        {
            field: "startDateTime",
            headerName: "Start Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "endDateTime",
            headerName: "End Date",
            flex: 1,
            minWidth: 150,
        },
        {
            field: "totalPrice",
            headerName: "Total Price (€)",
            flex: 1,
            minWidth: 120,
        },
    ];

    const items = [
        {
            key: "1",
            label: "Temporary Reservations",
            children: (
                <div className="data-grid-container">
                    <h2>Temporary Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <DataGrid
                        rows={formattedTempReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columns={tempReservationsColumns}
                        autoPageSize // Automatically adjust page size
                        rowsPerPageOptions={[5, 10, 20]}
                        getRowId={(row) => row._id}
                        disableSelectionOnClick
                        sx={{
                            height: "100%", // Use full height of the container
                            width: "100%",
                            "& .MuiDataGrid-cell": {
                                fontSize: "0.875rem", // Smaller font size for mobile
                            },
                        }}
                    />
                </div>
            ),
        },
        {
            key: "2",
            label: "Confirmed Reservations",
            children: (
                <div className="data-grid-container">
                    <h2>Confirmed Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <DataGrid
                        rows={formattedConfirmedReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columns={confirmedReservationsColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        getRowId={(row) => row._id}
                        disableSelectionOnClick
                        autoHeight
                        sx={{
                            "& .MuiDataGrid-cell": {
                                fontSize: "0.875rem", // Smaller font size for mobile
                            },
                        }}
                    />
                </div>
            ),
        },
        {
            key: "3",
            label: "Archived Reservations",
            children: (
                <div className="data-grid-container">
                    <h2>Archived Reservations</h2>
                    <div className="search-bar">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                        />
                    </div>
                    <DataGrid
                        rows={formattedArchivedReservations.filter((res) =>
                            Object.values(res).some((value) =>
                                String(value)
                                    .toLowerCase()
                                    .includes(searchText.toLowerCase())
                            )
                        )}
                        columns={archivedReservationsColumns}
                        pageSize={5}
                        rowsPerPageOptions={[5, 10, 20]}
                        getRowId={(row) => row._id}
                        disableSelectionOnClick
                        autoHeight
                        sx={{
                            "& .MuiDataGrid-cell": {
                                fontSize: "0.875rem", // Smaller font size for mobile
                            },
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
