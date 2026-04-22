# Grup Tespit ve Yönetim Paneli

## Özellikler

Bu özellik, Telegram botunuzun yönettiği grupları otomatik tespit etmenizi ve yöneticiliğini kolaylaştırmanızı sağlar.

## 🎯 Ana Özellikler

### 1. Grupları Tespit Et
- Botun üye olduğu tüm grupları tarar
- Her grubun yönetici durumunu kontrol eder
- Grup bilgilerini (üye sayısı, tipi vb.) günceller
- Veritabanına kaydeder

### 2. Yetkileri Kontrol Et
- Botun her gruptaki yetki durumunu kontrol eder
- Mesaj gönderme izinlerini doğrular
- Kanallar için "Mesaj Gönder" yetkisini kontrol eder
- Kısıtlama bilgilerini günceller

### 3. Çoklu Seçim ve Toplu İşlemler
- Birden fazla grubu aynı anda seçme
- Seçilen gruplara toplu olarak bot ekleme
- Seçim durumunu görsel olarak takip etme
- Hızlı işlem için kısayollar

### 4. Botu Yönetici Yap
- Tek grup için adım adım yönetici yapma talimatları
- Çoklu grup için toplu yönetici yapma talimatları
- Doğru yetkileri seçmenize yardımcı olur
- Güvenlik uyarıları içerir
- Anonim mod hakkında bilgi verir

## 📋 Kullanım

### Grupları Tespit Etme

1. **Gruplar sayfasına gidin**
2. **"Grupları Tespit Et" butonuna tıklayın**
3. Sistem botun üye olduğu tüm grupları tarar
4. Tespit edilen gruplar listelenir

### Yetkileri Kontrol Etme

1. **"Yetkileri Kontrol Et" butonuna tıklayın**
2. Sistem her grubun yetki durumunu kontrol eder
3. Sonuçlar otomatik olarak güncellenir

### Botu Yönetici Yapma (Tek Grup)

1. **Grup kartında "Admin Yap" butonuna tıklayın**
2. Açılan modal'da adımları takip edin:
   - Gruba gidin
   - Yöneticiler bölümüne girin
   - Botu aratın ve seçin
   - Aşağıdaki yetkileri verin:
     - ✅ Mesajları sil (Delete Messages)
     - ✅ Üyeleri yasakla (Ban Users)
     - ✅ Grup bilgilerini düzenle (Change Group Info)
     - ✅ Üye ekle (Invite Users)
     - ✅ Mesajları sabitle (Pin Messages)
     - ❌ Yönetici Ekleme (Add Admin) - VERMEYİN!

### Botu Yönetici Yapma (Çoklu Grup)

1. **Grup kartlarına tıklayarak birden fazla grup seçin**
2. **Üstte çıkan "Seçilenlere Botu Ekle" butonuna tıklayın**
3. **Açılan modal'da:**
   - Seçilen grupları ve durumlarını inceleyin
   - Her grup için talimatları takip edin
   - Zaten admin olan grupları atlayabilirsiniz
   - Üye olmayan grupları önce eklemeniz gerekebilir

## 🔒 Güvenlik

### Anonim Mod
Bot anonim olarak çalışacak, yani:
- Yönetici işlemleri grupta görünmeyecek
- "Bot" mesajı yerine doğrudan mesaj gönderilecek
- Daha profesyonel görünüm

### Güvenlik Önlemleri
- **"Yönetici Ekleme" yetkisi vermeyin** - Bu, botun güvenliği için kritiktir
- Bot sadece ihtiyaç duyduğu yetkileri almalıdır
- Düzenli olarak yetkileri kontrol edin

## 🛠️ Teknik Detaylar

### Backend API Endpoint'leri

#### `POST /api/groups/detect-groups`
Kullanıcının admin olduğu grupları tespit eder.

**Response:**
```json
{
  "detected": 5,
  "groups": [
    {
      "id": 1,
      "chat_id": -100123456789,
      "title": "Örnek Grup",
      "username": "ornek_grup",
      "chat_type": "supergroup",
      "member_count": 150,
      "is_admin": true,
      "can_post": true,
      "restrict_info": null,
      "admin_count": 3
    }
  ]
}
```

#### `POST /api/groups/check-permissions`
Tüm grupların yetki durumunu kontrol eder.

**Response:**
```json
{
  "checked": 10,
  "groups": [
    {
      "id": 1,
      "title": "Örnek Grup",
      "chat_type": "supergroup",
      "is_active": true,
      "is_admin": true,
      "can_post": true,
      "restrict_info": null
    }
  ]
}
```

#### `POST /api/groups/promote-bot`
Tek bir grup için botu yönetici yapma talimatlarını döndürür.

**Request:**
```json
{
  "group_id": 1
}
```

**Response:**
```json
{
  "message": "Botu yönetici yapmak için şu adımları izleyin:",
  "group_title": "Örnek Grup",
  "bot_username": "my_bot",
  "instructions": [
    "1. Örnek Grup grubuna gidin",
    "2. Grup adına tıklayın → 'Yöneticiler' veya 'Manage'",
    ...
  ],
  "bot_link": "https://t.me/my_bot",
  "group_link": "https://t.me/ornek_grup",
  "note": "Bot anonim olarak çalışacak, yönetici işlemleri görünmeyecek"
}
```

#### `POST /api/groups/promote-bot-bulk`
Seçilen gruplar için botu yönetici yapma talimatlarını döndürür.

**Request:**
```json
{
  "group_ids": [1, 2, 3]
}
```

**Response:**
```json
{
  "bot_username": "my_bot",
  "bot_id": 123456789,
  "bot_link": "https://t.me/my_bot",
  "groups": [
    {
      "id": 1,
      "title": "Örnek Grup",
      "username": "ornek_grup",
      "chat_id": -100123456789,
      "chat_type": "supergroup",
      "is_member": true,
      "is_admin": false,
      "group_link": "https://t.me/ornek_grup"
    }
  ],
  "instructions": [
    "1. Her grup için aşağıdaki adımları takip edin:",
    "2. Gruba gidin → Grup adına tıklayın → 'Yöneticiler'",
    ...
  ],
  "total": 3,
  "already_admin": 1,
  "not_member": 0
}
```

### Frontend Bileşenleri

#### GroupsPage.jsx
Ana grup yönetim sayfası. Şu özellikleri içerir:
- Grup listesi
- Filtreleme (tümü, aktif, admin, kara liste)
- Arama
- Grup tespit butonu
- Yetki kontrol butonu
- Çoklu seçim özelliği
- Toplu işlemler barı
- Tek ve çoklu bot ekleme modal'ları

#### Modal Bileşenleri
1. **Tek Grup Modal'ı**: Botu yönetici yapma adımlarını gösteren modal
   - Grup bilgileri
   - Adım adım talimatlar
   - Grup ve bot linkleri
   - Güvenlik uyarıları

2. **Çoklu Grup Modal'ı**: Seçilen gruplar için özet ve talimatlar
   - Grup sayısı özeti
   - Her grubun durumu (admin/üye değil/hazır)
   - Toplu talimatlar
   - Güvenlik uyarıları

## 📝 Notlar

1. **Otomatik Tespit**: Bot, `my_chat_member` eventi ile gruplara eklendiğinde otomatik olarak tespit edilir
2. **Manuel Ekleme**: Grup ID'si veya kullanıcı adı ile manuel olarak da grup eklenebilir
3. **Yetki Gereksinimleri**:
   - Gruplar: Bot üye olmalı, yönetici olması önerilir
   - Kanallar: Bot yönetici OLMALI ve "Mesaj Gönder" yetkisi olmalı

## 🐛 Sorun Giderme

### Bot Grupları Tespit Etmiyor
- Botun çalıştığından emin olun
- Botun gruba eklendiğinden emin olun
- Bot token'ının doğru olduğundan emin olun

### Yetki Kontrolü Başarısız Oluyor
- Botun çalıştığından emin olun
- İnternet bağlantınızı kontrol edin
- Telegram API limitlerini aşmadığınızdan emin olun

### Bot Mesaj Gönderemiyor
- Botun yönetici olduğundan emin olun
- Kanal için "Mesaj Gönder" yetkisinin açık olduğundan emin olun
- Grup ayarlarında botun mesaj göndermesine izin verildiğinden emin olun

## 🔄 Güncellemeler

### v2.0.0
- Çoklu seçim özelliği eklendi
- Toplu bot ekleme özelliği eklendi
- Seçim görselleştirmesi iyileştirildi
- Toplu işlemler barı eklendi
- Yeni API endpoint'leri eklendi

### v1.0.0
- İlk sürüm
- Grup tespit özelliği
- Yetki kontrolü özelliği
- Botu yönetici yapma talimatları
- Anonim mod desteği
