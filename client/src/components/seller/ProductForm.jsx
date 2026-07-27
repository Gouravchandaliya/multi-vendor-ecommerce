import { useEffect, useState } from 'react';
import FormInput from '../common/FormInput';
import productService from '../../features/product/productService';

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

  // AI Assistant state
  const [aiNotes, setAiNotes]       = useState('');
  const [aiTone, setAiTone]         = useState('Professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError]       = useState(null);
  const [aiSuccessMsg, setAiSuccessMsg] = useState(null);
  const [aiHighlights, setAiHighlights] = useState([]);
  const [aiKeywords, setAiKeywords]   = useState([]);

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

  // AI Content Generator Trigger
  const handleGenerateAi = async () => {
    if (!form.name.trim()) {
      setFormErrors((p) => ({ ...p, name: 'Please enter a product name first to generate AI content.' }));
      return;
    }

    setIsGenerating(true);
    setAiError(null);
    setAiSuccessMsg(null);

    try {
      const content = await productService.generateAiContent({
        name: form.name.trim(),
        category: form.category.trim(),
        brand: form.brand.trim(),
        notes: aiNotes.trim(),
        tone: aiTone,
      });

      // Populate description (if not already custom typed, or append/overwrite after seller confirmation)
      if (content.description) {
        setForm((p) => ({
          ...p,
          description: content.description,
        }));
      }

      setAiHighlights(content.highlights || []);
      setAiKeywords(content.keywords || []);
      setAiSuccessMsg('✨ AI content generated successfully! Review and edit the description below before saving.');
    } catch (err) {
      setAiError(err.response?.data?.message || 'AI generation failed. You can continue entering product details manually.');
    } finally {
      setIsGenerating(false);
    }
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

    formData.append('existingImages', JSON.stringify(existingImages));

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

      {/* Basic Information Section */}
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

      {/* ✨ AI Content Generator Assistant Section */}
      <div className="bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-blue-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <div>
              <h2 className="text-sm font-extrabold text-blue-900">AI Product Content Assistant</h2>
              <p className="text-[11px] text-blue-700">Generate e-commerce descriptions and search tags from product facts</p>
            </div>
          </div>
          
          <select
            value={aiTone}
            onChange={(e) => setAiTone(e.target.value)}
            className="px-3 py-1.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Professional">Tone: Professional</option>
            <option value="Concise">Tone: Concise</option>
            <option value="Friendly">Tone: Friendly</option>
          </select>
        </div>

        {aiError && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
            ⚠️ {aiError}
          </div>
        )}

        {aiSuccessMsg && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl font-semibold">
            {aiSuccessMsg}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="aiNotes" className="text-xs font-bold text-blue-950 uppercase tracking-wider">
            Product Features & Specs (Optional facts for AI)
          </label>
          <textarea
            id="aiNotes"
            rows={2}
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="e.g. 40 hour battery, Bluetooth 5.3, active noise cancelling, USB-C fast charging..."
            className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="button"
          onClick={handleGenerateAi}
          disabled={isGenerating}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generating Content...
            </>
          ) : (
            '✨ Generate Description with AI'
          )}
        </button>

        {/* Generated Highlights & Keywords Preview */}
        {(aiHighlights.length > 0 || aiKeywords.length > 0) && (
          <div className="bg-white p-4 rounded-xl border border-blue-100 space-y-3 text-xs">
            {aiHighlights.length > 0 && (
              <div>
                <span className="font-bold text-gray-800 block mb-1">Key Highlights Suggested:</span>
                <ul className="list-disc list-inside text-gray-600 space-y-0.5">
                  {aiHighlights.map((h, idx) => (
                    <li key={idx}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {aiKeywords.length > 0 && (
              <div>
                <span className="font-bold text-gray-800 block mb-1">SEO Search Keywords:</span>
                <div className="flex flex-wrap gap-1.5">
                  {aiKeywords.map((kw, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-semibold text-[10px]">
                      #{kw}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Description Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-3">Product Description</h2>

        <div className="flex flex-col gap-1">
          <label htmlFor="description" className="text-sm font-medium text-gray-700">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            rows={6}
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
      </div>

      {/* Pricing & Inventory Section */}
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

      {/* Product Images Section */}
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
