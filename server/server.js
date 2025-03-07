import express from "express";
import cors from "cors";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import Invoice from "./models/invoiceShema.js";
import PDFDocument from "pdfkit";
import path, { format } from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import areaRoutes from "./routes/areaRoutes.js";
import jwt from "jsonwebtoken";
import TempReservation from "./models/tempReserevationSchema.js";
import ConfirmedReservation from "./models/confirmedReservations.js";
import cron from "node-cron"; // Import node-cron
import dayjs from "dayjs";
import archivedReservation from "./models/archivedReservations.js"; // Your archive model
dotenv.config();

const mongoURI = process.env.MONGO_URI;

mongoose
    .connect(mongoURI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", areaRoutes);

// Serve static files from the React app
const __filenamee = fileURLToPath(import.meta.url);
const __dirnamee = path.dirname(__filenamee);
app.use(express.static(path.join(__dirnamee, "..", "client", "dist")));

// Handle client-side routing
app.get("*", (req, res) => {
    res.sendFile(path.join(__dirnamee, "..", "client", "dist", "index.html"));
});

// Function to delete expired reservations

const moveToArchive = async () => {
    try {
        const now = new Date();
        // Find all expired reservations where the endDateTime is in the past
        const expiredReservations = await ConfirmedReservation.find({
            endDateTime: { $lt: now },
        });

        if (expiredReservations.length === 0) {
            console.log("No expired reservations found to archive.");
            return;
        }

        // Prepare the reservations for archiving by converting to plain objects.
        // Optionally remove the _id so that a new one is generated for the archive.
        const reservationsToArchive = expiredReservations.map((reservation) => {
            const archivedData = reservation.toObject();
            delete archivedData._id;
            return archivedData;
        });

        // Insert the expired reservations into the archive collection
        const inserted = await archivedReservation.insertMany(
            reservationsToArchive
        );

        // Remove the archived reservations from the confirmed reservations collection
        await ConfirmedReservation.deleteMany({
            _id: { $in: expiredReservations.map((r) => r._id) },
        });

        console.log(`Archived ${inserted.length} expired reservations.`);
    } catch (error) {
        console.error("Error archiving expired reservations:", error);
    }
};

// Schedule the task to run every 10 minutes
cron.schedule("*/1 * * * *", () => {
    console.log("Running scheduled task to archive expired reservations...");
    moveToArchive();
});

const formatDateForDisplay = (isoDate) => {
    return dayjs(isoDate).format("DD/MM/YYYY HH:mm"); // Format: 18/02/2025 22:00
};

const users = [{ username: "admin", password: "admin123" }];

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

app.get("/api/confirmed-reservations/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const reservation = await ConfirmedReservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }
        res.status(200).json(reservation);
    } catch (error) {
        console.error("Error fetching confirmed reservation:", error);
        res.status(500).json({
            error: "Failed to fetch confirmed reservation",
        });
    }
});

app.get("/api/confirmed-reservations", async (req, res) => {
    const { startDateTime, endDateTime } = req.query;

    // Check if required query parameters are present
    if (!startDateTime || !endDateTime) {
        return res.status(400).json({
            message: "Missing startDateTime or endDateTime query parameters",
        });
    }

    try {
        // Parse the date strings into Date objects
        const startDate = new Date(startDateTime);
        const endDate = new Date(endDateTime);

        // Check if the parsed dates are valid
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format. Please use YYYY-MM-DD HH:mm",
            });
        }

        // Query the database for overlapping reservations
        const reservations = await ConfirmedReservation.find({
            $or: [
                {
                    startDateTime: { $lt: endDate },
                    endDateTime: { $gt: startDate },
                },
                {
                    startDateTime: { $gte: startDate, $lt: endDate },
                },
                {
                    endDateTime: { $gt: startDate, $lte: endDate },
                },
            ],
        });

        // Return the reservations (empty array if no reservations exist)
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Error fetching confirmed reservations:", error);
        res.status(500).json({
            error: "Failed to fetch confirmed reservations",
        });
    }
});

app.get("/api/reservations-confirmed", async (req, res) => {
    try {
        const reservations = await ConfirmedReservation.find();
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Error fetching confirmed reservations:", error);
        res.status(500).json({
            error: "Failed to fetch confirmed reservations",
        });
    }
});

app.get("/api/temp-reservations", async (req, res) => {
    try {
        const reservations = await TempReservation.find(); // Ensure no projection is excluding _id
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Error fetching temp reservations:", error);
        res.status(500).json({ error: "Failed to fetch temp reservations" });
    }
});

app.get("/api/temp-reservations/:id", async (req, res) => {
    const { id } = req.params;

    try {
        const reservation = await TempReservation.findById(id);

        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        res.status(200).json(reservation);
    } catch (error) {
        console.error("Error fetching reservation:", error);
        res.status(500).json({ error: "Failed to fetch reservation" });
    }
});

app.post("/api/confirm-reservation/:id", async (req, res) => {
    const { id } = req.params;

    console.log("Confirming reservation with ID:", id);

    try {
        const tempReservation = await TempReservation.findById(id);
        console.log("Temporary Reservation:", tempReservation);

        if (!tempReservation) {
            console.error("Reservation not found for ID:", id);
            return res.status(404).json({ message: "Reservation not found" });
        }

        const confirmedReservation = new ConfirmedReservation({
            ...tempReservation._doc,
        });
        console.log("Confirmed Reservation:", confirmedReservation);

        await confirmedReservation.save();
        console.log("Confirmed reservation saved successfully");

        await TempReservation.findByIdAndDelete(id);
        console.log("Temporary reservation deleted successfully");

        return res
            .status(200)
            .json({ message: "Reservation confirmed successfully" });
    } catch (error) {
        console.error("Error confirming reservation:", error);
        return res.status(500).json({
            message: "Failed to confirm reservation",
            error: error.message,
        });
    }
});

app.get("/api/archived-reservations", async (req, res) => {
    try {
        const reservations = await archivedReservation.find(); // Ensure no projection is excluding _id
        res.status(200).json(reservations);
    } catch (error) {
        console.error("Error fetching archived reservations:", error);
        res.status(500).json({
            error: "Failed to fetch archived reservations",
        });
    }
});

app.post("/api/login", (req, res) => {
    const { username, password } = req.body;

    const user = users.find(
        (user) => user.username === username && user.password === password
    );

    if (user) {
        const token = jwt.sign({ username }, "your_jwt_secret", {
            expiresIn: "1h",
        });
        return res.json({ token });
    } else {
        return res.status(401).json({ message: "Invalid credentials" });
    }
});

app.delete("/api/delete-temp-reservation/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Check if the ID is valid
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid reservation ID" });
        }

        // Find and delete the reservation
        const deletedReservation = await TempReservation.findByIdAndDelete(id);

        // If no reservation is found, return a 404 error
        if (!deletedReservation) {
            return res.status(404).json({ message: "Reservation not found" });
        }

        // Return success response
        res.status(200).json({ message: "Reservation deleted successfully" });
    } catch (error) {
        console.error("Error deleting reservation:", error);
        res.status(500).json({
            message: "An error occurred while deleting the reservation",
        });
    }
});

app.post("/api/send-decline-email/:id", async (req, res) => {
    const { id } = req.params;
    console.log("Sending Decline Email for reservation with ID:", id);

    try {
        const reservation = await TempReservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        const { name, email } = reservation;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Booking Declined - Jūrmalciema Jēkabi",
            html: `
                <p>Dear ${name},</p>
                <p>We regret to inform you that your booking request at <b>Jūrmalciema Jēkabi Camping</b> has been declined.</p>
                <p>If you have any questions or would like to make a new reservation, please feel free to contact us.</p>
                <p>Best regards,</p>
                <p><b>Jūrmalciema Jēkabi Team</b><br>
                Phone number: +371 20 510 502<br>
                E-mail: <a href="mailto:info@jekabi.com">info@jekabi.com</a></p>
            `,
            attachments: [
                {
                    filename: "JJLogo.png",
                    path: "https://res.cloudinary.com/dq3svbwy6/image/upload/v1739300133/JJLogoBlack_kv5ulj.png",
                    cid: "logo",
                },
            ],
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: "Decline email sent successfully" });
    } catch (error) {
        console.error("Error sending decline email:", error);
        res.status(500).json({ error: "Failed to send decline email" });
    }
});

app.post("/api/send-pdf/:id", async (req, res) => {
    const { id } = req.params;
    console.log("Sending PDF for reservation with ID:", id);

    try {
        const reservation = await ConfirmedReservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        const {
            name,
            lastName,
            email,
            startDateTime,
            endDateTime,
            totalPrice,
            pricePerNight,
            duration,
            selectedArea,
        } = reservation;

        // Generate invoice number
        const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
        const newInvoiceNumber = lastInvoice
            ? lastInvoice.invoiceNumber + 1
            : 1;

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const invoiceBuffer = [];

        doc.on("data", (chunk) => invoiceBuffer.push(chunk));

        doc.on("end", async () => {
            const invoiceContent = Buffer.concat(invoiceBuffer);

            // Save the invoice to the database
            const newInvoice = new Invoice({
                invoiceNumber: newInvoiceNumber,
                name,
                lastName,
                email,
                startDateTime,
                endDateTime,
                totalPrice,
                pricePerNight,
                duration,
                selectedArea,
                pdfContent: invoiceContent, // Save the PDF content as a buffer
            });

            await newInvoice.save();

            const customerMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Invoice for Your Booking - Jūrmalciema Jēkabi",
                html: `
                    <p>Hi ${name},</p>
                    <p>Thank you for your booking at <b>Jūrmalciems Jēkabi Camping</b>!  
                    Please find attached the invoice for your booking.</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><b>Start Date:</b> ${formatDateForDisplay(
                            startDateTime
                        )}</li>
                        <li><b>End Date:</b> ${formatDateForDisplay(
                            endDateTime
                        )}</li>
                        <li><b>Total Price:</b> ${totalPrice}€</li>
                    </ul>
                    <p>If you have any questions, feel free to reply to this email.</p>
                    <p>Best regards,</p>
                    <p><b>Jūrmalciems Jēkabi Team</b><br>
                    Phone number: +371 20 510 502<br>
                    E-mail: <a href="mailto:info@jekabi.com">info@jekabi.com</a></p>
                    <img src="cid:logo" alt="Jūrmalciema Jēkabi Camping" width="150" />
                `,
                attachments: [
                    {
                        filename: "JJLogo.png",
                        path: "https://res.cloudinary.com/dq3svbwy6/image/upload/v1739300133/JJLogoBlack_kv5ulj.png",
                        cid: "logo",
                    },
                    {
                        filename: `invoice_${name}_${lastName}_${newInvoiceNumber}.pdf`,
                        content: invoiceContent,
                        contentType: "application/pdf",
                    },
                ],
            };

            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New Invoice Generated for ${name} ${lastName}`,
                html: `
                    <p>A new invoice has been generated for ${name} ${lastName}.</p>
                    <p>Invoice Number: GS ${newInvoiceNumber}</p>
                    <p>Total Price: ${totalPrice}€</p>
                `,
                attachments: [
                    {
                        filename: `invoice_${name}_${lastName}_${newInvoiceNumber}.pdf`,
                        content: invoiceContent,
                        contentType: "application/pdf",
                    },
                ],
            };

            try {
                await transporter.sendMail(customerMailOptions);
                await transporter.sendMail(adminMailOptions);
                res.status(200).json({ message: "PDF sent successfully" });
            } catch (error) {
                console.error("Error sending email:", error);
                res.status(500).json({ error: "Failed to send email" });
            }
        });

        const fontPath = path.join(__dirname, "fonts", "NotoSans-Bold.ttf");
        const fontPathRegular = path.join(
            __dirname,
            "fonts",
            "NotoSans-Regular.ttf"
        );

        doc.font(fontPath);
        const today = new Date();
        const formattedDate = `${
            today.getDate() < 10 ? "0" + today.getDate() : today.getDate()
        }/${
            today.getMonth() + 1 < 10
                ? "0" + (today.getMonth() + 1)
                : today.getMonth() + 1
        }/${today.getFullYear().toString().slice(2)}`;

        // Header
        doc.fillColor("#333333")
            .fontSize(24)
            .text(`SIA GSrent`, {
                align: "center",
            })
            .moveDown(0.5);

        doc.font(fontPathRegular)
            .fontSize(12)
            .text(
                `"Jēkabi", Jūrmalciems, Nīcas pag., Dienvidkurzemes nov., LV-3473`,
                { align: "center" }
            )
            .text("Phone: +371 26184342 | Email: info@jekabi.com", {
                align: "center",
            })
            .moveDown(1);

        // Invoice Title
        doc.font(fontPath)
            .fontSize(18)
            .fillColor("#444444")
            .text(`INVOICE Nr. GS ${formattedDate}-${newInvoiceNumber}`, {
                align: "center",
            })
            .moveDown(1);

        // Invoice Details
        doc.font(fontPath).fontSize(14).text("Supplier");
        doc.font(fontPathRegular)
            .fontSize(10)
            .fillColor("#555555")
            .text(
                `Legal Address: "Jēkabi", Jūrmalciems, Nīcas pag., Nīcas nov., LV-3473`
            )
            .text(`Billing Details: AS "DNB banka"`)
            .text(`Reg. No: 40203273547`)
            .text(`VAT Reg. No: LV40203273547`)
            .text(`Bank Account: LV12RIKO0002930316345`)
            .text(`Bank Account Code: RIKOLV2X`);

        generateHr(doc, doc.y + 1);

        doc.font(fontPath).fontSize(14).text("Recipient");
        doc.font(fontPathRegular).fontSize(10).text(`${name} ${lastName}`);

        generateHr(doc, doc.y + 2);

        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 10);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDueDate = dueDate.toLocaleDateString("en-GB", options);

        doc.font(fontPath).fontSize(14).text("Payment");
        doc.font(fontPathRegular)
            .fontSize(10)
            .text(`Payment method: Bank Transfer`)
            .text(`Payment term: ${formattedDueDate}`);

        doc.font(fontPathRegular).text(" ").moveDown(5);

        // Invoice Table
        generateInvoiceTable(doc, {
            items: [
                {
                    description: "Campsite rental",
                    pricePerNight: pricePerNight,
                    nights: duration,
                    totalPrice: totalPrice,
                },
            ],
        });

        doc.moveDown(5);

        // Footer
        doc.font(fontPathRegular)
            .fontSize(10)
            .fillColor("#777777")
            .text("Thank you for choosing SIA GSrent!", { align: "center" })
            .text("Please contact us if you have any questions.", {
                align: "center",
            })
            .moveDown(1);

        doc.end();

        // Helper Functions
        function generateHr(doc, y) {
            doc.strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, y)
                .lineTo(550, y)
                .stroke();
        }

        function generateInvoiceTable(doc, booking) {
            const invoiceTableTop = 350;
            const fontPath = path.join(__dirname, "fonts", "NotoSans-Bold.ttf");
            const fontPathRegular = path.join(
                __dirname,
                "fonts",
                "NotoSans-Regular.ttf"
            );

            doc.font(fontPath).fontSize(12).fillColor("#333333");

            generateTableRow(
                doc,
                invoiceTableTop,
                "Description",
                "Price per Night",
                "Nights",
                "Total (EUR)"
            );
            generateHr(doc, invoiceTableTop + 50);

            doc.font(fontPath).fontSize(10).fillColor("#555555");

            booking.items.forEach((item, index) => {
                const position = invoiceTableTop + (index + 1) * 30;
                generateTableRow(
                    doc,
                    position,
                    item.description,
                    formatCurrency(item.pricePerNight),
                    item.nights,
                    formatCurrency(item.totalPrice)
                );
                generateHr(doc, position + 50);
            });

            const totalWithoutVat = booking.items.reduce(
                (acc, item) => acc + item.totalPrice,
                0
            );
            const vatAmount = totalWithoutVat * 0.21; // VAT at 21%
            const totalWithVat = totalWithoutVat + vatAmount;

            const vatRowPosition =
                invoiceTableTop + (booking.items.length + 1) * 30;
            generateTableRowWithVat(
                doc,
                vatRowPosition + 40,
                "Total (Excl. VAT)",
                formatCurrency(totalWithoutVat)
            );
            generateTableRowWithVat(
                doc,
                vatRowPosition + 60,
                "VAT (21%)",
                formatCurrency(vatAmount)
            );
            generateTableRowWithVat(
                doc,
                vatRowPosition + 80,
                "Total (Incl. VAT)",
                formatCurrency(totalWithVat)
            );
        }

        function generateTableRowWithVat(doc, y, description, total) {
            doc.text(description, 50, y).text(total, 0, y, { align: "right" });
        }

        function generateTableRow(
            doc,
            y,
            description,
            pricePerNight,
            nights,
            total
        ) {
            doc.text(description, 50, y + 50)
                .text(pricePerNight, 200, y + 50, {
                    width: 180,
                    align: "right",
                })
                .text(nights, 370, y + 50, { width: 90, align: "right" })
                .text(total, 0, y + 50, { align: "right" });
        }

        function formatCurrency(amount) {
            if (amount === undefined || amount === null || isNaN(amount)) {
                return "0.00€";
            }
            return `${amount.toFixed(2)}€`;
        }
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

app.post("/api/send-pdf-legal/:id", async (req, res) => {
    const { id } = req.params;
    console.log("Sending PDF for reservation with ID:", id);

    try {
        const reservation = await ConfirmedReservation.findById(id);
        if (!reservation) {
            return res.status(404).json({ error: "Reservation not found" });
        }

        const {
            name,
            lastName,
            email,
            registrationNumber,
            companyName,
            vatNumber,
            bankAccount,
            legalAddress,
            postalCode,
            streetHouseName,
            houseNumber,
            flatNumber,
            startDateTime,
            endDateTime,
            totalPrice,
            pricePerNight,
            duration,
            selectedArea,
        } = reservation;

        // Generate invoice number
        const lastInvoice = await Invoice.findOne().sort({ invoiceNumber: -1 });
        const newInvoiceNumber = lastInvoice
            ? lastInvoice.invoiceNumber + 1
            : 1;

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const invoiceBuffer = [];

        doc.on("data", (chunk) => invoiceBuffer.push(chunk));

        doc.on("end", async () => {
            const invoiceContent = Buffer.concat(invoiceBuffer);

            // Save the invoice to the database
            const newInvoice = new Invoice({
                invoiceNumber: newInvoiceNumber,
                name,
                lastName,
                email,
                startDateTime,
                endDateTime,
                totalPrice,
                pricePerNight,
                duration,
                selectedArea,
                pdfContent: invoiceContent, // Save the PDF content as a buffer
            });

            await newInvoice.save();

            // Define customerMailOptions and adminMailOptions here
            const customerMailOptions = {
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Invoice for Your Booking - Jūrmalciema Jēkabi",
                html: `
                    <p>Hi ${name},</p>
                    <p>Thank you for your booking at <b>Jūrmalciems Jēkabi Camping</b>!  
                    Please find attached the invoice for your booking.</p>
                    <h3>Booking Details:</h3>
                    <ul>
                        <li><b>Start Date:</b> ${formatDateForDisplay(
                            startDateTime
                        )}</li>
                        <li><b>End Date:</b> ${formatDateForDisplay(
                            endDateTime
                        )}</li>
                        <li><b>Total Price:</b> ${totalPrice}€</li>
                    </ul>
                    <p>If you have any questions, feel free to reply to this email.</p>
                    <p>Best regards,</p>
                    <p><b>Jūrmalciems Jēkabi Team</b><br>
                    Phone number: +371 20 510 502<br>
                    E-mail: <a href="mailto:info@jekabi.com">info@jekabi.com</a></p>
                    <img src="cid:logo" alt="Jūrmalciema Jēkabi Camping" width="150" />
                `,
                attachments: [
                    {
                        filename: "JJLogo.png",
                        path: "https://res.cloudinary.com/dq3svbwy6/image/upload/v1739300133/JJLogoBlack_kv5ulj.png",
                        cid: "logo",
                    },
                    {
                        filename: `invoice_${name}_${lastName}_${newInvoiceNumber}.pdf`,
                        content: invoiceContent,
                        contentType: "application/pdf",
                    },
                ],
            };

            const adminMailOptions = {
                from: process.env.EMAIL_USER,
                to: process.env.EMAIL_USER,
                subject: `New Invoice Generated for ${name} ${lastName}`,
                html: `
                    <p>A new invoice has been generated for ${name} ${lastName}.</p>
                    <p>Invoice Number: GS ${newInvoiceNumber}</p>
                    <p>Total Price: ${totalPrice}€</p>
                `,
                attachments: [
                    {
                        filename: `invoice_${name}_${lastName}_${newInvoiceNumber}.pdf`,
                        content: invoiceContent,
                        contentType: "application/pdf",
                    },
                ],
            };

            try {
                await transporter.sendMail(customerMailOptions);
                await transporter.sendMail(adminMailOptions);
                res.status(200).json({ message: "PDF sent successfully" });
            } catch (error) {
                console.error("Error sending email:", error);
                res.status(500).json({ error: "Failed to send email" });
            }
        });

        const fontPath = path.join(__dirname, "fonts", "NotoSans-Bold.ttf");
        const fontPathRegular = path.join(
            __dirname,
            "fonts",
            "NotoSans-Regular.ttf"
        );

        doc.font(fontPath);
        const today = new Date();
        const formattedDate = `${
            today.getDate() < 10 ? "0" + today.getDate() : today.getDate()
        }/${
            today.getMonth() + 1 < 10
                ? "0" + (today.getMonth() + 1)
                : today.getMonth() + 1
        }/${today.getFullYear().toString().slice(2)}`;

        // Header
        doc.fillColor("#333333")
            .fontSize(24)
            .text(`SIA GSrent`, {
                align: "center",
            })
            .moveDown(0.5);

        doc.font(fontPathRegular)
            .fontSize(12)
            .text(
                `"Jēkabi", Jūrmalciems, Nīcas pag., Dienvidkurzemes nov., LV-3473`,
                { align: "center" }
            )
            .text("Phone: +371 26184342 | Email: info@jekabi.com", {
                align: "center",
            })
            .moveDown(1);

        // Invoice Title
        doc.font(fontPath)
            .fontSize(18)
            .fillColor("#444444")
            .text(`INVOICE Nr. GS ${formattedDate}-${newInvoiceNumber}`, {
                align: "center",
            })
            .moveDown(1);

        // Invoice Details
        doc.font(fontPath).fontSize(14).text("Supplier");
        doc.font(fontPathRegular)
            .fontSize(10)
            .fillColor("#555555")
            .text(
                `Legal Address: "Jēkabi", Jūrmalciems, Nīcas pag., Nīcas nov., LV-3473`
            )
            .text(`Billing Details: AS "DNB banka"`)
            .text(`Reg. No: 40203273547`)
            .text(`VAT Reg. No: LV40203273547`)
            .text(`Bank Account: LV12RIKO0002930316345`)
            .text(`Bank Account Code: RIKOLV2X`);

        generateHr(doc, doc.y + 1);

        doc.font(fontPath).fontSize(14).text("Recipient");
        doc.font(fontPathRegular).fontSize(10).text(`${name} ${lastName}`);
        doc.font(fontPathRegular).fontSize(10).text(`Company: ${companyName}`);
        doc.font(fontPathRegular)
            .fontSize(10)
            .text(`Registration number: ${registrationNumber}`);
        doc.font(fontPathRegular).fontSize(10).text(`VAT number: ${vatNumber}`);
        doc.font(fontPathRegular)
            .fontSize(10)
            .text(`Bank account: ${bankAccount}`);
        doc.font(fontPathRegular)
            .fontSize(10)
            .text(
                `Legal address: ${legalAddress}, ${postalCode}, ${streetHouseName}`
            );

        generateHr(doc, doc.y + 2);

        const dueDate = new Date(today);
        dueDate.setDate(today.getDate() + 10);
        const options = { year: "numeric", month: "long", day: "numeric" };
        const formattedDueDate = dueDate.toLocaleDateString("en-GB", options);

        doc.font(fontPath).fontSize(14).text("Payment");
        doc.font(fontPathRegular)
            .fontSize(10)
            .text(`Payment method: Bank Transfer`)
            .text(`Payment term: ${formattedDueDate}`);

        doc.font(fontPathRegular).text(" ").moveDown(10);

        // Invoice Table
        generateInvoiceTable(doc, {
            items: [
                {
                    description: "Campsite rental",
                    pricePerNight: pricePerNight,
                    nights: duration,
                    totalPrice: totalPrice,
                },
            ],
        });

        doc.moveDown(10);

        // Footer
        doc.font(fontPathRegular)
            .fontSize(10)
            .fillColor("#777777")
            .text("Thank you for choosing SIA GSrent!", { align: "center" })
            .text("Please contact us if you have any questions.", {
                align: "center",
            })
            .moveDown(1);

        doc.end();

        // Helper Functions
        function generateHr(doc, y) {
            doc.strokeColor("#aaaaaa")
                .lineWidth(1)
                .moveTo(50, y)
                .lineTo(550, y)
                .stroke();
        }

        function generateInvoiceTable(doc, booking) {
            const invoiceTableTop = 350;
            const fontPath = path.join(__dirname, "fonts", "NotoSans-Bold.ttf");
            const fontPathRegular = path.join(
                __dirname,
                "fonts",
                "NotoSans-Regular.ttf"
            );

            doc.font(fontPath).fontSize(12).fillColor("#333333");

            generateTableRow(
                doc,
                invoiceTableTop,
                "Description",
                "Price per Night",
                "Nights",
                "Total (EUR)"
            );
            generateHr(doc, invoiceTableTop + 100);

            doc.font(fontPath).fontSize(10).fillColor("#555555");

            booking.items.forEach((item, index) => {
                const position = invoiceTableTop + (index + 1) * 30;
                generateTableRow(
                    doc,
                    position,
                    item.description,
                    formatCurrency(item.pricePerNight),
                    item.nights,
                    formatCurrency(item.totalPrice)
                );
                generateHr(doc, position + 100);
            });

            const totalWithoutVat = booking.items.reduce(
                (acc, item) => acc + item.totalPrice,
                0
            );
            const vatAmount = totalWithoutVat * 0.21; // VAT at 21%
            const totalWithVat = totalWithoutVat + vatAmount;

            const vatRowPosition =
                invoiceTableTop + (booking.items.length + 1) * 30;
            generateTableRowWithVat(
                doc,
                vatRowPosition + 100,
                "Total (Excl. VAT)",
                formatCurrency(totalWithoutVat)
            );
            generateTableRowWithVat(
                doc,
                vatRowPosition + 120,
                "VAT (21%)",
                formatCurrency(vatAmount)
            );
            generateTableRowWithVat(
                doc,
                vatRowPosition + 140,
                "Total (Incl. VAT)",
                formatCurrency(totalWithVat)
            );
        }

        function generateTableRowWithVat(doc, y, description, total) {
            doc.text(description, 100, y).text(total, 0, y, { align: "right" });
        }

        function generateTableRow(
            doc,
            y,
            description,
            pricePerNight,
            nights,
            total
        ) {
            doc.text(description, 50, y + 100)
                .text(pricePerNight, 200, y + 100, {
                    width: 180,
                    align: "right",
                })
                .text(nights, 370, y + 100, { width: 90, align: "right" })
                .text(total, 0, y + 100, { align: "right" });
        }

        function formatCurrency(amount) {
            if (amount === undefined || amount === null || isNaN(amount)) {
                return "0.00€";
            }
            return `${amount.toFixed(2)}€`;
        }
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).json({ error: "Failed to generate PDF" });
    }
});

app.post("/send-email", async (req, res) => {
    const {
        name,
        lastName,
        phone,
        email,
        message,
        startDateTime,
        endDateTime,
        adults,
        children,
        tents,
        camperVans,
        carsInTeritory,
        electricity,
        outdoorShower,
        additionalFirewood,
        totalPrice,
        paymentType,
        pricePerNight,
        duration,
        selectedArea,
        registrationNumber,
        companyName,
        vatNumber,
        bankAccount,
        legalAddress,
        postalCode,
        streetHouseName,
        houseNumber,
        flatNumber,
    } = req.body;

    try {
        const tempReservation = new TempReservation({
            name,
            lastName,
            phone,
            email,
            message,
            startDateTime,
            endDateTime,
            adults,
            children,
            tents,
            camperVans,
            carsInTeritory,
            electricity,
            outdoorShower,
            additionalFirewood,
            totalPrice,
            paymentType,
            pricePerNight,
            duration,
            selectedArea,
            paymentType,
            vatNumber,
            registrationNumber,
            companyName,
            bankAccount,
            legalAddress,
            postalCode,
            streetHouseName,
            houseNumber,
            flatNumber,
        });

        await tempReservation.save();

        const adminMailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER,
            subject: "New Booking Request",
            text: `
                Name: ${name} ${lastName}
                Phone: ${phone}
                Email: ${email}
                Start Date: ${formatDateForDisplay(startDateTime)}
                End Date: ${formatDateForDisplay(endDateTime)}
                Adults: ${adults}
                Children: ${children}
                Tents: ${tents}
                Camper Vans: ${camperVans}
                Cars in Territory: ${carsInTeritory}
                Electricity: ${electricity}
                Outdoor Shower: ${outdoorShower}
                Additional Firewood: ${additionalFirewood}
                Total Price: ${totalPrice}€
                Message: ${message}
            `,
        };

        const customerMailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Booking Confirmation - Jūrmalciema Jēkabi",
            html: `
                <p>Hi ${name},</p>
                <p>Thank you for your booking request at <b>Jūrmalciems Jēkabi Camping</b>!  
                We have received your request and will get back to you shortly.</p>
                <h3>Booking Details:</h3>
                <ul>
                    <li><b>Start Date:</b> ${startDateTime}</li>
                    <li><b>End Date:</b> ${endDateTime}</li>
                    <li><b>Total Price:</b> ${totalPrice}€</li>
                </ul>
                <p>If you have any questions, feel free to reply to this email.</p>
                <p>Best regards,</p>
                <p><b>Jūrmalciems Jēkabi Team</b><br>
                Phone number: +371 20 510 502<br>
                E-mail: <a href="mailto:info@jekabi.com">info@jekabi.com</a></p>
                <img src="cid:logo" alt="Jūrmalciema Jēkabi Camping" width="150" />
            `,
            attachments: [
                {
                    filename: "JJLogo.png",
                    path: "https://res.cloudinary.com/dq3svbwy6/image/upload/v1739300133/JJLogoBlack_kv5ulj.png",
                    cid: "logo",
                },
            ],
        };

        // Send emails without PDF
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(customerMailOptions);

        res.status(200).json({ message: "Emails sent successfully!" });
    } catch (error) {
        console.error("Error processing reservation:", error);
        res.status(500).json({ error: "Failed to process reservation" });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
