import React, { useState, useId } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * SmartInput Component
 * Impeccable design & WCAG 2.1 AA accessible smart input with real-time feedback,
 * auto-sanitization, tactile states, and animated micro-indicators.
 */
export default function SmartInput({
  label,
  value = '',
  onChange,
  onBlur,
  validator,
  sanitizer,
  icon: Icon,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  maxLength,
  inputMode,
  helperText,
  id: customId,
  className = '',
  inputClassName = '',
  showCharCount = false,
  ...props
}) {
  const generatedId = useId();
  const inputId = customId || generatedId;
  const [isFocused, setIsFocused] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  // Compute validation state
  const validation = validator ? validator(value) : { isValid: true, error: '' };
  const hasValue = String(value || '').length > 0;
  
  // Show error only after user interacts (focused & blurred) or typed full expected length
  const shouldShowError = isTouched && hasValue && !validation.isValid;
  const shouldShowSuccess = hasValue && validation.isValid && validator;

  const handleChange = (e) => {
    let nextVal = e.target.value;
    if (sanitizer) {
      nextVal = sanitizer(nextVal);
    }
    if (onChange) {
      onChange(nextVal, e);
    }
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    setIsTouched(true);
    if (onBlur) onBlur(e);
  };

  const handleFocus = () => {
    setIsFocused(true);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <label htmlFor={inputId} className="cursor-pointer flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500 font-bold" title="Required">*</span>}
          </label>
          {showCharCount && maxLength && (
            <span className={`text-[10px] font-mono ${value.length === maxLength ? 'text-emerald-600 font-bold' : 'text-slate-400'}`}>
              {value.length}/{maxLength}
            </span>
          )}
        </div>
      )}

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 flex items-center justify-center pointer-events-none text-slate-400">
            <Icon className={`w-4 h-4 transition-colors ${
              shouldShowError 
                ? 'text-rose-500' 
                : shouldShowSuccess 
                ? 'text-emerald-600' 
                : isFocused 
                ? 'text-[#1E56E3]' 
                : 'text-slate-400'
            }`} />
          </div>
        )}

        <input
          id={inputId}
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          maxLength={maxLength}
          inputMode={inputMode}
          placeholder={placeholder}
          aria-invalid={shouldShowError ? 'true' : 'false'}
          aria-describedby={shouldShowError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full py-2.5 text-xs rounded-xl transition-all outline-none font-medium ${
            Icon ? 'pl-10' : 'pl-3.5'
          } ${
            shouldShowSuccess || shouldShowError ? 'pr-9' : 'pr-3.5'
          } ${
            disabled
              ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
              : shouldShowError
              ? 'bg-rose-50/50 border-rose-300 text-slate-900 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
              : shouldShowSuccess
              ? 'bg-emerald-50/30 border-emerald-300 text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15'
              : 'bg-slate-50/90 border-slate-200/90 text-slate-900 hover:border-slate-300 focus:bg-white focus:border-[#1E56E3] focus:ring-2 focus:ring-blue-500/15'
          } border ${inputClassName}`}
          {...props}
        />

        {/* Validation Status Indicator Icon */}
        <div className="absolute right-3 flex items-center pointer-events-none">
          {shouldShowSuccess && (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 animate-in zoom-in-75 duration-150" />
          )}
          {shouldShowError && (
            <AlertCircle className="w-4 h-4 text-rose-500 animate-in zoom-in-75 duration-150" />
          )}
        </div>
      </div>

      {/* Accessible Error or Helper Message */}
      {shouldShowError ? (
        <p id={`${inputId}-error`} role="alert" className="text-[11px] text-rose-600 font-semibold flex items-center gap-1 animate-in fade-in duration-150">
          <span>{validation.error}</span>
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-[11px] text-slate-400 font-medium">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
