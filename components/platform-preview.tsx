import type { ApplicationBrand } from '@/lib/application';
export default function PlatformPreview({
  brand,
}: {
  tenantId: string;
  brand: ApplicationBrand;
}) {
  return (
    <section className="gt-live-preview" aria-label="Prévia da plataforma">
      <h2>Prévia</h2>
      <div className="gt-static-preview">
        <img
          src="/brand/platform-preview.png"
          alt={`Referência visual da plataforma ${brand.name}`}
        />
      </div>
    </section>
  );
}
