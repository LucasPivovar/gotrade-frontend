type RGB = [number, number, number];
function rgb(color: string): RGB {
  let value = /^#[\da-f]{3}([\da-f]{3})?$/i.test(color || '') ? color.slice(1) : '4fbb83';
  if (value.length === 3) value = value.split('').map((c) => c + c).join('');
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16)) as RGB;
}
const hex = (channels: number[]) => '#' + channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
export const mix = (a: string, b: string, amount: number) => hex(rgb(a).map((c, i) => c * (1 - amount) + rgb(b)[i] * amount));
function luminance(color: string) {
  const values = rgb(color).map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
export const contrast = (a: string, b: string) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
export const foreground = (background: string) => contrast(background, '#ffffff') > contrast(background, '#000000') ? '#ffffff' : '#000000';
function readable(color: string, background: string, minimum = 4.5) {
  let result = color;
  for (let i = 0; contrast(result, background) < minimum && i < 40; i++) result = mix(result, '#ffffff', 0.1);
  return result;
}
export function create(color: string, secondary?: string) {
  const primary = hex(rgb(color));
  const surface = '#202020';
  const surfaceRaised = '#262626';
  const subtle = mix(surface, primary, 0.14);
  const readableSurface = luminance(subtle) > luminance(surfaceRaised) ? subtle : surfaceRaised;
  const complement = hex(rgb(primary).map((c) => 255 - c));
  const hover = mix(primary, foreground(primary) === '#000000' ? '#ffffff' : '#000000', 0.12);
  return {
    primary, rgb: rgb(primary).join(', '), hover, onPrimary: foreground(primary), onHover: foreground(hover),
    background: '#191919', surface, surfaceRaised,
    border: '#333333', subtle,
    text: '#ffffff', muted: '#bfc3c7', accent: readable(primary, readableSurface),
    secondary: readable(secondary && secondary.toLowerCase() !== '#ffffff' ? hex(rgb(secondary)) : complement, readableSurface),
    complement: readable(complement, readableSurface),
  };
}
