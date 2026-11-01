import React from 'react';

/**
 * Reusable Loading Skeleton Components
 * Uses high-contrast subtle shimmer gradients matching the native design tokens.
 */

export function MetricCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="w-8 h-8 rounded-xl skeleton-shimmer"></div>
        <div className="w-16 h-4 rounded-full skeleton-shimmer"></div>
      </div>
      <div className="space-y-1.5">
        <div className="w-24 h-6 rounded-md skeleton-shimmer"></div>
        <div className="w-32 h-3.5 rounded-md skeleton-shimmer"></div>
      </div>
    </div>
  );
}

export function ShipmentRowSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer shrink-0"></div>
        <div className="space-y-2">
          <div className="w-28 h-4 rounded-md skeleton-shimmer"></div>
          <div className="w-40 h-3 rounded-md skeleton-shimmer"></div>
        </div>
      </div>
      <div className="space-y-2 text-right flex flex-col items-end">
        <div className="w-16 h-4 rounded-md skeleton-shimmer"></div>
        <div className="w-12 h-3 rounded-md skeleton-shimmer"></div>
      </div>
    </div>
  );
}

export function CarrierCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full skeleton-shimmer"></div>
          <div className="w-20 h-4 rounded-md skeleton-shimmer"></div>
        </div>
        <div className="w-16 h-5 rounded-md skeleton-shimmer"></div>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-slate-100">
        <div className="w-14 h-3 rounded-md skeleton-shimmer"></div>
        <div className="w-24 h-3 rounded-md skeleton-shimmer"></div>
      </div>
    </div>
  );
}

export default function SkeletonLoader({ type = 'shipment', count = 3 }) {
  const items = Array.from({ length: count });

  if (type === 'metric') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {items.map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (type === 'carrier') {
    return (
      <div className="space-y-3">
        {items.map((_, i) => (
          <CarrierCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <ShipmentRowSkeleton key={i} />
      ))}
    </div>
  );
}
