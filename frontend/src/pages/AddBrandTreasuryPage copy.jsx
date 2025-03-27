import React, { useState,useEffect } from 'react';
import InputText from '../components/common/InputText';
import Button from '../components/common/Button';
import { addBrandTreasury } from '../api/brandTreasury';
import { fetchAllProducts, fetchBrandByProductId, fetchModelCategoriesByBrand } from '../api/masterDataApi';

const AddBrandTreasuryPage = () => {
    const [formData, setFormData] = useState({ title: '', product: '', brand: '', model: '' });
    const [products, setProducts] = useState([]);
    const [brands, setBrands] = useState([]);
    const [models, setModels] = useState([]);

    const [error, setError] = useState('');

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
        const productId = e.target.value;
        setFormData((prev) => ({ ...prev, product: productId, brand: '',model: '' }));
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
        const brandId = e.target.value;
        setFormData((prev) => ({ ...prev, brand: brandId, model:''}));
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

    const handleOnChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleOnSubmit = async (e) => {
        e.preventDefault();
        try {
            await addBrandTreasury(formData);
            console.log('Submitted successfully');
        } catch (error) {
            console.error('Error response:', error.response?.data);
            setError(error.response?.data?.message || 'Submission failed');
        }
    };

    return (
        <div>
            <form onSubmit={handleOnSubmit}>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-4">
                        <InputText
                            placeholder="Enter title"
                            name="title"
                            label="Title"
                            value={formData.title}
                            handleOnChange={handleOnChange}
                        />
                        <div className="w-full">
                            <div className='flex flex-col gap-1 w-full'>
                                <label>State</label>
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
                        </div>
                    </div>
                    <div>
                    <label>Brand</label>
                    <select name="brand" value={formData.brand} onChange={handleBrandChange} className="border p-2 rounded-md" disabled={!formData.product}>
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
                    <select name="model" value={formData.model} onChange={handleOnChange} className="border p-2 rounded-md" disabled={!formData.brand}>
                        <option value="">Select Model</option>
                        {models.map((model) => (
                            <option key={model._id} value={model._id}>
                                {model.name}
                            </option>
                        ))}
                    </select>
                    </div>
                    {error && <p className="text-red-500">{error}</p>}
                    <div className="flex gap-3">
                        <Button type="submit">Submit</Button>
                        <Button variant="outline">Cancel</Button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default AddBrandTreasuryPage;
