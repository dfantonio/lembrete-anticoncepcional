# 💊 Lembrete Anticoncepcional

Aplicativo pessoal de lembrete de pílula anticoncepcional para um casal, com notificações automáticas entre dispositivos.

## 🏗️ Arquitetura

Arquitetura **serverless** baseada em Firebase:

- **Frontend:** React Native (Expo) + Expo Router — iOS (Expo Go) e Android (EAS Build)
- **Backend:** Firebase (Firestore + Cloud Functions)
- **Notificações:** Notificações locais (cliente) + Expo Push API (servidor)

### Por que essa arquitetura?

Para evitar a taxa anual de US$99 do Apple Developer Program (necessária para push real via APNs no iOS), os dois papéis usam estratégias diferentes:

- **GF (a tomadora)** — roda em **iOS via Expo Go** e depende de **notificações locais** para o lembrete das 21:00.
- **BF (o lembrete)** — roda em **Android via EAS Build** (binário nativo), o que fornece um `pushToken` Expo válido para receber **push notifications** disparadas pelo servidor — mesmo com o app fechado.

## 📱 Como funciona

### Papéis

| Papel | `role` | Plataforma | Função |
| :---- | :----- | :--------- | :----- |
| GF | `GF_PILL_TAKER` | iOS (Expo Go) | Toma a pílula e marca como tomada |
| BF | `BF_REMINDER` | Android (EAS Build) | Recebe os alertas |

Na primeira abertura o app faz login anônimo, e como ainda não há `role` salvo, exibe a tela de seleção de papel. Nas próximas vezes, vai direto para a tela principal correspondente.

### Fluxo de notificação

1. **21:00** — GF recebe notificação **local** lembrando de tomar a pílula.
2. GF marca a pílula como tomada no app (registra `taken`, `takenTime`, tipo da pílula e observações).
3. Ao confirmar, a notificação local do dia é cancelada e a Cloud Function `notifyBfOnPillTaken` envia um push de confirmação ao BF.
4. **22:00** — A Cloud Function agendada `dailyPillReminder` verifica o dia: se `taken = false` e `alertSent = false`, envia um **alerta push** ao BF e marca `alertSent = true`.

### Recursos do app

- **Tela GF (`main-gf`)** — status do dia em tempo real, botão "Pílula Tomada", seleção de tipo de pílula (ativo/placebo) e observações.
- **Tela BF (`main-bf`)** — acompanhamento do status do dia; registra/atualiza o `pushToken` no Firestore.
- **Histórico (`calendar-history`)** — calendário com os dias tomados/perdidos e detalhes por dia.
- **Analytics (`analytics`)** — adesão (%), sequências (streaks), distribuição de horários, contagem de observações e tipos de pílula.
- **Tema** — claro, escuro ou automático (segue o sistema), com a paleta da identidade visual.
- **Observações diárias** — cólica, sangramento, dor de cabeça, treino, etc. (ver `constants/observations.ts`).

### Estrutura de dados (Firestore)

Caminho base: `artifacts/lembrete-anticoncepcional/public/data/`

```
daily_log/{YYYY-MM-DD}
├── dateKey: string
├── taken: boolean
├── takenTime?: string (HH:MM)
├── alertSent: boolean          # usada pela Cloud Function das 22:00
├── pillType: "active" | "placebo"
├── observations?: string[]
└── takenNotified?: boolean      # dedupe do push de confirmação

users_config/{userId}
├── role: "GF_PILL_TAKER" | "BF_REMINDER"
├── pushToken?: string          # obrigatório apenas para o BF
└── platform?: "ios" | "android"
```

## ☁️ Cloud Functions (`functions/src/index.ts`)

| Função | Tipo | Descrição |
| :----- | :--- | :-------- |
| `notifyBfOnPillTaken` | Trigger Firestore | Quando `taken` vira `true` no `daily_log`, envia push de confirmação ao BF (dedupe via `takenNotified`). |
| `dailyPillReminder` | Agendada (`0 22 * * *`, America/Sao_Paulo) | Às 22:00, se a pílula não foi tomada, alerta o BF e marca `alertSent`. |
| `testPillReminder` | HTTP | Executa a mesma lógica da agendada, para teste manual. |

Todas enviam push via Expo Push API para todos os usuários com `role: BF_REMINDER` e `pushToken` definido.

## 🚀 Como executar

### 1. Configuração de ambiente

As variáveis do Firebase ficam no EAS. Baixe-as com:

```bash
npx eas env:pull --environment production   # gera .env.local
```

Para build Android, você também precisa do `google-services.json` (secret do EAS / Firebase Console) na raiz do projeto.

### 2. Instalar e rodar o app

```bash
npm install
npm start          # expo start --port 3001
npm run ios        # GF — Expo Go
npm run android    # BF — requer dev client / EAS Build
```

### 3. Build do APK (BF)

```bash
npx eas build --platform android
```

### 4. OTA update

```bash
npm run release-expo   # eas update
```

## ☁️ Deploy das Cloud Functions

```bash
cd functions
npm install
npm run build      # tsc -> lib/
npm run serve      # build + emuladores locais
npm run deploy     # firebase deploy --only functions
npm run logs       # firebase functions:log
```

## 🔧 Desenvolvimento

Aliases de import: `@/*` aponta para a raiz (ex.: `@/src/...`, `@/components/...`, `@/constants/...`).

```
app/                      # Rotas (Expo Router, file-based)
├── index.tsx             # Gatekeeper: auth + redireciona por role
├── role-select.tsx
├── main-gf.tsx / main-bf.tsx
├── calendar-history.tsx / analytics.tsx
components/                # Componentes de UI reutilizáveis
constants/                 # theme, observations, pillTypes
src/
├── config/firebase.ts     # Init do Firebase + caminhos das coleções
├── contexts/ThemeContext.tsx
├── hooks/                 # useAnalytics, useCalendarHistory
├── services/              # FirestoreService, AuthService, NotificationService, StorageService
├── types/index.ts         # Tipos + enum ScreenName
└── utils/dateUtils.ts

functions/src/index.ts     # Cloud Functions (codebase separado)
```

Convenções e regras de produto/arquitetura detalhadas estão em `.cursor/rules/*.mdc` e em `CLAUDE.md`.

## 📋 Status

- ✅ Telas principais (seleção de papel, GF, BF, histórico, analytics)
- ✅ Firebase (Auth anônima + Firestore)
- ✅ Cloud Functions (trigger, agendada e HTTP de teste)
- ✅ Notificações locais (GF) e push (BF)
- ✅ Tema claro/escuro/automático
- ✅ Observações diárias e tipos de pílula (ativo/placebo)

---

**Desenvolvido com ❤️ usando Expo + Firebase**
