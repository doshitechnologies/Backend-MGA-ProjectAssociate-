const ModalData =  require("../models/ArchiTectureModel");


const createArchitectureData = async (req, res) => {
    try {
        const data = req.body; // 'req.body' is synchronous, no 'await' needed

        // Create a new instance of InteriorData
        const interiorModel = new ModalData(data);
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





// Controller to Update ModalData
const updateModalData = async (req, res) => {
    try {
        const { id } = req.params;
        const modalDataUpdates = {
            ...req.body,
            updatedAt: new Date(),
        };

        console.log(modalDataUpdates)


       
        // Update data in MongoDB
        const updatedModalData = await ModalData.findByIdAndUpdate(id, modalDataUpdates);
        if (!updatedModalData) {
            return res.status(404).json({ success: false, message: 'Data not found' });
        }
        console.log(updateModalData)
        res.status(200).json({
            success: true,
            message: 'Data updated successfully',
            data: updatedModalData,
        });
    } catch (error) {
        console.error('Update Error:', error);
        res.status(500).json({ success: false, error: 'Update failed', details: error.message });
    }
};

// Controller to Delete ModalData
const deleteModalData = async (req, res) => {
    try {
        const { id } = req.params;

        const deletedData = await ModalData.findByIdAndDelete(id);
        if (!deletedData) {
            return res.status(404).json({ success: false, message: 'Data not found' });
        }

        const deletePromises = [];
        for (const fieldName in deletedData.toObject()) {
            const fileUrls = deletedData[fieldName];
            if (Array.isArray(fileUrls)) {
                fileUrls.forEach((fileUrl) => {
                    const fileKey = fileUrl.split(`${BUCKET_NAME}/`)[1];
                    if (fileKey) {
                        deletePromises.push(
                            s3.deleteObject({ Bucket: BUCKET_NAME, Key: fileKey }).promise(),
                        );
                    }
                });
            }
        }

        await Promise.all(deletePromises);

        res.status(200).json({
            success: true,
            message: 'Data deleted successfully',
        });
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ success: false, error: 'Delete failed', details: error.message });
    }
};

// Controller to Fetch ModalData
const getModalData = async (req, res) => {
    try {
        const { id } = req.params;
        if (id) {
            const modalData = await ModalData.findById(id);
            if (!modalData) {
                return res.status(404).json({ success: false, message: 'Data not found' });
            }
            return res.status(200).json({ success: true, data: modalData });
        }

        const modalDataList = await ModalData.find();
        res.status(200).json({ success: true, data: modalDataList });
    } catch (error) {
        console.error('Fetch Error:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch data', details: error.message });
    }
};


const getModalDataById = async (req, res) => {
        try {
            const { id } = req.params;
    
            // Fetch a single document by ID
            const modalData = await ModalData.findById(id);
    
            // If no data found, send a 404 response
            if (!modalData) {
                return res.status(404).json({
                    success: false,
                    message: 'Data not found'
                });
            }
    
            // Return the data if found
            return res.status(200).json({
                success: true,
                data: modalData
            });
        } catch (error) {
            console.error('Fetch Error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch data by ID',
                details: error.message
            });
        }
    };



module.exports = {
    createArchitectureData,
    handleMulterError,
    updateModalData,
    deleteModalData,
    getModalData,
    getModalDataById
};
