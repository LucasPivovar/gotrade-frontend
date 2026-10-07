'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  fullCrop,
  logoFile,
  renderLogo,
  type CropArea,
} from '@/lib/logo-image';

export default function LogoEditor({
  source,
  busy,
  onClose,
  onApply,
}: {
  source: string;
  busy: boolean;
  onClose: () => void;
  onApply: (file: File) => Promise<void>;
}) {
  const [crop, setCrop] = useState<CropArea>(fullCrop),
    [step, setStep] = useState<'crop' | 'finish'>('crop'),
    [remove, setRemove] = useState(false),
    [tolerance, setTolerance] = useState(30),
    [preview, setPreview] = useState(''),
    [processing, setProcessing] = useState(false),
    [error, setError] = useState('');
  const canvas = useRef<HTMLCanvasElement | null>(null),
    area = useRef<HTMLDivElement>(null),
    start = useRef<{ x: number; y: number; crop: CropArea } | null>(null);
  useEffect(() => {
    if (step !== 'finish') return;
    let current = true;
    setProcessing(true);
    setError('');
    renderLogo(source, crop, remove, tolerance)
      .then((result) => {
        if (current) {
          canvas.current = result;
          setPreview(result.toDataURL('image/png'));
        }
      })
      .catch((e) => {
        if (current) setError((e as Error).message);
      })
      .finally(() => {
        if (current) setProcessing(false);
      });
    return () => {
      current = false;
    };
  }, [source, crop, remove, tolerance, step]);
  const point = (event: React.PointerEvent) => {
    const bounds = area.current!.getBoundingClientRect();
    return {
      x: Math.max(
        0,
        Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100),
      ),
      y: Math.max(
        0,
        Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100),
      ),
    };
  };
  const working = busy || processing;
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !working) onClose();
      }}
    >
      <DialogContent className="gt-dialog gt-logo-dialog">
        <DialogHeader>
          <DialogTitle>
            {step === 'crop' ? 'Recortar logo' : 'Finalizar logo'}
          </DialogTitle>
          <DialogDescription>
            {step === 'crop'
              ? 'Arraste sobre a imagem para selecionar o corte.'
              : 'Confira a logo e escolha se deseja remover o fundo.'}
          </DialogDescription>
        </DialogHeader>
        {step === 'crop' ? (
          <>
            <div
              ref={area}
              className="gt-crop-area"
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                e.currentTarget.setPointerCapture(e.pointerId);
                start.current = { ...point(e), crop };
              }}
              onPointerMove={(e) => {
                if (!start.current) return;
                const p = point(e),
                  origin = start.current;
                const width = Math.max(1, Math.abs(p.x - origin.x)),
                  height = Math.max(1, Math.abs(p.y - origin.y));
                setCrop({
                  x: Math.min(p.x, origin.x),
                  y: Math.min(p.y, origin.y),
                  width: Math.min(width, 100 - Math.min(p.x, origin.x)),
                  height: Math.min(height, 100 - Math.min(p.y, origin.y)),
                });
              }}
              onPointerUp={() => {
                start.current = null;
              }}
              onPointerCancel={() => {
                start.current = null;
              }}
            >
              <img src={source} alt="Imagem para recortar" draggable={false} />
              <div
                className="gt-crop-selection"
                style={{
                  left: `${crop.x}%`,
                  top: `${crop.y}%`,
                  width: `${crop.width}%`,
                  height: `${crop.height}%`,
                }}
              />
            </div>
            <div className="gt-crop-sliders">
              {[
                { label: 'Esquerda', key: 'x', max: 100 - crop.width },
                { label: 'Topo', key: 'y', max: 100 - crop.height },
                { label: 'Largura', key: 'width', max: 100 - crop.x },
                { label: 'Altura', key: 'height', max: 100 - crop.y },
              ].map(({ label, key, max }) => (
                <label key={key}>
                  {label}
                  <input
                    type="range"
                    min={key === 'width' || key === 'height' ? 1 : 0}
                    max={max}
                    value={crop[key as keyof CropArea]}
                    onChange={(e) =>
                      setCrop({ ...crop, [key]: Number(e.target.value) })
                    }
                  />
                </label>
              ))}
            </div>
            <button
              type="button"
              className="gt-back"
              onClick={() => setCrop(fullCrop)}
            >
              Usar imagem inteira
            </button>
          </>
        ) : (
          <>
            <div className="gt-logo-checker">
              {preview && <img src={preview} alt="Prévia da logo recortada" />}
            </div>
            <label className="gt-logo-option">
              <input
                type="checkbox"
                checked={remove}
                onChange={(e) => {
                  setProcessing(true);
                  setRemove(e.target.checked);
                }}
              />
              <span>Remover fundo</span>
            </label>
            <p className="gt-muted">
              Ideal para fundos de uma só cor. Confira a transparência na
              prévia.
            </p>
            {remove && (
              <label className="gt-logo-tolerance">
                Ajuste da remoção
                <input
                  type="range"
                  min={5}
                  max={90}
                  value={tolerance}
                  onChange={(e) => {
                    setProcessing(true);
                    setTolerance(Number(e.target.value));
                  }}
                />
              </label>
            )}
          </>
        )}
        {error && (
          <p className="gt-form-error" role="alert">
            {error}
          </p>
        )}
        <div className="gt-form-actions">
          <button
            type="button"
            className="gt-button"
            disabled={working}
            onClick={() => (step === 'finish' ? setStep('crop') : onClose())}
          >
            {step === 'finish' ? 'Voltar' : 'Cancelar'}
          </button>
          {step === 'crop' ? (
            <button
              type="button"
              className="gt-button gt-primary"
              onClick={() => {
                setProcessing(true);
                setStep('finish');
              }}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="gt-button gt-primary"
              disabled={working || !canvas.current || !!error}
              onClick={async () => {
                if (!canvas.current) return;
                setProcessing(true);
                setError('');
                try {
                  await onApply(await logoFile(canvas.current));
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setProcessing(false);
                }
              }}
            >
              {working ? 'Processando…' : 'Usar logo'}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
