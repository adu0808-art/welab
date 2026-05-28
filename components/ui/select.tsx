import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * 단순 네이티브 select. shadcn Radix-Select 대체.
 * 한국 모바일 환경에서는 네이티브 select 가 가장 친숙·안전합니다.
 */
export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      'flex h-11 w-full appearance-none rounded-md border border-border bg-white px-3 py-2 text-base shadow-sm transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
      'disabled:cursor-not-allowed disabled:opacity-50',
      // 화살표
      "bg-[url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%231F3A5F'%3e%3cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3e%3c/svg%3e\")]",
      'bg-no-repeat bg-[length:1rem_1rem] bg-[right_0.75rem_center] pr-9',
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = 'Select';
