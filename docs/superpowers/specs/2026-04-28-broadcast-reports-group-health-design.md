# Broadcast Raporlama ve Grup Saglik Skoru Tasarim Spec'i

Tarih: 2026-04-28

---

## 1. Genel Bakis

Iki yeni ozellik ekleniyor:

1. **Detayli Broadcast Raporlama** — Her broadcast icin kapsamli metrikler, grafikler ve zaman bazli analiz.
2. **Grup Saglik Skoru** — Her grup icin 0-100 puanlik otomatik hesaplanan saglik skoru.

---

## 2. Ozellik 1: Detayli Broadcast Raporlama

### 2.1 Veri Modeli Degisiklikleri

**Broadcast modeline yeni alanlar gerekmiyor.** Mevcut alanlar yeterli:
- `total_groups`, `sent_count`, `failed_count`, `skipped_count`
- `started_at`, `finished_at`, `created_at`
- `tokens_cost`, `tokens_used`

**BroadcastLog zaten mevcut** — grup bazli `status` (sent/failed/skipped), `error_message`, `sent_at`.

### 2.2 API Endpoint'leri

#### `GET /api/reports/broadcast/{broadcast_id}`

Broadcast detayli rapor. Response:

```json
{
  "broadcast_id": 1,
  "status": "completed",
  "message_preview": "...",
  "media_type": "photo",
  "created_at": "...",
  "started_at": "...",
  "finished_at": "...",
  "duration_seconds": 142,

  "summary": {
    "total_groups": 50,
    "sent_count": 42,
    "failed_count": 5,
    "skipped_count": 3,
    "success_rate": 84.0,
    "tokens_used": 50
  },

  "error_distribution": [
    {"error_type": "Forbidden: bot was kicked", "count": 3},
    {"error_type": "Forbidden: chat not found", "count": 1},
    {"error_type": "RetryAfter: flood", "count": 1}
  ],

  "group_results": [
    {
      "chat_id": -100123,
      "chat_title": "Grup 1",
      "status": "sent",
      "sent_at": "...",
      "health_score": 95,
      "error_message": null
    }
  ],

  "timeline": [
    {"minute": 0, "sent": 5, "failed": 0},
    {"minute": 1, "sent": 8, "failed": 1}
  ]
}
```

`timeline`: broadcast baslangicindan itibaren dakikalik breakdown. Her dakika kac basarili/basarisiz gonderim yapilmis.

`error_distribution`: BroadcastLog'lardaki `error_message` alanindan hata turlerini gruplayip sayar.

#### `GET /api/reports/broadcasts/overview`

Kullanicinin tum broadcast'lerinin ozet istatistikleri. Response:

```json
{
  "total_broadcasts": 25,
  "total_sent": 1250,
  "total_failed": 80,
  "average_success_rate": 93.5,
  "total_tokens_used": 5000,
  "recent_trend": [
    {"date": "2026-04-22", "broadcasts": 3, "success_rate": 95.0},
    {"date": "2026-04-23", "broadcasts": 2, "success_rate": 88.0}
  ]
}
```

`recent_trend`: Son 30 gunluk gunluk bazli broadcast istatistikleri.

### 2.3 Backend Servisi

Yeni dosya: `backend/app/services/report_service.py`

```
ReportService
├── get_broadcast_report(broadcast_id, user_id) -> dict
│   ├── summary hesapla (mevcut alanlardan)
│   ├── error_distribution (BroadcastLog group by error_message)
│   ├── group_results (BroadcastLog + Group saglik skoru)
│   └── timeline (BroadcastLog sent_at'a gore dakikalik bucket)
├── get_broadcasts_overview(user_id) -> dict
│   ├── toplam istatistikler
│   └── recent_trend (son 30 gun, gunluk group by)
└── _calculate_duration(started_at, finished_at) -> int | None
```

### 2.4 Yeni Router

Yeni dosya: `backend/app/router_reports.py` — `reports` router.

```
APIRouter(prefix="/api/reports", tags=["reports"])
├── GET /broadcast/{broadcast_id}  (auth required)
└── GET /broadcasts/overview       (auth required)
```

### 2.5 Frontend

#### Yeni sayfa: `frontend/src/pages/ReportPage.jsx`

- Ust kisim: Ozet kartlari (success rate, duration, tokens)
- Orta kisim: Grafikler (recharts)
  - Timeline grafigi: Dakikalik gonderim (sent vs failed, stacked bar)
  - Hata dagilimi: Pie chart
- Alt kisim: Grup sonuclari tablosu (saglik skoru ile birlikte)
- Performans metrikleri: Success rate gostergesi (yuzyuzde buyuk sayi)

#### DashboardPage guncelleme

- `GET /api/reports/broadcasts/overview` ile son 30 gunluk trend grafigi ekle
- Ortalama success rate goster

---

## 3. Ozellik 2: Grup Saglik Skoru

### 3.1 Skor Hesaplama Formulu

Dort bilesen, dengeli agirlik:

| Bilesen | Agirlik | Aciklama |
|---------|---------|----------|
| Son basarili mesaj | %40 | Ne kadar zaman once basarili gonderim yapildi |
| Hata sikligi | %30 | Son 10 broadcast'teki hata orani |
| Admin yetkisi | %20 | Bot admin mi + mesaj gonderebiliyor mu |
| Uye sayisi | %10 | Member count trendi (buyume/azalma) |

#### 3.1.1 Son Basarili Mesaj Skoru (max 40 puan)

```
if last_success_at is None:
    puan = 0
elif (now - last_success_at) < 1 gun:
    puan = 40
elif (now - last_success_at) < 7 gun:
    puan = 30
elif (now - last_success_at) < 30 gun:
    puan = 20
else:
    puan = 10
```

#### 3.1.2 Hata Sikligi Skoru (max 30 puan)

```
error_rate = failed_sends / max(total_sends, 1)

if error_rate == 0:
    puan = 30
elif error_rate < 0.1:
    puan = 25
elif error_rate < 0.3:
    puan = 15
elif error_rate < 0.5:
    puan = 5
else:
    puan = 0
```

#### 3.1.3 Admin Yetkisi Skoru (max 20 puan)

```
if is_admin and can_post:
    puan = 20
elif is_admin or can_post:
    puan = 10
else:
    puan = 0
```

#### 3.1.4 Uye Sayisi Skoru (max 10 puan)

```
if member_count >= 1000:
    puan = 10
elif member_count >= 100:
    puan = 7
elif member_count >= 10:
    puan = 4
else:
    puan = 1
```

**Toplam saglik skoru = bilesen1 + bilesen2 + bilesen3 + bilesen4 (0-100 arasi)**

### 3.2 Veri Modeli Degisiklikleri

**Group modeline yeni alanlar:**

| Alan | Tip | Varsayilan | Aciklama |
|------|-----|------------|----------|
| `last_success_at` | DateTime(timezone=True), nullable | None | Son basarili mesaj tarihi |
| `total_sends` | Integer | 0 | Toplam gonderim sayisi |
| `failed_sends` | Integer | 0 | Basarisiz gonderim sayisi |
| `health_score` | Integer, nullable | None | Hesaplanan saglik skoru (0-100) |
| `health_updated_at` | DateTime(timezone=True), nullable | None | Skorun son guncelleme tarihi |

**Migration:** Hem SQLite hem PostgreSQL icin `ADD COLUMN IF NOT EXISTS` / `_sqlite_add_column`.

### 3.3 Saglik Skoru Guncelleme Stratejisi

Saglik skoru uc yerde guncellenir:

1. **Broadcast tamamlandiginda** — `broadcast_service.py`'de her grup icin BroadcastLog yazilirken, `sent` durumunda `last_success_at` ve `total_sends` guncellenir, `failed` durumunda `failed_sends` arttirilir. Broadcast bitiminde tum ilgili gruplarin saglik skorlari yeniden hesaplanir.

2. **Grup yetki kontrolunde** — `POST /api/groups/check-permissions` ve `POST /api/groups/{id}/check` endpoint'lerinde yetki durumu degistiginde skor guncellenir.

3. **Manuel tetikleme** — `POST /api/groups/recalculate-health` endpoint'i ile tum gruplarin skorlari yeniden hesaplanir.

### 3.4 Backend Servisi

Yeni dosya: `backend/app/services/health_service.py`

```
HealthService
├── calculate_health_score(group: Group) -> int
│   └── 4 bileseni hesapla, topla, 0-100 arasina sikistit
├── update_group_stats(db, chat_id, status: str)
│   └── BroadcastLog yazilirken cagrilir (total_sends/failed_sends/last_success_at)
├── recalculate_for_user(db, user_id)
│   └── Kullanicinin tum gruplarini sirayla hesapla
└── recalculate_for_groups(db, group_ids: list[int])
    └── Belirli gruplari hesapla
```

### 3.5 API Endpoint'leri

**Groups router'a eklentiler:**

- `GET /api/groups/` response'una `health_score` ve `health_updated_at` alanlari eklenir
- `POST /api/groups/recalculate-health` — Tum gruplarin saglik skorlarini yeniden hesapla

**Reports router:**

- Saglik skoru grup sonuclarinda broadcast raporunda gorunur (2.2'deki `group_results`)

### 3.6 Frontend Degisiklikleri

#### GroupsPage guncelleme

- Grup tablosuna "Saglik" kolonu ekle
- Badge renkleri:
  - 80-100: yesil (`bg-green-500`)
  - 50-79: sari (`bg-yellow-500`)
  - 0-49: kirmizi (`bg-red-500`)
  - `null`: gri (`bg-gray-500`) — hesaplanmamis
- Liste gorunumunde saga dogru azalan siralama secenegi

#### ReportPage guncelleme

- Broadcast detay raporundaki grup tablosunda saglik skoru badge'i gosterilir

---

## 4. Dosya Degisiklik Ozeti

### Yeni Dosyalar
| Dosya | Aciklama |
|-------|----------|
| `backend/app/services/report_service.py` | Rapor hesaplama servisi |
| `backend/app/services/health_service.py` | Saglik skoru hesaplama servisi |
| `backend/app/routers/reports.py` | Rapor API endpoint'leri |
| `frontend/src/pages/ReportPage.jsx` | Rapor sayfasi |

### Degisecek Dosyalar
| Dosya | Degisiklik |
|-------|------------|
| `backend/app/models/group.py` | 5 yeni alan ekle |
| `backend/app/database.py` | Migration ekle (SQLite + PostgreSQL) |
| `backend/app/main.py` | Reports router kaydi |
| `backend/app/services/broadcast_service.py` | Broadcast bitiminde grup istatistik guncelle + skor hesapla |
| `backend/app/routers/groups.py` | Saglik skoru response'a ekle, recalculate endpoint |
| `frontend/src/pages/GroupsPage.jsx` | Saglik skoru kolonu |
| `frontend/src/pages/DashboardPage.jsx` | Overview trend grafigi |
| `frontend/src/App.jsx` | ReportPage route ekleme |
| `frontend/src/lib/api.js` | Report API fonksiyonlari |

---

## 5. Etik ve Guvenlik

- Raporlama verileri sadece sahibi kullaniciya gosterilir (`user_id` kontrolu)
- Saglik skoru hesaplamasi kullanici verilerini disari acmaz
- Yeni endpoint'lerin tumu `Depends(get_current_user)` ile korunmali
- Hata mesajlari Turkce
