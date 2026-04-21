/**
 * Resolução única de Conta + Centro de Custo a partir de uma categoria selecionada.
 *
 * Regra de inferência:
 *  - accountId    = categoria.default_account_id  →  override do usuário  →  null
 *  - costCenterId = categoria.cost_center_id (sempre vem da categoria)
 *  - isOrphan     = true se nenhuma conta puder ser resolvida (bloqueia submissão)
 *
 * Usada por todos os modais de lançamento e como guard final em
 * `useCreateTransaction`.
 */

export interface CategoryLike {
  id: string;
  default_account_id?: string | null;
  cost_center_id?: string | null;
  name?: string;
}

export interface ResolvedCategoryRouting {
  accountId: string | null;
  costCenterId: string | null;
  /** True quando nem categoria, nem override fornecem uma conta. */
  isOrphan: boolean;
  /** True quando o usuário precisa selecionar conta manualmente (categoria sem default). */
  needsAccountOverride: boolean;
}

export function resolveAccountAndCostCenter(
  category: CategoryLike | null | undefined,
  overrideAccountId?: string | null,
): ResolvedCategoryRouting {
  const fromCategory = category?.default_account_id ?? null;
  const accountId = fromCategory ?? overrideAccountId ?? null;

  return {
    accountId,
    costCenterId: category?.cost_center_id ?? null,
    isOrphan: !accountId,
    needsAccountOverride: !!category && !fromCategory,
  };
}
