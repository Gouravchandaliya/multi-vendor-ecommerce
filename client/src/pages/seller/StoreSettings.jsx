import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  createStore, fetchMyStore, updateMyStore,
  clearStoreError, clearStoreSuccess,
  selectMyStore, selectMyStoreLoaded,
  selectStoreSubmitting, selectStoreLoading,
  selectStoreError, selectStoreSuccess,
} from '../../features/store/storeSlice';
import { selectUser } from '../../features/auth/authSlice';
import FormInput from '../../components/common/FormInput';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const STATUS_INFO = {
  pending:   { text: 'Your store is under review. You can edit details while waiting.', colour: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  approved:  { text: 'Your store is live! You can now add products.', colour: 'text-green-700 bg-green-50 border-green-200' },
  suspended: { text: 'Your store has been suspended. Contact support for more information.', colour: 'text-red-700 bg-red-50 border-red-200' },
};

const StoreSettings = () => {
  const dispatch     = useDispatch();
  const user         = useSelector(selectUser);
  const myStore      = useSelector(selectMyStore);
  const storeLoaded  = useSelector(selectMyStoreLoaded);
  const isLoading    = useSelector(selectStoreLoading);
  const isSubmitting = useSelector(selectStoreSubmitting);
  const error        = useSelector(selectStoreError);
  const success      = useSelector(selectStoreSuccess);

  const isCreate = !myStore;  // no store yet → show create form

  const [form, setForm] = useState({ name: '', description: '' });
  const [formErrors, setFormErrors] = useState({});

  // Load seller's store on mount
  useEffect(() => { dispatch(fetchMyStore()); }, [dispatch]);

  // When store loads, populate edit form
  useEffect(() => {
    if (myStore) {
      setForm({ name: myStore.name, description: myStore.description || '' });
    }
  }, [myStore]);

  // Auto-clear success after 4 s
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => dispatch(clearStoreSuccess()), 4000);
      return () => clearTimeout(t);
    }
  }, [success, dispatch]);

  if (!storeLoaded || isLoading) return <PageSpinner />;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (formErrors[name]) setFormErrors((p) => ({ ...p, [name]: '' }));
    if (error) dispatch(clearStoreError());
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Store name is required';
    else if (form.name.trim().length < 2) errs.name = 'At least 2 characters';
    else if (form.name.trim().length > 60) errs.name = 'Max 60 characters';
    if (form.description.length > 500) errs.description = 'Max 500 characters';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    if (isCreate) {
      dispatch(createStore({ name: form.name.trim(), description: form.description.trim() }));
    } else {
      dispatch(updateMyStore({ name: form.name.trim(), description: form.description.trim() }));
    }
  };

  const statusInfo = myStore ? STATUS_INFO[myStore.status] : null;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Page header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
          <p className="text-gray-500 text-sm mt-1">
            {isCreate ? 'Create your seller store to start listing products.' : 'Manage your store details.'}
          </p>
        </div>

        {/* Status banner (only when store exists) */}
        {statusInfo && (
          <div className={`flex items-center justify-between p-4 rounded-xl border ${statusInfo.colour}`}>
            <p className="text-sm">{statusInfo.text}</p>
            <StatusBadge status={myStore.status} />
          </div>
        )}

        {/* Success / error alerts */}
        <Alert type="success" message={success} onClose={() => dispatch(clearStoreSuccess())} />
        <Alert type="error"   message={error}   onClose={() => dispatch(clearStoreError())} />

        {/* Store info card (when store exists) */}
        {myStore && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Store Info</h2>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-gray-400">Store slug</dt>
                <dd className="font-mono text-gray-700 mt-0.5">/{myStore.slug}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Created</dt>
                <dd className="text-gray-700 mt-0.5">{new Date(myStore.createdAt).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-gray-400">Status</dt>
                <dd className="mt-0.5"><StatusBadge status={myStore.status} /></dd>
              </div>
              <div>
                <dt className="text-gray-400">Last updated</dt>
                <dd className="text-gray-700 mt-0.5">{new Date(myStore.updatedAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Create / Edit form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-5">
            {isCreate ? 'Create Store' : 'Edit Store Details'}
          </h2>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormInput
              id="name"
              label="Store name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Gourav's Electronics"
              error={formErrors.name}
              required
            />

            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={form.description}
                onChange={handleChange}
                placeholder="Tell customers what you sell..."
                maxLength={500}
                className={`w-full px-4 py-2.5 rounded-lg border text-sm text-gray-900 placeholder-gray-400
                  resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition
                  ${formErrors.description ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}`}
              />
              <div className="flex justify-between">
                {formErrors.description
                  ? <p className="text-xs text-red-600">{formErrors.description}</p>
                  : <span />}
                <span className="text-xs text-gray-400">{form.description.length}/500</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
                text-white font-semibold rounded-lg transition focus:outline-none
                focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isCreate ? 'Creating...' : 'Saving...'}</>
              ) : (
                isCreate ? 'Create Store' : 'Save Changes'
              )}
            </button>
          </form>
        </div>

        {/* Note for approved sellers */}
        {myStore?.status === 'approved' && (
          <p className="text-center text-xs text-gray-400">
            Products management coming in Phase 3.
          </p>
        )}

      </div>
    </div>
  );
};

export default StoreSettings;
