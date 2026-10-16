# Jeodezi Koordinat Sistemleri (TGCS · LGCS · LACS)

Terrestrial Geocentric, Local Geodetic ve Local Astronomic koordinat sistemlerini formülsüz, görsel olarak öğreten 3B etkileşimli araç.
Vite + vanilla JS + Three.js (OrbitControls, CSS2DRenderer).

## Kurulum
```
npm install
npm run dev      # http://localhost:5173
npm run build    # üretim derlemesi (dist/)
```

## Yapı
- `index.html`, `css/style.css`
- `js/main.js` – uygulama durumu, sekmeler, tur, quiz
- `js/viewport.js` – sahne/kamera/seçim/etiket yerleşimi
- `js/earth.js` – elipsoit, jeoit, arazi, global çerçeve
- `js/tgcs-scene.js`, `js/geodetic-scene.js`, `js/astronomic-scene.js` – sisteme özel öğeler
- `js/ui.js`, `js/section.js` – yan panel, legend, meridyen kesiti
- `js/data/concepts.js` – **tüm metinler ve renkler** (buradan düzenleyin)

Basıklık, jeoit dalgası ve düşey sapma öğretici amaçla abartılmıştır (arayüzde belirtilir).
