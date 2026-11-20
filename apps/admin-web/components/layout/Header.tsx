'use client';

import React from 'react';
import { Menu, LogOut, Shield, User as UserIcon } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Open navigation menu"
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <Breadcrumb />
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* User Info */}
        <div className="flex items-center gap-3 pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-semibold text-sm">
            {user?.full_name ? user.full_name[0].toUpperCase() : <UserIcon className="h-4 w-4" />}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-xs font-semibold text-slate-900 leading-none">
              {user?.full_name || 'Admin User'}
            </p>
            <div className="flex items-center gap-1 mt-0.5">
              <Shield className="h-3 w-3 text-indigo-500" />
              <p className="text-[11px] font-medium text-slate-500 capitalize">
                {user?.role || 'Administrator'}
              </p>
            </div>
          </div>
        </div>

        {/* Logout Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => logout()}
          leftIcon={<LogOut className="h-3.5 w-3.5 text-slate-500" />}
          className="text-xs text-slate-700"
        >
          <span className="hidden sm:inline">Sign Out</span>
        </Button>
      </div>
    </header>
  );
}
