# Серверная часть приложения VK mini-app Меню Заведения

## Переменные окружения

### Кредитсы для амазон бакета S3:

AWS_ACCESS_KEY_ID - пример: JKJ38JFBN0FD77KMGDBV<br/>
AWS_SECRET_ACCESS_KEY - пример: 68H\djkkwfg09wefHDNfdafads923ddfkdd8384f<br/>
AWS_REGION -регион сервера, пример: eu-north-1<br/>
S3_BUCKET - название бакета, пример: menu
DATABASE_URL - данные для прдключения к БД: postgres://menu:menu@localhost:5432/menu

Пример настроек S3 для selectel
```
S3_BUCKET: 'menu',
AWS_ACCESS_KEY_ID: '59617_s3',
AWS_SECRET_ACCESS_KEY: 'xxx',
AWS_HOST: 'https://s3.selcdn.ru',
S3_BUCKET_URL: 'https://205005.selcdn.ru/menu/',
AWS_REGION: 'ru-1',
AWS_S3_BUCKED_ENDPOINT: true,
AWS_S3_FORCE_PATH_STYLE: true
```

### Кредитсы для ВК:

VK_APP_SECRET_KEY - Защищённый ключ приложения, пример: AjndUj903jnjdHHDDEND<br/>
VK_APP_SERVICE_KEY - Ключ приложения для обращения к АПИ ВК.

### Константы:

CATS_PER_GROUP - Максимальное количесвто категорий на группу<br/>
POS_PER_CAT - Максимальное количество позиций на группу

# Info

- Название: Меню Заведения, menu
- PM: vk.com/girl
- Dev: https://vk.com/pierrot_le_fou
- Staging: https://vk.com/app7815236, https://menu.dev1.hsstore.ru/
