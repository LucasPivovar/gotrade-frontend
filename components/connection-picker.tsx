'use client';

export default function ConnectionPicker({
  catalog,
  value,
  onChange,
  disabled = false,
}: {
  catalog: string[];
  value: string[];
  onChange: (connections: string[]) => void;
  disabled?: boolean;
}) {
  return (
    <>
      <label>
        Adicionar conexão
        <select
          aria-label="Adicionar conexão"
          value=""
          disabled={disabled}
          onChange={(e) => {
            const provider = e.target.value;
            if (catalog.includes(provider) && !value.includes(provider))
              onChange([...value, provider]);
          }}
        >
          <option value="">Selecione uma corretora</option>
          {catalog
            .filter((p) => !value.includes(p))
            .map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
        </select>
      </label>
      <div className="gt-connection-box">
        {value.length ? (
          value.map((p) => (
            <label className="gt-connection-chip" key={p}>
              <input
                type="checkbox"
                checked
                disabled={disabled}
                onChange={() => onChange(value.filter((x) => x !== p))}
              />
              {p}
            </label>
          ))
        ) : (
          <p className="gt-muted">Nenhuma conexão habilitada.</p>
        )}
      </div>
    </>
  );
}
