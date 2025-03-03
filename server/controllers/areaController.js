// Ensure you are exporting these functions properly
export const getAllAreas = async (req, res) => {
    try {
        const areas = await Area.find();
        res.status(200).json(areas);
    } catch (error) {
        res.status(500).json({ error: "Failed to get areas" });
    }
};

export const createAreas = async (req, res) => {
    try {
        const areas = req.body; // Array of areas
        const result = await Area.insertMany(areas);
        res.status(201).json(result);
    } catch (error) {
        console.error("Error inserting areas:", error); // Log the error to the console
        res.status(500).json({
            error: "Failed to add areas",
            details: error.message,
        });
    }
};
