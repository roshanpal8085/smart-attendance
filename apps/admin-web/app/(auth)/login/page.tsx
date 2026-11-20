'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Radio, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid academic email address'),
  password: z.string().min(4, 'Password must be at least 4 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isSubmitting, error, setError } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // error handled by useAuth
    }
  };

  const handleDemoFill = (role: 'admin' | 'faculty') => {
    if (role === 'admin') {
      setValue('email', 'admin@college.edu');
      setValue('password', 'admin123');
    } else {
      setValue('email', 'dr.watson@college.edu');
      setValue('password', 'teacher123');
    }
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-slate-900">
      {/* Left decorative branding panel - hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800 text-white relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <Radio className="h-6 w-6 text-white animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Smart Attendance</h1>
            <p className="text-xs text-indigo-300">College Administration Portal</p>
          </div>
        </div>

        {/* Center Hero Description */}
        <div className="max-w-md space-y-4 relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" /> Next-Gen BLE Infrastructure
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-white leading-tight">
            Automated Proximity Attendance with Zero Friction
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage campus hardware beacons, live classroom lecture streams, faculty rosters,
            and real-time student check-in analytics with sub-second precision.
          </p>
        </div>

        {/* Bottom stats/footer */}
        <div className="grid grid-cols-3 gap-4 border-t border-slate-800/80 pt-6 relative z-10">
          <div>
            <p className="text-2xl font-bold text-white">99.8%</p>
            <p className="text-xs text-slate-400">Verification Accuracy</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">&lt; 1.5s</p>
            <p className="text-xs text-slate-400">BLE Detection Latency</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">100%</p>
            <p className="text-xs text-slate-400">Proxy Resistant</p>
          </div>
        </div>
      </div>

      {/* Right Login Form Container */}
      <div className="flex flex-1 flex-col justify-center items-center px-6 py-12 lg:px-12 bg-white">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
              <Radio className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Smart Attendance</h2>
              <p className="text-xs text-slate-500">Admin Console</p>
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Enter your authorized staff or administrator credentials
            </p>
          </div>

          {error && (
            <Alert variant="danger" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="admin@college.edu"
              autoComplete="email"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.email?.message}
              {...register('email')}
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              leftIcon={<Lock className="h-4 w-4" />}
              error={errors.password?.message}
              {...register('password')}
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-600">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                Remember this device
              </label>
              <a href="#" className="font-medium text-indigo-600 hover:text-indigo-500">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              className="w-full py-2.5 text-sm"
              isLoading={isSubmitting}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Sign In to Dashboard
            </Button>
          </form>

          {/* Quick Demo Credentials Assistant */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-500 mb-2">Quick Dev Login:</p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs flex-1"
                onClick={() => handleDemoFill('admin')}
              >
                Auto-fill Admin
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="text-xs flex-1"
                onClick={() => handleDemoFill('faculty')}
              >
                Auto-fill Faculty
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
