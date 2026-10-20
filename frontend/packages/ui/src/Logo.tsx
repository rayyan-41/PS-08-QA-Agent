import mark from '@pokayoke/brand/logo/pokayoke-mark.svg';
import reversedMark from '@pokayoke/brand/logo/pokayoke-mark-reversed.svg';

type LogoProps = { variant?: 'default' | 'reversed' };

export function Logo({ variant = 'default' }: LogoProps) {
  return (
    <span className={`pk-logo pk-logo--${variant}`}>
      <img src={variant === 'reversed' ? reversedMark : mark} alt="" width="40" height="40" />
      <span>Pokayoke</span>
    </span>
  );
}
