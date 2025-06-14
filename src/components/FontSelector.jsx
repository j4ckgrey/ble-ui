import React, { useState } from "react";

export default function FontSelector({ fields, setFields }) {
  const fonts = [
    { label: "Helvetica Regular", value: "u8g2_font_helvR" },
    { label: "Helvetica Bold", value: "u8g2_font_helvB" },
    { label: "Courier Regular", value: "u8g2_font_courR" },
    { label: "Courier Bold", value: "u8g2_font_courB" },
    { label: "Times Regular", value: "u8g2_font_timesR" },
    { label: "Times Bold", value: "u8g2_font_timesB" },
  ];

  const updateFont = (newFontBase) => {
    setFields((prev) => ({
      ...prev,
      font: newFontBase,
    }));
  };

  const onFontChange = (e) => {
    const newFont = e.target.value;
    updateFont(newFont);
  };

  return (
    <div className="flex w-full">
      <label className="flex items-center gap-4">
        Select Font:
        <select
          value={fields.font}
          onChange={onFontChange}
          className="border rounded"
        >
          {fonts.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
