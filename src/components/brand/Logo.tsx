import { cn } from '@/lib/utils';
import logoSymbol from '@/assets/brand/logo-symbol.png';
import logoHorizontal from '@/assets/brand/logo-horizontal.png';
import logoVertical from '@/assets/brand/logo-vertical.png';
import logoVerticalMono from '@/assets/brand/logo-vertical-mono.png';
import watermark from '@/assets/brand/watermark.png';

type LogoVariant = 'symbol' | 'horizontal' | 'vertical' | 'vertical-mono' | 'watermark';

interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  alt?: string;
}

const sources: Record<LogoVariant, string> = {
  symbol: logoSymbol,
  horizontal: logoHorizontal,
  vertical: logoVertical,
  'vertical-mono': logoVerticalMono,
  watermark,
};

export function Logo({ variant = 'symbol', className, alt = 'Ramos Engenharia' }: LogoProps) {
  return (
    <img
      src={sources[variant]}
      alt={alt}
      className={cn('select-none', className)}
      draggable={false}
    />
  );
}
