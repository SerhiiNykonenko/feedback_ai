# QA-гайд: ролі та feedback workflow

Цей документ описує фактично реалізовану поведінку застосунку станом на поточну версію.

## Запуск і тестові акаунти

Застосунок: `http://localhost:3000`

Усі тестові акаунти використовують пароль `Password123!`.

| Роль          | Email                  | Тестовий користувач | Команда              |
| ------------- | ---------------------- | ------------------- | -------------------- |
| Employee      | `employee@example.com` | Elena Employee      | Platform Engineering |
| Manager       | `manager@example.com`  | Maks Manager        | Platform Engineering |
| HR            | `hr@example.com`       | Hanna HR            | People Operations    |
| Admin         | `admin@example.com`    | Ada Admin           | People Operations    |
| Employee / QA | `qa@example.com`       | Quinn QA            | Quality Guild        |

Перед тестуванням перевір:

```powershell
docker compose ps
```

Контейнери `app` і `postgres` повинні мати статус `healthy`.

## Загальні функції

Усі ролі можуть:

- переглядати Dashboard;
- відкривати Reviews;
- запитувати feedback;
- бути автором feedback;
- заповнювати draft-форму;
- використовувати автоматичне збереження draft;
- надсилати feedback;
- переглядати власну Analytics;
- використовувати глобальний пошук;
- переглядати Profile та notifications;
- перемикати світлу/темну тему;
- перемикати мову `EN / UK`;
- виходити через кнопку `Sign out / Вийти`.

Мова зберігається у браузері. Після оновлення сторінки обрана локалізація залишається.

## Матриця ролей

| Функція                             | Employee |        Manager         | HR  | Admin |
| ----------------------------------- | :------: | :--------------------: | :-: | :---: |
| Запитати feedback                   |   Так    |          Так           | Так |  Так  |
| Заповнити й надіслати feedback      |   Так    |          Так           | Так |  Так  |
| Перегляд власної аналітики          |   Так    |          Так           | Так |  Так  |
| Перегляд feedback своєї команди     |    Ні    |          Так           | Ні  |  Так  |
| Перевести feedback у `Under Review` |    Ні    | Так, для своєї команди | Ні  |  Так  |
| Погодити feedback                   |    Ні    |          Так           | Так |  Так  |
| Опублікувати feedback               |    Ні    |           Ні           | Так |  Так  |
| Створити review cycle               |    Ні    | Так, для своєї команди | Так |  Так  |
| Start / Close / Archive cycle       |    Ні    | Так, для своєї команди | Так |  Так  |
| Створити template                   |    Ні    |           Ні           | Так |  Так  |
| Видалити custom template            |    Ні    |           Ні           | Так |  Так  |
| Змінювати ролі користувачів         |    Ні    |           Ні           | Так |  Так  |
| Створювати користувачів             |    Ні    |           Ні           | Ні  |  Так  |
| Створювати команди                  |    Ні    |           Ні           | Ні  |  Так  |
| Створювати продукти                 |    Ні    |           Ні           | Ні  |  Так  |
| Перегляд audit trail                |    Ні    |           Ні           | Так |  Так  |

## Feedback workflow

```text
Draft -> Submitted -> Under Review -> Approved -> Published
```

### 1. Створити запит

Увійди будь-якою роллю та відкрий `Reviews / Оцінювання`.

У блоці `Request feedback / Запросити відгук`:

1. Вибери активний review cycle.
2. Вибери `Review subject / Кого оцінюють`.
3. Вибери `Feedback author / Хто надає відгук`.
4. Натисни `Request feedback`.

Очікуваний результат:

- з’являється повідомлення про успішне збереження;
- у `Feedback tasks` створюється запис зі статусом `draft`;
- автор отримує notification;
- запис доступний requester, author і subject.

Для найпростішого тесту під Employee вибери Elena Employee як subject і author. Тоді запит і форма доступні в одній сесії.

### 2. Заповнити draft

Автор feedback відкриває `Reviews`:

1. Знаходить запис зі статусом `draft`.
2. Натискає `Open form / Відкрити форму`.
3. Заповнює всі required-поля.
4. Чекає приблизно секунду після редагування.

Очікуваний результат:

- відображається progress;
- з’являється `Draft saved automatically`;
- після оновлення сторінки значення залишаються;
- порожні required-поля не дозволяють успішно завершити workflow.

### 3. Надіслати feedback

Натисни `Submit feedback / Надіслати відгук`.

Очікуваний результат:

- поточні відповіді зберігаються перед submit;
- статус змінюється на `submitted`;
- форма стає read-only;
- кнопка редагування draft зникає.

### 4. Взяти на review

Увійди як Manager або Admin:

1. Відкрий `Reviews`.
2. Знайди feedback зі статусом `submitted`.
3. Натисни `Review`.

Очікуваний результат: статус `under review`.

Manager може виконати це лише для subject зі своєї команди. Admin може працювати з усіма командами.

### 5. Погодити

Увійди як Manager, HR або Admin:

1. Знайди feedback зі статусом `under review`.
2. Натисни `Approve / Погодити`.

Очікуваний результат: статус `approved`.

HR не має кнопки `Review`, тому інший Manager або Admin повинен спочатку перевести feedback у `under review`.

### 6. Опублікувати

Увійди як HR або Admin:

1. Знайди feedback зі статусом `approved`.
2. Натисни `Publish / Опублікувати`.

Очікуваний результат: статус `published`.

## Review cycles

```text
Draft -> Active -> Closed -> Archived
```

### Manager

Manager може:

- створити cycle;
- прив’язати template;
- створити cycle лише для своєї команди;
- натиснути `Start`, `Close`, `Archive`.

Спроба керувати cycle іншої команди повинна завершитися помилкою доступу.

### HR та Admin

HR і Admin можуть створювати organization-level cycles, вибирати product/team та керувати lifecycle.

Feedback можна запросити лише для cycle зі статусом `Active`.

## Templates

Сторінка доступна HR та Admin.

Реалізовано:

- створення custom template;
- введення назви й опису;
- створення першої section;
- створення першого long-text question;
- перегляд кількості sections/questions/cycles;
- видалення custom template, якщо він не використовується cycle.

Built-in templates видаляти не можна. Custom template, який використовується review cycle, також видаляти не можна.

## Settings

### Admin

Admin може:

- створити Product;
- створити Team і прив’язати її до Product;
- створити User;
- задати ім’я, email, посаду, пароль, team і role;
- змінити role існуючого користувача;
- переглядати products, teams, users та audit trail.

Після створення користувача ним можна увійти за заданим email/password.

### HR

HR може:

- переглядати users і products;
- змінювати ролі користувачів;
- переглядати audit trail.

HR не створює users, teams або products.

### Manager та Employee

Settings не відображаються в навігації. Прямий перехід на `/settings` повинен перенаправити на Dashboard із помилкою доступу.

## Analytics і Dashboard

Ці сторінки наразі переважно read-only.

Dashboard показує pending reviews, requested feedback, completed reviews, completion rate і recent activity.

Analytics показує середню оцінку, completion rate, strengths, areas for improvement та participation за cycles.

## Локалізація

Перемикач мови знаходиться у верхній панелі та на Login.

Перевір:

1. Натисни `EN`.
2. Переконайся, що кнопка змінилася на `UK`.
3. Перевір назви: `Головна`, `Оцінювання`, `Шаблони`, `Аналітика`, `Налаштування`, `Профіль`.
4. Онови сторінку.
5. Переконайся, що українська мова збереглася.
6. Перемкни назад на English.

Динамічні дані з бази, імена шаблонів, audit summary та status values поки не перекладаються.

## Негативні RBAC-перевірки

- Employee: `/templates` і `/settings` заборонені.
- Manager: `/templates` і `/settings` заборонені.
- HR: `/templates` і `/settings` доступні, але немає створення users/products/teams.
- Admin: усі основні routes доступні.
- Manager не може review feedback іншої команди.
- Employee не може approve або publish feedback.
- Manager не може publish feedback.
- Built-in template не можна видалити.
- Неактивний cycle не можна використовувати для нового feedback request.

## Що ще не реалізовано в UI

- редагування існуючого template;
- додавання багатьох sections/questions через template builder;
- видалення users, teams і products;
- редагування user profile;
- UI для comments і `@mentions`;
- завантаження attachments;
- email delivery provider;
- окрема сторінка notifications;
- фільтри та drill-down для analytics;
- повний mobile sidebar/menu.

## Скидання тестових даних

Звичайний restart не видаляє PostgreSQL data:

```powershell
docker compose down
docker compose up -d
```

Повне скидання видаляє volume та всі створені вручну дані:

```powershell
docker compose down -v
docker compose up --build -d
```

Команду з `-v` використовуй лише тоді, коли справді потрібно почати з чистої бази.
