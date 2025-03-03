import mongoose from "mongoose";

const areaSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    shape: { type: String, required: true },
    coords: { type: String, required: true },
});

const Area = mongoose.model("Area", areaSchema);
export default Area;
