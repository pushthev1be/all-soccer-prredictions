import * as React from "react";
import { clsx } from "clsx";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={clsx(
        "flex h-10 w-full rounded-md border-2 border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-all duration-200",
        "placeholder:text-gray-500",
        "hover:border-gray-400",
        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:border-blue-500",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
