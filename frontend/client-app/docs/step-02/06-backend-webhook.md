# Крок 2.6: Налаштування Clerk Webhook для Django

У цьому документі ми налаштуємо Clerk Webhook, щоб кожного разу, коли користувач реєструється або оновлює профіль через Clerk, Django-бекенд автоматично синхронізував свою базу даних.

---

## Чому потрібен Webhook?

Clerk — це зовнішній сервіс. Ваш Django-бекенд не знає про нових користувачів, поки Clerk не повідомить його. Webhook — це HTTP POST-запит, який Clerk надсилає на ваш Django-сервер при кожній важливій події:

| Подія Clerk | Дія у Django (`apps/users/services.py`) |
| :--- | :--- |
| `user.created` | `handle_clerk_user_created()` — створення `User` у БД |
| `user.updated` | `handle_clerk_user_updated()` — оновлення `first_name`, `last_name` |
| `user.deleted` | `handle_clerk_user_deleted()` — деактивація `User.is_active = False` |

Endpoint для Webhook вже реалізовано у вашому бекенді:
```
POST /api/v1/users/webhooks/clerk/
```
(файл `apps/users/views.py` → функція `clerk_webhook`)

---

## Частина 1: Проблема локальної розробки

Clerk не може надсилати Webhook на `localhost:8000`, оскільки він недоступний з інтернету. Для розробки ми використаємо **ngrok** — тунель, який надає публічну URL для вашого локального сервера.

### Встановлення ngrok

```bash
# Варіант 1: через snap (Ubuntu/Debian)
sudo snap install ngrok

# Варіант 2: через npm
npm install -g ngrok

# Варіант 3: скачати з офіційного сайту
# https://ngrok.com/download
```

### Отримання authtoken

1. Зареєструйтеся на [https://ngrok.com](https://ngrok.com).
2. Перейдіть до **"Your Authtoken"** у Dashboard.
3. Скопіюйте токен та виконайте:

```bash
ngrok config add-authtoken ВАШ_ТОКЕН_ТУТ
```

---

## Частина 2: Запуск тунелю

**Крок 1.** Переконайтесь, що ваш Django-сервер працює:
```bash
# У папці backend/
make up
```

**Крок 2.** В окремому терміналі запустіть ngrok:
```bash
ngrok http 8000
```

Ви побачите вивід подібний до:
```
Session Status                online
Account                       your@email.com
Version                       3.x.x
Region                        Europe (eu)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:8000
```

> [!IMPORTANT]
> Скопіюйте URL у рядку **Forwarding** (наприклад: `https://abc123.ngrok-free.app`).
> Ця URL **змінюється** кожного разу при перезапуску ngrok у безкоштовному плані!

**Крок 3.** Оновіть `backend/.env` щоб Django приймав запити з цього домену:
```bash
ALLOWED_HOSTS=localhost,127.0.0.1,abc123.ngrok-free.app
```

Перезапустіть контейнери для застосування змін:
```bash
make restart
```

---

## Частина 3: Реєстрація Webhook у Clerk Dashboard

1. Відкрийте [Clerk Dashboard](https://dashboard.clerk.com) → ваш застосунок.
2. Перейдіть до **"Webhooks"** у лівому меню.
3. Натисніть **"Add Endpoint"**.
4. Заповніть форму:
   - **URL:** `https://abc123.ngrok-free.app/api/v1/users/webhooks/clerk/`
   - **Events:** оберіть всі три:
     - ✅ `user.created`
     - ✅ `user.updated`
     - ✅ `user.deleted`
5. Натисніть **"Create"**.

### Отримання Webhook Secret

Після створення Webhook у деталях знайдіть **"Signing Secret"**:
```
whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Скопіюйте та додайте у `backend/.env`:
```bash
CLERK_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Перезапустіть:
```bash
make restart
```

---

## Частина 4: Перевірка що Webhook працює

### 4.1 Тест через Clerk Dashboard

1. У розділі **"Webhooks"** натисніть на щойно створений ендпоінт.
2. Перейдіть до вкладки **"Testing"**.
3. Оберіть подію `user.created` та натисніть **"Send Example"**.
4. Перевірте що отримали відповідь `200 OK` та статус `success`.

### 4.2 Реєстрація нового користувача

1. Запустіть ваш React Native додаток.
2. Зареєструйтесь через email або телефон.
3. Після успішної реєстрації перевірте базу даних:

```bash
# Зайти в Django shell
make shell

# У Python shell:
from apps.users.models import User
User.objects.all().values('email', 'clerk_user_id', 'created_at')
```

Ви повинні побачити нового користувача з заповненим `clerk_user_id`.

### 4.3 Перегляд логів

```bash
make logs
```

При успішному Webhook ви побачите:
```
INFO apps.users.views - Received Clerk webhook: user.created
INFO apps.users.services - Created user from webhook: your@email.com
```

---

## Частина 5: Що вже реалізовано у вашому бекенді

Нагадаємо як виглядає реалізація у Django (це вже є у вашому коді):

### `apps/users/views.py` — endpoint для Webhook

```python
@csrf_exempt
@require_http_methods(["POST"])
def clerk_webhook(request):
    """Отримує події від Clerk та синхронізує з БД."""
    try:
        # Верифікація підпису — захист від підроблених запитів
        headers = {
            'svix-id': request.headers.get('svix-id', ''),
            'svix-timestamp': request.headers.get('svix-timestamp', ''),
            'svix-signature': request.headers.get('svix-signature', ''),
        }
        wh = Webhook(settings.CLERK_WEBHOOK_SECRET)
        payload = wh.verify(request.body, headers)

        event_type = payload.get('type')
        data = payload.get('data')

        if event_type == 'user.created':
            handle_clerk_user_created(data)
        elif event_type == 'user.updated':
            handle_clerk_user_updated(data)
        elif event_type == 'user.deleted':
            handle_clerk_user_deleted(data)

        return JsonResponse({'status': 'success'}, status=200)

    except WebhookVerificationError:
        return JsonResponse({'error': 'Invalid signature'}, status=401)
```

### `apps/users/services.py` — обробка події

```python
def handle_clerk_user_created(data: dict) -> None:
    """Створює User у БД на основі даних від Clerk."""
    clerk_user_id = data.get('id')
    email_addresses = data.get('email_addresses', [])
    primary_email_id = data.get('primary_email_address_id')

    # Знаходимо основний email
    email = next(
        (addr.get('email_address') for addr in email_addresses
         if addr.get('id') == primary_email_id),
        None
    )

    # Створюємо користувача (або знаходимо існуючого)
    try:
        user = User.objects.get(clerk_user_id=clerk_user_id)
        logger.info("User already exists: %s", user.email)
    except User.DoesNotExist:
        user = User.objects.create_user(
            email=email,
            clerk_user_id=clerk_user_id,
            first_name=data.get('first_name') or '',
            last_name=data.get('last_name') or '',
        )
        logger.info("Created user from webhook: %s", user.email)
```

> [!NOTE]
> Модель `User` у Django (`apps/users/models.py`) зберігає `clerk_user_id` як унікальне поле. Саме за ним Django ідентифікує користувача при кожному API-запиті.

---

## Результат цього кроку

- ✅ Встановлено та налаштовано ngrok для локальної розробки.
- ✅ Налаштовано Webhook endpoint у Clerk Dashboard.
- ✅ Django отримує та обробляє події `user.created`, `user.updated`, `user.deleted`.
- ✅ Нові користувачі автоматично з'являються у базі даних Django.

**Наступний крок →** [07-api-client.md](./07-api-client.md)
