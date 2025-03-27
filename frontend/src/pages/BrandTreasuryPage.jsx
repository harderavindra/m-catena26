import React, { useState } from 'react'
import { useEffect } from 'react'
import { deleteBrandTreasury, fetchBrandTreasury, fetchBrandTreasuryList } from '../api/brandTreasury';
import Button from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import StatusBubble from '../components/common/StatusBubble';
import { FiCalendar, FiFile, FiImage, FiMapPin, FiMoreVertical, FiPlayCircle } from 'react-icons/fi';
import { formatDateTime } from '../utils/formatDateTime';
import Avatar from '../components/common/Avatar';
import MoreOptions from '../components/common/MoreOptions';
import { snakeToCapitalCase } from '../utils/convertCase';
import { IoLanguageOutline } from "react-icons/io5";
import { FaRegFilePdf } from "react-icons/fa";
import { TbFileZip } from "react-icons/tb";
import FileIcon from '../components/common/FileIcon';



const BrandTreasuryPage = () => {
    const navigate = useNavigate()
    const [brandTreasuries, setBrandTreasuries] = useState([]);
    const [showDelete, setShowDelete] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            console.log("Fetching Brand Treasury...");
            try {
                const data = await fetchBrandTreasuryList();
                console.log(data)
                setBrandTreasuries(data)
            } catch (error) {
                console.error("Error fetching Brand Treasury:", error.response?.data?.message || error.message);
            }
        };
        fetchData();
    }, []); // Empty dependency array runs it once when the component mounts
    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this item?")) return;

        try {
            await deleteBrandTreasury(id); // Call API to delete
            setBrandTreasuries((prev) => prev.filter((item) => item._id !== id)); // Remove from UI
            console.log(`Deleted treasury with ID: ${id}`);
        } catch (error) {
            console.error("Error deleting Brand Treasury:", error.response?.data?.message || error.message);
        }
    };
    return (
        <div className=''>
            <div className='flex justify-between'>
                <h1>Banrd Treasury</h1>
                <div className='w-[120px]'><Button onClick={() => navigate('/add-brand-treasury')}>Add</Button></div>
            </div>
            <div className='grid grid-cols-4 gap-8'>
                {brandTreasuries.length > 0 ? (
                    brandTreasuries.map((treasury) => (
                        <div key={treasury._id} className='flex flex-col gap-5 border border-blue-300/60 rounded-xl p-6  shadow-md  '  >
                            <div className='flex gap-4 justify-between items-start'>
                                <StatusBubble size='sm' status={'success'} icon={'check'} className='' />

                                <p className="text-gray-500 capitalize  ">{snakeToCapitalCase(treasury?.documentType || 'N/A')}</p>
                                <StatusBubble size='sm' status={'success'} icon={'check'} className='' />
                                {/* <StatusBubble size='sm' status={`${user.status === 'active' ? 'success' : 'error'}`} icon={user.status === 'inactive' ? 'eyeOff' : 'check'} className='absolute right-5 top-5' /> */}
                            </div>
                            <div className="h-[180px]" onClick={() => navigate(`/view-brandtreasury/${treasury._id}`)}>
                                {treasury.thumbnailUrl ? (
                                    <img src={treasury?.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" style={{ borderRadius: "8px", marginBottom: "10px" }} />
                                ) : (
                                    <div className="w-full h-full object-cover bg-gray-800 rounded-md justify-center items-center flex text-5xl" >
                                              
                                              <FileIcon mimeType={treasury?.mimeType} size={50} className="text-gray-600" />


                                        </div>
                                )}
                            </div>
                            <div className='flex flex-col gap-1'>
                                <div className='flex gap-3 items-start' onClick={() => navigate(`/view-brandtreasury/${treasury._id}`)}><FiPlayCircle size={24} /><p className='font-semibold text-lg capitalize line-clamp-1' >{treasury.title.toLowerCase()}</p></div>
                                <div className='flex gap-3 items-center'><FiCalendar size={14} /><p className=' text-sm capitalize'>{formatDateTime(treasury.updatedAt)}</p></div>
                                <div className='flex gap-3 justify-between items-start'>
                                    <div className='flex gap-3 items-center'><FiMapPin size={14} /><p className=' text-sm capitalize'>{treasury?.zone} </p></div>
                                    <div className='flex gap-3 items-center'><IoLanguageOutline size={14} /><p className=' text-sm capitalize'>{treasury?.language}</p></div>
                                </div>
                            </div>
                            <div className='flex justify-between'>
                                <div className='flex gap-2'><Avatar src={treasury.lastUpdatedBy?.profilePic} size='sm' /><span>{treasury.lastUpdatedBy?.firstName}</span></div>
                                <MoreOptions>
                                    <button className="px-3 py-1 hover:bg-gray-200" onClick={() => handleDelete(treasury._id)}>Delete</button>

                                </MoreOptions>


                            </div>
                        </div>
                    ))
                ) : (
                    <div>
                        <p colSpan="2" className="text-center border p-2">
                            No Brand Treasuries Found
                        </p>
                    </div>
                )}
            </div>
            <div>      <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} onPageChange={setPage} />
            </div>
        </div>
    )
}

export default BrandTreasuryPage
