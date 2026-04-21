import { Search, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface CategorySearchInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

/**
 * Search input designed to live inside a Radix `<SelectContent>`.
 * - Stops key/pointer propagation so Radix doesn't steal focus / trigger typeahead.
 * - Filters by substring (case + accent insensitive) — handled by the parent.
 */
export function CategorySearchInput({ value, onChange, placeholder = 'Buscar categoria...' }: CategorySearchInputProps) {
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Defer focus so Radix mounting doesn't fight us
    const t = setTimeout(() => ref.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className="sticky top-0 z-20 bg-popover border-b p-2"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // Prevent Radix Select typeahead/navigation from hijacking the input
            e.stopPropagation();
          }}
          placeholder={placeholder}
          className="w-full h-8 pl-7 pr-7 text-xs rounded-md bg-background border border-input outline-none focus:ring-1 focus:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-muted text-muted-foreground"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/** Normalizes string for substring matching (lowercase + strips accents). */
export function normalizeForSearch(s: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}
