import { useToastStore } from '../lib/toast';
import './ui.css';

export const Toaster = () => {
  const items = useToastStore((state) => state.items);
  return (
    <div className="ni-toaster" role="status" aria-live="polite">
      {items.map((item) => (
        <div key={item.id} className={`ni-toast ni-toast--${item.tone}`}>
          {item.message}
        </div>
      ))}
    </div>
  );
};
