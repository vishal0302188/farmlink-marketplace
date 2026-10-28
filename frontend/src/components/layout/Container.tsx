import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = "xl",
  className = "",
  ...props
}) => {
  const sizeStyles = {
    sm: "max-w-3xl",
    md: "max-w-5xl",
    lg: "max-w-6xl",
    xl: "max-w-7xl",
    full: "max-w-full",
  }[size];

  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 w-full ${sizeStyles} ${className}`} {...props}>
      {children}
    </div>
  );
};
