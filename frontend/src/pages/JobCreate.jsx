import { useState, useEffect } from "react";
import axios from "axios";
import FileUpload from "../components/common/FileGcsUpload"; // Import the reusable FileUpload component
import { BRAND_TREASURY_DOCUMENTS, LANGUAGES, PRIORITY, ZONES } from "../utils/constants"; // Assuming this is defined
import { useLocation, useNavigate } from "react-router-dom";
import PageTitle from "../components/common/PageTitle";
import StatusMessageWrapper from "../components/common/StatusMessageWrapper";
import Button from "../components/common/Button";
import SelectField from "../components/common/SelectField";
import InputText from "../components/common/InputText";
import { fetchAllProducts, fetchBrandByProductId, fetchModelCategoriesByBrand } from "../api/masterDataApi";


const JobCreate = () => {
  const [formData, setFormData] = useState({
    title: "",
    type: "",
    priority: "",
    offerType: "",
    zone: "",
    state: "",
    language: "",
    product: "",
    brand: "",
    model: "",
    offerDetails: "",
    dueDate: "",
    attachment: null, // Store uploaded file object
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("location");

  const location = useLocation();

  const [success, setSuccess] = useState(location.state?.successMessage || "");
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const getProducts = async () => {
      try {
        const data = await fetchAllProducts();
        console.log("Fetched Products:", data); // Debugging

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

  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split("T")[0]; // Format: YYYY-MM-DD
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split("T")[0];
  };


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (file) => {
    setFormData((prev) => ({ ...prev, attachment: file }));
    console.log(file, "file")
  };

  const validateForm = () => {
    let newErrors = {};
    if (!formData.title) newErrors.title = "Title is required";
    if (!formData.type) newErrors.type = "Job Type is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    let fileUrl = "";
    try {
      if (formData.attachment) {
        const timestamp = Date.now();
        const fileNameWithFolder = `${timestamp}-${formData.attachment.name}`;
        const { data } = await axios.post(
          "http://localhost:3000/api/jobs/signed-url-gcs",
          { fileName: fileNameWithFolder, fileType: formData.attachment.type },
          { withCredentials: true }
        );

        if (!data.signedUrl) throw new Error("Failed to get signed URL");

        await axios.put(data.signedUrl, formData.attachment, {
          headers: { "Content-Type": formData.attachment.type },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percentCompleted);
          },
        });

        fileUrl = data.fileUrl;
        setUploadProgress(0);
      }

      await axios.post(
        "http://localhost:3000/api/jobs/create",
        { ...formData, attachment: fileUrl },
        { withCredentials: true }
      );

      alert("Job created successfully!");
      setFormData({
        title: "",
        type: "",
        priority: "",
        offerType: "",
        zone: "",
        state: "",
        language: "",
        product: "",
        brand: "",
        model: "",
        offerDetails: "",
        attachment: null,
      });
    } catch (error) {
      console.error("Error response:", error.response?.data);
      alert("Error creating job: " + (error.response?.data?.message || error.message));
    }
    setLoading(false);
  };

  const handleDateChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, dueDate: value });
    console.log(formData)
  };

  return (
    <div className="p-10">
      {/* Header Section */}
      <div className="flex justify-between items-center pb-4">
        <PageTitle>Create Artwork Request</PageTitle>
        <StatusMessageWrapper loading={loading} success={success} error={error} />
        <Button variant="outline" width="auto" onClick={() => navigate('/create-artwork')}>Add Artwork</Button>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-12" >
        <div className="flex flex-col gap-3 bg-white border border-blue-300/60 rounded-lg p-10 w-xl">

          <div className="flex gap-8">
            <InputText name={'title'} label={'Title'} value={formData.title} handleOnChange={handleChange} placeholder={'Job Title'} />

          </div>
          <div className="flex gap-8">
            <SelectField
              label="Request Type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              options={["Full-Time", "Second-Time", "Part-Time"]}
            />
          </div>
          <div className="w-full">

            <label>Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
              <option value="">Select Priority</option>
              {Object.keys(PRIORITY).map((priority) => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
          </div>
          <input
            type="date"
            value={dueDate}
            onChange={handleDateChange}
            min={getMinDate()}
            max={getMaxDate()}
            className="mt-1 p-2 border rounded w-full"
          />

          <div className="bg-amber-50 border border-amber-100/75 p-5 rounded-md">

            <FileUpload onFileSelect={handleFileChange} />

            {uploadProgress > 0 && (
              <div className="flex items-center gap-2">
                <progress value={uploadProgress} max="100"></progress>
                <span>{uploadProgress}%</span>
              </div>
            )}

            {/* <p><strong>Size:</strong> {(formData.attachment.size / 1024).toFixed(2)} KB</p>
            <p><strong>Type:</strong> {formData.attachment.type}</p> */}
          </div>
        </div>
        <div className="w-full">
          <div className='fle gap-4 bg-gray-50 rounded-lg items-start justify-start'>
            <div className=' bg-white rounded-t-md w-fit border border-blue-300/70 overflow-hidden  ' style={{ boxShadow: "inset 0px -6px 5px 0px rgba(0, 0, 0, 0.13)" }}>
              <button type="button" className={`px-4 py-2 cursor-pointer ${activeTab === "location" ? 'bg-red-600/90 text-white' : ''}`} onClick={() => setActiveTab('location')}>Location</button>
              <button type="button" className={`px-4 py-2 cursor-pointer ${activeTab === "specifications" ? 'bg-red-600/90 text-white' : ''}`} onClick={() => setActiveTab('specifications')}>Specifications</button>
            </div>
          </div>

          <div className="flex flex-col gap-3 bg-white border border-blue-300/60 rounded-b-lg rounded-r-lg p-10  w-full">
            {
              activeTab === "location" && (
                <div>
                  <div className="flex gap-8">
                    <div className="w-full">

                      <label>Zone</label>
                      <select name="zone" value={formData.zone} onChange={handleChange} className="block w-full mt-1 border rounded-md p-2">
                        <option value="">Select Zone</option>
                        {Object.keys(ZONES).map((zone) => (
                          <option key={zone} value={zone}>{zone}</option>
                        ))}
                      </select>
                    </div>
                    <div className="w-full">
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
                </div>
              )}
 {
              activeTab === "specifications" && (
                <div>
            <div className="flex gap-8">
              <div className='flex flex-col gap-1 w-full'>
                <label>Product</label>
                <select
                  className="w-full border border-gray-400 rounded-md py-2 px-2"
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
              <div className='flex flex-col gap-1 w-full'>
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

            </div>
            <div className="flex gap-8">

              <div className='flex flex-col gap-1 w-full'>
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

              <InputText label={"Offer Type"} name="offerType" value={formData.offerType} handleOnChange={handleChange} placeholder="Offer Type" />
            </div>
            <textarea name="offerDetails" value={formData.offerDetails} onChange={handleChange} placeholder="Offer Details" className="w-full border p-2 rounded mt-5"></textarea>
            </div>)}

                  <div className="flex gap-5">
            <Button  type="submit">
              {loading ? "Creating..." : "Create Job"}
            </Button>
            <Button variant="outline">Back</Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default JobCreate;
