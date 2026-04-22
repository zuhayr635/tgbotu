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

### 3. Botu Yönetici Yap
- Her grup için adım adım yönetici yapma talimatları sunar
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

### Botu Yönetici Yapma

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
Botu yönetici yapma talimatlarını döndürür.

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

### Frontend Bileşenleri

#### GroupsPage.jsx
Ana grup yönetim sayfası. Şu özellikleri içerir:
- Grup listesi
- Filtreleme (tümü, aktif, admin, kara liste)
- Arama
- Grup tespit butonu
- Yetki kontrol butonu
- Botu yönetici yapma modal'ı

#### Modal Bileşeni
Botu yönetici yapma adımlarını gösteren modal:
- Grup bilgileri
- Adım adım talimatlar
- Grup ve bot linkleri
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

### v1.0.0
- İlk sürüm
- Grup tespit özelliği
- Yetki kontrolü özelliği
- Botu yönetici yapma talimatları
- Anonim mod desteği
