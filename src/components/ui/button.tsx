import { forwardRef, isValidElement, cloneElement } from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  asChild?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200",
  destructive: "bg-red-600 text-white hover:bg-red-700 hover:scale-105 active:scale-95 shadow-md hover:shadow-lg transition-all duration-200",
  outline: "border-2 border-gray-300 text-gray-900 hover:bg-gray-100 hover:border-gray-400 hover:scale-105 active:scale-95 transition-all duration-200",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300 hover:scale-105 active:scale-95 transition-all duration-200",
  ghost: "text-gray-800 hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all duration-200",
  link: "text-blue-600 underline hover:text-blue-800 hover:no-underline transition-all duration-200",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", asChild = false, children, disabled, ...props }, ref) => {
    const baseClass = clsx(
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 disabled:shadow-none",
      variantClasses[variant],
      className
    );

    if (asChild && isValidElement(children)) {
      // Clone child element and apply button styles to it
      const child = children as React.ReactElement<any>;
      const { asChild: _ignored, variant: _variantIgnored, ...restProps } = props as any;
      return cloneElement(child, {
        ...restProps,
        className: clsx(baseClass, child.props.className),
      });
    }

    return (
      <button ref={ref} type={type} className={baseClass} disabled={disabled} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
