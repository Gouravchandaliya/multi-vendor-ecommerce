import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import api from '../../services/api';
import { PageSpinner } from '../../components/common/Spinner';

const AdminDashboard = () => {
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    suspended: 0,
    rejected: 0,
    total: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [pendingRes, approvedRes, suspendedRes, rejectedRes] = await Promise.all([
          api.get('/stores?status=pending&limit=1'),
          api.get('/stores?status=approved&limit=1'),
          api.get('/stores?status=suspended&limit=1'),
          api.get('/stores?status=rejected&limit=1'),
        ]);

        setCounts({
          pending:   pendingRes.data.data.pagination.total,
          approved:  approvedRes.data.data.pagination.total,
          suspended: suspendedRes.data.data.pagination.total,
          rejected:  rejectedRes.data.data.pagination.total,
          total:     (pendingRes.data.data.pagination.total +
                      approvedRes.data.data.pagination.total +
                      suspendedRes.data.data.pagination.total +
                      rejectedRes.data.data.pagination.total),
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCounts();
  }, []);

  if (isLoading) return <PageSpinner />;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
          <p className="text-gray-500 text-sm mt-1">Platform overview and store approval workflow</p>
        </div>

        {/* Store Status Breakdown Counters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <Link
            to="/admin/manage-stores?status=pending"
            className="bg-white p-6 rounded-2xl border border-amber-200 shadow-sm hover:shadow transition group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">Pending Applications</span>
              <span className="text-2xl">⏳</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{counts.pending}</p>
            <span className="text-xs text-amber-600 font-medium mt-1 block group-hover:underline">Review applications &rarr;</span>
          </Link>

          <Link
            to="/admin/manage-stores?status=approved"
            className="bg-white p-6 rounded-2xl border border-green-200 shadow-sm hover:shadow transition group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Approved Stores</span>
              <span className="text-2xl">✅</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{counts.approved}</p>
            <span className="text-xs text-green-600 font-medium mt-1 block group-hover:underline">View active stores &rarr;</span>
          </Link>

          <Link
            to="/admin/manage-stores?status=suspended"
            className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow transition group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Suspended Stores</span>
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{counts.suspended}</p>
            <span className="text-xs text-gray-600 font-medium mt-1 block group-hover:underline">Manage suspensions &rarr;</span>
          </Link>

          <Link
            to="/admin/manage-stores?status=rejected"
            className="bg-white p-6 rounded-2xl border border-red-200 shadow-sm hover:shadow transition group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Rejected Applications</span>
              <span className="text-2xl">❌</span>
            </div>
            <p className="text-3xl font-extrabold text-gray-900 mt-2">{counts.rejected}</p>
            <span className="text-xs text-red-600 font-medium mt-1 block group-hover:underline">View rejected records &rarr;</span>
          </Link>

        </div>

        {/* Admin Navigation Cards */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Platform Management Modules</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/admin/manage-stores"
              className="p-5 border border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50/20 transition flex items-center justify-between group"
            >
              <div>
                <h3 className="font-bold text-gray-900 text-sm">Store Approvals & Management</h3>
                <p className="text-xs text-gray-500 mt-0.5">Approve, reject with reason, or suspend seller stores</p>
              </div>
              <span className="text-blue-600 font-bold group-hover:translate-x-1 transition-transform">&rarr;</span>
            </Link>

            <div className="p-5 border border-gray-100 rounded-xl opacity-60 flex items-center justify-between cursor-not-allowed">
              <div>
                <h3 className="font-bold text-gray-700 text-sm">User & Role Management</h3>
                <p className="text-xs text-gray-400 mt-0.5">Buyer and Seller user directory</p>
              </div>
              <span className="text-gray-400">&rarr;</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
