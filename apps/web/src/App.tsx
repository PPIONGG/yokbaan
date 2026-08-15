import { useEffect, useState } from 'react';
import { fetchHealth } from './api/health';

type Status = 'loading' | 'ok' | 'error';

export function App() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    fetchHealth()
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">YokBaan</h1>
      <p className="text-sm text-gray-500">
        {status === 'loading' && 'กำลังเชื่อมต่อ API...'}
        {status === 'ok' && '✅ เชื่อมต่อ API สำเร็จ'}
        {status === 'error' && '❌ เชื่อมต่อ API ไม่ได้'}
      </p>
    </main>
  );
}
