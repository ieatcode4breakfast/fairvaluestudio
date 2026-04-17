import React, { useState, useEffect } from 'react';

interface NumericFormatProps {
  value: number | string | undefined | null;
  onValueChange: (values: { floatValue: number | undefined; value: string }) => void;
  className?: string;
  isAllowed?: (values: { floatValue: number | undefined }) => boolean;
  placeholder?: string;
  onFocus?: () => void;
}

export function NumericFormat({ value, onValueChange, className, isAllowed, placeholder, onFocus: onFocusProp }: NumericFormatProps) {
  const [display, setDisplay] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const stripped = display.replace(/,/g, '');
    const parsedCurrent = parseFloat(stripped);
    const currentFloat = isNaN(parsedCurrent) ? undefined : parsedCurrent;
    
    const parsedIncoming = value === '' || value === undefined || value === null ? NaN : parseFloat(String(value));
    const incomingFloat = isNaN(parsedIncoming) ? undefined : parsedIncoming;

    // If not focused, always sync.
    // If focused, only sync if the incoming value is mathematically different from what we are typing.
    // This prevents the parent from clobbering intermediate states like "1.", "-", or "0.0".
    if (!isFocused || incomingFloat !== currentFloat) {
      const s = value === '' || value === undefined || value === null ? '' : String(value);
      setDisplay(formatDisplay(s));
    }
  }, [value, isFocused]);

  function formatDisplay(raw: string) {
    if (raw === '' || raw === '-') return raw;
    const isNeg = raw.startsWith('-');
    const abs = isNeg ? raw.slice(1) : raw;
    const [int, dec] = abs.split('.');
    
    const intFormatted = int ? int.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
    
    let result = (isNeg ? '-' : '') + intFormatted;
    if (dec !== undefined) {
      result += '.' + dec;
    }
    return result;
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    const stripped = raw.replace(/,/g, '');
    
    if (!/^-?\d*\.?\d*$/.test(stripped) && stripped !== '') return;
    
    const parsed = parseFloat(stripped);
    const floatValue = isNaN(parsed) ? undefined : parsed;
    
    if (isAllowed && floatValue !== undefined) {
      if (!isAllowed({ floatValue })) return;
    }
    
    setDisplay(formatDisplay(stripped));
    onValueChange({ floatValue, value: stripped });
  }

  function handleBlur() {
    setIsFocused(false);
    // Clean up the display on blur (e.g. "1." becomes "1", "-" becomes "")
    const stripped = display.replace(/,/g, '');
    const parsed = parseFloat(stripped);
    if (isNaN(parsed)) {
      setDisplay('');
      onValueChange({ floatValue: undefined, value: '' });
    } else {
      setDisplay(formatDisplay(String(parsed)));
      onValueChange({ floatValue: parsed, value: String(parsed) });
    }
  }

  function handleFocus() {
    setIsFocused(true);
    onFocusProp?.();
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
}
