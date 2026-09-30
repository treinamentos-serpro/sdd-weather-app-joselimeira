# Discovery — Weather App

## Contexto

A empresa solicitou uma aplicação web de previsão do tempo para permitir que
usuários consultem as condições meteorológicas de cidades e planejem suas
atividades. O produto deve atender tanto ao uso rápido no celular quanto à
consulta em telas maiores.

O briefing define cinco necessidades principais: buscar cidades, visualizar o
clima atual, consultar a previsão de cinco dias, alternar entre Celsius e
Fahrenheit e utilizar a aplicação em dispositivos móveis. A análise abaixo
separa o comportamento esperado do sistema das qualidades que ele deve
oferecer e registra as decisões que ainda precisam ser tomadas.

## Requisitos Funcionais

1. O usuário deve poder buscar uma cidade por nome.
2. O sistema deve apresentar resultados de busca que permitam identificar a
   cidade escolhida.
3. O usuário deve poder selecionar uma cidade para consultar seus dados
   meteorológicos.
4. O sistema deve exibir o clima atual da cidade selecionada.
5. O sistema deve exibir uma previsão para cinco dias.
6. O usuário deve poder alternar a unidade de temperatura entre Celsius e
   Fahrenheit.
7. O sistema deve atualizar os valores de temperatura quando a unidade for
   alterada, sem exigir uma nova busca da cidade.
8. O sistema deve informar quando a busca não retornar nenhuma cidade.
9. O sistema deve informar quando não for possível carregar os dados
   meteorológicos.
10. O sistema deve informar visualmente quando uma operação estiver em
    andamento.

## Requisitos Não-Funcionais

1. **Responsividade:** a interface deve funcionar em dispositivos móveis,
   tablets e desktops sem perda de conteúdo ou sobreposição de elementos.
2. **Acessibilidade:** controles devem ser navegáveis por teclado e possuir
   nomes, labels e estados semânticos compreensíveis por tecnologias
   assistivas.
3. **Desempenho:** a interface deve fornecer feedback imediato durante buscas
   e evitar requisições desnecessárias.
4. **Disponibilidade:** falhas de rede, indisponibilidade do serviço ou
   respostas inválidas não devem deixar a interface travada ou sem orientação
   para o usuário.
5. **Usabilidade:** os dados principais, incluindo temperatura atual,
   condição do tempo e previsão, devem ser fáceis de localizar e interpretar.
6. **Consistência:** a unidade escolhida pelo usuário deve ser aplicada de
   forma consistente a todas as temperaturas exibidas.
7. **Internacionalização:** idioma, formatos de data e unidades devem ser
   definidos explicitamente antes da implementação.
8. **Privacidade:** a aplicação não deve exigir autenticação nem coletar dados
   pessoais para realizar uma consulta, salvo decisão posterior em contrário.

## Riscos

| Risco | Probabilidade | Impacto | Mitigação |
| --- | --- | --- | --- |
| Serviço de dados meteorológicos indisponível ou sujeito a limite de requisições | Média | Alto | Definir estados de erro, timeout, retry controlado e uma mensagem acionável para o usuário. |
| Busca retornar cidades homônimas ou localização incorreta | Média | Alto | Exibir cidade e país/região nos resultados e exigir seleção explícita quando houver ambiguidade. |
| Latência elevada durante a busca ou carregamento da previsão | Média | Médio | Exibir estado de loading, evitar requisições duplicadas e definir um limite de espera aceitável. |
| Interface não se adaptar corretamente a telas pequenas | Média | Alto | Adotar abordagem mobile-first e validar os principais fluxos em viewports móveis e desktop. |
| Conversão de Celsius para Fahrenheit gerar valores inconsistentes | Baixa | Médio | Definir uma única regra de conversão, arredondamento e unidade interna antes da implementação. |
| Diferenças de formato de data ou idioma confundirem o usuário | Média | Médio | Confirmar locale, formato de data e idioma da interface como parte da especificação. |

## Perguntas em Aberto (Open Questions)

1. Qual fonte de dados meteorológicos será usada? Ela exige API key, tem custo
   ou possui limites de uso? **Impacto:** afeta arquitetura, segurança,
   orçamento e possibilidade de disponibilizar o app sem configuração extra.
2. O que significa exatamente "previsão de cinco dias": inclui o dia atual ou
   representa os quatro dias seguintes? **Impacto:** altera a consulta à API,
   o modelo de dados e a expectativa do usuário.
3. A previsão deve ser diária, horária ou apresentar os dois formatos?
   **Impacto:** determina a quantidade de dados, o desenho da interface e a
   complexidade de leitura.
4. A busca deve aceitar apenas nomes de cidades ou também país, estado,
   coordenadas e localização automática? **Impacto:** afeta o componente de
   busca, a desambiguação e a experiência em dispositivos móveis.
5. Qual deve ser a unidade padrão na primeira visita: Celsius ou Fahrenheit?
   **Impacto:** afeta a experiência inicial e os critérios de aceite da
   conversão.
6. A preferência de unidade deve persistir entre visitas? **Impacto:** define
   se será necessário usar armazenamento local ou manter a preferência apenas
   durante a sessão.
7. Qual idioma e locale a interface deve usar? **Impacto:** afeta textos,
   datas, números, acessibilidade e formato das unidades.
8. Como o sistema deve se comportar sem conexão ou quando a API falhar?
   **Impacto:** define a estratégia de cache, mensagens de erro, retry e
   possíveis dados desatualizados.
9. É necessário permitir múltiplas cidades salvas, histórico ou favoritos?
   **Impacto:** pode introduzir autenticação, persistência e escopo adicional.
10. Quais metas de desempenho são aceitáveis para busca e carregamento dos
    dados? **Impacto:** permite definir timeouts, métricas e critérios de
    aceite mensuráveis.

## Decisões

1. **Fonte de dados: Open-Meteo, sem API key.** A aplicação usará a Open-Meteo
   para geocodificação e dados de previsão, evitando a necessidade de
   configurar e proteger uma chave de API no cliente. Esta decisão resolve a
   pergunta sobre a fonte de dados e reduz os riscos de custo, exposição de
   credenciais e configuração inicial.
2. **Definição de cinco dias: hoje + quatro dias seguintes.** A previsão
   exibirá o dia atual e os quatro dias subsequentes, totalizando cinco dias.
   Esta decisão resolve a ambiguidade sobre a interpretação do período e
   orienta o contrato de dados e os critérios de aceite.
3. **Unidade padrão: Celsius.** A primeira consulta será apresentada em
   Celsius, com possibilidade de alternância para Fahrenheit. Esta decisão
   resolve a definição da unidade inicial e estabelece um comportamento
   previsível para a primeira visita.
4. **Sem autenticação e sem persistência de servidor.** O MVP não exigirá
   login nem armazenará dados do usuário em um servidor. As consultas ficam
   restritas à sessão atual, salvo decisão posterior sobre persistência local.
   Esta decisão reduz o escopo inicial e resolve a dúvida sobre autenticação,
   contas e armazenamento de histórico ou favoritos no servidor.
5. **Idioma da interface: pt-BR.** Textos, mensagens, datas e formatos da UI
   serão definidos para o locale pt-BR. Esta decisão resolve a escolha inicial
   de idioma e locale, mantendo a internacionalização para outros idiomas
   fora do escopo atual.

## Suposições

- A aplicação será uma experiência web responsiva, sem necessidade inicial de
  aplicativo nativo.
- O usuário selecionará uma cidade antes de consultar seus dados
  meteorológicos.
- A busca exibirá informação suficiente para diferenciar cidades com o mesmo
  nome.
- O sistema terá acesso à internet para obter dados atualizados.
- Os dados meteorológicos serão apresentados somente para a cidade selecionada
  na sessão atual, salvo decisão explícita sobre favoritos ou histórico.
- A conversão de temperatura será apenas de apresentação; a unidade usada
  internamente ainda precisa ser definida no plano técnico.
- Não haverá autenticação, pagamentos ou funcionalidades sociais no primeiro
  escopo.

## Personas

### Viajante que planeja a semana

Precisa consultar rapidamente a previsão de uma cidade antes de organizar uma
viagem. Usa principalmente o celular e valoriza previsão clara, busca simples
e informações fáceis de comparar.

### Pessoa decidindo a roupa do dia

Consulta o clima atual e a previsão próxima antes de sair de casa. Pode usar
celular ou desktop e precisa localizar temperatura e condição atual sem
percorrer uma interface complexa.

### Usuário internacional

Está acostumado a Fahrenheit ou a formatos de data diferentes do padrão local.
Precisa alternar a unidade de temperatura e interpretar os dados sem
ambiguidade.