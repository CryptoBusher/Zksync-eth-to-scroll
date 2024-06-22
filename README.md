## 🚀 Zksync eth to scroll
Бриджит весь ETH из zkSync в Scroll через Router Nitro. Сети захардкодил так как писал для своих целей. Скрипт бриджит не под 0 (остается около 3-10 центов), вычисление суммы ETH для бриджа производится по максимально человеческому способу (сибильные суммы не бриджит, так как Router Nitro автоматически не посчитает вам сумму под 0).

<i>Связь с создателем: https://t.me/CrytoBusher</i> <br>
<i>Если ты больше по Твиттеру: https://twitter.com/CryptoBusher</i> <br>

<i>Залетай сюда, чтоб не пропускать дропы подобных скриптов: https://t.me/CryptoKiddiesClub</i> <br>
<i>И сюда, чтоб общаться с крутыми ребятами: https://t.me/CryptoKiddiesChat</i> <br>

## ⌛️ TODO
- [x] Смена IP общего прокси по ссылке
- [x] Опциональные уведомления TG

## 📚 Первый запуск
1. Устанавливаем [NodeJs](https://nodejs.org/en/download)
2. Скачиваем проект, в терминале, находясь в папке проекта, вписываем команду "npm i" для установки всех зависимостей
3. Меняем название файла "_wallets.txt" на "wallets.txt" и вбиваем свои кошельки, каждый с новой строки в формате "name|privateKey|httpProxy" или "name|privateKey" (если без прокси - будет использоваться generalProxy из конфига - мобильный прокси). Если используете прокси, то формат должен быть такой: "http://user:pass@host:port".
4. Меняем название файла ".env.example" на ".env", открываем через любой текстовый редактор и заполняем.
5. Настраиваем "userConfig.js":
    1. accDelaySec: минимальная и максимальная задержка между аккаунтами в секундах.
    2. minimalBalanceEth: минимальный баланс в эфире, при котором совершается бридж.
    3. slippages: проскальзывания (выбирает рандомно).
    4. maxFeeEth: максимальная комиссия моста, при которой будет совершатся бридж (иначе выбъет ошибку).
    5. bridgesToUse: оставляем как есть, так как в софте всего 1 бридж.
    6. rpcs: оставляем как есть, подтягивает из .env файла.
    7. generalProxy: Прокси + ссылка для смены IP (если не привязали к каким - то кошелькам свои прокси, иначе можно оставить значения пустыми). Подтягивается из .env файла. "sleepTimeSec" - пауза после запроса на смену IP (некоторые прокси меняют IP около долго, 1-2 минуты, но ответ в запросе приходит положительный сразу).
    8. telegramData: оставляем как есть, подтягивает из .env файла.
6. Запускаем скрипт командой "node zksyncEthToScroll.js". Если запускаетесь на сервере - "npm run start", тогда просмотреть лог можно в файле "out.log", а отслеживать в консоли прогресс можно командой "tail -f out.log".

## 🌵 Дополнительная информация
- Я не несу никакой ответственности за ваши средства.
- Данные о кошельках лежат в .json файлах в папке "src/data/dataFiles". Там можно посмотреть ошибки, связанные с кошельком или итоговые затраты на операцию в ETH.

## 💴 Донат
Если хочешь поддержать мой канал - можешь мне задонатить, все средства пойдут на развитие сообщества.
<b>0x77777777323736d17883eac36d822d578d0ecc80<b>
