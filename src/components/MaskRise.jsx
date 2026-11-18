import React from 'react';

/**
 * MaskRise Component
 * Creates an elegant masked reveal animation where child elements glide up
 * into place from behind a clipped horizon mask.
 * 
 * Props:
 * - children: ReactNode
 * - delay: number in ms (e.g. 50, 100, 150) or string
 * - clip: boolean (if true, uses 100% full vertical clip translation; otherwise soft 24px rise)
 * - className: custom outer container class
 * - innerClassName: custom inner moving content class
 * - as: HTML container tag ('div', 'span', 'h1', etc.)
 */
export default function MaskRise({
  children,
  delay = 0,
  clip = false,
  className = '',
  innerClassName = '',
  as: Component = 'div',
  ...props
}) {
  const isInline = Component === 'span';
  const containerClass = isInline ? 'mask-rise-container' : 'mask-rise-container-block';
  const animClass = clip ? 'mask-rise-clip' : 'mask-rise';
  
  const style = delay > 0 ? { animationDelay: `${delay}ms` } : undefined;

  return (
    <Component className={`${containerClass} ${className}`} {...props}>
      <div className={`${animClass} ${innerClassName}`} style={style}>
        {children}
      </div>
    </Component>
  );
}
