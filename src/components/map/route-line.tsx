import type { Route } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { MapPin, XCircle, CheckCircle } from 'lucide-react';

interface RouteLineProps {
  route: Route;
}

export function RouteLine({ route }: RouteLineProps) {
  const isBlocked = route.status === 'blocked';
  return (
    <div
      className={`p-3 rounded-md border flex items-center justify-between transition-all duration-300 ease-in-out ${
        isBlocked ? 'bg-accent/20 border-accent text-accent-foreground' : 'bg-card hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-3">
        <MapPin className={`h-5 w-5 ${isBlocked ? 'text-accent' : 'text-primary'}`} />
        <div>
          <p className={`font-medium ${isBlocked ? '' : 'text-card-foreground'}`}>{route.name}</p>
          <p className={`text-xs ${isBlocked ? 'text-accent-foreground/80' : 'text-muted-foreground'}`}>{route.pathDescription}</p>
        </div>
      </div>
      <Badge variant={isBlocked ? 'destructive' : 'secondary'} className="flex items-center gap-1">
        {isBlocked ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
        {isBlocked ? 'Bloqueada' : 'Abierta'}
      </Badge>
    </div>
  );
}
