import React, { useState, useRef, useEffect } from "react";
import Avatar from "../common/Avatar";
import axios from "axios";
import { FiCamera } from "react-icons/fi";

const ChangeAvatar = ({ user }) => {
    const [profilePic, setProfilePic] = useState(user?.profilePic || "");
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const fileInputRef = useRef(null);
    useEffect(() => {
        if (user?.profilePic) {
            setProfilePic(user.profilePic);
        }
    }, [user?.profilePic]);
    // 🔹 Handle File Upload
    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append("profilePic", file);
        formData.append("userId", user._id);

        try {
            const response = await axios.post("http://localhost:3000/api/profile-pic/upload-profile-pic", formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                    console.log(percentCompleted)
                }
              
            });
           

            setProfilePic(response.data.profilePicUrl);
            setUploading(false);
            alert("Profile picture updated!");

        } catch (error) {
            console.error("Upload failed:", error);
            setUploading(false);
        }
    };

    return (
        <div className="flex flex-col items-center gap-4 relative w-fit mx-auto">
            <div className="relative">
            <Avatar src={profilePic} size="xl" className="border-2 border-gray-400" />
            <button
                onClick={() => fileInputRef.current.click()}
                className=" absolute right-0 bottom-2 bg-white w-8 h-8 rounded-full flex items-center justify-center border border-gray-300"
            >
                <FiCamera size={18} />
            </button>
            </div>
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
            />

            {uploading && (
                <div className="w-[200px] mb-2 text-gray-300">
                    <span> {progress}% </span>
                <div className="w-full bg-gray-200  rounded-full p-1">
                   
                    <div className="h-1 bg-blue-500 rounded" style={{ width: `${progress}%` }} />
                </div>
                </div>
            )}
        </div>
    );
};

export default ChangeAvatar;
