# Backlog de Tarefas — Weather App

Este backlog deriva de [specs/weather-app-spec.md](../specs/weather-app-spec.md)
e [plans/weather-app-plan.md](../plans/weather-app-plan.md). As tarefas estão
ordenadas por dependência e são pequenas o suficiente para implementação e
validação isoladas.

## Convenções

- **Prioridade:** `P0` bloqueia o fluxo principal; `P1` é necessário para o
  MVP; `P2` melhora qualidade ou prepara evolução.
- **Tamanho:** `P` pequeno, `M` médio, `G` grande. Tarefas `G` devem ser
  divididas antes da implementação.
- **Tipos:** `Infra`, `Data`, `UI` e `Test`.

## Entrega 1 — Fundação e contratos

### T-01 — Restaurar o bootstrap mínimo da aplicação

- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Recriar a entrada React, a configuração de estilos globais e
  o ponto inicial para que o Vite consiga carregar uma tela mínima.
- **Requisitos relacionados:** base para FR-01 a FR-10; NFR-01.
- **Dependências:** nenhuma.
- **Arquivos prováveis:** `src/main.tsx`, `src/styles/index.css`.
- **Critérios de aceite:**
  - `pnpm dev` inicia com exit code 0 e `/` retorna a aplicação sem erro de
    módulo.
  - O bootstrap monta React no elemento `#root` existente em `index.html`.
  - `pnpm build` termina com exit code 0 após carregar `src/styles/index.css`.

### T-02 — Definir os tipos compartilhados de clima

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar os contratos `Unit`, `City`, `CurrentWeather`,
  `ForecastDay`, `WeatherData`, `WeatherStatus` e `OperationPhase` definidos no
  plano e usados pelo mapeamento da API.
- **Requisitos relacionados:** FR-02, FR-03, FR-04, FR-05, FR-06.
- **Dependências:** T-01.
- **Arquivos prováveis:** `src/types/weather.ts`.
- **Critérios de aceite:**
  - `Unit` contém exatamente `celsius | fahrenheit`; `WeatherStatus` contém
    `idle | loading | success | error | empty`.
  - `City` tipa `name` como string, latitude/longitude como number e country/
    admin1 como opcionais; intervalos são validados no service T-05.
  - Temperaturas são Celsius; os campos parciais definidos no plano aceitam
    `null`; `WeatherData` inclui timezone e uma tupla de cinco `ForecastDay`.
  - Todos os contratos são exportados e `pnpm build` termina com exit code 0,
    sem `any` nesses tipos (FR-02–FR-07, NFR-06).

### T-03 — Implementar conversão e formatação puras

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar funções puras para conversão Celsius/Fahrenheit,
  arredondamento, datas e números no locale pt-BR.
- **Requisitos relacionados:** FR-06, FR-07; NFR-06, NFR-07.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/temperature.ts`, `src/lib/format.ts`.
- **Critérios de aceite:**
  - `convertTemperature(0, 'fahrenheit')` retorna `32` e `convertTemperature`
    aplica `°F = (°C × 9/5) + 32`.
  - Valores positivos, negativos, zero e empates arredondam para o inteiro mais
    próximo, com empate afastando-se de zero (NFR-06).
  - Conversão repetida parte sempre do valor Celsius original, sem mutá-lo.
  - Funções exportadas não usam `fetch` nem alteram estado externo.

### T-04 — Mapear códigos meteorológicos

- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Mapear códigos WMO conhecidos para condição legível e recurso
  visual acessível, com fallback para código desconhecido.
- **Requisitos relacionados:** FR-04, FR-05; NFR-05.
- **Dependências:** T-02.
- **Arquivos prováveis:** `src/lib/weatherCodes.ts`.
- **Critérios de aceite:**
  - Códigos WMO configurados retornam `label` não vazio em português.
  - Código não mapeado retorna `Condição indisponível` e não lança exceção.
  - Cada condição fornece texto que pode ser exibido independentemente de cor
    ou ícone (FR-04, FR-05, NFR-05).

## Entrega 2 — Integração de dados

### T-05 — Implementar busca de cidades na Open-Meteo

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar a função de geocoding, normalizando resultados válidos
  para `City` e rejeitando respostas inválidas.
- **Requisitos relacionados:** FR-01, FR-02, FR-08.
- **Dependências:** T-02, T-03, T-04.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Critérios de aceite:**
  - URL de request contém `name=<termo aparado>`, `count=5`, `language=pt` e
    `format=json`.
  - Só são retornadas cidades com nome não vazio, latitude finita em [-90, 90]
    e longitude finita em [-180, 180]; país/região ausentes são aceitos.
  - `results: []` retorna `[]`; envelope ausente/malformado, JSON inválido e
    HTTP não-2xx rejeitam com erro tipado (AC-01.1, AC-02.1–AC-02.2, AC-08.1).

### T-06 — Implementar forecast e normalização meteorológica

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar a função que busca clima atual e previsão diária de cinco
  períodos, preservando timezone e normalizando respostas parciais em
  `WeatherData`.
- **Requisitos relacionados:** FR-04, FR-05, FR-09.
- **Dependências:** T-02, T-03, T-04, T-05.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Critérios de aceite:**
  - Request usa as coordenadas selecionadas, os parâmetros `current` e `daily`
    do plano, `forecast_days=5`, `timezone=auto` e `temperature_unit=celsius`.
  - Sucesso produz cinco datas no timezone da resposta, começando hoje, e as
    temperaturas de domínio permanecem em Celsius (FR-04, FR-05).
  - `WeatherData.timezone` recebe exatamente o timezone retornado pela API.
  - Ausência de mínima, máxima ou código em um dia produz `null` nesse campo e
    mantém os cinco dias; envelope inválido ou menos de cinco datas falha como
    erro tratável (AC-05.1–AC-05.3).

### T-07 — Definir timeout e erros de rede do service

- **Tipo:** Data
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Padronizar erros de rede e timeout para que a camada de estado
  possa apresentar mensagens e retry.
- **Requisitos relacionados:** FR-09, FR-10; NFR-03, NFR-04.
- **Dependências:** T-05, T-06.
- **Arquivos prováveis:** `src/services/weatherService.ts`.
- **Critérios de aceite:**
  - Uma request pendente é abortada aos 10 segundos e rejeita com `kind: timeout`.
  - Falha de rede, HTTP não-2xx, timeout e payload inválido resultam em kinds
    distintos; status HTTP é preservado no erro interno quando disponível.
  - O service não dispara retry; a interface pode iniciar nova request apenas
    por ação manual (AC-09.1–AC-09.2).
  - Requests não incluem nem exigem API key (NFR-10).

## Entrega 3 — Orquestração e estados

### T-08 — Implementar o hook de estado do clima

- **Tipo:** Data
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar `useWeather` com estados `idle`, `loading`, `success`,
  `empty` e `error`, além das ações de busca, seleção e retry.
- **Requisitos relacionados:** FR-01, FR-03, FR-08, FR-09, FR-10.
- **Dependências:** T-05, T-06, T-07.
- **Arquivos prováveis:** `src/hooks/useWeather.ts`.
- **Critérios de aceite:**
  - Busca vazia/apenas espaços não chama `searchCities` e define mensagem de
    validação; busca válida transita `idle → loading → success|empty|error`.
  - Estado estável sempre tem `phase: null`; em loading, `phase` é `geocoding`
    ou `forecast` de acordo com a operação iniciada.
  - Selecionar resultado chama `getWeather` uma vez com o objeto/coordenadas
    selecionados.
  - Retry manual repete a operação que falhou e encerra loading em success/error.
  - Reenvio normalizado idêntico não cria request concorrente; respostas de
    operações obsoletas não alteram o estado atual (AC-01.2, AC-03.1–AC-03.2,
    AC-08.1–AC-09.2, AC-10.2–AC-10.3).

### T-09 — Criar o componente de loading

- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Apresentar loading com texto em pt-BR e semântica acessível.
- **Requisitos relacionados:** FR-10; NFR-02.
- **Dependências:** T-08.
- **Arquivos prováveis:** `src/components/states/LoadingState.tsx`.
- **Critérios de aceite:**
  - Renderiza a mensagem recebida e expõe o indicador como `role="status"` com
    nome acessível não vazio.
  - O componente não dispara requests nem altera estado externo (AC-10.1).

### T-10 — Criar o componente de estado vazio

- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Informar busca sem resultados e orientar uma nova consulta.
- **Requisitos relacionados:** FR-08; NFR-02, NFR-05.
- **Dependências:** T-08.
- **Arquivos prováveis:** `src/components/states/EmptyState.tsx`.
- **Critérios de aceite:**
  - Exibe texto pt-BR que comunica que nenhuma cidade foi encontrada.
  - A mensagem é localizável por role `status`; uma nova busca permanece
    disponível (AC-08.1–AC-08.2).

### T-11 — Criar o componente de estado de erro

- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Apresentar erro recuperável e ação de retry manual.
- **Requisitos relacionados:** FR-09; NFR-02, NFR-04.
- **Dependências:** T-08.
- **Arquivos prováveis:** `src/components/states/ErrorState.tsx`.
- **Critérios de aceite:**
  - Exibe a mensagem fornecida sem payload ou stack trace da API e usa
    `role="alert"`.
  - Renderiza um botão de retry com nome acessível, acionável por teclado.
  - O botão só chama o callback após interação; não ocorre retry automático
    (AC-09.1–AC-09.2).

## Entrega 4 — Interface principal

### T-12 — Criar a barra de busca

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Criar entrada, label, ação de busca e lista de resultados
  selecionáveis.
- **Requisitos relacionados:** FR-01, FR-02, FR-03, FR-08, FR-10;
  NFR-02, NFR-05.
- **Dependências:** T-02, T-08, T-09.
- **Arquivos prováveis:** `src/components/SearchBar.tsx`.
- **Critérios de aceite:**
  - O input tem label acessível `Nome da cidade`; vazio/espaços não chama
    `onSearch` e apresenta validação.
  - Fixture com dois resultados homônimos exibe nome e metadados disponíveis;
    clicar ou pressionar Enter em cada resultado chama `onSelect` com sua City.
  - Durante loading, o botão Buscar está desabilitado e exibe “Buscando...”.
  - Termo vazio não chama callback de busca (AC-01.1–AC-03.2, AC-10.1–AC-10.3).

### T-13 — Criar a apresentação do clima atual

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Exibir cidade, temperatura, unidade, condição e atualização do
  clima atual.
- **Requisitos relacionados:** FR-04; NFR-02, NFR-05, NFR-06, NFR-07.
- **Dependências:** T-02, T-03, T-04, T-08.
- **Arquivos prováveis:** `src/components/CurrentWeather.tsx`.
- **Critérios de aceite:**
  - Fixture de 20 °C em Celsius renderiza `20°C`, nome da cidade e o label WMO
    esperado em texto visível.
  - Hora é formatada no timezone de `WeatherData`; `time: null` mostra a
    indicação de horário indisponível.
  - `temperatureCelsius: null` ou `weatherCode: null` produz rótulo
    `Indisponível`, sem zero ou descrição inventada (AC-04.1–AC-04.2).

### T-14 — Criar cartão e lista da previsão

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Exibir os cinco dias em componentes separados e legíveis em
  mobile e desktop.
- **Requisitos relacionados:** FR-05; NFR-01, NFR-02, NFR-05, NFR-06.
- **Dependências:** T-02, T-03, T-04, T-08.
- **Arquivos prováveis:** `src/components/ForecastCard.tsx`,
  `src/components/ForecastList.tsx`.
- **Critérios de aceite:**
  - Um fixture com cinco datas renderiza exatamente cinco cartões/`article`,
    em ordem cronológica, cada um com data local, mínima, máxima e condição
    em texto.
  - Temperaturas usam a unidade ativa; valor `null` renderiza
    `Indisponível`, sem substituir por zero.
  - Campo ausente em um dia não remove os outros cartões (AC-05.1–AC-05.3).
  - Em 320 px a lista não causa rolagem horizontal.

### T-15 — Criar o alternador de unidades

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Criar o controle acessível para selecionar Celsius ou
  Fahrenheit.
- **Requisitos relacionados:** FR-06, FR-07; NFR-02, NFR-06.
- **Dependências:** T-02, T-03, T-08.
- **Arquivos prováveis:** `src/components/UnitToggle.tsx`.
- **Critérios de aceite:**
  - Controle inicia com Celsius selecionado e expõe o estado ativo
    (`aria-pressed` ou semântica equivalente).
  - Acionar Fahrenheit/Celsius via teclado dispara `onChange` com o valor
    correspondente.
  - Botões °C e °F são acionáveis por teclado; cada ação chama `onChange` uma
    vez com `celsius` ou `fahrenheit`.
  - O componente não chama services; conversão e arredondamento obedecem
    FR-06/NFR-06 (AC-06.1–AC-07.2).

### T-16 — Compor a tela e integrar a UI ao hook

- **Tipo:** UI
- **Prioridade:** P0
- **Tamanho:** M
- **Descrição:** Integrar busca, estados, clima atual, previsão e alternador em
  `App`, conectando ações ao `useWeather`.
- **Requisitos relacionados:** FR-01 a FR-10; NFR-01 a NFR-08.
- **Dependências:** T-08, T-09, T-10, T-11, T-12, T-13, T-14, T-15.
- **Arquivos prováveis:** `src/App.tsx`.
- **Critérios de aceite:**
  - Fixture de sucesso mostra heading da cidade selecionada e exatamente cinco
    artigos; fixtures de lista vazia e erro mostram seus estados definidos.
  - Selecionar B e resolver depois uma resposta antiga de A deixa B e seus dados
    visíveis (AC-03.2, AC-10.3).
  - Trocar C/F atualiza todas as temperaturas e mantém inalterada a contagem de
    chamadas ao service (AC-06.1–AC-07.2).
  - Busca, retry e unidade são localizáveis por role/label acessível
    (AC-01.1–AC-10.3).

## Entrega 5 — Testes

### T-17 — Testar conversão e arredondamento de temperatura

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Cobrir conversão Celsius/Fahrenheit e arredondamento com
  testes unitários.
- **Requisitos relacionados:** FR-06, FR-07; NFR-06.
- **Dependências:** T-03, T-16.
- **Arquivos prováveis:** `tests/unit/temperature.test.ts`.
- **Critérios de aceite:**
  - Testes verificam `celsiusToFahrenheit(0) === 32`,
    `celsiusToFahrenheit(-10) === 14` e `fahrenheitToCelsius(32) === 0`.
  - `roundTemperature(20.5) === 21` e `roundTemperature(-20.5) === -21`; há
    também casos 20.4 e -20.4.
  - `convertTemperature(20, 'fahrenheit') === 68`; converter C→F→C parte do
    Celsius original, sem mutá-lo (AC-06.1–AC-07.2, NFR-06).

### T-18 — Testar formatação e códigos meteorológicos

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Testar funções puras de formatação pt-BR e descrições WMO.
- **Requisitos relacionados:** FR-04, FR-05; NFR-05, NFR-07.
- **Dependências:** T-03, T-04, T-16.
- **Arquivos prováveis:** `tests/unit/format.test.ts`,
  `tests/unit/weatherCodes.test.ts`.
- **Critérios de aceite:**
  - `formatTemperature(21, '°C')` retorna `21°C` e
    `formatDate('2026-09-30')` inclui o dia `30`.
  - `formatTime('2026-09-30T14:05:00')` inclui `14:05` no locale pt-BR.
  - Código WMO `0` retorna `Céu limpo`; código `999` retorna
    `Condição indisponível`.

### T-19 — Testar o service com rede mockada

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Testar geocoding, forecast, normalização, HTTP error, timeout e
  resposta parcial sem chamar a Open-Meteo real.
- **Requisitos relacionados:** FR-01, FR-02, FR-04, FR-05, FR-08, FR-09.
- **Dependências:** T-05, T-06, T-07, T-16.
- **Arquivos prováveis:** `tests/unit/weatherService.test.ts`.
- **Critérios de aceite:**
  - Mock de geocoding confirma `name`, `count=5`, `language=pt` e `format=json`;
    resultado válido mapeia para City, vazio resolve `[]` e item inválido não é
    selecionável.
  - Mock de forecast confirma coordenadas e `forecast_days=5`; sucesso mapeia
    timezone e cinco datas, e campo diário ausente vira `null` no índice
    correspondente.
  - HTTP 500, timeout, rejeição de rede, JSON/envelope inválido e menos de
    cinco datas rejeitam com o `kind` esperado.
  - Todos os cenários substituem `fetch`; a contagem de chamadas externas é zero.
  - Cenários cobrem cidade homônima, forecast com cinco datas e campos
    parciais e falha/timeout conforme AC-02.1–AC-03.2, AC-05.1–AC-05.3 e
    AC-09.1.

### T-20 — Testar o hook de estado

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Testar transições, retry e concorrência do `useWeather` com
  services mockados.
- **Requisitos relacionados:** FR-01, FR-03, FR-08, FR-09, FR-10.
- **Dependências:** T-08, T-16.
- **Arquivos prováveis:** `tests/unit/useWeather.test.ts`.
- **Critérios de aceite:**
  - Buscar `''` ou `'   '` mantém status `idle`, define validação e deixa
    `searchCities` com zero calls.
  - Fixtures controladas verificam `loading` seguido de `success`, `empty` ou
    `error`; estado estável retorna `phase: null`.
  - Seleção chama `getWeather` uma vez com a City escolhida; retry manual chama
    a operação correspondente mais uma vez.
  - Termos iguais após trim geram uma chamada; respostas invertidas deixam no
    estado somente resultados do termo mais recente (AC-01.2, AC-08.1–AC-09.2,
    AC-10.2–AC-10.3).

### T-21 — Testar SearchBar e UnitToggle

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Testar busca/seleção e alternância de unidade em componentes
  isolados.
- **Requisitos relacionados:** FR-01, FR-02, FR-03, FR-06, FR-07; NFR-02.
- **Dependências:** T-12, T-15, T-16.
- **Arquivos prováveis:** `tests/unit/SearchBar.test.tsx`,
  `tests/unit/UnitToggle.test.tsx`.
- **Critérios de aceite:**
  - `getByLabelText('Nome da cidade')` localiza o input; Enter submete a busca
    e os botões de resultado podem ser ativados por teclado.
  - Fixture com dois resultados mostra os metadados recebidos; selecionar uma
    opção chama `onSelect` uma vez com a City correspondente.
  - UnitToggle inicia em Celsius; °C/°F chamam `onChange` com a unidade correta
    e o teste registra zero chamadas de `fetch` (AC-02.1–AC-03.2, AC-06.1–AC-07.2).

### T-22 — Testar componentes de loading, erro e vazio

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Testar isoladamente os componentes que representam loading,
  erro e busca sem resultados.
- **Requisitos relacionados:** FR-08, FR-09, FR-10; NFR-02, NFR-05.
- **Dependências:** T-09, T-10, T-11.
- **Arquivos prováveis:** `tests/unit/StateComponents.test.tsx`.
- **Critérios de aceite:**
  - `LoadingState` é localizado por `role=status`, expõe `aria-live=polite` e
    renderiza exatamente a mensagem recebida por props.
  - `EmptyState` é localizado por `role=status` e mostra mensagem e orientação
    de nova busca.
  - `ErrorState` é localizado por `role=alert`, mostra a mensagem por props e
    chama `onRetry` zero vezes antes e exatamente uma vez após o clique.

### T-23 — Testar a composição do App

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Testar a integração dos estados e componentes no fluxo da tela.
- **Requisitos relacionados:** FR-01 a FR-10; NFR-02, NFR-05, NFR-06.
- **Dependências:** T-16.
- **Arquivos prováveis:** `tests/unit/App.test.tsx`.
- **Critérios de aceite:**
  - Fixture idle mostra `Digite uma cidade para começar`; loading expõe
    `role=status`; empty mostra `Nenhuma cidade encontrada`; error expõe
    `role=alert` e botão Buscar novamente.
  - Success mostra o nome selecionado, heading `Previsão de 5 dias` e exatamente
    cinco `article`; dado diário nulo exibe `Indisponível`.
  - Após alternar °C→°F, os valores esperados mudam e o número de chamadas a
    `fetch` permanece igual (AC-04.1–AC-10.3).

### T-24 — Testar fluxos E2E com Playwright

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** M
- **Descrição:** Cobrir o fluxo principal e estados críticos no Playwright com
  `page.route` para respostas determinísticas.
- **Requisitos relacionados:** FR-01 a FR-10; NFR-01, NFR-02, NFR-04.
- **Dependências:** T-16, T-19, T-20, T-21, T-22, T-23.
- **Arquivos prováveis:** `tests/e2e/weather.spec.ts`.
- **Critérios de aceite:**
  - Selecionar a segunda cidade homônima envia à rota forecast as coordenadas
    exatas dessa fixture.
  - Fluxo de sucesso mostra clima atual e exatamente cinco artigos; alternar
    °C/°F não aumenta o contador da rota forecast.
  - Cenários independentes verificam input vazio, geocoding vazio, timeout,
    erro com retry manual e resposta parcial conforme os ACs referenciados.
  - Fluxo principal passa em 320 px e 1440 px; todas as rotas Open-Meteo são
    interceptadas e nenhuma chamada externa real é observada.

## Entrega 6 — Hardening e validação

### T-25 — Ajustar responsividade do MVP

- **Tipo:** UI
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Ajustar estilos globais e grade da previsão para os viewports
  definidos na spec.
- **Requisitos relacionados:** FR-05; NFR-01, NFR-05.
- **Dependências:** T-14, T-16, T-24.
- **Arquivos prováveis:** `src/styles/index.css`,
  `src/components/ForecastList.tsx`.
- **Critérios de aceite:**
  - Em viewports 320 px, 768 px e 1440 px, busca, clima atual e cinco cartões
    ficam visíveis sem sobreposição ou overflow horizontal.
  - `pnpm lint` termina com exit code 0 nos arquivos alterados (NFR-01).

### T-26 — Auditar acessibilidade dos fluxos principais

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Automatizar a auditoria de acessibilidade e verificar
  navegação por teclado nos fluxos principais.
- **Requisitos relacionados:** NFR-02.
- **Dependências:** T-24, T-25.
- **Arquivos prováveis:** `package.json`, `tests/e2e/weather.spec.ts`.
- **Critérios de aceite:**
  - Auditoria automatizada roda nas telas de idle, resultado, success e error;
    não permanecem violações axe critical/serious; demais violações são
    registradas com decisão de correção ou justificativa.
  - Roteiro manual completa busca, seleção, retry e troca C/F somente por
    teclado e confirma foco visível em cada controle.
  - Loading, erro e vazio são localizáveis por role/nome; checklist WCAG 2.2 AA
    aplicável fica registrado (NFR-02).

### T-27 — Fechar decisões pendentes para release

- **Tipo:** Infra
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Registrar decisões do responsável de produto sobre
  persistência local da unidade, termos/limites da Open-Meteo e aceitação das
  metas de performance/SLO.
- **Requisitos relacionados:** NFR-03, NFR-08, NFR-09, NFR-10.
- **Dependências:** T-24; bloqueia aprovação de release, mas não o
  desenvolvimento local.
- **Arquivos prováveis:** `specs/weather-app-spec.md`, `plans/weather-app-plan.md`.
- **Critérios de aceite:**
  - A decisão sobre persistência da unidade está registrada na spec e não resta
    como Open Question.
  - Termos de uso, limite de tráfego e necessidade de atribuição da Open-Meteo
    têm referência consultada e resultado registrado na spec/plano.
  - Aprovação do PO para os targets de performance e decisão de SLO está
    documentada; spec e plano refletem essa decisão antes do release.

### T-28 — Medir metas de performance do frontend

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Medir o tempo de feedback e de renderização após resposta
  válida da API no dispositivo de referência.
- **Requisitos relacionados:** NFR-03.
- **Dependências:** T-16, T-24, T-27.
- **Arquivos prováveis:** `tests/e2e/performance.spec.ts`.
- **Critérios de aceite:**
  - Em 20 execuções no dispositivo de referência aprovado, p95 do indicador de
    loading é ≤100 ms e p95 da renderização após resposta válida é ≤500 ms.
  - O cronômetro do render começa após receber resposta válida e exclui a
    latência da API.
  - Relatório registra browser, configuração/dispositivo, 20 amostras e p95
    calculado para loading/renderização (NFR-03).

### T-29 — Executar smoke tests da matriz de navegadores

- **Tipo:** Test
- **Prioridade:** P1
- **Tamanho:** P
- **Descrição:** Configurar os smoke tests do fluxo principal nas plataformas
  suportadas.
- **Requisitos relacionados:** NFR-09.
- **Dependências:** T-24, T-27.
- **Arquivos prováveis:** `playwright.config.ts`,
  `.github/workflows/ci.yml`.
- **Critérios de aceite:**
  - CI executa o smoke do fluxo principal nas duas versões estáveis mais
    recentes de Chrome, Edge e Firefox, Safari macOS/iOS e Chrome Android.
  - Relatório contém resultado separado para cada browser/plataforma.
  - Runner indisponível é registrado como `blocked`, nunca `passed`, e bloqueia
    aprovação do release (NFR-09).

### T-30 — Executar validação final do projeto

- **Tipo:** Infra
- **Prioridade:** P0
- **Tamanho:** P
- **Descrição:** Executar o checklist final e registrar qualquer falha antes da
  revisão.
- **Requisitos relacionados:** todos os requisitos da spec.
- **Dependências:** T-17, T-18, T-19, T-20, T-21, T-22, T-23, T-24, T-25,
  T-26, T-27, T-28, T-29.
- **Arquivos prováveis:** nenhum arquivo novo; possíveis correções nos arquivos
  apontados pelas ferramentas.
- **Critérios de aceite:**
  - `pnpm lint`, `pnpm build`, `pnpm test` e `pnpm test:e2e` terminam cada um
    com exit code 0 na mesma revisão candidata.
  - Saída/resumo dos quatro comandos e relatório HTML Playwright ficam anexados
    à revisão antes do Review Agent.

## Rastreabilidade: requisito funcional → tarefas

| Requisito | Tarefas de implementação | Tarefas de teste |
| --- | --- | --- |
| FR-01 — Buscar cidade | T-05, T-08, T-12, T-16 | T-19, T-20, T-21, T-23, T-24 |
| FR-02 — Exibir resultados identificáveis | T-05, T-12, T-16 | T-19, T-21, T-24 |
| FR-03 — Selecionar cidade | T-06, T-08, T-12, T-16 | T-19, T-20, T-21, T-24 |
| FR-04 — Exibir clima atual | T-04, T-06, T-13, T-16 | T-18, T-19, T-23, T-24 |
| FR-05 — Exibir previsão de cinco dias | T-04, T-06, T-14, T-16 | T-18, T-19, T-22, T-23, T-24 |
| FR-06 — Alternar unidade | T-03, T-15, T-16 | T-17, T-21, T-23, T-24 |
| FR-07 — Atualizar sem nova busca | T-03, T-08, T-15, T-16 | T-17, T-20, T-21, T-23, T-24 |
| FR-08 — Informar busca sem resultados | T-05, T-08, T-10, T-12, T-16 | T-19, T-20, T-22, T-23, T-24 |
| FR-09 — Informar falha no carregamento | T-07, T-08, T-11, T-16 | T-19, T-20, T-22, T-23, T-24 |
| FR-10 — Informar operação em andamento | T-07, T-08, T-09, T-12, T-16 | T-20, T-21, T-22, T-23, T-24 |

**Lacunas:** nenhum requisito funcional da spec está sem tarefa de implementação
ou teste associado.

## Sequência recomendada de execução

1. T-01: preparar o bootstrap mínimo do Vite/React.
2. T-02: definir os tipos e contratos compartilhados.
3. T-03 a T-04: implementar as funções puras de temperatura, formatação e WMO.
4. T-05 a T-07: implementar services de geocoding/forecast e erros/timeout.
5. T-08: implementar o hook de estado e concorrência.
6. T-09 a T-15: criar componentes de estado, busca, clima, previsão e unidade.
7. T-16: integrar componentes e hook na aplicação.
8. T-17 a T-24: executar testes unitários, testes dedicados dos estados,
   integração do App e E2E em desktop/mobile.
9. T-25 a T-29: hardening de responsividade, acessibilidade e gates de release.
10. T-30: executar os gates finais antes da revisão.
