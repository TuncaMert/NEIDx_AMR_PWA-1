/** Report offline availability only after the worker confirms every asset. */
export function register(onStatus) {
  if (process.env.NODE_ENV !== 'production') return () => {};
  if (!('serviceWorker' in navigator) || !window.isSecureContext) {
    onStatus('Offline mode requires HTTPS and service-worker support.');
    return () => {};
  }
  let disposed = false;
  let registration;
  let channel;
  let timer;
  const report = text => { if (!disposed) onStatus(text); };
  const check = async () => {
    if (disposed) return;
    const worker = navigator.serviceWorker.controller || (registration && registration.active);
    if (!worker) return;
    if (channel) channel.port1.close();
    clearTimeout(timer);
    channel = new MessageChannel();
    channel.port1.onmessage = event => {
      clearTimeout(timer);
      channel.port1.close();
      report(event.data.ready ? 'Ready for offline use' : 'Offline files are incomplete. Reconnect and reload.');
    };
    timer = setTimeout(() => report('Offline readiness could not be confirmed. Reconnect and reload.'), 15000);
    worker.postMessage({ type: 'OFFLINE_STATUS' }, [channel.port2]);
  };
  const watch = worker => {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') check();
      if (worker.state === 'installed' && registration.active) {
        report('Update downloaded. Close all app tabs and reopen to use it.');
      }
      if (worker.state === 'redundant') report('Offline download failed. Reconnect and reload to retry.');
    });
  };
  report('Preparing offline use — keep this page open while files download.');
  navigator.serviceWorker.addEventListener('controllerchange', check);
  navigator.serviceWorker.register('/service-worker.js', { updateViaCache: 'none' })
    .then(value => {
      if (disposed) return;
      registration = value;
      watch(registration.installing);
      registration.addEventListener('updatefound', () => watch(registration.installing));
      if (registration.waiting) report('Update downloaded. Close all app tabs and reopen to use it.');
      else if (registration.active) check();
    })
    .catch(() => report('Offline setup failed. Check your connection and reload.'));
  return () => {
    disposed = true;
    clearTimeout(timer);
    if (channel) channel.port1.close();
    navigator.serviceWorker.removeEventListener('controllerchange', check);
  };
}
