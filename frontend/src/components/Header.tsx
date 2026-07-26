import { useAuth } from '../contexts/AuthContext';

export function Header() {
  const { user } = useAuth();
  const displayName = user?.username || user?.sub || 'User';

  return (
    <header className="flex h-14 items-center justify-end border-b bg-background px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground">{displayName}</span>
        {user?.role && (
          <span className="rounded bg-secondary px-2 py-0.5 text-xs capitalize">
            {user.role}
          </span>
        )}
      </div>
    </header>
  );
}
