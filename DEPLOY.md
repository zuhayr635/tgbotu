# Coolify Deploy Rehberi

## 1. .env Dosyasını Hazırla

`.env.example` dosyasını `.env` olarak kopyala ve doldur:

```
POSTGRES_USER=tgbot
POSTGRES_PASSWORD=GüçlüBirŞifre123
POSTGRES_DB=tgbotdb
SECRET_KEY=enaz32karakterrastgelesecretkey123456
ADMIN_USERNAME=admin
ADMIN_PASSWORD=PanelŞifren
DOMAIN=tele.luanawork.com
```

## 2. Coolify'da Yeni Servis Oluştur

1. Coolify'a giriş yap
2. **New Resource → Docker Compose** seç
3. GitHub repo'nu bağla veya dosyaları yükle
4. Environment Variables bölümüne `.env` içeriğini ekle
5. **Deploy** butonuna bas

## 3. Domain Ayarı

Coolify otomatik olarak Traefik ile SSL sertifikası alır.
DNS'te `tele.luanawork.com` → Coolify sunucu IP'sine A kaydı ekle.

## 4. İlk Kullanım

1. `tele.luanawork.com` adresine git
2. `.env`'de belirlediğin kullanıcı adı ve şifre ile giriş yap
3. **Ayarlar** sayfasına git → Bot Token'ı gir → Test Et → Botu Başlat
4. Botu gruplara ve kanallarına ekle
5. Gruplar sayfasında otomatik görünecekler

## 5. Bot Kurulum Notları

- **Gruplara**: Normal üye olarak ekle yeterli
- **Kanallara**: Mutlaka **Admin** olarak ekle (Telegram zorunlu kılıyor)
- Bot'u BotFather'dan al: `@BotFather` → `/newbot`
- Grup gizlilik modunu kapat: `@BotFather` → `/mybots` → Bot seç → **Bot Settings** → **Group Privacy** → **Turn off**

## 6. Port Bilgileri

| Servis | Port |
|--------|------|
| Frontend | 3000 (Nginx) |
| Backend API | 8000 |
| PostgreSQL | 5432 (dahili) |

## API Dokümantasyonu

Backend çalışırken: `tele.luanawork.com/api/docs`
