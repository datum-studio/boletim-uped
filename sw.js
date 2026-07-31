// Service Worker do Boletim UPED — cache mínimo do "shell" do app.
// Estratégia: network-first (sempre tenta buscar a versão mais nova online;
// se não tiver internet, usa a última versão salva em cache).
// Os dados do boletim em si (Firebase) exigem internet e não são cacheados
// aqui — isso garante que o boletim nunca mostre números desatualizados
// "escondido" atrás de um cache velho.

const CACHE_NAME = 'boletim-uped-v1';
const ARQUIVOS_PARA_CACHE = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_PARA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(
        nomes
          .filter((nome) => nome !== CACHE_NAME)
          .map((nome) => caches.delete(nome))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Só intercepta pedidos do próprio app (shell). Chamadas ao Firebase
  // (firestore.googleapis.com etc.) passam direto, sem cache.
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});
