# Multi-Tenant Telegram Broadcast SaaS - Mimari Plan

## 1. Sistem Özeti

Mevcut single-user Telegram broadcast sistemini multi-tenant SaaS platformuna dönüştürme projesi. Her kullanıcı:
- Kendi bot token'lerini yönetebilir
- Kendi gruplarını ve broadcast'larını yönetebilir
- Plan tabanlı limitler ile çalışır (bot sayısı, grup sayısı)
- Jeton sistemi ile broadcast başlatabilir (her broadcast belirli sayıda jeton harcar)
- Admin onayı gerekli

## 2. Fiyatlandırma Modeli (Hibrit)

### 2.1 Plan Limitleri
Admin panel üzerinden ayarlanabilir:
- **Ücretsiz Plan**: Bot limit, Grup limit, Jeton/gün limiti
- **Haftalık Plan**: Bot limit, Grup limit, Jeton/hafta limiti
- **Aylık Plan**: Bot limit, Grup limit, Jeton/ay limiti

### 2.2 Jeton Sistemi
- Plan kredisi: Her plana belirli jeton/dönem kredisi
- Broadcast maliyeti: Her broadcast başlatıldığında X jeton harcanır
- Jeton satın alma: Ek jeton satın alınabilir (hesaplanmamış)
- Jeton sıfırlanması: Plan döneminin sonunda otomatik sıfırlanır

## 3. Veri Modeli Değişiklikleri

### 3.1 Yeni/Güncellenmiş Modeller

#### User Model (Yeni)
```
- id (PK)
- username (unique, not null)
- email (unique, not null)
- password_hash (not null)
- is_admin (boolean, default=False)
- is_approved (boolean, default=False)
- approval_status (enum: pending/approved/rejected, default=pending)
- plan_type (enum: free/weekly/monthly, default=free)
- tokens (integer, default=0)
- tokens_used_period (integer, tracking dönem içi kullanım)
- created_at
- updated_at
- approved_by (FK to User, nullable - admin info)
- approved_at (nullable)
```

#### PlanLimits Model (Yeni)
```
- id (PK)
- plan_type (enum: free/weekly/monthly, unique)
- max_bots (integer)
- max_groups (integer)
- tokens_per_period (integer)
- period_length_days (integer)
- price_usd (decimal, nullable - admin reference)
- created_at
- updated_at
```

#### BotToken Model (Yeni)
```
- id (PK)
- user_id (FK to User, not null)
- token (string, unique, not null)
- bot_username (string, nullable)
- bot_id (string, nullable)
- is_active (boolean, default=True)
- created_at
- updated_at
```

#### Group Model (Güncellenmiş)
```
Mevcut alanlara ek:
- user_id (FK to User, not null, index)
- bot_token_id (FK to BotToken, nullable)
```

#### Broadcast Model (Güncellenmiş)
```
Mevcut alanlara ek:
- user_id (FK to User, not null, index)
- tokens_cost (integer, default=1)
- tokens_used (integer, default=0)
```

#### ScheduledTask Model (Güncellenmiş)
```
Mevcut alanlara ek:
- user_id (FK to User, not null, index)
- tokens_cost (integer, default=1)
- tokens_used (integer, default=0)
```

#### Template Model (Güncellenmiş)
```
Mevcut alanlara ek:
- user_id (FK to User, not null, index)
```

#### BotSettings Model (Güncellenmiş)
```
Değiştirilmeyecek - global ayarlar için olduğu gibi kalacak
```

### 3.2 Veri İlişkileri (ER Diagram)
```
User (1) ──────── (M) BotToken
  │
  ├──── (M) Group
  │
  ├──── (M) Broadcast
  │
  ├──── (M) ScheduledTask
  │
  └──── (M) Template

PlanLimits (1) ──────── (M) User

BotToken (1) ──────── (M) Group
```

## 4. Backend Değişiklikleri

### 4.1 Yeni Endpoints

#### Authentication & User Management
- `POST /api/auth/register` - Kullanıcı kayıt (pending onay)
- `POST /api/auth/login` - Giriş (sadece approved users)
- `GET /api/auth/me` - Mevcut kullanıcı bilgisi

#### Admin Management
- `GET /api/admin/users` - Tüm kullanıcıları listele (admin only)
- `PATCH /api/admin/users/{user_id}/approve` - Kullanıcı onayla (admin only)
- `PATCH /api/admin/users/{user_id}/reject` - Kullanıcı reddet (admin only)
- `DELETE /api/admin/users/{user_id}` - Kullanıcı sil (admin only)
- `GET /api/admin/plan-limits` - Plan limitlerini göster (admin only)
- `PATCH /api/admin/plan-limits/{plan_type}` - Plan limitlerini güncelle (admin only)

#### User Profile
- `GET /api/users/profile` - Profil bilgisi
- `PUT /api/users/profile` - Profil güncelle
- `GET /api/users/tokens` - Token bilgisi ve geçmişi
- `GET /api/users/plan` - Plan bilgisi

#### Bot Token Management
- `POST /api/bots` - Bot token ekle
- `GET /api/bots` - Kullanıcının bot'larını listele
- `GET /api/bots/{bot_id}` - Bot detayları
- `DELETE /api/bots/{bot_id}` - Bot sil
- `PATCH /api/bots/{bot_id}/toggle` - Bot aktif/pasif yap

### 4.2 Değiştirilecek Endpoints (User Filtering)

Tüm mevcut endpoint'ler user_id ile filter yapılacak:
- `GET /api/groups` → Sadece user'ın gruplarını döner
- `GET /api/broadcasts` → Sadece user'ın broadcast'larını döner
- `POST /api/broadcasts` → Token kontrolü, rate limiting
- `GET /api/schedules` → Sadece user'ın schedule'larını döner
- `GET /api/templates` → Sadece user'ın template'lerini döner

### 4.3 Yeni Middleware/Services

#### QuotaService
```python
- check_user_quota(user_id, resource_type) → bool
- check_tokens_available(user_id, tokens_needed) → bool
- deduct_tokens(user_id, tokens_amount) → None
- reset_period_tokens(user_id) → None
```

#### RateLimitService
```python
- check_broadcast_rate_limit(user_id) → bool
- check_plan_limits(user_id, resource_type, count) → bool
```

#### UserAuthorizationMiddleware
```python
- Tüm user-specific isteklerde user kontrolü
- User'ın sadece kendi verilerine erişebilmesini sağla
```

### 4.4 Veritabanı Güvenliği

```python
# Her query'ye user_id filtresi eklenecek
await session.execute(
    select(Broadcast)
    .where(Broadcast.user_id == user_id)
    .where(Broadcast.id == broadcast_id)
)

# Admin için check
if not current_user.is_admin:
    # user-specific query
else:
    # no user_id filter
```

## 5. Frontend Değişiklikleri

### 5.1 Yeni Sayfalar

#### 1. Kayıt Sayfası (`/register`)
- Username, Email, Password, Password Confirm
- Terms & Conditions checkbox
- Başarılı kayıt → Onay beklemesi mesajı
- Zaten hesap var → Login sayfasına link

#### 2. Admin Paneli (`/admin`)
- **Alt Sayfalar:**
  - Kullanıcı Yönetimi: Pending/Approved/Rejected listesi, Onayla/Reddet
  - Plan Ayarları: Her plan tipi için limitleri düzenle
  - Sistem İstatistikleri: Toplam user, active broadcast, token istatistikleri

#### 3. Plan & Üyelik Sayfası (`/pricing`)
- Mevcut plan göster
- Plan sürümü, limitler, jeton info
- Token satın alma (hesaplanmamış - placeholder)

#### 4. Bot Token Yönetimi (`/bots`)
- Bot token listesi
- Yeni bot token ekle
- Bot detayları ve son kullanım

### 5.2 Güncellenmiş Bileşenler

#### Header/Navigation
- Kullanıcı adı ve plan göster
- Jeton durumu göster
- Onay beklemesi varsa bildirim
- Admin link (admin users için)

#### Dashboard
- Plan bilgisi
- Jeton kullanımı (bar chart)
- Dönem bilgisi ve sıfırlanma tarihi
- Kullanıcı bazlı istatistikler

#### Sidebar
- Admin section (admin users için)
- Plan bilgisi
- Jeton göstergesi

### 5.3 Form Validasyonları

- Username: 3-20 karakter, alphanumeric + underscore
- Email: valid email format
- Password: minimum 8 karakter, en az 1 uppercase, 1 number
- Bot token: format validation

## 6. Güvenlik Gereksinimleri

### 6.1 Authentication
- JWT tokens (mevcut sistem korunacak)
- Access token + Refresh token (opsiyonel)
- Token expiry: 7 gün (mevcut ayar korunacak)

### 6.2 Authorization
- Middleware: Her request'te user check
- Resource ownership: User sadece kendi verilerine erişebilir
- Admin check: Admin-only endpoints

### 6.3 Rate Limiting
- Per-user broadcast rate limit
- Per-user token deduction
- IP-based DDoS protection

### 6.4 Password Security
- bcrypt hashing (mevcut)
- Password complexity requirements

## 7. Veritabanı Migration Stratejisi

### Aşamalar:
1. **Phase 1**: Yeni modeller oluştur
2. **Phase 2**: Mevcut veriler için default user oluştur
3. **Phase 3**: Foreign keys ekle ve backfill et
4. **Phase 4**: Index'ler oluştur

### Migration Script:
```sql
-- 1. User tablosu
-- 2. PlanLimits tablosu
-- 3. BotToken tablosu
-- 4. Group'a user_id ekle
-- 5. Broadcast'a user_id ekle
-- 6. ScheduledTask'a user_id ekle
-- 7. Template'e user_id ekle
-- 8. Foreign key constraints
-- 9. Index'ler
```

## 8. API Güvenlik Örnekleri

### 8.1 User-Specific Query
```python
@router.get("/api/broadcasts/{broadcast_id}")
async def get_broadcast(
    broadcast_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    broadcast = await db.execute(
        select(Broadcast)
        .where(Broadcast.id == broadcast_id)
        .where(Broadcast.user_id == current_user.id)
    )
    result = broadcast.scalar_one_or_none()
    if not result:
        raise HTTPException(status_code=404)
    return result
```

### 8.2 Token Deduction
```python
async def start_broadcast(
    broadcast_data: BroadcastCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Token kontrolü
    if current_user.tokens < broadcast_data.tokens_cost:
        raise HTTPException(status_code=402, detail="Yetersiz jeton")
    
    # Broadcast oluştur
    broadcast = Broadcast(
        **broadcast_data.dict(),
        user_id=current_user.id,
        tokens_used=broadcast_data.tokens_cost
    )
    
    # Token düş
    current_user.tokens -= broadcast_data.tokens_cost
    await db.commit()
```

## 9. Frontend State Management

### Global State (Zustand/Context)
```javascript
- authStore: user, token, isAdmin, isApproved
- userStore: profile, plan, tokens, planLimits
- uiStore: sidebar, theme, notifications
```

### API Calls Interceptor
```javascript
- Token auto-refresh
- User data caching
- Error handling (403 unauthorized)
```

## 10. Implementasyon Sırası

### Faz 1: Backend Foundation
1. User ve PlanLimits modellerini oluştur
2. Database migrations
3. Auth endpoints (register, login)
4. User model'e dependency inject etme

### Faz 2: Multi-Tenancy
1. Mevcut modellete user_id ekle
2. Quota service oluştur
3. API endpoints'leri güncelle
4. Authorization middleware

### Faz 3: Admin Features
1. Admin endpoints oluştur
2. Plan limits yönetimi
3. User approval sistemi

### Faz 4: Frontend
1. Kayıt ve giriş UI
2. Admin paneli
3. Plan/Profile sayfaları
4. Dashboard güncellemeleri

## 11. Test ve Validasyon

- Unit tests: Service'ler, model'ler
- Integration tests: API endpoints
- E2E tests: Kayıt → Onay → Broadcast flow
- Security tests: Authorization checks
- Load tests: Multi-user scenarios

## 12. Deployment Considerations

- Database migration scripts
- Environment variables (.env)
- Backward compatibility
- Rollback strategy
- Monitoring ve logging

---

**Notlar:**
- Mevcut single-user sistem korunacak (backward compatibility)
- Tüm yeni features opt-in olacak
- Admin panel başlangıçta basic olacak, sonraya genişletilebilir
- Token satın alma sistemi placeholder olarak kalacak (payment integration opsiyonel)
