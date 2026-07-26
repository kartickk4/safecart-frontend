import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', name: 'India', flag: '🇮🇳' },
  { code: '+1', name: 'USA / Canada', flag: '🇺🇸' },
  { code: '+44', name: 'United Kingdom', flag: '🇬🇧' },
  { code: '+61', name: 'Australia', flag: '🇦🇺' },
  { code: '+971', name: 'UAE', flag: '🇦🇪' },
  { code: '+65', name: 'Singapore', flag: '🇸🇬' },
  { code: '+49', name: 'Germany', flag: '🇩🇪' },
  { code: '+33', name: 'France', flag: '🇫🇷' },
  { code: '+966', name: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+81', name: 'Japan', flag: '🇯🇵' },
];

export default function PhoneInput({ value = '', onChange, disabled = false, required = false, placeholder = "9876543210" }) {
  // Extract initial country code and local number
  const detectInitialState = (val) => {
    if (!val) return { code: '+91', number: '' };
    const matched = COUNTRY_CODES.find(c => val.startsWith(c.code));
    if (matched) {
      return {
        code: matched.code,
        number: val.slice(matched.code.length).replace(/\s+/g, '')
      };
    }
    if (val.startsWith('+')) {
      const codePart = val.slice(0, 3);
      const numPart = val.slice(3).replace(/\s+/g, '');
      return { code: codePart, number: numPart };
    }
    return { code: '+91', number: val.replace(/\s+/g, '') };
  };

  const [selectedCode, setSelectedCode] = useState(() => detectInitialState(value).code);
  const [localNumber, setLocalNumber] = useState(() => detectInitialState(value).number);

  useEffect(() => {
    const { code, number } = detectInitialState(value);
    setSelectedCode(code);
    setLocalNumber(number);
  }, [value]);

  const handleCodeChange = (e) => {
    const newCode = e.target.value;
    setSelectedCode(newCode);
    const cleanNum = localNumber.replace(/\D/g, '');
    const combined = cleanNum ? `${newCode}${cleanNum}` : '';
    if (onChange) onChange(combined);
  };

  const handleNumberChange = (e) => {
    const inputVal = e.target.value;
    const cleanNum = inputVal.replace(/\D/g, '');
    setLocalNumber(cleanNum);
    const combined = cleanNum ? `${selectedCode}${cleanNum}` : '';
    if (onChange) onChange(combined);
  };

  const currentCountry = COUNTRY_CODES.find(c => c.code === selectedCode) || { flag: '🌐', code: selectedCode };

  return (
    <div className="relative flex items-center w-full bg-slate-50 border border-slate-200 rounded-xl focus-within:ring-2 focus-within:ring-blue-500 focus-within:bg-white transition overflow-hidden">
      {/* Country Code Select Dropdown */}
      <div className="relative flex items-center bg-slate-100/80 hover:bg-slate-200/70 transition border-r border-slate-200 px-3 py-2.5 cursor-pointer min-w-[110px]">
        <span className="text-base mr-1.5">{currentCountry.flag}</span>
        <span className="text-xs font-bold text-slate-800">{selectedCode}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
        <select
          value={selectedCode}
          onChange={handleCodeChange}
          disabled={disabled}
          className="absolute inset-0 opacity-0 w-full h-full cursor-pointer disabled:cursor-not-allowed"
          title="Select Country Dialing Code"
        >
          {COUNTRY_CODES.map((item) => (
            <option key={item.code + item.name} value={item.code}>
              {item.flag} {item.code} ({item.name})
            </option>
          ))}
        </select>
      </div>

      {/* Local Phone Number Input */}
      <input
        type="tel"
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={localNumber}
        onChange={handleNumberChange}
        className="w-full px-3.5 py-2.5 bg-transparent text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none disabled:cursor-not-allowed"
      />
    </div>
  );
}
