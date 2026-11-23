import { Check, CircleAlert, Info } from 'lucide-react';
import { useToastStore } from '../lib/toast';
import './ui.css';

const TONE_ICONS = {
  success: Check,
  error: CircleAlert,
  info: Info,
} as const;

export const Toaster = () => {
  const items = useToastStore((state) => state.items);
  return (
    <div className="ni-toaster" role="status" aria-live="polite">
      {items.map((item) => {
        const Icon = TONE_ICONS[item.tone];
        return (
          <div key={item.id} className={`ni-toast ni-toast--${item.tone}`}>
            <Icon aria-hidden="true" />
            <span className="ni-toast__text">{item.message}</span>
          </div>
        );
      })}
    </div>
  );
};
