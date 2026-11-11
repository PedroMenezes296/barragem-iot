# BarragemIot — Criação do novo frontend com Next.js, React, TypeScript e Material UI

Você atuará como engenheiro de software frontend sênior, com experiência em Next.js, React, TypeScript, Material UI, arquitetura de componentes e desenvolvimento de dashboards responsivos.

Sua tarefa é **criar uma aplicação frontend completamente nova**, dentro do diretório atual, para o projeto universitário BarragemIot.

Não quero apenas sugestões ou um planejamento. Quero que você implemente a aplicação, configure as dependências, desenvolva as páginas e execute as verificações necessárias.

## 1. Contexto do projeto

O BarragemIot é um sistema de monitoramento de nível de água de um reservatório experimental, desenvolvido no Projeto Integrador V de Engenharia de Computação.

Nossa arquitetura geral utiliza:

- Arduino Mega 2560.
- Ethernet Shield W5100.
- Sensor ultrassônico HC-SR04.
- Sensor resistivo de nível.
- Sensor de umidade ambiental.
- Backend NestJS.
- Prisma e MongoDB.
- Previsões meteorológicas da Open-Meteo, em uma futura integração.
- Frontend Next.js com React e TypeScript.

O Arduino envia medições para o backend por meio de requisições HTTP.

O backend valida e armazena os dados.

O frontend será responsável por apresentar essas informações de maneira intuitiva.

**Nesta etapa, não haverá conexão com o backend. Toda a aplicação deve funcionar utilizando dados mockados.**

## 2. Objetivo principal

Criar o frontend do BarragemIot com uma identidade visual moderna, profissional, intuitiva e responsiva.

Utilizar:

- Next.js com App Router.
- React.
- TypeScript.
- Material UI (MUI).
- MUI Icons.
- Componentes reutilizáveis.
- Dados mockados e tipados.

A interface deve possuir três páginas:

1. Visão Geral.
2. Histórico.
3. Alertas.

Não criar a página Meteorologia separadamente nesta versão.

As informações meteorológicas devem aparecer dentro da Visão Geral.

## 3. Criação do projeto com Next.js CLI

Utilize a estrutura oficial produzida pelo `create-next-app`.

Antes de começar:

1. Inspecione o diretório atual.
2. Identifique se já existe um projeto Next.js configurado.
3. Preserve o arquivo deste prompt e outros arquivos fornecidos.
4. Não altere aplicações vizinhas.
5. Não crie uma segunda pasta de projeto desnecessariamente.

Se o projeto ainda não estiver inicializado, utilize o CLI oficial do Next.js com as seguintes opções:

- TypeScript habilitado.
- ESLint habilitado.
- App Router habilitado.
- Diretório `src` habilitado.
- Alias `@/*` configurado.
- npm como gerenciador de pacotes.
- Sem Tailwind CSS.

Exemplo de comando, adaptando o nome ou o diretório conforme necessário:

```bash
npx create-next-app@latest barragem-iot --typescript --eslint --app --src-dir --import-alias "@/*" --no-tailwind --use-npm
```

Se o diretório atual já for a pasta final do projeto, inicialize a aplicação diretamente nela, sem criar `barragem-iot/barragem-iot`.

Mantenha os arquivos e as convenções oficiais do Next.js sempre que possível.

Não recrie manualmente as configurações que o CLI já fornece corretamente.

## 4. Instalação e configuração do Material UI

Utilize MUI como biblioteca principal de componentes e responsividade.

Instale as dependências compatíveis com as versões selecionadas do Next.js e React:

- `@mui/material`
- `@mui/icons-material`
- `@emotion/react`
- `@emotion/styled`
- `@mui/material-nextjs`
- `@emotion/cache`

Utilize a documentação oficial do MUI para configurar sua integração com o Next.js App Router.

Configure corretamente:

- `ThemeProvider`.
- `CssBaseline`.
- `AppRouterCacheProvider`.
- Tema personalizado.
- Tipografia.
- Breakpoints.
- Cores.
- Estilos compartilhados.

Utilize o caminho de importação do `AppRouterCacheProvider` correspondente à versão instalada do Next.js. Não copie um caminho de uma versão diferente sem conferir sua compatibilidade.

Evite erros de hidratação ou inconsistências entre renderização no servidor e no navegador.

O Material UI deve ser responsável pela maior parte da interface.

Priorize seus componentes prontos, como:

- `Box`
- `Container`
- `Stack`
- `Grid`
- `Card`
- `CardContent`
- `Typography`
- `AppBar`
- `Toolbar`
- `Drawer`
- `List`
- `ListItemButton`
- `Button`
- `Chip`
- `Alert`
- `LinearProgress`
- `CircularProgress`
- `Table`
- `TableContainer`
- `TablePagination`
- `TextField`
- `Select`
- `MenuItem`
- `Tooltip`
- `Skeleton`
- `Dialog`

Personalize esses componentes usando o tema MUI, `sx` e `styled`, conforme necessário.

Não utilize Tailwind CSS, Bootstrap ou shadcn/ui.

Não adicione outra biblioteca de interface que duplique funcionalidades do MUI.

## 5. Identidade visual

O nome oficial da aplicação é:

**BarragemIot**

Não utilize os nomes antigos HidroLab ou Barragem-IoT na interface.

A identidade visual deve ser inspirada no conceito de dashboard de monitoramento hídrico que definimos.

Estilo:

**Professional Water Monitoring Dashboard**

Características:

- Tema escuro como padrão inicial.
- Azul-marinho como cor principal.
- Azul intermediário nos elementos interativos.
- Azul acinzentado nos gráficos.
- Verde discreto para situações normais.
- Amarelo ou âmbar para avisos.
- Vermelho para alertas críticos.
- Cards arredondados.
- Bordas suaves.
- Sombras discretas.
- Tipografia moderna.
- Ícones consistentes.
- Boa hierarquia visual.
- Espaçamento confortável.

Paleta de referência:

```typescript
const colors = {
  background: '#0B1F3B',
  surface: '#142941',
  surfaceSecondary: '#1E3A5F',
  primary: '#2D6CDF',
  chartPrimary: '#7497B8',
  chartSecondary: '#A4B6C8',
  success: '#14B8A6',
  warning: '#F59E0B',
  error: '#EF4444',
  text: '#E2E8F0',
};
```

Essas cores são uma referência e podem ser refinadas para obter um resultado harmonioso.

Evite gráficos muito saturados, brilhos neon e efeitos exagerados.

Os gráficos devem ser discretos, principalmente em tons de azul e cinza-azulado.

Crie um tema MUI centralizado, evitando repetir valores visuais em cada componente.

Configure também um tema claro consistente, caso implemente alternância de tema.

## 6. Estrutura modular obrigatória

Quero uma arquitetura altamente modular.

**TODOS os componentes React devem ficar dentro de `src/components`.**

Os arquivos do App Router devem continuar em `src/app`, contendo somente a composição das páginas, metadados e responsabilidades próprias do Next.js.

Estrutura de referência:

```text
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── historico/
│   │   └── page.tsx
│   └── alertas/
│       └── page.tsx
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Header.tsx
│   │   └── PageContainer.tsx
│   │
│   ├── overview/
│   │   ├── ReservoirCapacityCard.tsx
│   │   ├── CurrentLevelCard.tsx
│   │   ├── WaterLevelChart.tsx
│   │   ├── RainForecastChart.tsx
│   │   ├── HumidityCard.tsx
│   │   └── SystemStatusCard.tsx
│   │
│   ├── history/
│   │   ├── ReadingHistory.tsx
│   │   ├── HistoryFilters.tsx
│   │   ├── ReadingsTable.tsx
│   │   └── ReadingStatusChip.tsx
│   │
│   ├── alerts/
│   │   ├── AlertsList.tsx
│   │   ├── AlertCard.tsx
│   │   ├── AlertSeverityChip.tsx
│   │   └── EmailSubscriptionForm.tsx
│   │
│   ├── charts/
│   │   ├── ChartContainer.tsx
│   │   └── ChartTooltip.tsx
│   │
│   └── ui/
│       ├── DashboardCard.tsx
│       ├── StatusBadge.tsx
│       ├── EmptyState.tsx
│       └── SectionHeader.tsx
│
├── mocks/
│   ├── readings.mock.ts
│   ├── weather.mock.ts
│   ├── alerts.mock.ts
│   └── devices.mock.ts
│
├── theme/
│   ├── theme.ts
│   └── ThemeRegistry.tsx
│
├── types/
│   ├── reading.types.ts
│   ├── weather.types.ts
│   └── alert.types.ts
│
├── hooks/
│
├── services/
│
└── utils/
    ├── formatters.ts
    └── date.utils.ts
```

Essa estrutura é uma referência.

Não crie arquivos desnecessários apenas para reproduzir a árvore.

Regras obrigatórias:

1. Todos os componentes React reutilizáveis ou específicos de páginas ficam em `src/components`.
2. Componentes de Visão Geral ficam em `src/components/overview`.
3. Componentes de Histórico ficam em `src/components/history`.
4. Componentes de Alertas ficam em `src/components/alerts`.
5. Componentes compartilhados ficam em `src/components/ui`, `layout` ou `charts`.
6. Não crie diretórios `features`.
7. Não crie subpastas `components` dentro de `overview`, `history` ou `alerts`.
8. Não coloque dados mockados dentro dos arquivos de componentes.
9. Não concentre toda a lógica da aplicação em um único arquivo.
10. Evite abstrações excessivas ou componentes sem responsabilidade clara.

Cada componente deve receber dados por propriedades tipadas sempre que isso melhorar a reutilização.

## 7. Página Visão Geral

Rota:

`/`

Essa será a página principal do BarragemIot.

Quero os seguintes elementos:

### 7.1. Porcentagem atual do reservatório

Criar um card com destaque para a porcentagem atual do reservatório.

Exemplo visual:

**68% — Nível atual do reservatório**

Utilize um gráfico circular, indicador radial ou componente visual semelhante.

O valor será mockado inicialmente.

IMPORTANTE:

A porcentagem não pode ser interpretada automaticamente como volume real armazenado.

O sistema futuramente precisará de um cálculo definido no backend, baseado em medidas calibradas do reservatório e, se necessário, em sua geometria.

Nesta etapa, apresente a porcentagem como indicador demonstrativo.

### 7.2. Gráfico comparativo dos sensores

Criar um gráfico de linha contendo duas séries:

- Sensor ultrassônico.
- Sensor resistivo.

Ambas devem aparecer no mesmo gráfico.

Requisitos:

- Eixo horizontal com data e horário.
- Eixo vertical com nível de água em centímetros.
- Legenda identificando os sensores.
- Tooltip exibindo valores da leitura.
- Cores diferentes, mas discretas.
- Linhas com aparência moderna.
- Boa responsividade.
- Tratamento correto de valores ausentes.

Utilize dados simulados coerentes, com algumas variações ao longo do tempo.

Não transforme valores `null` em zero.

A distância medida pelo sensor ultrassônico não deve ser confundida com o nível da água.

Para o protótipo, utilize níveis demonstrativos já calculados e identificados como simulados.

### 7.3. Gráfico de previsão de chuva

Criar um gráfico de previsão meteorológica para os **próximos 7 dias**.

Utilize um gráfico de barras.

Cada barra deve representar a quantidade de precipitação prevista para um dia, em milímetros.

Exemplo:

```text
Dia 1: 12 mm
Dia 2: 28 mm
Dia 3: 35 mm
Dia 4: 19 mm
Dia 5: 13 mm
Dia 6: 9 mm
Dia 7: 6 mm
```

Os dados devem vir de `weather.mock.ts`.

Posteriormente, essa informação será obtida por meio da API Open-Meteo.

A previsão deve ser claramente identificada como simulada nesta etapa.

### 7.4. Card de umidade

Criar um card exibindo a umidade ambiental atual.

Exemplo:

**Umidade relativa: 72%**

Não é necessário criar gráfico histórico de umidade na Visão Geral.

Utilize um componente compacto com ícone, valor percentual e descrição.

### 7.5. Outros indicadores

Criar cards compactos para:

- Última leitura recebida.
- Nível atual em centímetros.
- Estado do sistema.
- Quantidade de sensores com dados disponíveis.

Esses componentes devem complementar a visualização sem sobrecarregá-la.

O dashboard deve priorizar visualmente:

1. Porcentagem do reservatório.
2. Gráfico comparativo dos níveis.
3. Previsão de chuva.
4. Umidade.
5. Indicadores complementares.

## 8. Página Histórico

Rota:

`/historico`

Essa página será utilizada principalmente para acompanhar as últimas leituras e demonstrar aos professores os registros produzidos pelo sistema.

A proposta é semelhante a um log de eventos, mas com a organização visual de uma tabela profissional.

Criar:

- Título da página.
- Identificação do dispositivo.
- Filtro de período.
- Tabela com as últimas leituras.
- Paginação.
- Indicação de total de registros.
- Estados de ausência de dados.

Campos sugeridos:

- Data e horário.
- ID da leitura.
- ID do dispositivo.
- Distância do sensor ultrassônico.
- Nível ultrassônico.
- Nível resistivo.
- Umidade.
- Estado da leitura.

Utilize componentes de tabela do MUI.

Ordene as leituras das mais recentes para as mais antigas.

Disponibilize dados suficientes para demonstrar a paginação e os filtros.

Se for útil, implemente exportação CSV dos dados simulados.

O resultado deve ser uma tela organizada, com aparência de histórico técnico.

## 9. Página Alertas

Rota:

`/alertas`

A página deve apresentar os alertas gerados a partir da interpretação dos dados de monitoramento.

Nesta etapa, os alertas serão completamente simulados.

### Categorias sugeridas

**Chuva intensa prevista**

Quando a previsão indicar precipitação elevada nos próximos dias.

**Risco elevado de inundação**

Quando o nível do reservatório estiver elevado e houver previsão de chuva significativa.

**Possível condição de seca**

Quando o nível estiver baixo e a previsão indicar pouca precipitação.

**Operação normal**

Quando não existirem condições de atenção identificadas.

Utilize níveis visuais de severidade:

- Informação.
- Atenção.
- Crítico.

Os exemplos não devem ser apresentados como uma avaliação real de segurança da barragem.

Não crie limites definitivos de enchente, inundação ou seca sem calibração e validação.

As regras futuras deverão ser definidas e implementadas no backend.

### Componentes de alertas

Crie cards com:

- Título.
- Ícone.
- Severidade.
- Descrição.
- Data de geração.
- Condições que motivaram o alerta.

As cores devem seguir o tema MUI.

Não utilize alertas excessivamente chamativos, exceto quando necessário para comunicar estados críticos.

## 10. Inscrição para notificações por e-mail

Na página Alertas, inclua uma seção:

**Receba alertas por e-mail**

Essa seção terá:

- Descrição breve.
- Campo para endereço de e-mail.
- Botão de cadastro.
- Validação do formato do endereço.
- Mensagens de erro e sucesso.

Nesta etapa:

- Não envie e-mails reais.
- Não crie integração SMTP.
- Não crie contas de usuário.
- Não conecte a serviços externos.
- Não persista dados pessoais em banco de dados.

Implemente apenas uma demonstração visual e funcional do formulário.

Ao cadastrar um e-mail válido, informe claramente que o cadastro foi simulado e que notificações reais ainda não estão habilitadas.

Não exiba mensagens que possam sugerir que e-mails reais serão enviados.

Futuramente, criaremos endpoints no NestJS para cadastro de assinantes e envio de notificações.

## 11. Dados mockados

Crie uma pasta:

`src/mocks`

Todos os dados simulados devem ficar centralizados nela.

Quero mocks consistentes para:

- Dispositivos.
- Leituras históricas.
- Níveis dos sensores.
- Porcentagem demonstrativa do reservatório.
- Umidade.
- Previsão de chuva.
- Alertas.

Gere uma quantidade suficiente de leituras para que a página Histórico seja útil.

Utilize tipos TypeScript definidos em `src/types`.

Exemplo conceitual:

```typescript
export interface Reading {
  id: string;
  deviceId: string;
  timestamp: string;

  distanceCm: number | null;
  ultrasonicLevelCm: number | null;
  resistiveLevelCm: number | null;
  humidityPct: number | null;
}
```

Utilize nomes de propriedades consistentes e adaptáveis ao contrato futuro do NestJS.

As datas devem seguir um padrão coerente.

O sistema deve utilizar formatação `pt-BR` nas páginas.

A aplicação deve funcionar sem acesso à internet e sem backend, após a instalação das dependências.

## 12. Organização para integração futura

Embora não exista integração real nesta etapa, quero uma arquitetura preparada para isso.

Nosso backend NestJS futuramente fornecerá:

- Leituras armazenadas no MongoDB.
- Dados atuais do reservatório.
- Percentual de nível calculado.
- Previsões meteorológicas.
- Alertas gerados pelo sistema.

Pretendemos utilizar:

- Swagger/OpenAPI para documentar a API.
- Orval para gerar clientes HTTP e tipos TypeScript.

Portanto:

1. Evite que componentes importem mocks diretamente.
2. Utilize hooks, serviços ou adaptadores para obter os dados mockados.
3. Mantenha os componentes independentes da origem das informações.
4. Separe os tipos de domínio dos contratos de transporte.
5. Facilite a futura substituição dos mocks por clientes gerados pelo Orval.

Exemplo de fluxo nesta etapa:

```text
Página Next.js
    ↓
Hook / Serviço
    ↓
Mock
    ↓
Componente React
```

Fluxo futuro:

```text
Página Next.js
    ↓
Hook / Serviço
    ↓
Cliente HTTP gerado pelo Orval
    ↓
Backend NestJS
    ↓
MongoDB
```

Não instale nem configure Orval agora.

Não implemente chamadas HTTP reais.

## 13. Responsividade com Material UI

A aplicação precisa funcionar em:

- Desktop.
- Notebook.
- Tablet.
- Celular.

Utilize os recursos de responsividade do Material UI.

Requisitos:

- Sidebar persistente no desktop.
- Drawer adaptado para celular.
- Menu acessível em telas menores.
- Cards reorganizados conforme os breakpoints.
- Gráficos responsivos.
- Tabelas com rolagem horizontal quando necessário.
- Textos e botões com tamanhos adequados.
- Espaçamento consistente.

Use Grid, Stack, Box e breakpoints do tema.

Evite breakpoints arbitrários quando os padrões do MUI forem suficientes.

A interface deve manter uma identidade visual consistente em todos os tamanhos de tela.

## 14. Biblioteca de gráficos

Avalie a utilização do MUI X Charts para os gráficos.

Prefira essa solução se ela atender adequadamente a:

- Gráficos de linha com duas séries.
- Gráficos de barras.
- Tooltips.
- Legendas.
- Responsividade.
- Valores ausentes.
- Customização de cores.

Se houver alguma limitação relevante, utilize outra biblioteca leve e compatível com React e Next.js.

Não implemente gráficos complexos manualmente em SVG sem necessidade.

Mantenha um componente de gráfico reutilizável quando isso reduzir duplicação.

## 15. Qualidade do código

Siga boas práticas de React e TypeScript.

- Componentes com responsabilidade bem definida.
- Propriedades tipadas.
- Evitar `any`.
- Evitar duplicação.
- Funções pequenas e legíveis.
- Separação entre apresentação e lógica.
- Hooks personalizados quando necessário.
- Utilitários reutilizáveis.
- Nomenclatura consistente.
- Imports com alias `@/`.
- Tratamento adequado de listas vazias.
- Uso correto de chaves em listas.
- Acessibilidade básica.
- Estados de carregamento e erro demonstrativos quando fizer sentido.

Não crie classes ou camadas de abstração desnecessárias.

A modularização deve melhorar a legibilidade, não aumentar artificialmente a complexidade.

## 16. Regras do projeto

Não faça alterações no backend.

Não implemente Prisma ou MongoDB no frontend.

Não crie API Routes desnecessárias.

Não implemente autenticação nesta etapa.

Não implemente notificações reais.

Não configure serviços externos.

Não utilize dados reais sem autorização.

Não afirme que o reservatório está seguro com base em dados simulados.

Mantenha uma indicação visível de que o dashboard está operando em modo de demonstração.

## 17. Execução e validação

Implemente a aplicação por completo.

Sequência sugerida:

**Etapa 1**
- Inicializar o projeto com Next.js CLI.
- Instalar e configurar Material UI.
- Criar o tema.

**Etapa 2**
- Criar layout compartilhado.
- Implementar Sidebar e Header.
- Configurar navegação.

**Etapa 3**
- Criar tipos e mocks.
- Criar serviços ou hooks de acesso aos dados.

**Etapa 4**
- Implementar a Visão Geral.
- Criar o indicador de porcentagem.
- Criar o gráfico comparativo dos sensores.
- Criar o gráfico de previsão de chuva.
- Criar o card de umidade.

**Etapa 5**
- Implementar a página Histórico.
- Criar tabela, filtros e paginação.

**Etapa 6**
- Implementar a página Alertas.
- Criar os cards de alerta.
- Criar o formulário demonstrativo de inscrição por e-mail.

**Etapa 7**
- Ajustar responsividade.
- Revisar acessibilidade.
- Corrigir possíveis problemas.
- Executar testes e build.

Valide os scripts disponíveis, incluindo:

```bash
npm run build
npm run lint
npx tsc --noEmit
```

Caso haja configuração diferente, adapte os comandos.

Corrija erros encontrados antes de encerrar.

## 18. Entrega esperada

Ao concluir, apresente:

1. Estrutura final de pastas.
2. Componentes criados.
3. Configuração do tema MUI.
4. Páginas implementadas.
5. Organização dos mocks.
6. Dependências utilizadas.
7. Resultado dos testes e do build.
8. Instruções para iniciar a aplicação.
9. Pendências de integração com o backend.

## Critério de conclusão

A tarefa será considerada concluída quando:

- O projeto BarragemIot executar corretamente em Next.js.
- O frontend utilizar React e TypeScript.
- A interface utilizar Material UI.
- As três páginas estiverem funcionais.
- Todos os componentes estiverem organizados dentro de `src/components`.
- Os dados simulados estiverem centralizados em `src/mocks`.
- O layout for responsivo.
- Os gráficos estiverem funcionando.
- A identidade visual estiver consistente com o conceito definido.
- O frontend funcionar sem depender do backend NestJS.

**Prioridade máxima: criar uma aplicação nova, visualmente profissional, altamente modular, responsiva e preparada para receber os dados reais do BarragemIot futuramente.**