// ==========================================
// PWA & Network Status Handler
// ==========================================
import { dom } from './dom.js';

export function updateNetworkStatus() {
  const isOnline = navigator.onLine;
  if (isOnline) {
    if (dom.offlineBanner) dom.offlineBanner.style.display = 'none';
    if (dom.networkStatusText) {
      dom.networkStatusText.textContent = '온라인';
      dom.networkStatusText.style.color = '#3ecf8e';
    }
  } else {
    if (dom.offlineBanner) dom.offlineBanner.style.display = 'block';
    if (dom.networkStatusText) {
      dom.networkStatusText.textContent = '오프라인';
      dom.networkStatusText.style.color = '#ff8b9e';
    }
  }
}

export function initPwaAndNetwork() {
  window.addEventListener('online', updateNetworkStatus);
  window.addEventListener('offline', updateNetworkStatus);
  updateNetworkStatus();

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) {
    if (dom.appDisplayMode) dom.appDisplayMode.textContent = '설치형 웹앱 (Standalone)';
    if (dom.pwaStatusBadge) {
      dom.pwaStatusBadge.textContent = '접속 방식: PWA 웹앱';
      dom.pwaStatusBadge.className = 'device-badge pwa';
    }
  } else {
    if (dom.appDisplayMode) dom.appDisplayMode.textContent = '웹 브라우저';
    if (dom.pwaStatusBadge) {
      dom.pwaStatusBadge.textContent = '접속 방식: 브라우저';
      dom.pwaStatusBadge.className = 'device-badge';
    }
  }

  let deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (dom.installAppRow) dom.installAppRow.style.display = 'block';
  });

  dom.installPwaBtn?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    if (dom.installAppRow) dom.installAppRow.style.display = 'none';
  });
}
