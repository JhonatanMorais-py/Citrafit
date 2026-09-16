# Android experimental — RUN/LIFE

O frontend original continua em `index.html` e `frontend/`. O backend Node continua separado, fora do APK. A base nativa usa Capacitor 8.4.3, com Android API 24+ (Android 7+) e compile/target SDK 36.

## Estado inicial sem servidor

É possível gerar, instalar e abrir o APK sem URL. Login e cadastro exigem um backend HTTPS publicado; a interface informa essa ausência ao tentar conectar. Não há servidor Node embutido nem modo offline de dados. Nenhum serviço foi publicado automaticamente.

## Ambiente

- Node 22+; neste ambiente foi usado Node 24.
- Android Studio 2025.2.1+.
- Android SDK Platform 36, Build Tools 35.0.0 (selecionado pelo Gradle), Platform Tools e um emulador com imagem API 24+.
- JDK 21 para Gradle. Evite o Java 8 do PATH. Em versões novas do Android Studio cujo JBR é Java 25, selecione JDK 21 nas configurações de Gradle deste projeto.
- `.tools/jdk21/`, quando presente, é uma instalação portátil local ignorada pelo Git. `android:debug` detecta essa instalação se JAVA_HOME não estiver definido.

## Web

Configure `.env` com as credenciais do backend e execute `npm.cmd start`. Abra `http://127.0.0.1:3000`. O fluxo Web usa cookies HttpOnly e URLs relativas. `npm.cmd run build` não altera a configuração Web.

## Build, Android Studio e APK

No PowerShell, use os executáveis `.cmd` caso `npm.ps1` seja bloqueado:

```powershell
npm.cmd ci
npm.cmd run build
npx.cmd cap sync android
npx.cmd cap open android
```

Ou `npm.cmd run android:sync` e `npm.cmd run android:open`. Abra a pasta `android/` no Android Studio, aguarde o Gradle Sync e selecione o JDK 21. Use SDK Manager para instalar os pacotes ausentes.

Para gerar o APK debug:

```powershell
npm.cmd run android:debug
```

Saída: `android/app/build/outputs/apk/debug/app-debug.apk`. A assinatura debug é gerada pelas ferramentas Android; não é assinatura de publicação.

Para testar no emulador: crie um dispositivo no Device Manager, instale uma imagem de sistema, inicie-o e use Run no Android Studio ou `npm.cmd run android:run`.

Para celular USB: habilite Opções do desenvolvedor e Depuração USB, conecte o cabo, confirme a chave de depuração no celular, confira `adb devices` e selecione o dispositivo no Android Studio. Se necessário, use o adb em `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe`.

Para instalar manualmente: transfira `app-debug.apk` ao celular, abra-o e autorize a instalação por esse aplicativo de arquivos. Por USB: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`.

## Configurar o servidor depois

Use um backend de homologação com HTTPS válido. No terminal usado para compilar:

```powershell
$env:MOBILE_API_URL = 'https://api.seu-dominio.com'
npm.cmd run android:debug
```

Esse domínio é somente exemplo; substitua pelo servidor real. Informe apenas a origem, sem `/api`, caminhos, parâmetros ou credenciais. A variável é pública, gravada no pacote; o build não carrega `.env`. Sem a variável, o build produz novamente um aplicativo sem API. Cada mudança exige novo build e sync.

No servidor:

```text
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<somente no servidor>
NODE_ENV=production
APP_HOST=127.0.0.1
APP_PORT=3000
NATIVE_ORIGINS=https://localhost,capacitor://localhost
```

Mantenha `127.0.0.1` atrás de um proxy HTTPS local. Em contêineres, configure o bind adequado, como `0.0.0.0`, e limite a exposição pela infraestrutura. O proxy deve preservar o Host público para as verificações de origem Web. Não habilite CORS genérico, HTTP claro no APK ou acesso a `.env`.

O endereço local `https://localhost` é a origem do Capacitor, não a URL da API. Esta versão exige API HTTPS externa; não inclui exceção HTTP para LAN/emulador. Sem servidor, apenas a interface pode ser exercitada no APK. O backend pode continuar sendo testado localmente pela Web.

## Sessão e segurança

- Web: cookies HttpOnly/SameSite=Strict; Secure em produção; restauração e renovação pelo backend.
- Android: header `X-Runlife-Client: native`, Bearer access token em memória e refresh token cifrado com AES-GCM e chave no Android Keystore. Não se usam cookies Web como fallback no transporte nativo.
- `SessionVaultPlugin.java` é o adaptador local de armazenamento protegido. Backups do aplicativo estão desabilitados. Falha ao ler uma sessão cifrada resulta em novo login.
- CORS permite somente as origens configuradas; não permite credenciais cross-origin.
- Perfil é autorizado no backend pelo token e ID do usuário, sem confiar no ID enviado pelo cliente.
- O build usa uma lista explícita de arquivos públicos e recria `dist/mobile/`. Backend, `.env` e node_modules não são copiados.
- Logout Android sem rede apaga a sessão local e informa que a revogação remota não foi confirmada. Na Web, falha de conexão não é apresentada como logout concluído.

Riscos herdados ainda exigem decisão antes de publicação: cadastro confirma e-mail automaticamente, rate limit é local ao processo/IP e deve ser adaptado ao proxy, e as operações de perfil usam cliente privilegiado (a autorização backend é essencial). As políticas RLS remotas precisam ser conferidas no ambiente real. A aceitação de termos ainda não é registrada no servidor. Nada disso foi afrouxado para Android.

Recuperação de senha e deep links não faziam parte dos fluxos existentes e não foram implementados. A arquitetura permite acrescentá-los com URLs autorizadas e validação de retorno. iOS exige futuramente macOS/Xcode, projeto `ios/` e implementação do adaptador SessionVault usando Keychain; não basta gerar a pasta iOS para considerar a persistência pronta.

## Verificação

```powershell
npm.cmd run build
npm.cmd test
npm.cmd run check:backend
```

Os testes usam Supabase simulado localmente, sem contas reais nem alteração no banco. Verificam separação Web/native, cookies Secure, CORS, renovação, autorização de perfil e arquivos privados. Antes de distribuir para testes com dados reais, valide login/cadastro, reabertura, expiração, logout, perda de rede, teclado, fonte ampliada e rotação em emulador e celular.

`npm.cmd run test:ui` testa cadastro, login, perfil, restauração e logout no Chrome local, em larguras de 360 e 1280 pixels, com API simulada. Instale Chrome ou ajuste `channel` em `playwright.config.mjs` para o navegador de teste. A barra mobile permite deslizar horizontalmente para acessar todas as sete áreas sem reduzir os alvos de toque.

O trabalho está na branch `feature/android-experimental`, criada a partir de `DEV`. Não há commit/push automático. As estruturas preparatórias anteriores em `apps/`, `packages/`, `supabase/` e testes foram preservadas.
