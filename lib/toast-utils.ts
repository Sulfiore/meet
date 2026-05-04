import toast from 'react-hot-toast';

const toastStyle = {
  backgroundColor: 'var(--lk-bg2)',
  color: 'var(--lk-fg)',
  border: '1px solid var(--lk-border-color)',
};

export function showErrorToast(message: string, id: string) {
  toast.error(message, {
    id,
    duration: 5000,
    position: 'top-right',
    style: toastStyle,
  });
}
