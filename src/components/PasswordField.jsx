"use client";

import { useId, useState } from "react";

export default function PasswordField({
  id,
  label,
  autoComplete = "current-password",
  ...inputProps
}) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fieldId} className="text-sm font-medium text-text">
        {label}
      </label>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 pr-16 text-sm text-text"
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="focus-ring absolute inset-y-0 right-2 my-1 rounded-md px-2 text-xs font-medium text-text-muted hover:text-text"
          aria-pressed={visible}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
}
