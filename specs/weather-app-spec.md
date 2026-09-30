# Especificação do Produto — Weather App

## Overview

### Objetivo

Criar uma aplicação web responsiva que permita consultar as condições
meteorológicas de uma cidade e a previsão de cinco dias, com suporte às
unidades Celsius e Fahrenheit. A experiência deve ser rápida de entender em
dispositivos móveis e telas maiores.

### Público-alvo

- **Viajante que planeja a semana:** precisa comparar o clima de uma cidade
  antes de organizar atividades.
- **Pessoa decidindo o que vestir:** consulta rapidamente o clima atual e a
  previsão próxima.
- **Usuário internacional:** precisa interpretar a previsão em Fahrenheit e
  consultar cidades fora do seu país.

### Decisões de produto

- A fonte de dados será a Open-Meteo, sem API key.
- "Cinco dias" significa o dia atual mais os quatro dias seguintes.
- Celsius será a unidade padrão na primeira visita.
- A interface será apresentada em pt-BR.
- A primeira versão não terá autenticação nem persistência de dados em servidor.

### Resultado esperado

Uma pessoa deve conseguir buscar uma cidade, identificar o resultado correto,
selecioná-lo e consultar o clima atual e a previsão definida sem depender de
conhecimento técnico ou de um fluxo complexo.

## Functional Requirements

### FR-01 — Buscar cidade

O usuário deve poder informar o nome de uma cidade e iniciar uma busca.

### FR-02 — Exibir resultados identificáveis

O sistema deve exibir resultados de busca com informação suficiente para
diferenciar cidades homônimas. Cada resultado deve apresentar o nome da cidade
e, quando disponíveis, a região administrativa e o país. A seleção deve
identificar a localização pelo registro selecionado, não apenas pelo nome.

### FR-03 — Selecionar cidade

O usuário deve poder selecionar um resultado para consultar seus dados
meteorológicos.

### FR-04 — Exibir clima atual

O sistema deve exibir a temperatura atual, a unidade ativa e a condição
meteorológica da cidade selecionada. Deve apresentar também a hora local da
observação fornecida pela fonte; se indisponível, deve indicar que o horário
não foi fornecido.

### FR-05 — Exibir previsão de cinco dias

O sistema deve exibir a previsão diária do dia atual e dos quatro dias
seguintes no fuso horário da cidade selecionada. Cada um dos cinco dias deve
mostrar a data local, a temperatura mínima, a temperatura máxima e a condição
meteorológica. Se um dia não tiver dados válidos, o sistema deve identificá-lo
como indisponível sem inventar valores.

### FR-06 — Alternar unidade de temperatura

O usuário deve poder alternar a unidade de temperatura entre Celsius e
Fahrenheit. Os valores devem ser convertidos a partir dos dados em Celsius e
arredondados para o inteiro mais próximo; em caso de empate, devem ser
arredondados para longe de zero.

### FR-07 — Atualizar temperaturas sem nova busca

Ao trocar a unidade, o sistema deve atualizar todas as temperaturas exibidas
sem exigir nova busca da cidade ou nova consulta externa.

### FR-08 — Informar busca sem resultados

O sistema deve informar de forma compreensível quando uma busca não retornar
cidades.

### FR-09 — Informar falha no carregamento

O sistema deve informar quando não conseguir carregar dados de geocodificação
ou meteorologia. Cada erro recuperável deve oferecer uma ação manual para
tentar novamente a operação que falhou. Uma requisição deve expirar após 10
segundos; não haverá repetição automática.

### FR-10 — Informar operação em andamento

O sistema deve indicar visualmente quando uma busca ou carregamento de dados
estiver em andamento. Deve ignorar o reenvio de uma busca idêntica enquanto ela
estiver pendente. Se uma nova busca diferente for iniciada, somente os
resultados da busca mais recente podem atualizar a interface.

## User Stories

1. **US-01 — Como viajante que planeja a semana, quero buscar uma cidade e selecionar o
  resultado correto para consultar sua previsão de hoje e dos quatro dias
  seguintes e planejar minhas atividades.**  
  Requisitos relacionados: FR-01, FR-02, FR-03, FR-05.
2. **US-02 — Como pessoa decidindo o que vestir, quero consultar o clima atual da minha
  cidade para escolher roupas adequadas antes de sair.**  
  Requisitos relacionados: FR-04.
3. **US-03 — Como usuário internacional, quero alternar entre Celsius e Fahrenheit e
  ver todas as temperaturas atualizadas sem refazer a busca para interpretar
  os dados na unidade com a qual estou acostumado.**  
  Requisitos relacionados: FR-06, FR-07.
4. **US-04 — Como viajante que planeja a semana, quero receber uma mensagem quando
  minha busca não encontrar cidades para corrigir o termo e continuar.**  
  Requisitos relacionados: FR-08.
5. **US-05 — Como pessoa decidindo o que vestir, quero ser informado quando os dados
  meteorológicos não puderem ser carregados e poder tentar novamente para
  decidir como prosseguir.**  
  Requisitos relacionados: FR-09.
6. **US-06 — Como usuário internacional, quero ver quando a busca ou o carregamento
  está em andamento para entender o estado da consulta e evitar repeti-la sem
  necessidade.**  
  Requisitos relacionados: FR-10.

## Matriz de Rastreabilidade

Cada referência `AC-xx.y` aponta para um critério Given/When/Then da seção
**Acceptance Criteria**. Os NFRs indicam as qualidades transversais que devem
ser consideradas ao implementar e testar a história.

| User Story | Acceptance Criteria relacionados | Requisitos não-funcionais relevantes |
| --- | --- | --- |
| US-01 — Buscar cidade e consultar previsão | AC-01.1–AC-01.2; AC-02.1–AC-02.2; AC-03.1–AC-03.2; AC-05.1–AC-05.3 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-07, NFR-08, NFR-09, NFR-10 |
| US-02 — Consultar clima atual | AC-04.1–AC-04.2 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-05, NFR-07, NFR-09 |
| US-03 — Alternar unidade | AC-06.1–AC-06.3; AC-07.1–AC-07.2 | NFR-02, NFR-03, NFR-06, NFR-07, NFR-09 |
| US-04 — Busca sem resultados | AC-08.1–AC-08.2 | NFR-02, NFR-03, NFR-04, NFR-07, NFR-09 |
| US-05 — Recuperar de falha | AC-09.1–AC-09.2 | NFR-02, NFR-03, NFR-04, NFR-09, NFR-10 |
| US-06 — Acompanhar operação | AC-10.1–AC-10.3 | NFR-01, NFR-02, NFR-03, NFR-04, NFR-09 |

## Acceptance Criteria

Os critérios abaixo usam **Given / When / Then**. O texto permanece em pt-BR;
cada resultado descrito deve ser verificável por teste automatizado ou
validação manual objetiva.

### FR-01 — Buscar cidade

- **AC-01.1** — **Given** que a aplicação está pronta para receber uma busca, **When** o
  usuário informa um nome não vazio e envia o formulário, **Then** o sistema
  inicia uma busca de geocodificação para esse termo e apresenta o estado de
  carregamento antes de exibir a resposta.
- **AC-01.2** — **Given** que o campo contém apenas espaços ou está vazio, **When** o usuário
  envia o formulário, **Then** nenhuma busca de geocodificação é iniciada e uma
  mensagem de validação solicita o nome de uma cidade.

### FR-02 — Exibir resultados identificáveis

- **AC-02.1** — **Given** que a busca retorna uma cidade com nome, país e região, **When** a
  lista de resultados é exibida, **Then** o resultado mostra o nome da cidade e
  os dados disponíveis de país e região.
- **AC-02.2** — **Given** que a busca retorna duas cidades de mesmo nome em localidades
  diferentes, **When** a lista é exibida, **Then** cada opção apresenta um dado
  de localização que permite distingui-las.

### FR-03 — Selecionar cidade

- **AC-03.1** — **Given** que a lista contém resultados de busca, **When** o usuário seleciona
  um resultado, **Then** o sistema solicita dados meteorológicos usando a
  localização associada àquele resultado.
- **AC-03.2** — **Given** que há dois resultados com o mesmo nome e coordenadas diferentes,
  **When** o usuário seleciona um deles, **Then** a consulta meteorológica usa
  as coordenadas do resultado selecionado.

### FR-04 — Exibir clima atual

- **AC-04.1** — **Given** que a consulta da cidade selecionada retorna dados atuais válidos,
  **When** o carregamento termina, **Then** a tela mostra a temperatura, a
  unidade ativa e a condição meteorológica retornadas para essa cidade.
- **AC-04.2** — **Given** que a fonte retorna o horário de observação ou atualização,
  **When** os dados atuais são exibidos, **Then** a tela apresenta esse horário
  ou uma indicação de atualização correspondente; se o dado não for fornecido,
  nenhum horário é inventado.

### FR-05 — Exibir previsão de cinco dias

- **AC-05.1** — **Given** que a cidade selecionada retorna previsão diária válida para cinco
  dias, **When** o carregamento termina, **Then** a tela exibe cinco itens
  diários, correspondentes a hoje e aos quatro dias seguintes, sem incluir dias
  adicionais.
- **AC-05.2** — **Given** que a previsão diária é exibida, **When** o usuário consulta cada
  item, **Then** cada um contém data local, mínima, máxima e condição
  meteorológica, com a unidade ativa indicada para temperaturas.
- **AC-05.3** — **Given** que a resposta não contém mínima, máxima ou condição para um dos
  dias, **When** os dados são apresentados, **Then** a data do dia permanece
  visível, os campos ausentes são identificados como indisponíveis e os outros
  dias válidos continuam exibidos.

### FR-06 — Alternar unidade de temperatura

- **AC-06.1** — **Given** que o clima atual e a previsão estão carregados em Celsius, **When**
  o usuário seleciona Fahrenheit, **Then** todas as temperaturas exibidas são
  apresentadas em Fahrenheit e o controle indica Fahrenheit como unidade ativa.
- **AC-06.2** — **Given** que o valor de origem é 0 °C, **When** a unidade Fahrenheit é
  selecionada, **Then** o valor apresentado é 32 °F.
- **AC-06.3** — **Given** que o clima atual e a previsão estão carregados em Fahrenheit,
  **When** o usuário seleciona Celsius, **Then** todas as temperaturas
  exibidas são apresentadas em Celsius e o controle indica Celsius como unidade
  ativa.

### FR-07 — Atualizar temperaturas sem nova busca

- **AC-07.1** — **Given** que o clima atual e a previsão estão visíveis e não há requisição em
  andamento, **When** o usuário troca a unidade, **Then** todos os valores de
  temperatura são atualizados, a cidade permanece selecionada e nenhuma nova
  requisição de geocodificação ou previsão é enviada.
- **AC-07.2** — **Given** que os dados meteorológicos já foram carregados, **When** o usuário
  alterna a unidade mais de uma vez, **Then** cada troca atualiza os valores a
  partir dos mesmos dados carregados, sem limpar os resultados ou iniciar uma
  nova consulta externa.

### FR-08 — Informar busca sem resultados

- **AC-08.1** — **Given** que a geocodificação retorna uma lista vazia, **When** a resposta é
  processada, **Then** a lista de resultados não exibe cidades e a interface
  apresenta uma mensagem informando que nenhum resultado foi encontrado.
- **AC-08.2** — **Given** que o estado sem resultados está visível, **When** o usuário
  informa outro termo e envia a busca, **Then** uma nova consulta é iniciada e
  o estado anterior é substituído pelo estado de carregamento.

### FR-09 — Informar falha no carregamento

- **AC-09.1** — **Given** que uma requisição falha, excede 10 segundos ou retorna
  dados inválidos, **When** a falha é processada, **Then** o indicador de
  carregamento é removido e a interface exibe uma mensagem de erro com uma
  ação para tentar novamente.
- **AC-09.2** — **Given** que a mensagem de erro e a ação de nova tentativa estão visíveis,
  **When** o usuário aciona a nova tentativa, **Then** uma nova requisição
  correspondente é iniciada e a interface volta ao estado de carregamento.

### FR-10 — Informar operação em andamento

- **AC-10.1** — **Given** que uma busca ou requisição meteorológica foi iniciada e ainda não
  terminou, **When** o estado da interface é renderizado, **Then** um indicador
  de carregamento visível e com nome acessível é apresentado.
- **AC-10.2** — **Given** que uma busca idêntica está em andamento, **When** o usuário tenta
  enviá-la novamente, **Then** o sistema não inicia uma segunda requisição
  concorrente para o mesmo termo.
- **AC-10.3** — **Given** que uma busca por uma cidade está em andamento, **When** o usuário
  inicia uma busca diferente e as respostas chegam fora de ordem, **Then** a
  interface exibe somente os resultados da busca mais recente.

## Non-Functional Requirements

### NFR-01 — Responsividade

A interface deve funcionar sem perda de conteúdo, rolagem horizontal
involuntária ou sobreposição nos fluxos principais em larguras de viewport de
320 px, 768 px e 1440 px.

### NFR-02 — Acessibilidade

Os fluxos de busca, seleção, troca de unidade e leitura dos estados devem ser
operáveis por teclado. Controles devem possuir nomes acessíveis, foco visível e
estados compreensíveis por tecnologias assistivas. Os fluxos principais devem
atender aos critérios aplicáveis da WCAG 2.2 nível AA. A validação deve incluir
auditoria automatizada e teste manual de teclado, foco visível e anúncio de
carregamento e erro.

### NFR-03 — Performance percebida

A interface deve apresentar o indicador de carregamento em até 100 ms após o
envio da busca ou seleção da cidade. Após a resposta válida da API, os dados
devem ser renderizados em até 500 ms em um dispositivo de referência com 4
núcleos de CPU e 4 GB de memória. O tempo de resposta da API não está incluído
no limite de renderização.

### NFR-04 — Resiliência e recuperação

Falhas de rede, indisponibilidade da Open-Meteo, timeout e respostas inválidas
não devem deixar a interface travada ou com loading por mais de 10 segundos
por requisição. O usuário deve receber uma mensagem orientadora e uma opção de
nova tentativa para erros recuperáveis. A disponibilidade do provedor externo
não é garantida pela aplicação.

### NFR-05 — Usabilidade

Temperatura atual, condição meteorológica, unidade ativa e previsão devem ser
localizáveis e interpretáveis sem navegação complexa. A interface deve
comunicar informações importantes também por texto, não apenas por cor ou
ícone.

### NFR-06 — Consistência de unidades

A unidade ativa deve ser indicada de forma consistente em todas as temperaturas
atuais e previstas. A conversão deve usar a mesma regra e arredondamento em
todos os componentes: `°F = (°C × 9/5) + 32`. Exibir temperaturas como números
inteiros, arredondando para o inteiro mais próximo e, em caso de empate,
afastando-se de zero. Preservar o valor de origem sem arredondamento para que
alternâncias repetidas não acumulem erro.

### NFR-07 — Locale

Textos da interface, mensagens, datas e números devem usar pt-BR. Os dados de
temperatura devem iniciar em Celsius e permitir a alternância para Fahrenheit.

### NFR-08 — Privacidade e escopo de dados

A aplicação não deve exigir autenticação nem coletar identificadores pessoais.
O termo de busca e as coordenadas da cidade selecionada são enviados à
Open-Meteo para obter os dados; a aplicação não persiste histórico de busca em
servidor. A persistência local da unidade permanece em aberto.

### NFR-09 — Compatibilidade

Os fluxos principais devem funcionar nas duas versões estáveis mais recentes
de Chrome, Edge e Firefox em desktop, Safari em macOS e iOS e Chrome em
Android. A matriz de navegadores suportados deve ser executada a cada release.

### NFR-10 — Segurança de integração

A aplicação deve tratar respostas da fonte externa como dados não confiáveis e
não deve expor credenciais no cliente. Como a decisão atual é usar Open-Meteo
sem API key, nenhuma chave deve ser necessária para o fluxo principal.

## Edge Cases

1. **Campo vazio:** o usuário tenta buscar sem informar uma cidade. O sistema
   não consulta a fonte externa e solicita um nome válido.
2. **Espaços excedentes:** o termo contém espaços no início, no fim ou apenas
   espaços. O sistema deve ignorar espaços excedentes e rejeitar o termo vazio.
3. **Caracteres especiais:** o nome contém acentos, hífens ou apóstrofos. O
   sistema deve preservar o significado do termo e informar quando não houver
   resultados, sem quebrar a interface.
4. **Cidade inexistente:** a geocodificação não retorna resultados. O sistema
   exibe o estado sem resultados e permite nova tentativa.
5. **Cidades homônimas:** existem vários resultados com o mesmo nome. O
   sistema exibe país ou região e não escolhe uma localização silenciosamente.
6. **Resposta vazia ou parcial da geocodificação:** a resposta sem nome ou
  coordenadas válidas não pode ser selecionada e gera uma mensagem de
  localização não identificada. País ou região ausentes não impedem seleção
  quando nome e coordenadas são válidos.
7. **Falha de rede ou serviço indisponível:** a consulta não pode ser
   concluída. O sistema encerra o loading, informa a falha e oferece retry.
8. **Timeout:** a fonte não responde em até 10 segundos. O sistema
   encerra a espera, informa que a consulta demorou e permite tentar novamente.
9. **Resposta meteorológica parcial:** se faltar temperatura ou condição
  atual, o cartão atual informa indisponibilidade. Se faltar mínima, máxima ou
  condição em um dia, a data permanece visível e os campos ausentes são
  marcados como indisponíveis; outros dias válidos continuam exibidos. Não
  estimar nem substituir dados ausentes por zero.
10. **Troca de unidade durante carregamento:** o usuário tenta alternar a
    unidade enquanto a previsão ainda carrega. O controle deve permanecer
    consistente e a unidade escolhida deve ser aplicada assim que houver dados.
11. **Várias buscas rápidas:** reenvios idênticos não criam chamadas
  concorrentes; se buscas diferentes forem iniciadas, respostas antigas não
  substituem os resultados da busca mais recente.
12. **Valores ausentes ou extremos:** não exibir valores nulos ou inválidos nem
  substituí-los por zero. Omitir o valor e indicar indisponibilidade; exibir
  valores extremos válidos sem overflow.
13. **Limite de requisições ou erro do provedor:** encerrar loading, informar
  indisponibilidade temporária e permitir retry manual, sem loop automático.
14. **Código meteorológico desconhecido:** exibir uma descrição neutra de
  condição indisponível, mantendo os demais dados válidos e sem mostrar o
  código bruto.
15. **Troca de cidade durante carregamento:** não associar dados da cidade
  anterior ao nome da nova seleção; somente os dados da seleção mais recente
  podem ser exibidos.

## Assumptions

- A aplicação será uma experiência web responsiva, sem aplicativo nativo na
  primeira versão.
- Open-Meteo continuará disponível para geocodificação e previsão sem exigir
  API key para o uso definido pelo produto.
- O usuário selecionará uma cidade antes de consultar seus dados
  meteorológicos.
- Para resultados selecionáveis, a fonte retornará nome e coordenadas válidas;
  país ou região podem estar ausentes e serão apresentados quando disponíveis.
- A previsão será diária e conterá o dia atual mais os quatro dias seguintes.
- A previsão e a hora de observação usarão o fuso da cidade selecionada,
  conforme fornecido pela fonte.
- Os dados de origem serão mantidos em Celsius e sem arredondamento; a regra de
  arredondamento será aplicada somente na apresentação.
- Cada requisição terá timeout de 10 segundos e retry apenas por ação manual.
- O usuário terá acesso à internet para obter dados atualizados.
- A primeira versão exibirá dados da cidade selecionada na sessão atual.
- Não haverá autenticação, pagamentos, funcionalidades sociais, favoritos ou
  histórico persistido em servidor.

## Risks

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Open-Meteo indisponível, lenta ou sujeita a limites de uso | Média | Alto | Aplicar timeout de 10 segundos, encerrar a espera, informar indisponibilidade e permitir retry manual; confirmar limites e termos antes do lançamento. |
| Busca retornar cidade homônima ou localização incorreta | Média | Alto | Exibir país/região e exigir seleção explícita quando houver ambiguidade. |
| Interpretação incorreta dos cinco dias | Baixa | Alto | Fixar no produto a regra hoje + quatro dias e cobri-la nos critérios de aceite. |
| Latência elevada nas consultas | Média | Médio | Mostrar loading em até 100 ms, medir renderização contra o limite de 500 ms e acompanhar o tempo externo da API separadamente. |
| Interface inadequada em telas pequenas | Média | Alto | Usar abordagem mobile-first e validar viewports de 320 px, 768 px e 1440 px. |
| Conversão Celsius/Fahrenheit inconsistente | Baixa | Médio | Aplicar a fórmula e arredondamento definidos em FR-06/NFR-06 e cobrir casos positivos, negativos e de empate com testes. |
| Datas, horários ou locale confundirem o usuário | Média | Médio | Usar pt-BR e datas no fuso da cidade selecionada; cobrir virada de dia e mudança de ano nos testes. |
| Escopo crescer com favoritos, histórico ou localização automática | Alta | Médio | Manter essas capacidades fora do escopo e tratá-las como decisões futuras. |
| Respostas de buscas concorrentes exibirem dados de uma cidade incorreta | Média | Alto | Ignorar respostas de buscas anteriores quando uma busca mais recente já tiver sido iniciada; cobrir respostas fora de ordem com teste. |
| Termos ou limites da Open-Meteo impedirem o uso pretendido em produção | Baixa | Alto | Confirmar termos, atribuição e limites antes do lançamento e definir contingência operacional. |

## Out of Scope

- Autenticação, criação de contas e gerenciamento de perfil.
- Persistência de histórico, favoritos ou cidades salvas em servidor.
- Alertas, notificações push e avisos meteorológicos.
- Mapas, radar meteorológico, imagens de satélite ou camadas geográficas.
- Previsão horária, salvo decisão posterior que altere este escopo.
- Comparação simultânea entre várias cidades.
- Widgets, aplicativo nativo ou funcionamento offline completo.
- Busca por coordenadas, código postal ou localização automática do dispositivo.
- Integração com calendários, agenda, vestuário ou recomendações de atividades.
- Suporte a múltiplos idiomas na primeira versão; a UI inicial será pt-BR.
- Administração de usuários, cobrança ou funcionalidades sociais.

## Open Questions

As seguintes decisões ainda precisam de validação do responsável pelo produto:

1. A unidade escolhida deve persistir apenas durante a sessão ou entre visitas
  no armazenamento local do dispositivo?
2. Os termos de uso e limites atuais da Open-Meteo permitem o uso pretendido em
  produção? Há requisitos de atribuição ou limites de tráfego a respeitar?
3. Os alvos de renderização definidos em NFR-03 são aceitáveis para o produto?
  É necessário definir um SLO de disponibilidade próprio além do tratamento
  de falhas do provedor externo?
