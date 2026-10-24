import { Clock, LayoutDashboard, LogIn, LogOut, MapPin, Phone, Users } from 'lucide-react';
import { BrandMark } from '../../lib/icons';
import { formatPhoneBR, onlyDigits } from '../../lib/utils';

interface FooterProps {
  siteTitle: string;
  footerText: string;
  visits: string;
  whatsappNumber: string;
  isAdmin?: boolean;
  /** False when VITE_ADMIN_EMAIL is missing — the panel is then disabled. */
  adminAvailable?: boolean;
  onAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

const QUICK_LINKS = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#notebooks', label: 'Notebooks seminovos' },
  { href: '#contato', label: 'Onde estamos' },
  { href: '#topo', label: 'Voltar ao topo' },
];

/** Keep the admin-managed copyright text but refresh the year automatically. */
function withCurrentYear(text: string): string {
  return text.replace(/\b(19|20)\d{2}\b/, String(new Date().getFullYear()));
}

export function Footer({
  siteTitle,
  footerText,
  visits,
  whatsappNumber,
  isAdmin = false,
  adminAvailable = true,
  onAdminLogin,
  onAdminLogout,
}: FooterProps) {
  const whatsappHref = `https://wa.me/${onlyDigits(whatsappNumber)}`;
  const visitCount = parseInt(visits || '0', 10);
  const formattedVisits = Number.isNaN(visitCount)
    ? '0'
    : visitCount.toLocaleString('pt-BR');

  return (
    <footer className="border-t border-white/8 bg-ink-950">
      <div className="container-page py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr] md:gap-12">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3">
              <BrandMark className="h-10 w-10" />
              <span className="text-xl font-black uppercase italic tracking-tighter text-white">
                {siteTitle}
              </span>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/45">
              Manutenção, upgrades e transformação gamer em notebooks e desktops.
              Atendimento técnico em toda Fortaleza e região.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5">
              <Users className="h-3.5 w-3.5 text-brand-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">
                {formattedVisits} visitas
              </span>
            </div>
          </div>

          {/* Links */}
          <nav aria-label="Links do rodapé">
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Navegação
            </h3>
            <ul className="space-y-3">
              {QUICK_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-medium text-white/60 transition-colors hover:text-brand-400"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="mb-5 text-xs font-black uppercase tracking-[0.18em] text-white/35">
              Contato
            </h3>
            <ul className="space-y-4 text-sm text-white/60">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>Fortaleza, CE<br />Atendimento em domicílio</span>
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <span>Segunda a sábado<br />Das 08h às 18h</span>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" />
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-brand-400"
                >
                  {formatPhoneBR(whatsappNumber)}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-5 border-t border-white/8 pt-7 sm:flex-row sm:justify-between">
          <p className="text-center text-xs leading-relaxed text-white/30 sm:text-left">
            {withCurrentYear(footerText)}
          </p>

          <div className="flex items-center gap-3">
            {isAdmin ? (
              <button
                type="button"
                onClick={onAdminLogout}
                className="btn btn-ghost btn-sm"
              >
                <LogOut className="h-4 w-4" />
                Sair do painel
              </button>
            ) : adminAvailable ? (
              <button
                type="button"
                onClick={onAdminLogin}
                className="btn btn-ghost btn-sm text-white/40"
                aria-label="Entrar no painel administrativo"
              >
                <LogIn className="h-4 w-4" />
                Área do técnico
              </button>
            ) : null}

            {isAdmin && (
              <a
                href="#topo"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <LayoutDashboard className="h-4 w-4" />
                Ver site
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
