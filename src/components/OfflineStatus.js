import React, { useEffect, useState } from 'react';
import { register } from '../serviceWorker';

export default function OfflineStatus() {
  const [status, setStatus] = useState('');
  useEffect(() => register(setStatus), []);
  return status ? <p className="container mt-3" role="status">{status}</p> : null;
}
