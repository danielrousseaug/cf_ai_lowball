import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('max-w-7xl mx-auto px-4 sm:px-6 lg:px-8', className)}
      {...props}
    />
  )
);

Container.displayName = 'Container';

export { Container };
