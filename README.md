# Escape — mehmonxona bron qilish va bonus ilovasi (Angular)

Mobil ilova uslubidagi veb-sayt: telefon raqam orqali kirish, mehmonxona qidirish, xona tanlash, bron qilish va ball yig‘ish.
Mobil-birinchi, kontent kengligi 460px; desktopda markazda turadi. Interfeys tili — o‘zbek (lotin), valyuta — so‘m.

## Ishga tushirish

```bash
npm install
npm start          # http://localhost:4200
npm run build
```

Node.js 20.19+ / 22.12+ kerak (Angular 21).

**Demo kirish:** istalgan raqam, SMS kod — `1234`.

## Ekranlar

| Yo‘l | Ekran |
| --- | --- |
| `/` | Boshlash (welcome) |
| `/login` | Telefon raqam → SMS kod → ism (yangi foydalanuvchi uchun) |
| `/home` | Salomlashuv, qidiruv, saralash chiplari, bonus kartasi, shaharlar, mashhur mehmonxonalar |
| `/results` | Qidiruv natijalari (qidiruv oynasi: joy, sanalar, mehmonlar, narx gistogrammasi, joy turi) |
| `/hotel/:id` | Mehmonxona: rasmlar, **xonalar ro‘yxati**, tafsilotlar, reyting, bron qilish oynasi |
| `/bookings` | Bronlarim |
| `/bonuses` | Ball balansi, daraja, “Qanday ishlaydi”, ballar tarixi |
| `/favorites`, `/profile` | Sevimlilar, profil (ism, ko‘rinish: tizim/yorug‘/qorong‘i, chiqish) |

## Biznes qoidalari (`src/app/core/loyalty.ts`)

- 20 000 so‘m to‘lov = 1 ball; 1 ball = 1 000 so‘m chegirma.
- Ball bilan bron summasining ko‘pi bilan 30% i to‘lanadi.
- Ball mehmon joylashguncha “kutilmoqda” holatida turadi, keyin balansga o‘tadi.
- Darajalar jami hisoblangan ball bo‘yicha: Kumush 0+, Oltin 1000+, Platina 3000+.
- Mehmonxonalar `ownership: 'own' | 'partner'` bilan belgilangan (Marmaris tarmog‘i va hamkorlar). Har bir mehmonxonaning, shu jumladan hamkorlarning ham, o‘z xonalari (`rooms`) bor; qidiruv mehmonlar soniga sig‘adigan va narx oralig‘idagi xonasi bor joylarni ko‘rsatadi.

## Ma’lumotlar qatlami

UI faqat `src/app/core/data/repositories.ts` dagi abstrakt klasslarga bog‘langan:

- `AuthRepository` — SMS kod yuborish/tekshirish
- `HotelRepository` — mehmonxonalar va xonalar (Exely booking engine)
- `BookingRepository` — bronlar
- `StayStatusSource` — mehmon joylashganini bildiradi (Exely PMS)
- `LoyaltyRepository`, `FavoritesRepository`
- `PaymentGateway` — Payme, Click, Uzum, Uzcard/Humo

Prototipda ular `local-adapters.ts` dagi localStorage adapterlariga ulangan (`app.config.ts` → `LOCAL_DATA_PROVIDERS`).
Haqiqiy API ga o‘tish uchun HTTP adapterlar yozib, shu provider ro‘yxatini almashtirish kifoya.
Prototipda joylashuv sanasi kelganda (yoki “Demo: joylashdim” bosilganda) ball balansga o‘tadi.

Rasmlar Unsplash’dan olinadi (`mock-data.ts` → `PHOTOS`); ishlab chiqarishda o‘z CDN yoki Exely media manzillari bilan almashtiring.
