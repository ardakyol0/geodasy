Bir jeodezi öğrenme aracı yapmanı istiyorum: "Terrestrial Geocentric (TGCS), Local Geodetic (LGCS) ve Local Astronomic (LACS) Koordinat Sistemleri" için 3 boyutlu, etkileşimli bir web projesi. Amaç, bu üç sistemle ilgili her kavramı sadece görsele bakarak net biçimde anlayabilmem. Matematiksel formül, matris veya sayısal denklem GÖSTERME; her şey görsel ve sözel açıklamayla anlatılsın.

## Teknik çerçeve
- Proje klasörü olarak kur (Vite + vanilla JS, Three.js, OrbitControls, CSS2DRenderer ile etiketler). npm install ve npm run dev ile çalışsın, README'ye kurulum adımlarını yaz.
- Önerilen yapı: index.html, css/style.css, js/main.js, js/earth.js (ortak dünya geometrisi), js/tgcs-scene.js, js/geodetic-scene.js, js/astronomic-scene.js, js/ui.js, js/data/concepts.js (tüm kavramların Türkçe/İngilizce metinleri).
- Arayüz Türkçe olsun, her terimin İngilizcesi parantez içinde yazsın (örn. "Elipsoit Normali (Ellipsoid Normal)").
- Koyu temalı, modern, temiz bir tasarım. Masaüstü ve mobilde çalışsın.

## Genel düzen
- Üç ayrı "dünya" olacak: Terrestrial Geocentric (global), Local Geodetic ve Local Astronomic. Üstte sekmeler: "Global (TGCS)", "Jeodezik (LGCS)", "Astronomik (LACS)", "İkili Karşılaştırma (LGCS | LACS)" ve "Hepsi Bir Arada".
- Varsayılan görünüm LGCS ve LACS'ın yan yana (split view) olduğu görünüm olsun; TGCS sekmesi tam ekran tek sahne olsun. Kamera hareketleri isteğe bağlı birbirine kilitlenebilsin (sync toggle).
- Her sahnede OrbitControls ile döndürme/yakınlaştırma, "K (veya P) noktasına yakınlaş" ve "Genel görünüm" butonları olsun.
- Aynı renk kodu tüm sahnelerde tutarlı kullanılsın; yan panelde renkli bir açıklama listesi (legend) bulunsun.

## Terrestrial Geocentric Kartezyen Sistem (TGCS) sahnesi
Referans görsel: Dünya küresi/elipsoidi, merkezde O, X-Y-Z eksenleri, P noktası, h, φ, λ.
- O: Yerin ağırlık merkezi (Origin at center of gravity). Etiketle: "O = Yerin ağırlık merkezi".
- Z ekseni: Dünya'nın dönme ekseni boyunca Kuzey Kutbu'na doğru; ucunda dönme yönünü gösteren küçük dairesel ok ve "Kuzey Kutbu (North Pole)" etiketi.
- X ekseni: Ekvator düzlemi ile Greenwich meridyen düzleminin kesişimi, yani ekvator üzerinde 0° boylam noktasına doğru.
- Y ekseni: Ekvator düzleminde X'ten 90° doğuya (sağ elli sistem rozeti göster).
- Ekvator (Equator) çemberi ve Ekvator düzlemi (Equatorial plane) yarı saydam disk olarak; Greenwich meridyeni (Greenwich Meridian) ve düzlemi yarı saydam yarım düzlem olarak.
- P: Topografya noktası (Topography point), elipsoit yüzeyinin biraz dışında. O'dan P'ye konum vektörü çizgisi (ok olarak, sayısal ifade olmadan).
- P'nin X, Y, Z bileşenleri: P'den eksenlere ve ekvator düzlemine inen kesikli dik çizgiler/izdüşümler (görseldeki kesikli kutu gibi), her bileşen etiketli ve renkli.
- φ jeodezik enlem (geodetic latitude): ekvator düzleminden P'nin elipsoit normaline kadar olan açı, Dünya merkezi tarafında yay olarak.
- λ jeodezik boylam (geodetic longitude): Greenwich meridyen düzleminden P'nin meridyen düzlemine kadar ekvator düzleminde ölçülen yay.
- h elipsoidal yükseklik (ellipsoidal height): elipsoit yüzeyinden P'ye elipsoit normali boyunca ölçü çizgisi.
- Önemli ince nokta: Elipsoit normali genelde Dünya merkezinden geçmez (kutuplar ve ekvator hariç). Bu yüzden φ açısının merkezden değil normalden tanımlandığını, "geosentrik enlem ile jeodezik enlem farkı" ayrı bir toggle ile göstererek (abartılı) sözel açıkla.
- "Koordinatlar nasıl okunur?" etkileşimi: P noktasını elipsoit üzerinde sürükleyince X, Y, Z bileşen çizgileri ve φ, λ, h yayları canlı güncellensin; sayı yerine sadece çizgi/yay boyutları değişsin (sayısal değer gösterme). Yan panelde sözel özet: "P şu an kuzey yarımkürede, doğu boylamında, elipsoitin h kadar üstünde" gibi.
- İki gösterim yolunu karşılaştıran kart: "Kartezyen (X, Y, Z)" ile "Elipsoidal (φ, λ, h)" aynı P noktasının iki farklı tarifi; hangisi ne için kullanılır sözel anlat (GNSS ve global sistemler, harita ve ulusal sistemler).
- Sistemin global olduğunu, tüm Dünya için tek ve ortak bir orijini olduğunu ve Dünya ile birlikte döndüğünü (yersel olduğunu) vurgulayan açıklama kartı.

## LGCS ve LACS ile köprü (TGCS'ten yerel sisteme geçiş)
- TGCS sahnesinde "Yerel sistemi kur" düğmesi: P noktasında (K ile aynı nokta) yerel teğet düzlem, x (Kuzey), y (Doğu), z (Yukarı) eksenleri animasyonla belirsin. Adımlar: (1) orijin Dünya merkezinden P'ye taşınır, (2) eksenler döner ve z elipsoit normaline hizalanır, (3) sistem sağ elliden sol elliye geçer (y ekseni yönü). Hiçbir sayı/matris gösterme, sadece animasyon ve sözel açıklama.
- Aynı P noktasının global X, Y, Z eksenleri ile yerel x, y, z eksenlerinin yan yana karşılaştırması: "Global: sağ elli, orijin Dünya merkezi. Yerel: sol elli, orijin gözlem noktası."
- Bu köprüden doğrudan LGCS sekmesine, oradan da LACS sekmesine geçiş linkleri bulunsun.

## Her sahnede (LGCS ve LACS) çizilecek ortak öğeler
- Dünya elipsoidi (hafif basık, kutuplardan basıklık görünür olsun, yarı saydam çerçeveli yüzey).
- Jeoit: elipsoidin etrafında dalgalı, yarı saydam, noktalı/farklı renkli yüzey. Dalgalanma gerçekte çok küçük olduğundan bir "Abartma (exaggeration)" slider'ı olsun.
- Fiziksel yer yüzeyi (Terrain): K noktası çevresinde engebeli arazi parçası.
- K gözlem noktası: arazi üzerinde belirgin bir işaret, etiketli (TGCS'teki P ile aynı nokta olduğu belirtilsin).
- Global eksenler X, Y, Z (Dünya merkezli): X Greenwich meridyeni yönü, Y 90° doğu, Z dönme ekseni. Bu sistemin sağ elli olduğu belirtilsin.
- Ekvator düzlemi ve Greenwich meridyen düzlemi (açılıp kapanabilir yarı saydam düzlemler).
- K'dan geçen meridyen düzlemi ve meridyen eğrisi.
- Enlem (φ) ve boylam (λ) açıları, Dünya merkezinde yaylarla gösterilsin.
- K noktasında yerel eksenler: x (Kuzey), y (Doğu), z (Yukarı), ve bu sistemin SOL ELLİ olduğunu gösteren bir rozet/ikon. Yerel ufuk (teğet) düzlemi K'da yarı saydam bir disk olarak çizilsin.

## Jeodezik dünyaya özel öğeler (referans yüzey: elipsoit)
- Elipsoit normali = z ekseni (vurgulu ok), K'dan elipsoide inen normal ve elipsoidle kesiştiği nokta.
- Jeodezik enlem φ ve jeodezik boylam λ.
- Jeodezik yükseklik h: elipsoit yüzeyinden K'ya kadar normal boyunca ölçülen mesafe (ölçü çizgisi ve etiket).
- Jeoit ondülasyonu N ve ortometrik yükseklik H'yi de göster (jeoitten K'ya H, elipsoitten jeoite N), aralarındaki ilişkiyi formülsüz, sözel olarak anlat: "h, H ile N'nin toplamıdır" tarzı bir cümle yeterli.
- Jeodezik kuzey (geodetic north): elipsoit meridyeninin teğet düzlemdeki yönü, x ekseni.
- Jeodezik azimut α: jeodezik kuzeyden saat yönünde ölçülen açı, K'dan bir hedef noktaya (örn. arazide i noktası) çizilen ışınla birlikte; ayrıca hedefin yükseklik açısı ve mesafesi (r) gösterilsin.
- Bu sistemde hesapların matematiksel referans yüzey üzerinde yapıldığını anlatan kısa bir açıklama kartı.

## Astronomik dünyaya özel öğeler (referans yüzey: jeoit)
- Çekül doğrultusu (plumb line / gravity vertical) = astronomik z ekseni (zenit yönü). Jeoide (eşpotansiyel yüzeye) diktir; yüzeye dik olduğunu gösteren dik açı işareti olsun.
- Astronomik enlem Φ ve astronomik boylam Λ (jeodezik olanlardan ayırt edilsin, büyük harf).
- Astronomik kuzey: ortalama yersel kutba doğru, astronomik ufuk düzleminde x̄ ekseni; astronomik doğu ȳ.
- Düşey sapma (Deflection of the Vertical, θ): çekül doğrultusu ile elipsoit normali arasındaki açı. Her iki çizgi aynı sahnede, farklı renkte, aralarındaki açı yayla vurgulansın. Bileşenleri ξ (meridyen) ve η (ilk düşey/prime vertical) ayrı küçük göstergelerle ve açıklamayla anlatılsın. Gerçekte birkaç yay saniyesi olan bu açıyı görünür kılmak için "Düşey sapmayı abart" slider'ı olsun ve ekranda "abartılmıştır" uyarısı yazsın.
- Astronomik azimut A, jeodezik azimut α ile karşılaştırmalı gösterilsin; astronomik kuzey ile jeodezik kuzey arasındaki küçük açı gösterilsin. Laplace koşulunu formülsüz, tek cümleyle anlat.
- Astronomik gözlemlerin (yıldız gözlemi, nivo ile yataylama) bu sistemi doğal olarak verdiğini anlatan açıklama kartı.

## Karşılaştırma modu
- "Karşılaştır" düğmesi: iki yerel sistemi tek bir sahnede K noktasında üst üste bindir (elipsoit normali ve çekül doğrultusu, iki ufuk düzlemi, iki kuzey). Aradaki farkları (θ, kuzey farkı) vurgula.
- "Hepsi Bir Arada" görünümü: TGCS global eksenleri, K'daki LGCS ve LACS eksenleri aynı sahnede; her sistemin orijini, z ekseni ve elliliği renk kodlu etiketlerle ayırt edilsin.
- Yan tarafta üç sütunlu karşılaştırma tablosu (TGCS | LGCS | LACS): orijin, z ekseni, ana düzlem, x ekseni, referans yüzey, enlem/boylam türü, nasıl elde edilir, elli olma (sağ/sol), kapsam (global/lokal), kullanım alanı.

## Etkileşim ve öğrenme desteği
- Legend'daki veya sahnedeki herhangi bir öğeye tıklayınca/üzerine gelince: o öğe parlasın, diğerleri soluklaşsın ve yan panelde bilgi kartı açılsın. Kartta: Türkçe ad, İngilizce ad, sembol, "Bu nedir?", "Nasıl belirlenir/ölçülür?", "Diğer sistemlerle ilişkisi".
- Katman açma/kapama checkbox'ları: elipsoit, jeoit, arazi, global eksenler, yerel eksenler, düzlemler, açılar, yükseklikler, etiketler, izdüşüm çizgileri.
- Küçük bir "meridyen kesiti" 2B yan paneli: K'dan geçen meridyen düzleminin kesitini yandan gösteren sade bir şema (elipsoit, jeoit, arazi, normal, çekül, θ, h, N, H, φ). 3B sahneyle senkron vurgulansın.
- "Adım adım anlat" modu: 9-11 adımlık rehberli tur. Sıra: (1) Dünya'nın ağırlık merkezi ve dönme ekseni, (2) global X, Y, Z eksenleri ve sağ elli yapı, (3) P noktası ve X, Y, Z bileşenleri, (4) φ, λ, h ile ikinci tarif yolu, (5) yerel sisteme geçiş (orijin P'ye taşınır, sol elli olur), (6) elipsoit ve jeoit, (7) elipsoit normali ve LGCS, (8) çekül doğrultusu ve LACS, (9) düşey sapma, (10) kuzeyler ve azimutlar, (11) karşılaştırma ve özet. Her adımda kamera ilgili bölgeye gitsin.
- "Quiz modu" (opsiyonel, sonda): sahnede bir öğe vurgulanır, ben adını ve hangi sisteme ait olduğunu seçerim; doğru/yanlış geri bildirimi sözel olsun.
- Etiketler her zaman kameraya dönük, okunaklı ve üst üste binmesin; gerekirse leader çizgisi kullan.

## Kalite beklentileri
- Gerçek şeklin birebir ölçeği değil, öğretici bir şematik model olsun; abartılan şeyler (basıklık, jeoit dalgası, düşey sapma, geosentrik-jeodezik enlem farkı) arayüzde açıkça belirtilsin.
- Önce kısa bir plan çıkar, sonra projeyi kur, çalıştır ve tarayıcıda açıp ekran görüntüsüyle kontrol et. Etiketlerin çakışmadığından ve üç sahnenin doğru çalıştığından emin ol.
- Tüm metinleri js/data/concepts.js içinde tut ki sonradan kolayca düzenleyebileyim.