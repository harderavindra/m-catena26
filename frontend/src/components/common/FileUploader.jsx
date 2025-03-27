import { useState } from "react";
import axios from "axios";
import { FiUploadCloud } from "react-icons/fi";
import Button from "./Button";

const FileUploader = ({ onUpload }) => {
    const [loading, setLoading] = useState(false);
    const [attachment, setAttachment] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleFileChange = (e) => {
        setAttachment(e.target.files[0]);
    };

    const uploadFile = async () => {
        if (!attachment) return;
        setLoading(true);
        setUploadProgress(0);
        let fileUrl = "";

        try {
            const timestamp = Date.now();
            const fileNameWithFolder = `${timestamp}-${attachment.name}`;
            const { data } = await axios.post(
                "http://localhost:3000/api/jobs/signed-url-gcs",
                { fileName: fileNameWithFolder, fileType: attachment.type },
                { withCredentials: true }
            );

            if (!data.signedUrl) throw new Error("Failed to get signed URL");

            await axios.put(data.signedUrl, attachment, {
                headers: { "Content-Type": attachment.type },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    );
                    setUploadProgress(percentCompleted);
                },
            });

            fileUrl = data.fileUrl;
            setAttachment(null);
            setUploadProgress(0);
            if (onUpload) onUpload(fileUrl);
        } catch (error) {
            console.error("Error uploading file:", error.response?.data || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Upload File</h3>
            {attachment && <p>Selected file: {attachment.name}</p>}
            <input
                type="file"
                id="fileInput"
                style={{ display: "none" }}
                onChange={handleFileChange}
            />
            <button
                onClick={() => document.getElementById("fileInput").click()}
                className="bg-amber-50 py-2 border border-amber-100 text-red-500 w-full rounded-md flex justify-center items-center gap-2"
            >
                <FiUploadCloud size={18} /> Select a file to upload
            </button>
            {uploadProgress > 0 && (
                <div className="flex items-center gap-2">
                    <progress value={uploadProgress} max="100"></progress>
                    <span>{uploadProgress}%</span>
                </div>
            )}
            <div className="flex gap-4">
                <Button variant="outline" disabled={loading} onClick={() => setAttachment(null)}>
                    Cancel
                </Button>
                <Button onClick={uploadFile} disabled={loading || !attachment}>
                    {loading ? "Uploading..." : "Submit"}
                </Button>
            </div>
        </div>
    );
};

export default FileUploader;
