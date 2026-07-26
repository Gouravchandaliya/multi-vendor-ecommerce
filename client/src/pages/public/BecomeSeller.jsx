import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router';
import {
  createStore,
  fetchMyStore,
  clearStoreError,
  clearStoreSuccess,
  selectMyStore,
  selectMyStoreLoaded,
  selectStoreSubmitting,
  selectStoreError,
  selectStoreSuccess,
} from '../../features/store/storeSlice';
import { selectUser } from '../../features/auth/authSlice';
import FormInput from '../../components/common/FormInput';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const BecomeSeller = () => {
  const dispatch     = useDispatch();
  const navigate     = useNavigate();
  const user         = useSelector(selectUser);
  const myStore      = useSelector(selectMyStore);
  const isLoaded     = useSelector(selectMyStoreLoaded);
  const isSubmitting = useSelector(selectStoreSubmitting);
  const error        = useSelector(selectStoreError);
  const success      = useSelector(selectStoreSuccess);

  const [form, setForm] = useState({
    name: '',
    description: '',
    businessEmail: user?.email || '',
    businessPhone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchMyStore());
  }, [dispatch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Store name is required';
    else if (form.name.trim().length < 2) errs.name = 'At least 2 characters required';

    if (form.businessEmail && !/\S+@\S+\.\S+/.test(form.businessEmail)) {
      errs.businessEmail = 'Invalid email address';
    }
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    dispatch(createStore(form));
  };

  if (!isLoaded) return <PageSpinner />;

  // If user already submitted a store application, show application status screen
  if (myStore) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-lg w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-5">
          <span className="text-5xl">
            {myStore.status === 'approved' ? '🎉' :
             myStore.status === 'rejected' ? '❌' :
             myStore.status === 'suspended' ? '⚠️' : '⏳'}
          </span>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {myStore.status === 'approved' ? 'Store Approved & Active' :
               myStore.status === 'rejected' ? 'Application Rejected' :
               myStore.status === 'suspended' ? 'Privileges Suspended' :
               'Application Pending Approval'}
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              Store Name: <span className="font-semibold text-gray-800">{myStore.name}</span>
            </p>
          </div>

          {myStore.status === 'pending' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-4 rounded-xl">
              Your seller application has been submitted and is currently being reviewed by our administration team.
              Product creation will be enabled once approved.
            </div>
          )}

          {myStore.status === 'rejected' && (
            <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-4 rounded-xl text-left">
              <span className="font-bold block mb-1">Rejection Reason:</span>
              {myStore.rejectionReason || 'Your application did not meet our verification requirements.'}
            </div>
          )}

          <div className="pt-2">
            <Link
              to="/seller/dashboard"
              className="inline-flex items-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow transition"
            >
              Go to Seller Dashboard &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Submission success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center space-y-4">
          <span className="text-5xl">✅</span>
          <h1 className="text-2xl font-bold text-gray-900">Application Submitted!</h1>
          <p className="text-gray-600 text-sm">
            Your seller application for <span className="font-semibold">{form.name}</span> has been received.
          </p>
          <div className="bg-blue-50 border border-blue-100 text-blue-800 text-xs p-4 rounded-xl">
            Admin approval is required before you can begin creating and listing products for sale.
          </div>
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow transition"
          >
            View Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900">Become a Seller</h1>
          <p className="text-gray-500 text-sm mt-2">
            Start selling your products on MarketX by applying for your store.
          </p>
        </div>

        <Alert type="error" message={error} onClose={() => dispatch(clearStoreError())} />

        <form onSubmit={handleSubmit} noValidate className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 space-y-6">
          
          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Store Identity</h2>

            <FormInput
              id="name"
              label="Store Name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Apex Tech Essentials"
              error={formErrors.name}
              required
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Store Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                placeholder="Describe your store and the products you plan to sell..."
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Business Contact Details</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                id="businessEmail"
                label="Business Email"
                type="email"
                value={form.businessEmail}
                onChange={handleChange}
                placeholder="sales@store.com"
                error={formErrors.businessEmail}
              />

              <FormInput
                id="businessPhone"
                label="Business Phone"
                value={form.businessPhone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-100 pb-2">Business Address</h2>

            <FormInput
              id="address"
              label="Street Address"
              value={form.address}
              onChange={handleChange}
              placeholder="123 Commerce Way, Suite 100"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <FormInput
                id="city"
                label="City"
                value={form.city}
                onChange={handleChange}
                placeholder="New York"
              />
              <FormInput
                id="state"
                label="State"
                value={form.state}
                onChange={handleChange}
                placeholder="NY"
              />
              <FormInput
                id="country"
                label="Country"
                value={form.country}
                onChange={handleChange}
                placeholder="USA"
              />
              <FormInput
                id="postalCode"
                label="Postal Code"
                value={form.postalCode}
                onChange={handleChange}
                placeholder="10001"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting Application...</>
            ) : (
              'Submit Seller Application'
            )}
          </button>

        </form>

      </div>
    </div>
  );
};

export default BecomeSeller;
