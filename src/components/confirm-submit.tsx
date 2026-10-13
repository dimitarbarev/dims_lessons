"use client";

export function ConfirmSubmit({ label, message }: { label: string; message: string }) {
  return (
    <button
      type="submit"
      className="text-sm font-bold text-soft underline-offset-2 hover:underline"
      onClick={(event) => {
        if (!window.confirm(message)) event.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
