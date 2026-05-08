import { Lock } from 'lucide-react';

interface NoAccessProps {
  moduleLabel?: string;
}

export function NoAccess({ moduleLabel }: NoAccessProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Lock className="w-7 h-7 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-display font-semibold mb-1">Sem acesso a este módulo</h2>
      <p className="text-sm text-muted-foreground max-w-sm">
        {moduleLabel ? (
          <>Seu perfil não tem permissão para acessar <strong>{moduleLabel}</strong>.</>
        ) : (
          'Seu perfil não tem permissão para acessar este módulo.'
        )}{' '}
        Solicite acesso ao administrador.
      </p>
    </div>
  );
}
