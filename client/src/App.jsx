import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React from "react";
import HomePage from "./pages/HomePage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import BookingPage from "./pages/BookingPage.jsx";
import Booking from "./pages/Booking.jsx";
import BookingMap from "./pages/BookingMap.jsx";
import NotFound from "./pages/NotFound.jsx";
import "./App.css";
import NavBar from "./components/NavBar.jsx";
import Footer from "./components/Footer.jsx";
import { Toaster } from "react-hot-toast";
import ScrollToTop from "./components/ScrollToTop.jsx";
import { BookingProvider } from "./context/BookingContext.jsx";
import Contact from "./pages/Contact.jsx";
import PricingPage from "./pages/PricingPage.jsx";
import LoginPage from "./pages/Login.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import { AccessProvider } from "./context/AccessContext.jsx";
import ProtectedRoute from "./helpers/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PrivateRoute } from "./helpers/PrivateRoute.jsx";

function App() {
    return (
        <BookingProvider>
            <AccessProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <ScrollToTop />
                        <NavBar />
                        <Toaster
                            position="top-center"
                            toastOptions={{ duration: 5000 }}
                        />
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            <Route
                                path="/admin/login"
                                element={<LoginPage />}
                            />
                            <Route path="/pricing" element={<PricingPage />} />
                            <Route path="/about" element={<AboutPage />} />
                            <Route path="/contact" element={<Contact />} />

                            {/* Protected Booking Routes */}
                            <Route
                                path="/booking-map"
                                element={
                                    <ProtectedRoute>
                                        <BookingMap />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/booking"
                                element={
                                    <ProtectedRoute>
                                        <Booking />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/booking-contact"
                                element={
                                    <ProtectedRoute>
                                        <BookingPage />
                                    </ProtectedRoute>
                                }
                            />

                            <Route
                                path="/admin/dashboard"
                                element={
                                    <PrivateRoute>
                                        <AdminDashboard />
                                    </PrivateRoute>
                                }
                            />
                            <Route path="*" element={<NotFound />} />
                        </Routes>
                        <Footer />
                    </BrowserRouter>
                </AuthProvider>
            </AccessProvider>
        </BookingProvider>
    );
}

export default App;
