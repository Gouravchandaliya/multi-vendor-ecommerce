import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  loginUser,
  selectIsLoading,
  selectAuthError,
  selectIsLoggedIn,
  selectUserRole,
  clearError,
} from '../../features/auth/authSlice';
import { mergeGuestCartThunk } from '../../features/cart/cartSlice';
import FormInput from '../../components/common/FormInput';

/**
 * Redirects to the right dashboard based on role after login.
 * Falls back to whatever page the user tried to visit before being
 * sent here by PrivateRoute (stored in location.state.from).
 */
const getRoleRedirect = (role) => {
  switch (role) {
    case 'admin':  return '/admin/dashboard';
    case 'seller': return '/seller/dashboard';
    default:       return '/buyer/dashboard';
  }
};

const LoginPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();

  const isLoading  = useSelector(selectIsLoading);
  const authError  = useSelector(selectAuthError);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole   = useSelector(selectUserRole);

  const [form, setForm]     = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isLoggedIn && userRole) {
      dispatch(mergeGuestCartThunk());
      const from = location.state?.from?.pathname;
      navigate(from || getRoleRedirect(userRole), { replace: true });
    }
  }, [isLoggedIn, userRole, navigate, location, dispatch]);

  // Clear server error when user starts typing again
  useEffect(() => {
    if (authError) dispatch(clearError());
  }, [form.email, form.password]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear field-level error on change
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.email.trim())    newErrors.email    = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email';
    if (!form.password)        newErrors.password = 'Password is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    dispatch(loginUser({ email: form.email, password: form.password }));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        {/* Server error banner */}
        {authError && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormInput
            id="email"
            label="Email address"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            error={errors.email}
            required
            autoComplete="email"
          />

          <FormInput
            id="password"
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="••••••••"
            error={errors.password}
            required
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white font-semibold rounded-lg transition focus:outline-none
              focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link to="/register" className="text-blue-600 font-medium hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
