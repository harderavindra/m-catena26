import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";

import axios from "axios"; // Import axios
import Avatar from "../components/common/Avatar";
import { formatDateTime, formatDateDistance, formatShortDateTime } from "../utils/formatDateTime";
import StatusBubbleText from "../components/common/StatusBubbleText";
import Button from "../components/common/Button";
import StatusBubble from "../components/common/StatusBubble";
import { FiClipboard, FiClock, FiPaperclip } from "react-icons/fi";
import StatusUpdater from "../components/common/StatusUpdater";
import AssignToDropdown from "../components/common/AssignToDropdown";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import PageTitle from "../components/common/PageTitle";
import FileIcon from "../components/common/FileIcon";
import axiosInstance from "../utils/axiosInstance";

const getPriorityColor = (priority) => {
    const priorityMap = {
        urgent: "error",
        high: "warning",
        medium: "info",
        low: "disabled",
    };
    return priorityMap[priority?.toLowerCase()] || "default";
};

const getStatusColor = (status) => {
    const statusMap = {
        created: "success",
        assigned: "info",
        approved: "success",
        inprogress: "info",
        hold: "warning",
        rejected: "error",
        resubmitted: "info",
        completed: "success",
    };
    return statusMap[status?.toLowerCase()] || "default";
};
const statusIcons = {
    created: "clock",
    approved: "check",
    inprogress: "star",
    assigned: "star",

};

const JobViewPage = () => {
    const { fileId } = useParams();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const navigate = useNavigate();
    const [mergedHistory, setMergedHistory] = useState([]);
    const [assigUser, setAssigUser] = useState(null)
    const isApproved = job?.decisionHistory?.some(item => item.status === "Approved") ?? false;
    const [statusUpdated, setStatusUpdated] = useState(false);

    const LabelValue = ({ label, value }) => (
        <div className="w-full">
            <label className="text-gray-400">{label}</label>
            <p className="first-letter:uppercase font-semibold">{value}</p>
        </div>
    );

    const mimeTypes = {
        png: "image/png",
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        pdf: "application/pdf",
        txt: "text/plain",
        doc: "application/msword",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xls: "application/vnd.ms-excel",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        zip: "application/zip",
        mp4: "video/mp4",
      };
      
      // Get MIME type from file extension
      const getMimeTypeFromUrl = (url) => {
        if (!url) return "application/octet-stream"; // Default unknown MIME type
      
        const ext = url.split("?")[0].split(".").pop().toLowerCase();
        return mimeTypes[ext] || "application/octet-stream"; // Fallback to unknown
      };

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const response = await axiosInstance.get(`/api/jobs/${fileId}`);

                const data = response.data;
                console.log(data)
                setJob(data);
                const combinedHistory = [...data.decisionHistory, ...data.statusHistory].sort(
                    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
                );
                setMergedHistory(combinedHistory);
            } catch (err) {
                console.error("Error fetching job:", err);
                setError(err.response?.data?.message || "Failed to fetch job details");
            } finally {
                setLoading(false);
            }
        };

        fetchJob();
    }, [fileId, statusUpdated]);



    const handleDelete = async (jobId) => {
        if (!window.confirm("Are you sure you want to delete this job?")) return;

        try {
            await axios.delete(`http://localhost:3000/api/jobs/${jobId}`, { withCredentials: true });


            setSuccess("Job deleted successfully!");
            navigate("/artworks", { state: { successMessage: "Job deleted successfully!" } }); // Redirect after deletion
        } catch (error) {
            console.error("Error deleting job:", error.response?.data);
            setError("Error deleting job: " + (error.response?.data?.message || error.message));
        }
    };
    const assignUserToJob = async (jobId) => {
        if (!assigUser) {
            setError("Please select a user to assign.");
            return;
        }

        try {

            // Make an API request to assign the user to the job
            const response = await axios.post(
                `http://localhost:3000/api/jobs/${jobId}/assign`,
                { assignedTo: assigUser },
                { withCredentials: true }
            );

            setSuccess(response.data.message);
            setStatusUpdated((prev) => !prev);
            // Optionally, trigger an onUpdate callback to update the UI
        } catch (error) {
            console.error("Error assigning user:", error.response?.data || error.message);
            setError("Failed to assign user: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = (data) => {
        if (data.error) {
            setError(`Error: ${data.error}`);
            setSuccess(""); // Clear success message
        } else {
            setSuccess(`Status updated successfully: ${data.status || ""}`);
            setError(""); // Clear error
        }
        setStatusUpdated((prev) => !prev); // Ensure state updates correctly
    };

    return (
        <div className="p-10">
            <div className="flex justify-between items-center pb-4">
                <PageTitle>Artwork Request</PageTitle>
                <StatusMessageWrapper
                    loading={loading}
                    success={success}
                    error={error}
                />
                <Button width="auto" onClick={()=>navigate('/artworks')} >Back</Button>
            </div>
            {job?.attachment && (
                <div className="">
                    <h3 className="text-lg font-semibold text-gray-700">Attachment</h3>
                    <FileIcon mimeType={getMimeTypeFromUrl(job.attachmentSignedUrl)}  size={48} className="text-blue-500" />

                    <img src={job?.attachmentSignedUrl} alt="Attachment" className="w-full max-w-sm mt-2 rounded-lg shadow" />
                </div>
            )}

            <div className=' flex gap-10'>
                            

                <div className='flex flex-col gap-4 bg-white border border-blue-300/60 rounded-lg p-6 px-10 w-3xl shadow-md'>
                    <div className="pb-2 flex justify-between gap-3 items-start">
                        <h2 className="text-2xl font-bold text-gray-800">{job?.title}</h2>
                        {isApproved ? (

                            <StatusBubble size="xs" icon={'check'} status={"success"}/>
                        ):(
                            <StatusBubble size="xs" icon={'clock'} status={"error"}/>

                        )}
                                                       
                                                    
                    </div>
                    <div className="flex justify-between items-center">
                        <div className="flex gap-3">
                            <Avatar src={job?.createdBy?.profilePic} size="sm" />
                            <div>
                                <p className="text-base/4">{job?.createdBy?.firstName}</p>
                                <p className="text-sm">{formatDateTime(job?.createdAt)}</p>
                            </div>
                        </div>
                        <StatusBubbleText text={job?.priority || 'Low'} status={getPriorityColor(job?.priority)} className={'ml-auto'} />
                    </div>
                    <h2>Specification</h2>
                    <div className="bg-gray-100/70 p-4 rounded-lg">
                        <div className="flex gap-4">
                            <LabelValue label="Offer Type" value={job?.type} />
                            <LabelValue label="Zone" value={job?.zone} />
                        </div>
                        <div className="flex gap-4">
                            <LabelValue label="State" value={job?.state} />
                            <LabelValue label="Language" value={job?.language} />
                        </div>
                        <div className="flex gap-4">
                            <LabelValue label="Product" value={job?.product} />
                            <LabelValue label="Brand" value={job?.brand} />
                        </div>
                        <div className="flex gap-4">
                            <LabelValue label="Model" value={job?.model} />
                        </div>

                    </div>
                    <h2>Comment</h2>
                    <div className="bg-gray-100/70 p-4 rounded-lg">
                        {job?.offerDetails}
                    </div>
                    <div className="flex gap-5">
                        <Button onClick={() => handleDelete(job?._id)}>Delete Job</Button>
                        <Button variant="outline" onClick={() => navigate('/artworks')}>Back to Artworks</Button>
                    </div>
                </div>
                <div className=' bg-white border border-blue-300/60 rounded-lg  w-full shadow-md overflow-hidden '>
                    <div className='flex justify-between p-0 h-full '>
                        <div className=" w-full p-6">
                            {job?.assignedTo ? (
                                <>
                                    <h3 className="text-lg font-semibold text-gray-700">Assigned to</h3>
                                    <div className="flex gap-3 items-center">
                                        <Avatar src={job?.assignedTo?.profilePic} size="sm" />
                                        <div>
                                            <p className="text-gray-400 text-base/tight">
                                                Assigned to{" "}
                                                <span className="text-gray-700 font-bold">
                                                    {job?.assignedTo?.firstName || "N/A"} {job?.assignedTo?.lastName || ""}
                                                </span>
                                            </p>
                                            <p className="text-gray-400 text-base/tight">
                                                Due Date{" "}
                                                <span className="text-gray-700 font-bold">
                                                    {job?.dueDate ? formatDateTime(job?.dueDate) : "No due date"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </>
                            ) : (

                                <>
                                    {isApproved ? (
                                        <div>
                                             <h2 className=" pb-2 border-b border-gray-300 text-xl font-bold">Assign to</h2>
                                            <div className="flex flex-col gap-3">
                                            <AssignToDropdown onSelect={(userId) => setAssigUser(userId)} />
                                            <Button onClick={() => assignUserToJob(job?._id)} disabled={loading || !assigUser}>
                                                {loading ? "Assigning..." : "Assign"}
                                            </Button>
                                            </div>
                                        </div>
                                    ) : (

                                        <StatusMessageWrapper
                                       
                                        success={'Approval required to assign a user'}
                                       
                                    />
                                    )}

                                </>
                            )}
                            <StatusUpdater jobId={job?._id} assignedTo={job?.assignedTo} currentStatus={job?.finalStatus} onUpdate={handleStatusUpdate} />

                        </div>
                        <div className=" bg-gray-50 w-full h-full ">
                            <h2 className="px-4 py-2 border-b border-gray-300 text-xl font-bold">History</h2>
                            {mergedHistory.length > 0 ? (
                                mergedHistory.map((history) => (
                                    <div key={history._id} className="border-b px-8 py-4 border-gray-300 flex flex-col gap-2">
                                        <div className="flex items-center justify-between ">
                                            <p className="flex gap-2 items-center">
                                                <FiClock size={12} />
                                                {formatShortDateTime(history.timestamp)}
                                            </p>
                                            <div className="flex gap-2 items-center">
                                                <span className="text-xs text=gray-100 font-semibold opacity-40">
                                                    {formatDateDistance(history.timestamp).relative}
                                                </span>
                                                <p className="flex gap-2 items-center">
                                                    <StatusBubble
                                                        size="xs"
                                                        icon={statusIcons[history?.status?.toLowerCase()] || "clock"}
                                                        status={getStatusColor(history?.status)?.toLowerCase().trim() || "error"}
                                                        className={'test'}
                                                    />
                                                    {history.status}

                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-4">
                                            <div className="min-w-8">
                                                <Avatar src={history?.updatedBy?.profilePic} size="sm" />
                                            </div>
                                            <div className="w-full">
                                                <p className=" text-gray-600 text-base/tight mb-2 ">{history.comment}</p>
                                                {history.attachmentSignedUrl && (
                                                    <a
                                                        href={history.attachmentSignedUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-semibold text-gray-600 hover:underline flex items-center "
                                                    >
                                                        <FiPaperclip size={14} /> Attachment
                                                    </a>

                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500">No history available</p>
                            )}
                        </div>
                    </div>
                    <div>


                    </div>
                    <div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobViewPage;
