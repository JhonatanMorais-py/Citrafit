# CitraFit — memória de identidade e produto

Este documento é a referência persistente para as próximas decisões do projeto. Ele registra o estado e a intenção percebidos no protótipo `index.html` em 04/09/2026.

## Marca

- Nome exibido no produto: **RUN/LIFE**.
- Nome do projeto/workspace: **CitraFit**.
- Território: corrida, evolução pessoal, lifestyle e comunidade.
- Promessa central: transformar metas esportivas em rotina, conquistas e identidade.
- Público sugerido pelo protótipo: corredor iniciante, com expansão futura para outros esportes e experiências sociais.
- Personalidade: energética, contemporânea, direta, acolhedora e aspiracional; mais “movimento como estilo de vida” do que performance extrema.

## Assinatura visual

- Contraste principal: preto quase absoluto (`#0b0d0f`) + verde-lima neon (`#b9ff3b`).
- Base clara: fundo cinza esverdeado (`#f4f5f2`), superfícies brancas (`#ffffff`) e superfície secundária (`#eef0ec`).
- Texto: `#101312`; texto secundário: `#66706a`; divisórias: `#dfe4df`.
- Cores funcionais atuais: sucesso `#78c633`, alerta `#f3b340`, perigo/notificação `#ff6b6b`.
- Marca gráfica atual: ponto verde com halo + wordmark tipográfico RUN/LIFE.
- Formas: cartões grandes e arredondados, pills, círculos e cantos suaves; raio-base de 24 px.
- Profundidade: sombras discretas nas superfícies claras e brilho/halo verde sobre fundos escuros.
- Tipografia: Inter/system sans; títulos muito pesados, compactos e com tracking negativo; labels em caixa-alta, pequenos e espaçados.
- Iconografia: SVG linear simples na navegação; símbolos/emoji aparecem em algumas ações e conquistas.

## Linguagem de interface

- Frases curtas, motivacionais e orientadas à progressão.
- Português brasileiro como idioma principal, com anglicismos pontuais de lifestyle (“Running”, “Starter”, “First 5K”, “Club”).
- Números e marcos são tratados como elementos hero: 3,2 km, 5K, 64%, sequência de treinos.
- CTAs usam verbos diretos: “Começar”, “Ver”, “Editar”, “Compartilhar”.
- A marca evita tom militar/agressivo; a motivação é progressiva e acessível.

## Sistema de componentes observado

- Navegação lateral escura no desktop e barra inferior escura no mobile.
- Cartões claros, escuros e de destaque verde.
- Botão primário escuro; variante de maior destaque em verde-lima; botão secundário branco contornado.
- Chips, barras e anéis de progresso, listas de treino, métricas, cards de conquistas e eventos.
- Modais, toast, campos de formulário, switches e estados ativo/bloqueado/concluído.
- Layout responsivo em três faixas: 1100 px, 860 px e 620 px.

## Arquitetura atual do produto

- Login demonstrativo.
- Home/dashboard.
- Plano de treinos “ZERO → 5K”, dividido em oito semanas.
- Progresso e histórico.
- Objetivos.
- Conquistas compartilháveis.
- Eventos sociais/comunidade.
- Perfil e preferências.

## Forças da direção atual

- Paleta memorável e imediatamente associável a energia/movimento.
- Hierarquia forte, leitura rápida e bons destaques de métricas.
- Boa combinação entre performance esportiva e lifestyle social.
- Componentes coerentes e responsividade já prevista.
- Tom adequado para reduzir a barreira de entrada de iniciantes.

## Pontos a amadurecer

- Resolver a relação entre os nomes **CitraFit** e **RUN/LIFE**: marca-mãe, produto, campanha ou substituição definitiva.
- Definir logo/wordmark proprietário; o ponto verde atual funciona como placeholder, mas ainda é genérico.
- Formalizar tokens tipográficos, espaçamentos, estados e acessibilidade em vez de depender de estilos inline.
- Padronizar o uso de português e inglês conforme uma regra editorial clara.
- Substituir emojis por um único sistema de ícones para consistência entre plataformas.
- Validar contraste do verde-lima em usos menores e estados interativos; manter texto escuro sobre o verde.
- Criar estados vazios, carregamento, erro, foco, desabilitado e confirmação.
- Evoluir eventos, comunidade e modalidades sem diluir o foco inicial em corrida para iniciantes.

## Princípios para próximas mudanças

1. Preservar preto + verde-lima como assinatura reconhecível.
2. Manter a interface limpa, arredondada e com hierarquia tipográfica forte.
3. Priorizar clareza e encorajamento para iniciantes.
4. Fazer cada tela destacar uma próxima ação principal.
5. Usar métricas para celebrar evolução, não para punir desempenho.
6. Tratar comunidade/lifestyle como diferencial, sem competir com o fluxo central de treino.
7. Toda nova tela deve funcionar em desktop e mobile e incluir estados de interação relevantes.
8. Todo código novo deve ser organizado por módulo, mantendo responsabilidades, configuração e integrações separadas.
9. Não usar emojis, setas em texto ou símbolos decorativos improvisados na interface e na comunicação do produto.
10. Quando um ícone for necessário, usar SVGs de um sistema profissional, consistente, acessível e alinhado à identidade visual.

## Arquitetura acordada

- O projeto será evoluído por módulos, evitando concentrar novas funcionalidades em arquivos monolíticos.
- Integrações sensíveis e regras privilegiadas pertencem exclusivamente ao backend.
- Credenciais reais nunca devem ser gravadas no código-fonte nem versionadas.

## Convenção do banco de dados

- As tabelas serão agrupadas por finalidade por meio de prefixos em português, para facilitar a leitura do banco.
- `cad_`: cadastros e entidades principais. Exemplos: `cad_perfis`, `cad_modalidades`, `cad_eventos`.
- `mov_`: movimentações, atividades e registros que acontecem ao longo do tempo. Exemplos: `mov_treinos`, `mov_progresso`, `mov_inscricoes`.
- `rel_`: tabelas de relacionamento, principalmente associações muitos-para-muitos. Exemplos: `rel_perfil_modalidade`, `rel_treino_exercicio`.
- `cfg_`: configurações e parâmetros do sistema. Exemplos: `cfg_planos`, `cfg_notificacoes`.
- `log_`: auditoria e histórico técnico. Exemplos: `log_acessos`, `log_alteracoes`.
- Nomes de tabelas e colunas usarão `snake_case`, em português e sem acentos.
- Tabelas usarão nomes no plural; chaves primárias usarão `id`; chaves estrangeiras usarão `<entidade>_id`.
- Datas de controle usarão `created_at` e `updated_at`; exclusão lógica, quando necessária, usará `deleted_at`.
- Entidades de usuário do produto devem referenciar `auth.users(id)` do Supabase, sem duplicar senha ou credenciais em tabelas públicas.
- Toda tabela com dados de usuário deverá ter RLS habilitado e políticas definidas antes de ser usada pelo frontend.

## Fonte atual de verdade

- Protótipo monolítico: `index.html` (HTML, CSS e JavaScript sem dependências).
- Esta memória deve ser atualizada quando nome, público, posicionamento ou sistema visual forem decididos formalmente.
