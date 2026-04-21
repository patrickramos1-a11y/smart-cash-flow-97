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
  ({ value, onValueChange, showPrefix = true, placeholder = "0,00", className, onBlur, ...props }, ref) => {
    // Texto interno mostrado no input
    const [text, setText] = React.useState<string>(() => {
      const n = parseBRLToNumber(value as any);
      return n === null ? "" : formatNumberBRL(n);
    });
    const [focused, setFocused] = React.useState(false);

    // Sincroniza quando o valor externo muda e o usuário não está digitando
    React.useEffect(() => {
      if (focused) return;
      const n = parseBRLToNumber(value as any);
      const next = n === null ? "" : formatNumberBRL(n);
      setText(next);
    }, [value, focused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Aceita somente dígitos, vírgula e ponto
      let raw = e.target.value.replace(/[^\d.,]/g, "");
      // Converte ponto em vírgula para coerência BR durante digitação
      // (só se não houver vírgula ainda — senão mantém o usuário colando "1.234,56")
      if (!raw.includes(",") && raw.includes(".")) {
        // Se tem apenas 1 ponto, tratar como decimal
        const dots = (raw.match(/\./g) || []).length;
        if (dots === 1) raw = raw.replace(".", ",");
      }
      setText(raw);
      const n = parseBRLToNumber(raw);
      onValueChange(n);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      const n = parseBRLToNumber(text);
      setText(n === null ? "" : formatNumberBRL(n));
      onValueChange(n);
      onBlur?.(e);
    };

    const handleFocus = () => setFocused(true);

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
          inputMode="decimal"
          value={text}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(showPrefix && "pl-9", className)}
          {...props}
        />
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
