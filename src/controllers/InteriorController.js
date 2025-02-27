const InteriorData = require("../models/InteriorModel");
const { deleteFileUsings3URL } = require("./uploadController");

const createInteriorData = async (req, res) => {
    try {
        const data = req.body; // 'req.body' is synchronous, no 'await' needed

        // Create a new instance of InteriorData
        const interiorModel = new InteriorData(data);
        await interiorModel.save();

        console.log(interiorModel);

        // Send a success response
        res.status(201).json({ success: true, message: 'Data created successfully', data: interiorModel });
    } catch (error) {
        console.error('Create Error:', error);

        // Send a server error response
        res.status(500).json({ success: false, message: 'Server error', details: error.message });
    }
};


// Error handler middleware
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size limit exceeded. Maximum size is 10MB.'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files uploaded.'
            });
        }
    }
    next(err);
};
const updateInteriorData = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the existing document
        const existingData = await InteriorData.findById(id);
        if (!existingData) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        // Prepare the update data, adding a new timestamp
        const updateData = { ...req.body, updatedAt: new Date() };

        console.log(updateData)

        const updatedInteriorData = await InteriorData.findByIdAndUpdate(id, updateData);

        res.status(200).json({
            success: true,
            message: 'Update successful',
            data: updatedInteriorData
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, error: 'Update failed', details: error.message });
    }
};

const deleteInteriorData = async (req, res) => {
    try {
        const { id } = req.params;

        // Find the existing document
        const existingData = await InteriorData.findById(id);
        if (!existingData) {
            return res.status(404).json({ success: false, error: 'Record not found' });
        }

        // Collect delete promises
        const deletePromises = [];

        Object.keys(existingData.toObject()).forEach((key) => {
            if (Array.isArray(existingData[key]) && existingData[key].every(item => typeof item === "string")) {
                // Call deleteFile for each file in the array and push the promise to the array
                deletePromises.push(...existingData[key].map(filePath => deleteFileUsings3URL(filePath)));
            }
        });

        // Wait for all delete operations to finish
        await Promise.allSettled(deletePromises);

        // Delete the document from the database
        await InteriorData.findByIdAndDelete(id);

        res.status(200).json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({ success: false, error: 'Delete failed', details: error.message });
    }
};

const getAllInteriorData = async (req, res) => {
    try {
        // Fetch all interior data from the database
        const interiorData = await InteriorData.find();

        res.status(200).json({
            success: true,
            data: interiorData,
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data',
            details: error.message,
        });
    }
};
const getInteriorDataById = async (req, res) => {
    try {
        // Get the ID from the request parameters
        const { id } = req.params;

        // Fetch the data by ID from the database
        const interiorData = await InteriorData.findById(id);

        if (!interiorData) {
            return res.status(404).json({
                success: false,
                error: 'Data not found',
            });
        }

        res.status(200).json({
            success: true,
            data: interiorData,
        });
    } catch (error) {
        console.error('Server Error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve data by ID',
            details: error.message,
        });
    }
};


module.exports = {
    createInteriorData,
    handleMulterError,
    updateInteriorData,
    deleteInteriorData,
    getAllInteriorData,
    getInteriorDataById
};
