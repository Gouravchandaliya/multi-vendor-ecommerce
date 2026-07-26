import { useEffect, useState } from 'react';
import FormInput from '../common/FormInput';

const ProductForm = ({ initialData = null, onSubmit, isSubmitting, error = null }) => {
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    brand: '',
    price: '',
    discountPrice: '0',
    stock: '0',
    isActive: true,
  });

  const [existingImages, setExistingImages] = useState([]); // Array of strings (URLs)
  const [newImages, setNewImages] = useState([]); // Array of File objects
  const [newPreviews, setNewPreviews] = useState([]); // Array of strings (ObjectURLs)
  const [formErrors, setFormErrors] = useState({});

  // Populate form on edit
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        brand: initialData.brand,
        price: initialData.price.toString(),
        discountPrice: initialData.discountPrice ? initialData.discountPrice.toString() : '0',
        stock: initialData.stock.toString(),
        isActive: initialData.isActive,
      });
      setExistingImages(initialData.images || []);
    }
  }, [initialData]);

  // Clean up ObjectURLs when previews change
  useEffect(() => {
    return () => {
      newPreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [newPreviews]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({
      ...p,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Check total limit (max 5 images combined)
    const totalCount = existingImages.length + newImages.length + files.length;
    if (totalCount > 5) {
      setFormErrors((p) => ({ ...p, images: 'You can upload a maximum of 5 images in total.' }));
      return;
    }

    // Validate file sizes and types
    const validFiles = [];
    const invalidErrors = [];
    files.forEach((file) => {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        invalidErrors.push(`${file.name}: only JPEG, JPG, PNG or WEBP allowed.`);
      } else if (file.size > 5 * 1024 * 1024) {
        invalidErrors.push(`${file.name} is too large (max 5MB).`);
      } else {
        validFiles.push(file);
      }
    });

    if (invalidErrors.length > 0) {
      setFormErrors((p) => ({ ...p, images: invalidErrors[0] }));
      return;
    }

    // Generate previews
    const previews = validFiles.map((file) => URL.createObjectURL(file));

    setNewImages((prev) => [...prev, ...validFiles]);
    setNewPreviews((prev) => [...prev, ...previews]);
    if (formErrors.images) setFormErrors((p) => ({ ...p, images: '' }));
  };

  const removeExistingImage = (idxToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const removeNewImage = (idxToRemove) => {
    // Revoke the object URL
    URL.revokeObjectURL(newPreviews[idxToRemove]);

    setNewImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setNewPreviews((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Product name is required';
    else if (form.name.trim().length < 2) errs.name = 'At least 2 characters';
    else if (form.name.trim().length > 100) errs.name = 'Max 100 characters';

    if (!form.description.trim()) errs.description = 'Description is required';
    else if (form.description.trim().length > 2000) errs.description = 'Max 2000 characters';

    if (!form.category.trim()) errs.category = 'Category is required';
    if (!form.brand.trim()) errs.brand = 'Brand is required';

    const p = Number(form.price);
    if (isNaN(p) || p < 0) errs.price = 'Price must be a positive number';

    const dp = Number(form.discountPrice);
    if (isNaN(dp) || dp < 0) errs.discountPrice = 'Discount price must be a non-negative number';
    else if (dp > p) errs.discountPrice = 'Discount price cannot exceed the original price';

    const s = Number(form.stock);
    if (isNaN(s) || s < 0 || !Number.isInteger(s)) errs.stock = 'Stock must be a non-negative integer';

    const totalImages = existingImages.length + newImages.length;
    if (totalImages === 0) errs.images = 'At least one product image is required';

    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const formData = new FormData();
    formData.append('name', form.name.trim());
    formData.append('description', form.description.trim());
    formData.append('category', form.category.trim());
    formData.append('brand', form.brand.trim());
    formData.append('price', form.price);
    formData.append('discountPrice', form.discountPrice);
    formData.append('stock', form.stock);
    formData.append('isActive', form.isActive);

    // Send array of existing images
    formData.append('existingImages', JSON.stringify(existingImages));

    // Append new files
    newImages.forEach((file) => {
      formData.append('images', file);
    });

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Basic Information</h2>
        
        <FormInput
          id="name"
          label="Product Name"
          value={form.name}
          onChange={handleChange}
          placeholder="e.g. Wireless Noise Cancelling Headphones"
          error={formErrors.name}
          required
        />

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={5}
            value={form.description}
            onChange={handleChange}
            placeholder="Provide a detailed description of features, specifications, and what's in the box..."
            className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none
              ${formErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
          />
          {formErrors.description ? (
            <p className="text-xs text-red-600 mt-1">{formErrors.description}</p>
          ) : (
            <p className="text-xs text-gray-400 text-right">{form.description.length}/2000</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            id="category"
            label="Category"
            value={form.category}
            onChange={handleChange}
            placeholder="e.g. Electronics"
            error={formErrors.category}
            required
          />

          <FormInput
            id="brand"
            label="Brand"
            value={form.brand}
            onChange={handleChange}
            placeholder="e.g. Sony"
            error={formErrors.brand}
            required
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Pricing & Inventory</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            id="price"
            label="Price ($)"
            type="number"
            value={form.price}
            onChange={handleChange}
            placeholder="99.99"
            error={formErrors.price}
            required
          />

          <FormInput
            id="discountPrice"
            label="Discount Price ($)"
            type="number"
            value={form.discountPrice}
            onChange={handleChange}
            placeholder="e.g. 79.99"
            error={formErrors.discountPrice}
          />

          <FormInput
            id="stock"
            label="Stock Quantity"
            type="number"
            value={form.stock}
            onChange={handleChange}
            placeholder="50"
            error={formErrors.stock}
            required
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            id="isActive"
            name="isActive"
            type="checkbox"
            checked={form.isActive}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Publish product immediately (Make Active)
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Product Images (Max 5)</h2>
        
        {formErrors.images && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg">{formErrors.images}</p>
        )}

        {/* Existing Images (For Edit Mode) */}
        {existingImages.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Current Images</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {existingImages.map((url, idx) => (
                <div key={`existing-${idx}`} className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden group">
                  <img src={url} alt={`Product ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeExistingImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition"
                    title="Remove Image"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Images Previews */}
        {newPreviews.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">New Uploads</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {newPreviews.map((url, idx) => (
                <div key={`new-${idx}`} className="relative aspect-square border border-gray-200 rounded-xl overflow-hidden group">
                  <img src={url} alt={`New upload preview ${idx}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeNewImage(idx)}
                    className="absolute top-1.5 right-1.5 p-1 bg-red-600/90 text-white rounded-full hover:bg-red-700 transition"
                    title="Cancel Upload"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Zone */}
        {(existingImages.length + newImages.length) < 5 && (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50/20 transition">
            <span className="text-3xl">📷</span>
            <span className="text-sm font-semibold text-blue-600 mt-2">Upload Images</span>
            <span className="text-xs text-gray-400 mt-1">Select JPEG, PNG, WEBP (Max 5MB each)</span>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
          text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving Product...</>
        ) : (
          initialData ? 'Update Product' : 'Publish Product'
        )}
      </button>
    </form>
  );
};

export default ProductForm;
