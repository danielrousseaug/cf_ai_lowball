'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCreateTask } from '@/hooks/use-tasks';
import { Container } from '@/components/layout/container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const MOCK_USER_ID = 'test-user-1';

export default function CreateTaskPage() {
  const router = useRouter();
  const createTask = useCreateTask();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    currencyType: 'points' as const,
    duration: '24',
    category: '',
    auctionType: 'standard' as const,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await createTask.mutateAsync({
        title: formData.title,
        description: formData.description,
        creatorId: MOCK_USER_ID,
        startingPayment: {
          type: formData.currencyType,
          amount: parseFloat(formData.amount),
        },
        duration: parseInt(formData.duration) * 3600000, // hours to ms
        category: formData.category || undefined,
        auctionType: formData.auctionType,
      });

      alert('Task created successfully!');
      router.push('/');
    } catch (error: any) {
      alert(error.message || 'Failed to create task');
    }
  };

  return (
    <Container className="py-8 max-w-2xl">
      <Link href="/" className="text-sm text-gray-600 hover:text-gray-900 mb-4 inline-block">
        ← Back to tasks
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Create New Task</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Task Title
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Clean my garage"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the task in detail..."
                className="flex min-h-[120px] w-full border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Payment
                </label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="100"
                  required
                />
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-2">
                  Currency Type
                </label>
                <select
                  id="currency"
                  value={formData.currencyType}
                  onChange={(e) => setFormData({ ...formData, currencyType: e.target.value as any })}
                  className="flex h-10 w-full border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                >
                  <option value="cash">Cash ($)</option>
                  <option value="points">Points</option>
                  <option value="favorTokens">Favor Tokens</option>
                  <option value="timeBank">Time Bank (min)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (hours)
                </label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  required
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category (optional)
                </label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., cleaning"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={createTask.isPending} className="flex-1">
                Create Task
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => router.push('/')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
