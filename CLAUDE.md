# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão geral

App pessoal de lembrete de pílula anticoncepcional para um casal. Existem dois papéis:

- **GF (`GF_PILL_TAKER`)** — toma a pílula. Roda em **iOS via Expo Go**, então depende de **notificações locais** (não há push real, para evitar a taxa de US$99 do Apple Developer Program).
- **BF (`BF_REMINDER`)** — é avisado. Roda em **Android via EAS Build** (binário nativo), o que dá um `pushToken` Expo válido para receber **push notifications** disparadas pelo servidor.

A arquitetura é **serverless**: React Native (Expo) no frontend + Firebase (Firestore + Cloud Functions) no backend. A automação crítica (alertar o BF quando a pílula não foi tomada) roda em Cloud Functions, garantindo que o alerta chegue mesmo com o app fechado.

## Comandos

App (raiz):
```bash
npm install
npm start              # expo start --port 3001
npm run ios            # GF — Expo Go
npm run android        # BF — requer EAS Build / dev client
npm run lint           # expo lint
npm run release-expo   # eas update (publica OTA)
npx eas build --platform android   # gera APK para o BF
```

Cloud Functions (`cd functions`):
```bash
npm run build          # tsc -> lib/
npm run serve          # build + emuladores locais
npm run deploy         # firebase deploy --only functions
npm run logs           # firebase functions:log
npm run lint           # eslint (config Google, separada da raiz)
```

Não há suíte de testes configurada.

## Configuração de ambiente

As variáveis `EXPO_PUBLIC_FIREBASE_*` vivem no EAS e são baixadas com `npx eas env:pull --environment production` (gera `.env.local`, gitignorado). `src/config/firebase.ts` lê elas via `process.env`. O `google-services.json` (Android) é um secret do EAS que **não pode ser lido fora dos servidores** — para build Android local, baixe-o do Firebase Console.

## Arquitetura

### Fluxo de navegação (Expo Router, file-based em `app/`)

`app/index.tsx` é o gatekeeper: faz login anônimo (`AuthService`), lê o `users_config` do usuário no Firestore e dá `router.replace` para `main-gf`, `main-bf` ou `role-select` (primeira vez). Nomes de rota são centralizados no enum `ScreenName` em `src/types/index.ts` — **use o enum, não strings literais**. O `app/_layout.tsx` envolve tudo no `ThemeProvider` e registra o Stack.

### Camada de dados (Firestore)

Todo acesso passa por `FirestoreService` (classe estática em `src/services/firestoreService.ts`). Os caminhos seguem o padrão `artifacts/{APP_ID}/public/data/{collection}` (definidos em `COLLECTIONS` em `src/config/firebase.ts`; `APP_ID = "lembrete-anticoncepcional"`). Coleções públicas mas acessíveis só por usuários autenticados.

- **`daily_log/{YYYY-MM-DD}`** — fonte da verdade diária. Campos: `taken`, `takenTime`, `alertSent`, `pillType` (`active`|`placebo`), `observations[]`. A chave do documento é a data; como é string `YYYY-MM-DD`, queries por intervalo usam comparação lexicográfica (`getLogsByDateRange`).
- **`users_config/{userId}`** — `role`, `pushToken` (só BF), `platform`.

Estado em tempo real usa os métodos `watch*` (wrappers de `onSnapshot`). O `userId` vem da auth anônima do Firebase (`AuthService`, persistida via AsyncStorage).

### Notificações — duas metades distintas

**Local (GF, cliente)** — `src/services/notificationService.ts`. `scheduleWeeklyNotifications()` agenda lembretes individuais para as **21:00 dos próximos 7 dias** (não usa `repeats`; reagenda em janelas). Ao confirmar a pílula, a notificação do dia é cancelada por `identifier` (`pill-reminder-{dateKey}`). O `projectId` do Expo está hardcoded em `getPushToken()`.

**Servidor (alerta do BF)** — `functions/src/index.ts`. Três functions:
- `notifyBfOnPillTaken` — trigger `onDocumentWritten` no `daily_log`; quando `taken` vira `true`, faz push para todos os BF. Deduplica via flag `takenNotified`.
- `dailyPillReminder` — agendada `0 22 * * *` (America/Sao_Paulo). Às 22:00, se `taken=false` e `alertSent=false`, alerta o BF e marca `alertSent=true`. Cria o `daily_log` do dia se não existir.
- `testPillReminder` — endpoint HTTP que roda a mesma lógica de `checkAndSendPillReminder` para teste manual.

Todas enviam via `sendPushToAllBfUsers`, que faz POST direto na Expo Push API (`https://exp.host/--/api/v2/push/send`) para cada usuário com `role: BF_REMINDER` e `pushToken` presente. **As functions não compartilham código com o app** — os caminhos do Firestore são reconstruídos manualmente lá (codebase separado, `firebase-admin`).

### Tema

`ThemeContext` (`src/contexts/ThemeContext.tsx`) provê `colors`, `theme` e `themeMode` (`light`|`dark`|`system`, persistido via `StorageService`/AsyncStorage). Componentes obtêm cores com o hook `useAppTheme()` e a paleta de `constants/theme.ts` (`getColors(theme)`) — **não hardcode cores**, use `colors.*`. A identidade visual (paleta, dark mode, tipografia) está documentada em detalhe em `.cursor/rules/visual-identity-theme.mdc`.

## Convenções

- Import alias `@/*` mapeia para a raiz do projeto (ex.: `@/src/...`, `@/constants/...`, `@/components/...`).
- Services são classes com métodos estáticos (`FirestoreService`, `AuthService`, `NotificationService`, `StorageService`).
- Datas: use os helpers de `src/utils/dateUtils.ts` (`formatDateKey`) para gerar a chave `YYYY-MM-DD`.
- UI, logs e mensagens de notificação são em **português**.
- Regras de arquitetura e produto vivem em `.cursor/rules/*.mdc` (sempre aplicadas no Cursor) — consulte-as antes de mudar fluxo de notificação, modelo de dados ou identidade visual.

> Nota: o `README.md` está parcialmente desatualizado (lista as telas principais como "próximo passo" e menciona lembrete às 20:00 — o código usa 21:00, e as telas já existem). Prefira o código e este arquivo.
