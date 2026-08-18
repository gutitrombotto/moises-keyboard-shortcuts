const TOAST_ID = 'moises-kb-toast';
const TOAST_VISIBLE_MS = 1500;
const TOAST_FADE_MS = 300;

export function showToast(message: string, isError: boolean): void {
  const existing = document.getElementById(TOAST_ID);
  if (existing != null) {
    existing.remove();
  }

  const toast = document.createElement('div');
  toast.id = TOAST_ID;
  Object.assign(toast.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px 18px',
    borderRadius: '8px',
    color: '#fff',
    fontSize: '14px',
    fontFamily: 'system-ui, sans-serif',
    zIndex: '999999',
    pointerEvents: 'none',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    background: isError ? '#d32f2f' : '#333',
  });
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.style.opacity = '1';
  });

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, TOAST_FADE_MS);
  }, TOAST_VISIBLE_MS);
}
