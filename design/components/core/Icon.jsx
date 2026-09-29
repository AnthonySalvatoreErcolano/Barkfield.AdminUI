import React from 'react';
import { ICONS } from './iconData.js';

export function Icon({ name, size = 18, strokeWidth = 1.75, color = 'currentColor', style, className, title }) {
  const body = ICONS[name];
  if (!body) return null;
  return React.createElement('svg', {
    xmlns: 'http://www.w3.org/2000/svg', width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
    stroke: color, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round',
    className, role: title ? 'img' : undefined, 'aria-hidden': title ? undefined : true, 'aria-label': title,
    style: Object.assign({ flexShrink: 0, display: 'block' }, style),
    dangerouslySetInnerHTML: { __html: body }
  });
}
