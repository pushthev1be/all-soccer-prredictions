import { forwardRef, isValidElement, cloneElement } from "react";
import { clsx } from "clsx";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  asChild?: boolean;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  default: "bg-blue-600 text-white hover:bg-blue-700",
  destructive: "bg-red-600 text-white hover:bg-red-700",
  outline: "border border-gray-300 text-gray-900 hover:bg-gray-100",
  secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
  ghost: "text-gray-800 hover:bg-gray-100",
  link: "text-blue-600 underline hover:text-blue-800",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", type = "button", asChild = false, children, ...props }, ref) => {
    const baseClass = clsx(
      "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
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
      <button ref={ref} type={type} className={baseClass} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
