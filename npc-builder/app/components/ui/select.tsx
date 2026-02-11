import React from 'react';

interface SelectProps {
  options: { value: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({ options, value, onChange, label, placeholder }) => {
  return (
    <div className="flex flex-col">
      {label && <label className="mb-2 text-sm font-medium text-gray-700">{label}</label>}
      <select
        className="block w-full rounded-md border border-gray-300 bg-white py-2 px-3 text-base text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;