'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ApplicationBrand } from '@/lib/application';

export default function PlatformPreview({
  tenantId,
  brand,
}: {
  tenantId: string;
  brand: ApplicationBrand;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const mobile = width > 0 && width < 400;
  const viewportWidth = mobile ? 390 : 1280;
  const viewportHeight = mobile ? 780 : 960;
  const scale = width / viewportWidth;
  const synchronize = useCallback(() => {
    if (
      !brand.name.trim() ||
      !/^#[0-9a-f]{6}$/i.test(brand.color) ||
      !/^#[0-9a-f]{6}$/i.test(brand.secondaryColor)
    )
      return;
    frame.current?.contentWindow?.postMessage(
      { type: 'GOTRADE_PREVIEW_BRANDING', tenantId, branding: brand },
      window.location.origin,
    );
  }, [brand, tenantId]);
  useEffect(() => {
    synchronize();
    const ready = (event: MessageEvent) => {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'GOTRADE_PREVIEW_READY'
      )
        synchronize();
    };
    window.addEventListener('message', ready);
    return () => window.removeEventListener('message', ready);
  }, [synchronize]);
  useEffect(() => {
    if (!container.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  return (
    <section className="gt-live-preview" aria-label="Prévia da plataforma">
      <h2>Prévia</h2>
      <div
        ref={container}
        className="gt-live-preview-frame"
        style={{ height: width ? viewportHeight * scale : 480 }}
      >
        <iframe
          ref={frame}
          src={`/prototipo/app?tenant=${tenantId}&preview=1`}
          title="Prévia do protótipo"
          onLoad={synchronize}
          style={{
            width: viewportWidth,
            height: viewportHeight,
            border: 0,
            display: 'block',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            visibility: width ? 'visible' : 'hidden',
          }}
        />
      </div>
    </section>
  );
}
