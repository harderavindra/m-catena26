import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import InputText from "../components/common/InputText";
import { BRAND_TREASURY_DOCUMENTS,CONTENT_TYPE_DOCUMENTS, LANGUAGES, ZONES } from "../utils/constants";
import { snakeToCapitalCase } from "../utils/convertCase";
import { fetchAllProducts, fetchBrandByProductId, fetchModelCategoriesByBrand } from '../api/masterDataApi';
import FileIcon from "../components/common/FileIcon";
import { FiUploadCloud } from "react-icons/fi";


const AddBrandTreasuryPage = () => {
    const [file, setFile] = useState(null);
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);

    const [formData, setFormData] = useState({
        title: "",
        documentType: "",
        contentType: "",
        zone: "",
        state: "",
        language: "",
        product: "",
        brand: "",
        model: "",
        comment: ""
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [message, setMessage] = useState("");
    const [uploading, setUploading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const getProducts = async () => {
            try {
                const data = await fetchAllProducts();
                setProducts(data);
            } catch (error) {
                console.error("Error fetching products:", error);
            }
        };
        getProducts();
    }, []);
    const handleProductChange = async (e) => {
        handleChange(e);
        const productId = e.target.value;
        setFormData((prev) => ({ ...prev, product: productId, brand: "", model: "" }));
        setBrands([]);
        setModels([]);

        if (productId) {
            try {
                const brandData = await fetchBrandByProductId(productId);
                setBrands(brandData);
            } catch (error) {
                console.error("Error fetching brands:", error);
            }
        }
    };

    const handleBrandChange = async (e) => {
        handleChange(e);
        const brandId = e.target.value;
        setFormData((prev) => ({ ...prev, brand: brandId, model: "" }));
        setModels([]);

        if (brandId) {
            try {
                const modelData = await fetchModelCategoriesByBrand(brandId);
                setModels(modelData);
            } catch (error) {
                console.error("Error fetching models:", error);
            }
        }
    };


    const handleChange = (e) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        console.log(event.target.files[0])
    };

    const validateForm = () => {
        return formData.documentType && formData.zone && formData.state && formData.language && file;
    };

    const uploadFile = async () => {
        if (!validateForm()) {
            setMessage("Please fill all fields and select a file!");
            return;
        }

        try {
            setUploading(true);
            setMessage("Generating signed URL...");

            // Step 1: Get Signed URL
            const { data } = await axios.post("http://localhost:3000/api/upload/generate-signed-url", {
                title: "Temp ",
                fileName: file.name,
                fileType: file.type,
                fileSize: file.size
            },  { withCredentials: true });

            const { signedUrl, fileId } = data;

            // Step 2: Upload File to Cloud Storage
            setMessage("Uploading file...");
            await axios.put(signedUrl, file, {
                headers: { "Content-Type": file.type },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percentCompleted);
                }
            });

            // Step 3: Save Document Metadata
            setMessage("Finalizing upload...");
            await axios.post(`http://localhost:3000/api/upload/save-document`, {
                fileId,
                ...formData
            },
                {
                    withCredentials: true,
                }
            );

            setMessage("Upload successful!");

            // Reset form and file state
            setFormData({ documentType: "", zone: "", state: "", language: "" });
            setFile(null);
            setUploadProgress(0);

            // Navigate to the newly uploaded file view
            navigate(`/view-brandtreasury/${fileId}`);

        } catch (err) {
            console.error("Upload failed:", err);
            setMessage("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="">
            <div className="flex gap-10">
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl p-6  shadow-md relative w-xl">
                    <div className="flex flex-col gap-0">
                        <InputText name={'title'} value={formData.title} label={'Document Title'} handleOnChange={handleChange} />

                    </div>
                    <div>
                        <label>Content Type</label>

                        <select name="contentType" value={formData.contentType} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                            <option value="">Select</option>
                            {Object.values(CONTENT_TYPE_DOCUMENTS).map((doc) => (
                                <option key={doc} value={doc.toLowerCase()}>{snakeToCapitalCase(doc)}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Document Type</label>

                        <select name="documentType" value={formData.documentType} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                            <option value="">Select</option>
                            {Object.values(BRAND_TREASURY_DOCUMENTS).map((doc) => (
                                <option key={doc} value={doc.toLowerCase()}>{snakeToCapitalCase(doc)}</option>
                            ))}
                        </select>
                    </div>
                  
                    <div className="w-full h-full object-cover bg-gray-800 rounded-md justify-center items-center flex flex-col py-2 px-6" >
                        {uploading && (
                            <FileIcon mimeType={document?.mimeType} size={50} className="text-gray-600  text-5xl" />
                        )}
                        <div className="text-white flex flex-col items-center justify-center w-full">
                            <label htmlFor="thumbnailUpload" className=" text-white flex flex-col justify-center items-center mt-4 border-b border-gray-600 pb-2 cursor-pointer w-full " >
                                <FiUploadCloud size={24} />
                                {file ? (
                                    <div className="mt-2 text-base text-gray-600 w-full">
                                        <p><strong></strong> {file.name}</p>
                                        <div className="flex justify-between">
                                            <p><strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
                                            <p><strong>Type:</strong> {file.type}</p>
                                        </div>
                                    </div>
                                ) : 'Select Upload '}
                            </label>
                            <input type="file" id="thumbnailUpload" onChange={handleFileChange} hidden className="mt-3" />

                            {uploadProgress > 0 && (
                                <div className="w-full ">

                                    <p className="mt-2 text-sm font-semibold mb-2">Uploading: {uploadProgress}%</p>
                                    <div style={{ width: "100%" }} className="bg-gray-200/20 rounded-2xl py-1 block px-1">
                                        <div
                                            className="bg-blue-500 h-1 rounded-2xl"
                                            style={{
                                                width: `${uploadProgress}%`,

                                                transition: "width 0.3s ease"
                                            }}></div>
                                    </div>
                                </div>
                            )
                            }
                        </div>
                    </div>

                </div>
                <div className="flex flex-col gap-4  bg-white border border-blue-300/60 rounded-xl p-6  shadow-md relative w-xl w-full">
                    <div className="flex gap-6">
                        <div className="w-full">

                            <label>Zone</label>
                            <select name="zone" value={formData.zone} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                                <option value="">Select Zone</option>
                                {Object.keys(ZONES).map((zone) => (
                                    <option key={zone} value={zone}>{zone}</option>
                                ))}
                            </select>
                        </div>
                        {formData.zone && (
                            <div className="w-full">
                                <label>State</label>
                                <select name="state" value={formData.state} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                                    <option value="">Select State</option>
                                    {ZONES[formData.zone].map((state) => (
                                        <option key={state} value={state}>{state}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>
                    <div>
                        <label>Language</label>
                        <div className="grid grid-cols-4 gap-2 mt-1">
                            {LANGUAGES.map((lang) => (
                                <label key={lang} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="language"
                                        value={lang}
                                        checked={formData.language === lang}
                                        onChange={handleChange}
                                    />
                                    <span>{lang}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className='flex flex-col gap-1 w-full'>
                        <label>Product</label>
                        <select
                            className="w-full border border-gray-400 rounded-md py-1 px-2"
                            name="product"
                            value={formData.product}
                            onChange={handleProductChange}
                        >
                            <option value="">Select Product</option>
                            {products.map((product) => (
                                <option key={product._id} value={product._id}>
                                    {product.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Brand</label>
                        <select name="brand" value={formData.brand} onChange={handleBrandChange} className="w-full border p-2 rounded-md" disabled={!formData.product}>
                            <option value="">Select Brand</option>
                            {brands.map((brand) => (
                                <option key={brand._id} value={brand._id}>
                                    {brand.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Model</label>
                        <select name="model" value={formData.model} onChange={handleChange} className="w-full border p-2 rounded-md" disabled={!formData.brand}>
                            <option value="">Select Model</option>
                            {models.map((model) => (
                                <option key={model._id} value={model._id}>
                                    {model.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label>Comments</label>
                        <textarea name="comment" value={formData.comment} onChange={handleChange} className="w-full  border p-2 rounded-md" />
                            </div>
                </div>
            </div>
            <div>


            </div>
            <div>





                <div className="w-full">

                </div>



            </div>
            <div></div>




            <button
                onClick={uploadFile}
                disabled={uploading}
                className={`mt-4 px-4 py-2 rounded-md w-full ${uploading ? "bg-gray-400" : "bg-green-600 text-white"}`}
            >
                {uploading ? "Uploading..." : "Upload"}
            </button>
            {message && <p className={`mt-2 text-sm ${message.includes("failed") ? "text-red-500" : "text-green-500"}`}>{message}</p>}



        </div>
    );
};

export default AddBrandTreasuryPage;
