import multer from "multer";

const storage = multer.memoryStorage(); // Stores file in memory before uploading
const upload = multer({ storage });

export default upload;
