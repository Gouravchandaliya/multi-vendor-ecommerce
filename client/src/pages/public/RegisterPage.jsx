import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import {
  registerUser,
  selectIsLoading,
  selectAuthError,
  selectIsLoggedIn,
  selectUserRole,
  clearError,
} from '../../features/auth/authSlice';
import { mergeGuestCartThunk } from '../../features/cart/cartSlice';
import FormInput from '../../components/common/FormInput';

const getRoleRedirect = (role) => {
  switch (role) {
    case 'seller': return '/seller/dashboard';
    default:       return '/buyer/dashboard';
  }
};

const RegisterPage = () => {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  const isLoading  = useSelector(selectIsLoading);
  const authError  = useSelector(selectAuthError);
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const userRole   = useSelector(selectUserRole);

  const [form, setForm] = useState({
    name:     '',
    email:    '',
    password: '',
    role:     'buyer',  // default selection
  });
  const [errors, setErrors] = useState({});

  // Redirect after successful registration
  useEffect(() => {
    if (isLoggedIn && userRole) {
      dispatch(mergeGuestCartThunk());
      navigate(getRoleRedirect(userRole), { replace: true });
    }
  }, [isLoggedIn, userRole, navigate, dispatch]);

  // Clear server error when user edits any field
  useEffect(() => {
    if (authError) dispatch(clearError());
  }, [form.name, form.email, form.password]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim())
      newErrors.name = 'Name is required';
    else if (form.name.trim().length < 2)
      newErrors.name = 'Name must be at least 2 characters';

    if (!form.email.trim())
      newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email))
      newErrors.email = 'Enter a valid email';

    if (!form.password)
      newErrors.password = 'Password is required';
    else if (form.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters';
    else if (!/\d/.test(form.password))
      newErrors.password = 'Password must contain at least one number';

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }
    dispatch(registerUser(form));
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">Join the marketplace today</p>
        </div>

        {/* Server error banner */}
        {authError && (
          <div role="alert" className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <FormInput
            id="name"
            label="Full name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="John Doe"
            error={errors.name}
            required
            autoComplete="name"
          />

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
            placeholder="Min. 6 characters with a number"
            error={errors.password}
            required
            autoComplete="new-password"
          />

          {/* Role selector — admin is intentionally not an option */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              I want to <span className="text-red-500" aria-hidden="true">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'buyer',  label: '🛒 Shop as Buyer' },
                { value: 'seller', label: '🏪 Sell Products' },
              ].map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer
                    text-sm font-medium transition select-none
                    ${form.role === value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    checked={form.role === value}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

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
                Creating account...
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
