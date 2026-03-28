"use client";

import { useRef } from "react";

interface DialogButtonProps {
  label: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export function DialogButton({ label, className, children }: DialogButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        className={className || "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"}
      >
        {label}
      </button>
      <dialog ref={dialogRef} className="rounded-lg shadow-xl backdrop:bg-black/50 p-0">
        <div className="w-full max-w-md p-6">
          {children}
          <div className="mt-4">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
