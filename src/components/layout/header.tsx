import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BusFront } from 'lucide-react';

export function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2">
          <BusFront className="h-8 w-8" />
          <h1 className="text-2xl font-headline font-bold">Tacna Transit Navigator</h1>
        </Link>
        <nav>
          <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground">
            <Link href="/">Mapa y Optimización</Link>
          </Button>
          <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-primary-foreground ml-2">
            <Link href="/admin">Panel de Admin</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
