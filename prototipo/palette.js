(function(exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.foreground = exports.contrast = exports.mix = void 0;
exports.create = create;
function rgb(color) {
    let value = /^#[\da-f]{3}([\da-f]{3})?$/i.test(color || '') ? color.slice(1) : '4fbb83';
    if (value.length === 3)
        value = value.split('').map((c) => c + c).join('');
    return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
}
const hex = (channels) => '#' + channels.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('');
const mix = (a, b, amount) => hex(rgb(a).map((c, i) => c * (1 - amount) + rgb(b)[i] * amount));
exports.mix = mix;
function luminance(color) {
    const values = rgb(color).map((c) => c / 255).map((c) => c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
}
const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) / (Math.min(luminance(a), luminance(b)) + 0.05);
exports.contrast = contrast;
const foreground = (background) => (0, exports.contrast)(background, '#ffffff') > (0, exports.contrast)(background, '#000000') ? '#ffffff' : '#000000';
exports.foreground = foreground;
function readable(color, background, minimum = 4.5) {
    let result = color;
    for (let i = 0; (0, exports.contrast)(result, background) < minimum && i < 40; i++)
        result = (0, exports.mix)(result, '#ffffff', 0.1);
    return result;
}
function create(color, secondary) {
    const primary = hex(rgb(color));
    const surface = '#202020';
    const surfaceRaised = '#262626';
    const subtle = (0, exports.mix)(surface, primary, 0.14);
    const readableSurface = luminance(subtle) > luminance(surfaceRaised) ? subtle : surfaceRaised;
    const complement = hex(rgb(primary).map((c) => 255 - c));
    const hover = (0, exports.mix)(primary, (0, exports.foreground)(primary) === '#000000' ? '#ffffff' : '#000000', 0.12);
    return {
        primary, rgb: rgb(primary).join(', '), hover, onPrimary: (0, exports.foreground)(primary), onHover: (0, exports.foreground)(hover),
        background: '#191919', surface, surfaceRaised,
        border: '#333333', subtle,
        text: '#ffffff', muted: '#bfc3c7', accent: readable(primary, readableSurface),
        secondary: readable(secondary && secondary.toLowerCase() !== '#ffffff' ? hex(rgb(secondary)) : complement, readableSurface),
        complement: readable(complement, readableSurface),
    };
}

})(window.TradingProPalette = {});
