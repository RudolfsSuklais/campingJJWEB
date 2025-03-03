import mongoose from "mongoose";

const confirmedReservationSchema = new mongoose.Schema({
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
    isInvoiceChecked: Boolean,
    pricePerNight: Number,
    duration: Number,
    selectedArea: String,
    paymentType: String,
    registrationNumber: String,
    companyName: String,
    vatNumber: String,
    bankAccount: String,
    legalAddress: String,
    postalCode: String,
    streetHouseName: String,
    houseNumber: String,
    flatNumber: String,
});

const ConfirmedReservation = mongoose.model(
    "ConfirmedReservation",
    confirmedReservationSchema
);

export default ConfirmedReservation;
