import React, { useId } from "react";

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, id, className = "", required, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-forest-900 mb-1.5"
          >
            {label}
            {required && <span className="text-earth-600 ml-1 font-semibold">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`
              w-full appearance-none rounded-lg bg-white text-forest-950
              border text-sm transition-colors duration-150 pl-3.5 pr-10 py-2.5
              ${
                error
                  ? "border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-600"
                  : "border-ivory-300 focus:border-forest-700 focus:ring-1 focus:ring-forest-700"
              }
              ${props.disabled ? "bg-ivory-100 cursor-not-allowed opacity-60" : "hover:border-forest-400"}
              ${className}
            `}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-forest-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && (
          <p id={errorId} className="mt-1.5 text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="mt-1.5 text-xs text-forest-600/75">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
