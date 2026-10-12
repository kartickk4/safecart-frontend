import React from 'react';
import { Truck, CheckCircle2 } from 'lucide-react';
import CarrierLogo from './CarrierLogo';

/**
 * CarrierComparisonCard — shows carrier price quotes in light friendly colors.
 * Allows user to select a different carrier.
 */
const CarrierComparisonCard = ({ quotes = [], selectedSlug, onSelect }) => {
  if (!quotes || quotes.length === 0) return null;

  return (
    <div style={{
      background: '#f8faff',
      border: '1.5px solid #e0e7ff',
      borderRadius: '16px',
      padding: '14px',
      marginTop: '8px',
      marginBottom: '8px',
      boxShadow: '0 2px 8px rgba(99, 102, 241, 0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        color: '#4f46e5',
        fontSize: '11px',
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        marginBottom: '10px'
      }}>
        <Truck size={14} />
        <span>Available Carrier Quotes</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {quotes.map((q) => {
          const isSelected = q.slug === selectedSlug;
          const isLowest   = q.isLowest;
          return (
            <button
              key={q.slug}
              type="button"
              onClick={() => onSelect && onSelect(q)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: isSelected ? '#eef2ff' : '#ffffff',
                border: isSelected ? '2px solid #6366f1' : '1.5px solid #e2e8f0',
                borderRadius: '12px',
                padding: '10px 14px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                width: '100%',
                textAlign: 'left',
                boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.12)' : '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CarrierLogo slug={q.slug} name={q.name} size="md" />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#1e293b', fontSize: '13px', fontWeight: '700' }}>
                      {q.name}
                    </span>
                    {isLowest && (
                      <span style={{
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '9.5px',
                        fontWeight: '800',
                        padding: '2px 7px',
                        borderRadius: '12px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em'
                      }}>
                        Cheapest
                      </span>
                    )}
                  </div>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                    ⏱ {q.eta}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '800'
                }}>
                  ₹{q.price?.toLocaleString('en-IN') || q.price}
                </span>
                {isSelected && (
                  <CheckCircle2 size={16} color="#6366f1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default CarrierComparisonCard;
