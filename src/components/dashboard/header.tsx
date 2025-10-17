import { checkHealth } from '@/lib/api';
import { Wrench } from 'lucide-react';

export default async function Header() {
  const { status } = await checkHealth();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 sm:px-6">
      <div className="flex items-center gap-2">
        <Wrench className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          Scrapit
        </h1>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <div
          className={`h-3 w-3 rounded-full ${
            status === 'ok' ? 'bg-green-500' : 'bg-red-500'
          } animate-pulse`}
        ></div>
        <span className="text-sm text-muted-foreground">
          {status === 'ok' ? 'API Connected' : 'API Error'}
        </span>
      </div>
    </header>
  );
}
