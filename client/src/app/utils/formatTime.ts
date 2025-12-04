export default function formatTime(time: Date) {
  if (!time) return '';
  if (!(time instanceof Date)) return time;

  const year = time.getFullYear();
  const month = String(time.getMonth() + 1).padStart(2, '0');
  const day = String(time.getDate()).padStart(2, '0');
  const hours = String(time.getHours()).padStart(2, '0');
  const minutes = String(time.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
