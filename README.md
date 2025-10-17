# 💊 Lembrete Anticoncepcional

Aplicativo de lembrete de pílula anticoncepcional com notificações automáticas entre dispositivos.

## 🏗️ Arquitetura

Este projeto utiliza uma arquitetura **serverless** baseada em Firebase:

- **Frontend:** React Native (Expo) - iOS (Expo Go) e Android (EAS Build)
- **Backend:** Firebase (Firestore + Cloud Functions)
- **Notificações:** Expo Push API + Notificações Locais

## 🔥 Firebase Functions Implementadas

### 1. `dailyPillReminder` (Função Agendada)

- **Execução:** Diariamente às 22:00 (horário de Brasília)
- **Função:** Verifica se a pílula foi tomada e envia notificação para o BF se necessário
- **Trigger:** Cloud Scheduler automático

### 2. `testPillReminder` (Função de Teste)

- **Execução:** Manual via HTTP
- **Função:** Executa a mesma lógica da função agendada para testes
- **URL:** https://us-central1-app-anticoncepcional.cloudfunctions.net/testPillReminder

## 📱 Como Funciona

### Fluxo Principal:

1. **GF (iOS)** recebe notificação local às 20:00
2. **GF** marca pílula como tomada no app
3. **22:00** - Cloud Function verifica automaticamente:
   - Se `taken = false` e `alertSent = false`
   - Envia notificação push para **BF (Android)**
   - Marca `alertSent = true`

### Estrutura de Dados (Firestore):

```
artifacts/lembrete-anticoncepcional/public/data/
├── daily_log/{YYYY-MM-DD}
│   ├── taken: boolean
│   ├── takenTime: string
│   └── alertSent: boolean
└── users_config/{userId}
    ├── role: "GF_PILL_TAKER" | "BF_REMINDER"
    ├── pushToken: string
    └── platform: "ios" | "android"
```

## 🚀 Como Executar

### 1. Configurar Firebase

**⚠️ IMPORTANTE:** Este projeto requer configuração do Firebase. Os arquivos de configuração sensíveis não estão incluídos no repositório por questões de segurança.

Você precisará criar:

1. **Projeto Firebase** em https://console.firebase.google.com
2. **Arquivo `google-services.json`** (Android) - baixe do console Firebase
3. **Arquivo `app-anticoncepcional-firebase-adminsdk-fbsvc-*.json`** (Service Account) - para Cloud Functions
4. **Arquivo `.firebaserc`** com seu project ID

### 2. Instalar dependências

```bash
npm install
```

### 3. Iniciar o app

```bash
npx expo start
```

### 3. Testar Firebase

- Abra o app
- Clique em "🧪 Abrir Teste Firebase"
- Teste autenticação, Firestore e notificações

### 4. Testar Cloud Functions

- Acesse: https://us-central1-app-anticoncepcional.cloudfunctions.net/testPillReminder
- Verifique se a notificação chega no dispositivo BF

## 🔧 Desenvolvimento

### Estrutura do Projeto:

```
src/
├── config/firebase.ts          # Configuração Firebase
├── services/
│   ├── authService.ts          # Autenticação anônima
│   ├── firestoreService.ts     # Operações Firestore
│   └── notificationService.ts  # Notificações locais/push
├── screens/
│   └── TestFirebaseScreen.tsx  # Tela de testes
└── types/index.ts              # Tipos TypeScript

functions/
└── src/index.ts                # Cloud Functions
```

### Comandos Úteis:

```bash
# Desenvolvimento
npx expo start

# Build para Android
npx eas build --platform android

# Deploy Cloud Functions
firebase deploy --only functions

# Ver logs das Functions
firebase functions:log
```

## 📋 Status da Implementação

- ✅ **Firebase configurado** (Auth + Firestore)
- ✅ **Cloud Functions deployadas** (agendada + teste)
- ✅ **Notificações locais** (iOS - Expo Go)
- ✅ **Push notifications** (Android - EAS Build)
- ✅ **Tela de teste** integrada
- 🔄 **Telas principais** (RoleSelect, MainGF, MainBF) - Próximo passo

## 🎯 Próximos Passos

1. Implementar telas principais do app
2. Integrar fluxo completo de usuário
3. Testes finais em produção
4. Deploy para stores (opcional)

---

**Desenvolvido com ❤️ usando Expo + Firebase**
