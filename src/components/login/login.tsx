'use client';

import Image from 'next/image';
import { useRouter } from 'nextjs-toploader/app';
import { useId, useState } from 'react';
import api from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { useAuthStore } from '@/store/auth-store';
import logo from '../../../public/logo.png';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Input } from '../ui/input';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginComponent() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const { setAuth } = useAuthStore();
  const emailId = useId();
  const passwordId = useId();
  const route = useRouter();

  /**
   * Validates the login form data.
   * Checks if the email and password fields are filled and if the email is in a valid format.
   * If any errors are found, updates the fieldErrors state with the error messages.
   * Returns true if the form data is valid, false otherwise.
   */
  const validate = () => {
    const errors: { email?: string; password?: string } = {};

    if (!email) {
      errors.email = 'Email is required';
    } else if (!emailRegex.test(email)) {
      errors.email = 'Enter a valid email address';
    }

    if (!password) {
      errors.password = 'Password is required';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Fetches user roles and permissions by user ID.
   * @param {string} userId The ID of the user to fetch roles and permissions for.
   * @returns {Promise<{roles: Array<{id: string, name: string, description: string | null}>, permissions: Array<{id: string, permissionName: string, description: string | null}>}>} A promise that resolves to an object containing arrays of roles and permissions.
   * @throws {Error} If there was an error while fetching the user's roles and permissions from the API.
   */
  const fetchUserRolesAndPermissions = async (userId: string) => {
    const response = await api.get(`api/user/${userId}/roles-permissions`);

    if (!response.data.success) {
      throw new Error(response.data.message || 'Failed to fetch user data');
    }

    return response.data.data;
  };

  /**
   * Performs a sign-in using the provided email and password.
   * @returns {Promise<User>} A promise that resolves to the user data if the sign-in is successful.
   * @throws {Error} If the sign-in fails, it throws an error with the exact error message from the server.
   */
  const performSignIn = async () => {
    try {
      const res = await authClient.signIn.email({
        email,
        password,
      });

      if (res.error) {
        // Throw the exact error message from the server
        throw new Error(
          res.error.message ||
            `Authentication failed${res.error.status ? ` (${res.error.statusText})` : ''}`
        );
      }

      if (!res.data?.user?.id) {
        throw new Error('User data not available');
      }

      return res.data.user;
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error(
          'Network error. Please check your internet connection.'
        );
      }

      // Re-throw the original error to preserve the exact message
      throw error;
    }
  };

  /**
   * Handles form submission by validating the input, performing a sign-in, fetching user roles and permissions, and then redirecting to the dashboard.
   * If any errors occur during the process, the form error state will be updated with the error message.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const user = await performSignIn();
      const { roles, permissions } = await fetchUserRolesAndPermissions(
        user.id
      );
      const userFullData = await api.get(`/api/user/${user.id}`);

      if (!userFullData.data.success) {
        throw new Error(
          userFullData.data.message || 'Failed to fetch user details'
        );
      }

      setAuth(
        {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image as string,
          organisationId: userFullData.data.data.data[0].organisationId,
        },
        roles,
        permissions
      );
      route.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setFormError(err.message);
      } else {
        setFormError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{
        backgroundColor: 'var(--background)',
        color: 'var(--foreground)',
      }}
    >
      {/* Left Side - Image (Hidden on mobile) */}
      <div className="relative hidden w-1/2 lg:block">
        <Image
          alt="Login illustration"
          className="object-cover"
          fill
          priority
          src={logo}
        />
        {/* Optional overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent" />

        {/* Optional content over image */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-white">
          <h1 className="mb-4 text-center font-bold text-4xl">Welcome Back</h1>
          <p className="text-center text-lg opacity-90">
            Sign in to continue to your dashboard
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex w-full items-center justify-center p-4 lg:w-1/2">
        <Card className="w-full max-w-md p-6 sm:p-8 md:p-10">
          {/* Logo for mobile (hidden on desktop) */}
          <div className="mb-6 flex justify-center lg:hidden">
            <Image
              alt="Logo"
              className="h-auto w-auto"
              height={40}
              src="/logo.png"
              width={120}
            />
          </div>

          <h2
            className="mb-6 text-center font-semibold"
            style={{
              fontSize: 'var(--text-xl, 1.5rem)',
              lineHeight: '1.2',
              color: 'var(--foreground)',
            }}
          >
            Login
          </h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                className="mb-1 block font-medium"
                htmlFor={emailId}
                style={{ color: 'var(--foreground-muted)' }}
              >
                Email
              </label>
              <Input
                id={emailId}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
              {fieldErrors.email && (
                <p
                  className="mt-1 text-red-500 text-sm"
                  id={`${emailId}-error`}
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div>
              <label
                className="mb-1 block font-medium"
                htmlFor={passwordId}
                style={{ color: 'var(--foreground-muted)' }}
              >
                Password
              </label>
              <Input
                id={passwordId}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="********"
                required
                type="password"
                value={password}
              />
              {fieldErrors.password && (
                <p
                  className="mt-1 text-red-500 text-sm"
                  id={`${passwordId}-error`}
                >
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {formError && <p className="text-red-500 text-sm">{formError}</p>}

            <Button className="w-full" disabled={loading} type="submit">
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
