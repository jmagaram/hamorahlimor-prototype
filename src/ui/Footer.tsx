export interface FooterButton {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

/** Fixed footer of thumb-reach buttons. Renders nothing with no buttons. */
export function Footer({ buttons }: { buttons: FooterButton[] }) {
  if (!buttons.length) return null;
  return (
    <footer>
      {buttons.map(b => (
        <button key={b.label} onClick={b.onClick} disabled={b.disabled}>{b.label}</button>
      ))}
    </footer>
  );
}
