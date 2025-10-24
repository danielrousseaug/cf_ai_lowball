'use client';

import Link from 'next/link';
import { useUserBalance } from '@/hooks/use-user';
import { formatCurrency } from '@/lib/utils';

const MOCK_USER_ID = 'test-user-1'; // For demo purposes

export function Header() {
  const { data: balance } = useUserBalance(MOCK_USER_ID);

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-gray-900">
              Lowball
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Tasks
              </Link>
              <Link
                href="/tasks/create"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Create Task
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Dashboard
              </Link>
              <Link
                href="/leaderboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Leaderboard
              </Link>
              <Link
                href="/chat"
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
              >
                Chat
              </Link>
            </nav>
          </div>

          {balance && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-gray-600">
                Cash: <span className="font-medium text-gray-900">{formatCurrency({ type: 'cash', amount: balance.cash })}</span>
              </div>
              <div className="text-gray-600">
                Points: <span className="font-medium text-gray-900">{formatCurrency({ type: 'points', amount: balance.points })}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
