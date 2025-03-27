import React from "react";

const MultiSelect = ({ options, selected, onChange }) => {
  const toggleSelection = (value) => {
    if (selected.includes(value)) {
      onChange(selected.filter(item => item !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="border rounded-md px-2 py-1 w-60 bg-white relative">
      <div className="flex  gap-1 absolute top-[50px] bg-white border-gray-300 border rounded-sm px-3 py-1 ">
        {selected.map((lang) => (
          <span key={lang} className="bg-blue-200 px-2 py-1 rounded text-sm flex">
            {lang}
            <button onClick={() => toggleSelection(lang)} className="ml-2 text-red-500">×</button>
          </span>
        ))}
      </div>
      <select
        className="w-full mt-1 p-1"
        onChange={(e) => toggleSelection(e.target.value)}
        value=""
      >
        <option value="" disabled>Select Language</option>
        {options
          .filter(opt => !selected.includes(opt.value))
          .map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
      </select>
    </div>
  );
};

export default MultiSelect;
