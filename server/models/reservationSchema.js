// models/reservationSchema.js
import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    name: String,
    lastName: String,
    phone: String,
    email: String,
    message: String,
    startDateTime: Date,
    endDateTime: Date,
    adults: Number,
    children: Number,
    tents: Number,
    camperVans: Number,
    carsInTeritory: Number,
    electricity: Boolean,
    outdoorShower: Boolean,
    additionalFirewood: Boolean,
    totalPrice: Number,
    pricePerNight: Number,
    duration: Number,
    status: {
        type: String,
        enum: ["pending", "accepted"],
        default: "accepted", // Only accepted reservations will go here
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Reservation = mongoose.model("Reservation", reservationSchema);

export default Reservation;
