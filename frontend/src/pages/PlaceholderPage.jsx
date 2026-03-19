import { Link } from "react-router-dom";

export default function PlaceholderPage({
  title,
  subtitle,
  ctaLabel,
  ctaTo,
}) {
  return (
    <section>
      <header className="mb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{title}</p>
        <h1 className="text-3xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      </header>

      <div className="rounded-2xl border border-borderSoft bg-white p-6 shadow-panel">
        <p className="text-sm text-slate-600">This module is connected and ready for feature expansion.</p>
        {ctaLabel && ctaTo ? (
          <Link
            to={ctaTo}
            className="mt-4 inline-flex rounded-full bg-[#101521] px-4 py-2 text-sm font-semibold text-white"
          >
            {ctaLabel}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
