import './style.css';
import { storage } from '#imports';

const KEY = 'sync:polarEnabled' as const;

const checkbox = document.getElementById('enabled') as HTMLInputElement;
const stateLabel = document.getElementById('state') as HTMLSpanElement;

function render(enabled: boolean) {
  checkbox.checked = enabled;
  stateLabel.textContent = enabled ? 'On' : 'Off';
  document.body.classList.toggle('is-off', !enabled);
}

// Load current preference (default ON).
storage.getItem<boolean>(KEY).then((v) => render(v !== false));

// Persist on change — the content script watches this key and re-themes live.
checkbox.addEventListener('change', async () => {
  const enabled = checkbox.checked;
  render(enabled);
  await storage.setItem(KEY, enabled);
});
