'use client';

import { useTasks } from '@/hooks/use-tasks';
import { TaskCard } from '@/components/features/tasks/task-card';
import { Container } from '@/components/layout/container';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const { data: tasks, isLoading, error } = useTasks();

  return (
    <Container className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Active Tasks</h1>
          <p className="text-gray-600 mt-1">Bid low to win tasks</p>
        </div>
        <Link href="/tasks/create">
          <Button variant="secondary">Create Task</Button>
        </Link>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 h-64 animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3">
          <p>Failed to load tasks. Please try again later.</p>
        </div>
      )}

      {tasks && tasks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">No active tasks at the moment</p>
          <Link href="/tasks/create">
            <Button variant="secondary">Create the first task</Button>
          </Link>
        </div>
      )}

      {tasks && tasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks
            .filter((task: any) => task.status === 'active')
            .map((task: any) => (
              <TaskCard key={task.id} task={task} />
            ))}
        </div>
      )}
    </Container>
  );
}
