import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllStores,
  approveStoreAction,
  rejectStoreAction,
  suspendStoreAction,
  reactivateStoreAction,
  clearStoreError,
  clearStoreSuccess,
  selectStores,
  selectStorePagination,
  selectStoreLoading,
  selectStoreSubmitting,
  selectStoreError,
  selectStoreSuccess,
} from '../../features/store/storeSlice';
import StatusBadge from '../../components/common/StatusBadge';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const ManageStores = () => {
  const dispatch     = useDispatch();
  const stores       = useSelector(selectStores);
  const pagination   = useSelector(selectStorePagination);
  const isLoading    = useSelector(selectStoreLoading);
  const isSubmitting = useSelector(selectStoreSubmitting);
  const error        = useSelector(selectStoreError);
  const success      = useSelector(selectStoreSuccess);

  const [activeTab, setActiveTab] = useState(''); // '' means All
  const [page, setPage]           = useState(1);

  // Rejection modal state
  const [rejectModalStore, setRejectModalStore] = useState(null);
  const [rejectionReason, setRejectionReason]   = useState('');

  const loadStores = (statusFilter = activeTab, pageNum = page) => {
    dispatch(fetchAllStores({ status: statusFilter, page: pageNum, limit: 10 }));
  };

  useEffect(() => {
    loadStores(activeTab, page);
  }, [activeTab, page]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (success) {
      setRejectModalStore(null);
      setRejectionReason('');
      const timer = setTimeout(() => dispatch(clearStoreSuccess()), 4000);
      return () => clearTimeout(timer);
    }
  }, [success, dispatch]);

  const handleTabChange = (status) => {
    setActiveTab(status);
    setPage(1);
  };

  const handleApprove = (id) => {
    if (window.confirm('Are you sure you want to approve this store?')) {
      dispatch(approveStoreAction(id)).then(() => loadStores());
    }
  };

  const handleOpenReject = (store) => {
    setRejectModalStore(store);
    setRejectionReason('');
  };

  const handleConfirmReject = () => {
    if (!rejectModalStore) return;
    if (!rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }
    dispatch(rejectStoreAction({
      id: rejectModalStore._id,
      rejectionReason: rejectionReason.trim(),
    })).then(() => loadStores());
  };

  const handleSuspend = (id) => {
    if (window.confirm('Are you sure you want to suspend this store?')) {
      dispatch(suspendStoreAction(id)).then(() => loadStores());
    }
  };

  const handleReactivate = (id) => {
    if (window.confirm('Are you sure you want to reactivate this store?')) {
      dispatch(reactivateStoreAction(id)).then(() => loadStores());
    }
  };

  const tabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
    { label: 'Suspended', value: 'suspended' },
  ];

  if (isLoading && stores.length === 0) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Store Management</h1>
          <p className="text-gray-500 text-sm mt-1">Review seller applications, approve, reject, or suspend stores</p>
        </div>

        <Alert type="success" message={success} onClose={() => dispatch(clearStoreSuccess())} />
        <Alert type="error"   message={error}   onClose={() => dispatch(clearStoreError())} />

        {/* Filter Tabs */}
        <div className="flex border-b border-gray-200 gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(tab.value)}
              className={`pb-3 px-4 text-sm font-semibold border-b-2 transition ${
                activeTab === tab.value
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Store List Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : stores.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <span className="text-4xl mb-2">🏬</span>
              <p className="text-sm font-medium text-gray-600">No stores found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3.5">Store & Seller</th>
                    <th className="text-left px-5 py-3.5">Contact & Location</th>
                    <th className="text-left px-5 py-3.5">Applied Date</th>
                    <th className="text-left px-5 py-3.5">Status</th>
                    <th className="text-left px-5 py-3.5">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {stores.map((store) => (
                    <tr key={store._id} className="hover:bg-gray-50/80 transition">
                      
                      <td className="px-5 py-4">
                        <p className="font-bold text-gray-900">{store.name}</p>
                        <p className="text-xs text-gray-400 font-mono">/{store.slug}</p>
                        <p className="text-xs text-gray-500 mt-1">Seller: {store.seller?.name || 'Unknown'}</p>
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-600 space-y-0.5">
                        <p>📧 {store.businessEmail || store.seller?.email}</p>
                        {store.businessPhone && <p>📞 {store.businessPhone}</p>}
                        {store.city && <p>📍 {store.city}, {store.country}</p>}
                      </td>

                      <td className="px-5 py-4 text-xs text-gray-500">
                        {new Date(store.createdAt).toLocaleDateString()}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={store.status} />
                        {store.status === 'rejected' && store.rejectionReason && (
                          <p className="text-[11px] text-red-600 mt-1 max-w-xs truncate" title={store.rejectionReason}>
                            Reason: {store.rejectionReason}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-xs font-semibold">
                        <div className="flex flex-wrap gap-2">
                          {store.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleApprove(store._id)}
                                disabled={isSubmitting}
                                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleOpenReject(store)}
                                disabled={isSubmitting}
                                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {store.status === 'approved' && (
                            <button
                              onClick={() => handleSuspend(store._id)}
                              disabled={isSubmitting}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition"
                            >
                              Suspend
                            </button>
                          )}

                          {(store.status === 'rejected' || store.status === 'suspended') && (
                            <button
                              onClick={() => handleReactivate(store._id)}
                              disabled={isSubmitting}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                            >
                              Reactivate
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center items-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-gray-500">Page {pagination.page} of {pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* Rejection Modal */}
      {rejectModalStore && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-lg font-bold text-gray-900">
              Reject Application: {rejectModalStore.name}
            </h3>
            <p className="text-xs text-gray-500">
              Please enter the reason for rejecting this seller application. This reason will be displayed to the seller.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Invalid business documentation or incomplete contact information."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRejectModalStore(null)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageStores;
