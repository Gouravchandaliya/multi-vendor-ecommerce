import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import adminAnalyticsService from '../../features/admin/adminAnalyticsService';
import Pagination from '../../components/common/Pagination';
import Alert from '../../components/common/Alert';
import { PageSpinner } from '../../components/common/Spinner';

const ManageUsers = () => {
  const [users, setUsers]           = useState([]);
  const [pagination, setPagination] = useState(null);
  const [role, setRole]             = useState('');
  const [search, setSearch]         = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage]             = useState(1);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState(null);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminAnalyticsService.getUsers({ role, search, page, limit: 10 });
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [role, search, page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  };

  const handleToggleStatus = async (userDoc) => {
    const action = userDoc.isActive === false ? 'activate' : 'deactivate';
    if (!window.confirm(`Are you sure you want to ${action} ${userDoc.name}'s account?`)) {
      return;
    }

    try {
      await adminAnalyticsService.toggleUserStatus(userDoc._id);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || `Failed to ${action} user account`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <nav className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-1">
              <Link to="/admin/dashboard" className="hover:text-blue-600">Admin Control Center</Link>
              <span>/</span>
              <span className="text-gray-900">User Management</span>
            </nav>
            <h1 className="text-2xl font-extrabold text-gray-900">User Directory & Status Control</h1>
          </div>

          <Link
            to="/admin/dashboard"
            className="px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-xs font-bold text-gray-700 rounded-xl transition"
          >
            ← Back to Control Center
          </Link>
        </div>

        <Alert type="error" message={error} />

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-auto flex-1">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search by user name or email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
            >
              Search
            </button>
          </form>

          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-bold">
            {[
              { label: 'All Roles', value: '' },
              { label: 'Buyers', value: 'buyer' },
              { label: 'Sellers', value: 'seller' },
              { label: 'Admins', value: 'admin' },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => { setRole(tab.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-lg transition ${
                  role === tab.value
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {isLoading ? (
            <PageSpinner />
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs text-gray-400 space-y-2">
              <span className="text-3xl block">👥</span>
              <p className="font-bold text-gray-700">No users found</p>
              <p>No user accounts matched your search or role filter criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-gray-400 uppercase text-[10px]">
                    <th className="px-6 py-3 font-bold">User Name</th>
                    <th className="px-6 py-3 font-bold">Email</th>
                    <th className="px-6 py-3 font-bold">Role</th>
                    <th className="px-6 py-3 font-bold">Account Status</th>
                    <th className="px-6 py-3 font-bold">Joined Date</th>
                    <th className="px-6 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                  {users.map((u) => (
                    <tr key={u._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                      <td className="px-6 py-4 font-mono text-gray-500">{u.email}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.role === 'admin'
                              ? 'bg-purple-100 text-purple-800'
                              : u.role === 'seller'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            u.isActive === false ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {u.isActive === false ? 'Deactivated' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {u.role !== 'admin' && (
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`text-xs font-bold px-3 py-1 rounded-lg border transition ${
                              u.isActive === false
                                ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100'
                            }`}
                          >
                            {u.isActive === false ? 'Activate' : 'Deactivate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination && pagination.totalPages > 1 && (
            <div className="p-4 border-t border-gray-100">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={(newPage) => setPage(newPage)}
              />
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ManageUsers;
