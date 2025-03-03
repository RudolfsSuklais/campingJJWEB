import express from "express";
import Area from "../models/areaModel.js"; // Make sure the path is correct

const router = express.Router();

// POST endpoint to add multiple areas
router.post("/add-areas", async (req, res) => {
    try {
        const areas = req.body; // expects an array of areas
        const result = await Area.insertMany(areas);
        res.status(201).json(result); // return the added areas
    } catch (error) {
        console.error("Error inserting areas:", error);
        res.status(500).json({
            error: "Failed to add areas",
            details: error.message,
        });
    }
});

// GET endpoint to fetch all areas
router.get("/areas", async (req, res) => {
    try {
        const areas = await Area.find(); // Fetch all areas from the database
        res.status(200).json(areas); // return the list of areas
    } catch (error) {
        console.error("Error fetching areas:", error);
        res.status(500).json({
            error: "Failed to fetch areas",
            details: error.message,
        });
    }
});

export default router;
