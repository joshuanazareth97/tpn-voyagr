import React, { FC, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  width?: number | string;
  height?: number | string;
  size?: number | string;
  className?: string;
}

export interface ShieldIconProps extends SVGProps<SVGSVGElement> {
  active?: boolean;
  width?: number | string;
  height?: number | string;
}

export const GlobeIcon: FC<IconProps> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM13.9 7H12C11.9 5.5 11.6 4.1 11.2 3C12.6 3.8 13.6 5.3 13.9 7ZM8 14C7.4 14 6.2 12.1 6 9H10C9.8 12.1 8.6 14 8 14ZM6 7C6.2 3.9 7.3 2 8 2C8.7 2 9.8 3.9 10 7H6ZM4.9 3C4.4 4.1 4.1 5.5 4 7H2.1C2.4 5.3 3.4 3.8 4.9 3ZM2.1 9H4C4.1 10.5 4.4 11.9 4.8 13C3.4 12.2 2.4 10.7 2.1 9ZM11.1 13C11.6 11.9 11.8 10.5 11.9 9H13.8C13.6 10.7 12.6 12.2 11.1 13Z"
      fill="#26D2FB"
    />
  </svg>
);

export const TimeIcon: FC<IconProps> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM8 14C4.7 14 2 11.3 2 8C2 4.7 4.7 2 8 2C11.3 2 14 4.7 14 8C14 11.3 11.3 14 8 14Z"
      fill="#26D2FB"
    />
    <path d="M8.5 4H7V8.7L11.1 11.2L12 9.9L8.5 7.8V4Z" fill="#26D2FB" />
  </svg>
);

export const SpeedIcon: FC<IconProps> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M5.6 10.6C5.3 10.2 5.1 9.6 5.1 9C5.1 7.3 6.4 6 8.1 6C9.8 6 11.1 7.3 11.1 9C11.1 9.6 10.9 10.1 10.6 10.6L11.7 11.7C12.2 11 12.6 10 12.6 9C12.6 6.5 10.6 4.5 8.1 4.5C5.6 4.5 3.6 6.5 3.6 9C3.6 10 3.9 10.9 4.5 11.7L5.6 10.6Z"
      fill="#26D2FB"
    />
    <path
      d="M13.3 14.3L11.6 12.6C10.6 13.4 9.4 13.8 8 13.8C4.1 13.8 1 10.7 1 6.8C1 3.5 3.2 0.8 6.2 0.1L6.7 1.5C4.3 2.1 2.5 4.2 2.5 6.8C2.5 9.9 5 12.3 8 12.3C9 12.3 10 12 10.8 11.5L9 9.7C8.8 9.8 8.4 9.8 8 9.8C6.3 9.8 5 8.5 5 6.8C5 5.1 6.3 3.8 8 3.8C9.7 3.8 11 5.1 11 6.8C11 7.2 10.9 7.6 10.8 7.9L14.7 11.8L13.3 14.3Z"
      fill="#26D2FB"
    />
  </svg>
);

export const DataIcon: FC<IconProps> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M14 0H2C0.9 0 0 0.9 0 2V14C0 15.1 0.9 16 2 16H14C15.1 16 16 15.1 16 14V2C16 0.9 15.1 0 14 0ZM14 14H2V2H14V14Z"
      fill="#26D2FB"
    />
    <path d="M4 12H6V7H4V12Z" fill="#26D2FB" />
    <path d="M7 12H9V4H7V12Z" fill="#26D2FB" />
    <path d="M10 12H12V9H10V12Z" fill="#26D2FB" />
  </svg>
);

export const ShieldIcon: FC<ShieldIconProps> = ({
  active = false,
  width = 20,
  height = 20,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 20 25"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path
      d="M10 0L0 4V10C0 15.5 4.3 20.7 10 22C15.7 20.7 20 15.5 20 10V4L10 0ZM10 20.1C5.3 18.8 2 14.6 2 10V5.2L10 2.1L18 5.2V10C18 14.6 14.7 18.8 10 20.1Z"
      fill="#26D2FB"
    />
    {active && (
      <path d="M9 14L5 10L6.4 8.6L9 11.2L14.6 5.6L16 7L9 14Z" fill="#26D2FB" />
    )}
  </svg>
);

export const LightningIcon: FC<IconProps> = ({
  width = 16,
  height = 16,
  ...props
}) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M9 0L0 9H6L3 16L12 6H7L9 0Z" fill="white" />
  </svg>
);

export const LocationPin: FC<IconProps> = ({
  size = 20,
  className = "",
  ...props
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="#26D2FB"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx={12} cy={10} r={3} />
  </svg>
);
