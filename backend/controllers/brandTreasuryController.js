import BrandTreasury from "../models/BrandTreasury.js";

export const createBrandTreasury = async (req, res) => {
  try {
    const newRecord = new BrandTreasury(req.body);
    await newRecord.save();
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getBrandTreasuries = async (req, res) => {
  try {
    const records = await BrandTreasury.find().populate('product').populate('brand').populate('model');
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Get a single Brand Treasury record by ID
export const getBrandTreasuryById = async (req, res) => {
  try {
    const record = await BrandTreasury.findById(req.params.id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update a Brand Treasury record by ID
export const updateBrandTreasury = async (req, res) => {
  try {
    const updatedRecord = await BrandTreasury.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Delete a Brand Treasury record by ID
export const deleteBrandTreasury = async (req, res) => {
  try {
    const deletedRecord = await BrandTreasury.findByIdAndDelete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
