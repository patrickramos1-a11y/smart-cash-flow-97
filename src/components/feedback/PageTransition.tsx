import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  routeKey: string;
  children: React.ReactNode;
  className?: string;
}

/** Subtle fade+lift on route/tab change. */
export function PageTransition({ routeKey, children, className }: PageTransitionProps) {
  const [shown, setShown] = useState(routeKey);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (routeKey === shown) return;
    setVisible(false);
    const t = setTimeout(() => {
      setShown(routeKey);
      setVisible(true);
    }, 120);
    return () => clearTimeout(t);
  }, [routeKey, shown]);

  return (
    <div
      key={shown}
      className={cn(
        'transition-all duration-300 ease-out will-change-[opacity,transform]',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1',
        className
      )}
    >
      {children}
    </div>
  );
}
