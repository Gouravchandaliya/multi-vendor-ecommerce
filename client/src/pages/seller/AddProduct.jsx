import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import {
  createProduct,
  clearProductError,
  clearProductSuccess,
  selectProductSubmitting,
  selectProductError,
  selectProductSuccess,
} from '../../features/product/productSlice';
import ProductForm from '../../components/seller/ProductForm';

const AddProduct = () => {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const isSubmitting = useSelector(selectProductSubmitting);
  const error        = useSelector(selectProductError);
  const success      = useSelector(selectProductSuccess);

  // Clear state on mount
  useEffect(() => {
    dispatch(clearProductError());
    dispatch(clearProductSuccess());
  }, [dispatch]);

  // Redirect on successful creation
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(clearProductSuccess());
        navigate('/seller/products');
      }, 1500);
    }
  }, [success, navigate, dispatch]);

  const handleSubmit = (formData) => {
    dispatch(createProduct(formData));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Navigation Header */}
        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="p-2 hover:bg-white rounded-lg transition border border-transparent hover:border-gray-200"
            title="Go back"
          >
            &larr; Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Product</h1>
            <p className="text-gray-500 text-sm mt-0.5">Publish a new item to your store</p>
          </div>
        </div>

        {/* Success message banner */}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl font-medium animate-pulse">
            ✓ {success} Redirecting to products list...
          </div>
        )}

        {/* Product Form */}
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />

      </div>
    </div>
  );
};

export default AddProduct;
