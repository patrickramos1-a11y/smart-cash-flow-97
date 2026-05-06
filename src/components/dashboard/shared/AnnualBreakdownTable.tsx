import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/data/mockData';
import type { AnnualGroupRow } from '@/hooks/useAnnualBreakdown';

const MONTHS = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

interface Props {
  title: string;
  groups: AnnualGroupRow[];
  monthlyTotal: number[];
  total: number;
  groupLabel?: string;
}

export function AnnualBreakdownTable({ title, groups, monthlyTotal, total, groupLabel = 'Grupo' }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base lg:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">{groupLabel}</TableHead>
              {MONTHS.map(m => <TableHead key={m} className="text-right text-xs">{m}</TableHead>)}
              <TableHead className="text-right font-semibold">Total</TableHead>
              <TableHead className="text-right text-xs">%</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.map(g => {
              const pct = total > 0 ? (g.total / total) * 100 : 0;
              return (
                <TableRow key={g.groupId}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {g.color && <span className="w-2.5 h-2.5 rounded-sm" style={{ background: g.color }} />}
                      <span className="truncate">{g.groupName}</span>
                    </div>
                  </TableCell>
                  {g.monthly.map((v, i) => (
                    <TableCell key={i} className="text-right text-xs tabular-nums">
                      {v > 0 ? formatCurrency(v) : '—'}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold tabular-nums">{formatCurrency(g.total)}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{pct.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/40 font-semibold">
              <TableCell>Total</TableCell>
              {monthlyTotal.map((v, i) => (
                <TableCell key={i} className="text-right text-xs tabular-nums">{v > 0 ? formatCurrency(v) : '—'}</TableCell>
              ))}
              <TableCell className="text-right tabular-nums">{formatCurrency(total)}</TableCell>
              <TableCell className="text-right text-xs">100%</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
