# Крок 2.2: Налаштування акаунту Clerk

У цьому документі ви зареєструєтесь у Clerk, отримаєте API-ключі та налаштуєте методи входу для нашого додатку.

---

## Частина 1: Реєстрація та створення застосунку в Clerk

### 1. Зареєструйтесь на Clerk

1. Перейдіть на [https://clerk.com](https://clerk.com) та натисніть **Get started for free**.
2. Зареєструйтеся через GitHub, Google або за email.
3. Після підтвердження email ви потрапите на Dashboard.

### 2. Створіть новий застосунок

Після входу у Dashboard:

1. Натисніть кнопку **"Create application"**.
2. Введіть назву застосунку, наприклад: `VARD Client App`.
3. Виберіть методи входу:
   - ✅ **Phone number** (SMS)
   - ✅ **Email address** + **Password**
   - ✅ **Google** (OAuth) — якщо потрібно
4. Натисніть **"Create application"**.

> [!IMPORTANT]
> Обов'язково увімкніть **Phone number** та **Email address + Password**, оскільки ваш додаток вже має екрани `login.tsx` та `login-email.tsx` для обох методів.

---

## Частина 2: Отримання API-ключів

Після створення застосунку Clerk автоматично відкриє сторінку "Quickstart". Знайдіть ваші ключі:

1. Перейдіть до **"API Keys"** у лівому меню.
2. Скопіюйте наступні ключі:

| Ключ | Де знайти | Для чого |
| :--- | :--- | :--- |
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | API Keys → Publishable key | React Native SDK |
| `CLERK_SECRET_KEY` | API Keys → Secret keys | Django Backend |

### Приклад ключів (не реальні):
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_d2VsY29tZS1nb3JpbGxhLTExLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> [!WARNING]
> `CLERK_SECRET_KEY` — **секретний ключ**, ніколи не додавайте його в код React Native. Він використовується **тільки** на сервері (Django backend)!

---

## Частина 3: Налаштування `.env` файлів

### 3.1 Для React Native (client-app)

Створіть файл `.env` у корені директорії `client-app/`:

```bash
# client-app/.env
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_ваш_ключ_тут
```

> [!NOTE]
> Prefix `EXPO_PUBLIC_` є обов'язковим — лише такі змінні Expo передає до клієнтського коду. Без нього змінна не буде доступна у додатку.

### 3.2 Для Django Backend

Відкрийте файл `backend/.env` (ви вже його створили на кроці 1) та переконайтеся, що заповнені Clerk-змінні:

```bash
# backend/.env
CLERK_SECRET_KEY=sk_test_ваш_secret_key_тут
CLERK_PUBLISHABLE_KEY=pk_test_ваш_publishable_key_тут
CLERK_WEBHOOK_SECRET=whsec_... # Буде заповнено пізніше (крок 06)
```

---

## Частина 4: Налаштування методів входу у Clerk Dashboard

### 4.1 Налаштування Phone Number (SMS)

1. У Dashboard перейдіть до **"User & Authentication"** → **"Email, Phone, Username"**.
2. Переконайтеся, що **Phone number** — увімкнений.
3. У розділі **"Verification"** встановіть **"SMS code"** як метод верифікації.

### 4.2 Налаштування Email + Password

1. У тому ж розділі переконайтеся, що **Email address** увімкнений.
2. Увімкніть **Password** як метод автентифікації.
3. Для верифікації email оберіть **"Email verification code"** (одноразовий код на пошту).

### 4.3 (Опціонально) Google OAuth

1. Перейдіть до **"Social Connections"** → **"Google"**.
2. Натисніть **"Enable"**.
3. Для розробки можна залишити дефолтні налаштування Clerk (Shared credentials).

---

## Результат цього кроку

- ✅ Створено застосунок у Clerk Dashboard.
- ✅ Налаштовано методи входу: телефон (SMS), email + пароль.
- ✅ Отримано та збережено API-ключі.
- ✅ Заповнено `.env` файли для React Native та Django.

**Наступний крок →** [03-clerk-provider.md](./03-clerk-provider.md)
