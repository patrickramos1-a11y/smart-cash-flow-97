import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * CurrencyInput — entrada monetária BRL consistente.
 *
 * - Sempre exibe formato pt-BR com prefixo "R$" (ex.: R$ 1.234,56)
 * - Aceita dígitos, vírgula e ponto durante a digitação; converte ponto→vírgula
 * - Emite o valor como número (number | null) via onValueChange
 * - Também atualiza onChange com o texto formatado, para manter retro-compat
 * - No blur, consolida a formatação completa (2 casas)
 *
 * Como usar:
 *   const [valor, setValor] = useState<number | null>(598.33);
 *   <CurrencyInput value={valor} onValueChange={setValor} />
 *
 * Ou com string (compat):
 *   <CurrencyInput value={String(valor)} onValueChange={(n)=>setValor(n ?? 0)} />
 */

export interface CurrencyInputProps
  extends Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> {
  value: number | string | null | undefined;
  onValueChange: (value: number | null) => void;
  /** Mostrar prefixo "R$" dentro do campo (padrão: true). */
  showPrefix?: boolean;
  /** Placeholder (padrão: "0,00"). */
  placeholder?: string;
}

// Converte qualquer representação numérica em número JS.
// Aceita "598,33", "598.33", "1.234,56", "1,234.56", "59833", etc.
export function parseBRLToNumber(input: string | number | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") return isFinite(input) ? input : null;
  const raw = String(input).trim();
  if (!raw) return null;

  // Remove prefixos e espaços
  const cleaned = raw.replace(/R\$\s?/gi, "").replace(/\s/g, "");
  if (!cleaned) return null;

  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");

  let normalized = cleaned;
  if (hasComma && hasDot) {
    // Formato pt-BR com separadores: "1.234,56" → "1234.56"
    // Se a última vírgula vier depois do último ponto, trata ponto como milhar.
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      // Caso oposto: "1,234.56" → "1234.56"
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma) {
    // Somente vírgula → decimal BR
    normalized = cleaned.replace(/\./g, "").replace(",", ".");
  } else {
    // Somente ponto OU só dígitos → já é decimal US ou inteiro
    normalized = cleaned;
  }

  const n = parseFloat(normalized);
  return isNaN(n) ? null : n;
}

// Formata número para exibição BRL (sem símbolo).
export function formatNumberBRL(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) return "";
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onValueChange, showPrefix = true, placeholder = "0,00", className, onBlur, onFocus, autoFocus, ...props }, ref) => {
    // Estado interno em CENTAVOS (inteiro). Ex.: R$ 91,00 → 9100.
    const toCents = (v: number | string | null | undefined): number => {
      const n = parseBRLToNumber(v as any);
      if (n === null) return 0;
      return Math.round(n * 100);
    };

    const [cents, setCents] = React.useState<number>(() => toCents(value));
    const isEditingRef = React.useRef(false);

    // Sincroniza com valor externo somente quando NÃO está em edição ativa.
    React.useEffect(() => {
      if (isEditingRef.current) return;
      setCents(toCents(value));
    }, [value]);

    const display = formatNumberBRL(cents / 100);

    const emit = (newCents: number) => {
      setCents(newCents);
      onValueChange(newCents / 100);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      isEditingRef.current = true;
      // Modo "caixa eletrônico": cada dígito empurra centavos da direita p/ esquerda.
      const digits = e.target.value.replace(/\D/g, "").slice(0, 14);
      const next = digits === "" ? 0 : parseInt(digits, 10);
      emit(next);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        isEditingRef.current = true;
        emit(Math.floor(cents / 10));
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isEditingRef.current = true;
      requestAnimationFrame(() => e.target.select());
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isEditingRef.current = false;
      onBlur?.(e);
    };

    return (
      <div className="relative">
        {showPrefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            R$
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className={cn(showPrefix && "pl-9", "text-right", className)}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
