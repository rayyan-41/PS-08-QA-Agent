import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant: 'primary' | 'secondary';
};

export function Button({ variant, className = '', type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={`pk-button pk-button--${variant} ${className}`} {...props} />
  );
}
