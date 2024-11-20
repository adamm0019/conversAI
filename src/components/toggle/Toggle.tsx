import { useState, useEffect, useRef } from 'react';

import './Toggle.scss';

export function Toggle({
  defaultValue = false,
  values,
  labels,
  onChange = () => {},
}: {
  defaultValue?: string | boolean;
  values?: string[];
  labels?: string[];
  onChange?: (isEnabled: boolean, value: string) => void;
}) {
  // Convert string value to boolean based on whether it matches the first value
  const initialValue = typeof defaultValue === 'string'
    ? defaultValue === values?.[0]
    : !!defaultValue;

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState<boolean>(initialValue);

  const toggleValue = () => {
    const newValue = !value;
    setValue(newValue);
    // Pass the corresponding string value if values array is provided
    const stringValue = values ? values[newValue ? 0 : 1] : String(newValue);
    onChange(newValue, stringValue);
  };

  useEffect(() => {
    const leftEl = leftRef.current;
    const rightEl = rightRef.current;
    const bgEl = bgRef.current;
    if (leftEl && rightEl && bgEl) {
      if (value) {
        bgEl.style.left = rightEl.offsetLeft + 'px';
        bgEl.style.width = rightEl.offsetWidth + 'px';
      } else {
        bgEl.style.left = '';
        bgEl.style.width = leftEl.offsetWidth + 'px';
      }
    }
  }, [value]);

  // Update value when defaultValue changes
  useEffect(() => {
    if (typeof defaultValue === 'string') {
      setValue(defaultValue === values?.[0]);
    } else {
      setValue(!!defaultValue);
    }
  }, [defaultValue, values]);

  return (
    <div
      data-component="Toggle"
      onClick={toggleValue}
      data-enabled={value.toString()}
    >
      {labels && (
        <div className="label left" ref={leftRef}>
          {labels[0]}
        </div>
      )}
      {labels && (
        <div className="label right" ref={rightRef}>
          {labels[1]}
        </div>
      )}
      <div className="toggle-background" ref={bgRef}></div>
    </div>
  );
}
