import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams, Link } from 'react-router';
import {
  fetchProductById,
  updateProduct,
  clearProductError,
  clearProductSuccess,
  resetCurrentProduct,
  selectCurrentProduct,
  selectProductLoading,
  selectProductSubmitting,
  selectProductError,
  selectProductSuccess,
} from '../../features/product/productSlice';
import ProductForm from '../../components/seller/ProductForm';
import { PageSpinner } from '../../components/common/Spinner';

const EditProduct = () => {
  const { id }       = useParams();
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  
  const product      = useSelector(selectCurrentProduct);
  const isLoading    = useSelector(selectProductLoading);
  const isSubmitting = useSelector(selectProductSubmitting);
  const error        = useSelector(selectProductError);
  const success      = useSelector(selectProductSuccess);

  // Fetch product on mount
  useEffect(() => {
    dispatch(clearProductError());
    dispatch(clearProductSuccess());
    dispatch(fetchProductById(id));

    return () => {
      dispatch(resetCurrentProduct());
    };
  }, [id, dispatch]);

  // Redirect on successful save
  useEffect(() => {
    if (success) {
      setTimeout(() => {
        dispatch(clearProductSuccess());
        navigate('/seller/products');
      }, 1500);
    }
  }, [success, navigate, dispatch]);

  const handleSubmit = (formData) => {
    dispatch(updateProduct({ id, formData }));
  };

  if (isLoading || !product) return <PageSpinner />;

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
            <p className="text-gray-500 text-sm mt-0.5">Modify product details and stock status</p>
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
          initialData={product}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          error={error}
        />

      </div>
    </div>
  );
};

export default EditProduct;
