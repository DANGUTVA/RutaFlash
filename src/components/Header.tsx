import { Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="gradient-header px-6 py-5 shadow-lg">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-center gap-3">
          <Zap className="h-8 w-8 text-accent" />
          <div>
            <h1 className="text-2xl font-bold font-display text-primary-foreground tracking-tight">
              RutaFlash
            </h1>
            <p className="text-sm text-primary-foreground/70">
              IA para Última Milla
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
