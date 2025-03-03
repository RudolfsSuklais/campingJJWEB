import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: Number, required: true, unique: true },
    name: String,
    lastName: String,
    email: String,
    startDateTime: String,
    endDateTime: String,
    totalPrice: Number,
    createdAt: { type: Date, default: Date.now },
});

const Invoice = mongoose.model("Invoice", invoiceSchema);

export default Invoice;
