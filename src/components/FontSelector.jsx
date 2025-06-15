import Select from "react-select";

export default function FontSelector({ fields, setFields }) {
  const fonts = [
    { label: "Helvetica Regular", value: "u8g2_font_helvR" },
    { label: "Helvetica Bold", value: "u8g2_font_helvB" },
    { label: "Courier Regular", value: "u8g2_font_courR" },
    { label: "Courier Bold", value: "u8g2_font_courB" },
    { label: "New Century Schoolbook Regular", value: "u8g2_font_ncenR" },
    { label: "New Century Schoolbook Bold", value: "u8g2_font_ncenB" },
    { label: "Times Regular", value: "u8g2_font_timesR" },
    { label: "Times Bold", value: "u8g2_font_timesB" },
  ];

  const customSelectStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#374151", // Tailwind: bg-gray-700
      color: "white",
      borderColor: "#4B5563", // border-gray-600
      padding: "0.375rem", // ~p-2
      borderRadius: "0.375rem", // rounded-md
    }),
    singleValue: (base) => ({
      ...base,
      color: "white",
    }),
    option: (base, { isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isSelected
        ? "#9CA3AF"
        : isFocused
        ? "#4b5563"
        : "#1f2937",
      color: isSelected ? "white" : "white",
      cursor: "pointer",
      padding: "0.5rem", // p-2
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: "#1f2937",
      borderRadius: "0.375rem",
      marginTop: "0.25rem",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "white",
    }),
    indicatorSeparator: () => ({
      display: "none",
    }),
  };

  const updateFont = (newFontBase) => {
    setFields((prev) => ({
      ...prev,
      font: newFontBase,
    }));
  };

  const onFontChange = (selectedOption) => {
    updateFont(selectedOption?.value);
  };

  return (
    <div>
      <label className="block mb-1 font-semibold">Select Font:</label>

      <Select
        options={fonts}
        value={fonts.find((f) => f.value === fields.font) || null}
        onChange={onFontChange}
        isSearchable={false}
        styles={customSelectStyles}
      />
    </div>
  );
}
