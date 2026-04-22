# Multi-Tenant SaaS - Sistem Mimarisi

## Veri Modeli İlişkileri

```mermaid
erDiagram
    User ||--o{ BotToken : "sahiplik"
    User ||--o{ Group : "sahiplik"
    User ||--o{ Broadcast : "sahiplik"
    User ||--o{ ScheduledTask : "sahiplik"
    User ||--o{ Template : "sahiplik"
    User }o--|| PlanLimits : "plan_atama"
    BotToken ||--o{ Group : "bot_atama"
    Broadcast ||--o{ BroadcastLog : "loglama"

    User {
        int id PK
        string username UK
        string email UK
        string password_hash
        boolean is_admin
        boolean is_approved
        enum approval_status
        enum plan_type
        int tokens
        int tokens_used_period
        datetime created_at
        datetime updated_at
        int approved_by FK
        datetime approved_at
    }

    PlanLimits {
        int id PK
        enum plan_type UK
        int max_bots
        int max_groups
        int tokens_per_period
        int period_length_days
        decimal price_usd
        datetime created_at
        datetime updated_at
    }

    BotToken {
        int id PK
        int user_id FK
        string token UK
        string bot_username
        string bot_id
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    Group {
        int id PK
        bigint chat_id UK
        string title
        string username
        enum chat_type
        int member_count
        boolean is_active
        boolean is_blacklisted
        boolean is_admin
        boolean can_post
        string restrict_info
        string tag
        int user_id FK
        int bot_token_id FK
        datetime created_at
        datetime updated_at
    }

    Broadcast {
        int id PK
        text message_text
        enum media_type
        string media_path
        string media_file_id
        boolean disable_preview
        string parse_mode
        enum status
        int total_groups
        int sent_count
        int failed_count
        int skipped_count
        int user_id FK
        int tokens_cost
        int tokens_used
        datetime created_at
        datetime started_at
        datetime finished_at
    }

    ScheduledTask {
        int id PK
        text message_text
        string media_type
        string media_path
        string media_file_id
        boolean disable_preview
        string parse_mode
        json target_chat_ids
        datetime run_at
        enum status
        string apscheduler_job_id
        enum repeat_type
        datetime repeat_end_at
        int broadcast_id FK
        int user_id FK
        int tokens_cost
        int tokens_used
        datetime created_at
        datetime updated_at
    }

    Template {
        int id PK
        string name
        string category
        text message_text
        string media_type
        string media_path
        string media_file_id
        boolean disable_preview
        string parse_mode
        int user_id FK
        datetime created_at
        datetime updated_at
    }

    BroadcastLog {
        int id PK
        int broadcast_id FK
        bigint chat_id
        string chat_title
        string status
        text error_message
        bigint telegram_message_id
        datetime sent_at
    }
```

## API Endpoint Yapısı

```mermaid
graph TD
    Client[Client] --> Auth[Authentication]
    Client --> API[API Endpoints]
    
    Auth --> Login[POST /api/auth/login]
    Auth --> Register[POST /api/auth/register]
    Auth --> Me[GET /api/auth/me]
    
    API --> UserAPI[User API]
    API --> AdminAPI[Admin API]
    API --> BroadcastAPI[Broadcast API]
    API --> GroupAPI[Group API]
    API --> ScheduleAPI[Schedule API]
    API --> TemplateAPI[Template API]
    API --> BotAPI[Bot API]
    
    UserAPI --> Profile[GET/PUT /api/users/profile]
    UserAPI --> Tokens[GET /api/users/tokens]
    UserAPI --> Plan[GET /api/users/plan]
    
    AdminAPI --> Users[GET /api/admin/users]
    AdminAPI --> Approve[PATCH /api/admin/users/:id/approve]
    AdminAPI --> Reject[PATCH /api/admin/users/:id/reject]
    AdminAPI --> DeleteUser[DELETE /api/admin/users/:id]
    AdminAPI --> PlanLimits[GET/PATCH /api/admin/plan-limits]
    
    BroadcastAPI --> GetBroadcasts[GET /api/broadcasts]
    BroadcastAPI --> CreateBroadcast[POST /api/broadcasts]
    BroadcastAPI --> GetBroadcast[GET /api/broadcasts/:id]
    BroadcastAPI --> CancelBroadcast[PATCH /api/broadcasts/:id/cancel]
    
    GroupAPI --> GetGroups[GET /api/groups]
    GroupAPI --> AddGroup[POST /api/groups]
    GroupAPI --> UpdateGroup[PATCH /api/groups/:id]
    GroupAPI --> DeleteGroup[DELETE /api/groups/:id]
    
    ScheduleAPI --> GetSchedules[GET /api/schedules]
    ScheduleAPI --> CreateSchedule[POST /api/schedules]
    ScheduleAPI --> UpdateSchedule[PATCH /api/schedules/:id]
    ScheduleAPI --> DeleteSchedule[DELETE /api/schedules/:id]
    
    TemplateAPI --> GetTemplates[GET /api/templates]
    TemplateAPI --> CreateTemplate[POST /api/templates]
    TemplateAPI --> UpdateTemplate[PATCH /api/templates/:id]
    TemplateAPI --> DeleteTemplate[DELETE /api/templates/:id]
    
    BotAPI --> GetBots[GET /api/bots]
    BotAPI --> CreateBot[POST /api/bots]
    BotAPI --> GetBot[GET /api/bots/:id]
    BotAPI --> DeleteBot[DELETE /api/bots/:id]
    BotAPI --> ToggleBot[PATCH /api/bots/:id/toggle]
```

## Kullanıcı Akışı

```mermaid
sequenceDiagram
    participant U as Kullanıcı
    participant F as Frontend
    participant A as API
    participant D as Database
    participant Admin as Admin Panel
    
    U->>F: Kayıt Formu Doldur
    F->>A: POST /api/auth/register
    A->>D: User oluştur (pending)
    D-->>A: User kaydedildi
    A-->>F: Kayıt başarılı, onay bekleniyor
    F-->>U: Onay bekleniyor mesajı
    
    Admin->>A: GET /api/admin/users
    A->>D: Tüm kullanıcıları getir
    D-->>A: Kullanıcı listesi
    A-->>Admin: Kullanıcı listesi
    
    Admin->>A: PATCH /api/admin/users/:id/approve
    A->>D: User'ı approve et
    D-->>A: User approved
    A-->>Admin: Onaylandı
    
    U->>F: Login Formu
    F->>A: POST /api/auth/login
    A->>D: User kontrolü (approved)
    D-->>A: User valid
    A-->>F: JWT Token
    F-->>U: Dashboard'a yönlendir
    
    U->>F: Bot Token Ekle
    F->>A: POST /api/bots
    A->>D: BotToken oluştur
    D-->>A: Kaydedildi
    A-->>F: Bot eklendi
    
    U->>F: Broadcast Başlat
    F->>A: POST /api/broadcasts
    A->>D: Token kontrolü
    D-->>A: Token yeterli
    A->>D: Token düş, Broadcast oluştur
    D-->>A: Kaydedildi
    A-->>F: Broadcast başlatıldı
```

## Frontend Sayfa Yapısı

```mermaid
graph TD
    App[App] --> Login[LoginPage]
    App --> Register[RegisterPage]
    App --> Main[Main Layout]
    
    Main --> Dashboard[DashboardPage]
    Main --> Broadcast[NewBroadcastPage]
    Main --> Active[ActivePage]
    Main --> Groups[GroupsPage]
    Main --> Schedules[SchedulesPage]
    Main --> Calendar[CalendarPage]
    Main --> Templates[TemplatesPage]
    Main --> History[HistoryPage]
    Main --> Settings[SettingsPage]
    Main --> Pricing[PricingPage]
    Main --> Bots[BotsPage]
    Main --> Admin[AdminPanel]
    
    Admin --> AdminUsers[AdminUsersPage]
    Admin --> AdminPlans[AdminPlansPage]
    Admin --> AdminStats[AdminStatsPage]
    
    Dashboard --> PlanInfo[Plan Bilgisi]
    Dashboard --> TokenInfo[Token Durumu]
    Dashboard --> UserStats[Kullanıcı İstatistikleri]
    
    Pricing --> PlanDetails[Plan Detayları]
    Pricing --> TokenPurchase[Token Satın Alma]
    
    Bots --> BotList[Bot Listesi]
    Bots --> AddBot[Bot Ekle]
```

## Backend Service Katmanı

```mermaid
graph TD
    Router[Router Layer] --> Middleware[Middleware Layer]
    Middleware --> AuthMiddleware[Auth Middleware]
    Middleware --> UserMiddleware[User Middleware]
    Middleware --> RateLimitMiddleware[Rate Limit Middleware]
    
    AuthMiddleware --> AuthService[AuthService]
    UserMiddleware --> UserService[UserService]
    RateLimitMiddleware --> QuotaService[QuotaService]
    
    Router --> Service[Service Layer]
    Service --> BroadcastService[BroadcastService]
    Service --> GroupService[GroupService]
    Service --> ScheduleService[ScheduleService]
    Service --> TemplateService[TemplateService]
    Service --> BotService[BotService]
    Service --> PlanService[PlanService]
    Service --> TokenService[TokenService]
    
    Service --> Database[Database Layer]
    Database --> Models[Models]
    Models --> User[User Model]
    Models --> PlanLimits[PlanLimits Model]
    Models --> BotToken[BotToken Model]
    Models --> Group[Group Model]
    Models --> Broadcast[Broadcast Model]
    Models --> ScheduledTask[ScheduledTask Model]
    Models --> Template[Template Model]
    
    BroadcastService --> TelegramAPI[Telegram API]
    GroupService --> TelegramAPI
```

## Güvenlik ve Yetkilendirme

```mermaid
graph LR
    Request[HTTP Request] --> JWT[JWT Validation]
    JWT --> UserCheck[User Check]
    UserCheck --> AdminCheck{Is Admin?}
    
    AdminCheck -->|Yes| AdminAccess[Full Access]
    AdminCheck -->|No| UserAccess[User Data Only]
    
    UserAccess --> ResourceCheck{Resource Owner?}
    ResourceCheck -->|Yes| Allow[Allow Access]
    ResourceCheck -->|No| Deny[Deny 403]
    
    AdminAccess --> QuotaCheck[Quota Check]
    Allow --> QuotaCheck
    QuotaCheck --> TokenCheck{Tokens Available?}
    TokenCheck -->|Yes| Process[Process Request]
    TokenCheck -->|No| Error[Return 402 Payment Required]
    
    Process --> Response[Response]
    Error --> Response
    Deny --> Response
```

## Plan ve Token Akışı

```mermaid
graph TD
    User[User] --> Plan[Plan Type]
    Plan --> PlanLimits[Plan Limits]
    PlanLimits --> MaxBots[Max Bots]
    PlanLimits --> MaxGroups[Max Groups]
    PlanLimits --> TokensPerPeriod[Tokens Per Period]
    
    TokensPerPeriod --> TokenBalance[Token Balance]
    TokenBalance --> Broadcast[Broadcast Request]
    Broadcast --> TokenCost[Token Cost]
    TokenCost --> TokenDeduct[Deduct Tokens]
    TokenDeduct --> NewBalance[New Balance]
    
    NewBalance --> PeriodEnd{Period End?}
    PeriodEnd -->|Yes| Reset[Reset Tokens]
    PeriodEnd -->|No| NextRequest[Next Request]
    
    Reset --> TokenBalance
    NextRequest --> Broadcast
```
