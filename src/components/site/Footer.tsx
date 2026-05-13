export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-7xl mx-auto px-6 py-10 text-center">
        <div className="parchment-divider mb-6" />
        <p className="font-display text-blood text-2xl mb-2">Grim Portal</p>
        <p className="text-muted-foreground text-sm">
          Un mundo donde la luz agoniza y los dioses ya no escuchan.
        </p>
        <p className="text-xs text-muted-foreground/70 mt-4">
          © {new Date().getFullYear()} Grim Portal. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
