import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-brand-black text-white">
      <div className="mx-auto max-w-6xl px-4 py-14 lg:px-6">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <Logo href="/" size="md" variant="white" />
            <p className="mt-5 text-sm leading-relaxed text-white/55 max-w-xs">
              Bulk SMS for Ghana and 190+ countries. Powered by Tecunit Ghana.
            </p>
          </div>
          <div>
            <p className="font-semibold text-primary mb-4 text-sm uppercase tracking-wider">
              Useful links
            </p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li><Link href="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link href="/features" className="hover:text-primary transition-colors">Why Split</Link></li>
              <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link href="/api-docs" className="hover:text-primary transition-colors">Developers</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">Reach Us</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-primary mb-4 text-sm uppercase tracking-wider">
              Reach us
            </p>
            <ul className="space-y-2.5 text-sm text-white/65">
              <li>
                <a href="mailto:support@tecunitgh.com" className="hover:text-primary transition-colors">
                  support@tecunitgh.com
                </a>
              </li>
              <li>+233 53 847 7596</li>
              <li>0242 530 753</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/45">
          © {new Date().getFullYear()} SplitSMS · Worlds Connected · All Rights Reserved
        </div>
      </div>
    </footer>
  );
}
