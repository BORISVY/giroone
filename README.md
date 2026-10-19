# GIRO - Gestão Integrada de Rotas e Operações

SISTEMA DE CONTROLE DE FROTA, SAÍDAS, CHEGADAS, MANUTENÇÕES E OCORRÊNCIAS. Crie um nome para ele bem legal, que fique gravado na mente

Quero criar um sistema web responsivo para substituir o processo que atualmente utilizamos através de Google Forms + Google Sheets.

O sistema será utilizado por motoristas, recepção e responsáveis pelo controle dos veículos.

O objetivo é criar um sistema simples, rápido, intuitivo e confiável, com foco em:

Controle de saída e retorno dos veículos.

Controle de quilometragem.

Identificação automática de inconsistências.

Alertas.

Prevenção de esquecimentos.

Histórico completo de utilização.

Controle de manutenções.

Controle e acompanhamento de observações/ocorrências.

Dashboard gerencial completo.

Métricas de utilização dos motoristas e veículos.

Facilidade de edição e correção dos lançamentos.

Uso extremamente simples pelo celular através de QR Code.

1. CONTEXTO ATUAL

Atualmente temos veículos utilizados para entregas, retiradas de materiais, compras e outras atividades da empresa.

Cada veículo possui um QR Code fixado no painel.

Quando um motorista pega um veículo, ele escaneia o QR Code e acessa um formulário.

Atualmente o formulário solicita:

Nome do motorista.

Veículo utilizado.

Quilometragem atual do painel.

Tipo de operação: SAÍDA ou RETORNO.

Motivo da utilização.

Observação opcional.

Depois essas informações são enviadas para uma planilha do Google Sheets.

Quero substituir completamente esse processo por este sistema.

O QR Code deverá continuar sendo utilizado, porém agora deverá direcionar para uma página específica do sistema.

2. PRINCÍPIO MAIS IMPORTANTE DO SISTEMA

O sistema deve funcionar com base no conceito de:

CADA VEÍCULO POSSUI UM STATUS ATUAL.

Exemplos:

VEÍCULO A:

Status: DISPONÍVEL

Último lançamento: RETORNO

Última quilometragem: 152 km

VEÍCULO B:

Status: EM USO

Último lançamento: SAÍDA

Última quilometragem: 100 km

Motorista responsável: João

Saída: 10:32

3. FLUXO DO MOTORISTA

O motorista deverá conseguir registrar uma saída ou retorno em poucos segundos.

Ao acessar pelo QR Code do veículo, o sistema deverá identificar automaticamente o veículo correspondente.

O motorista NÃO deve precisar selecionar manualmente o veículo quando acessar pelo QR Code específico daquele carro.

Exemplo:

/veiculos/VEICULO-X/registro

Ao acessar esse endereço, o sistema já sabe qual é o veículo.

4. TELA DE REGISTRO

Criar uma interface extremamente simples e mobile-first.

Mostrar:

REGISTRAR MOVIMENTAÇÃO

🚗 VEÍCULO: Fiat Strada - ABC-1234

Status atual:

🟢 DISPONÍVEL

ou

🔴 EM USO

CAMPOS

Motorista

Campo obrigatório.

Utilizar uma lista de motoristas cadastrados.

Possibilitar busca pelo nome.

Tipo de movimentação

Dois botões grandes:

[ SAÍDA ]

[ RETORNO ]

O sistema deve sugerir automaticamente a operação correta de acordo com o status do veículo.

Quilometragem

Campo obrigatório.

Aceitar somente números.

Motivo da utilização

Campo obrigatório.

Deve ser preenchido com as informações referentes ao uso do carro



Observação / Ocorrência

Campo opcional.

IMPORTANTE:

A observação NÃO deve ser tratada apenas como um simples texto perdido dentro do lançamento.

Sempre que o motorista registrar uma observação, o sistema deverá transformar essa observação em uma OCORRÊNCIA CONTROLÁVEL, que poderá ser acompanhada posteriormente pelo responsável.

Exemplos:

"Pneu dianteiro esquerdo aparentando estar murcho."

"Luz do painel acendeu."

"Veículo apresentou dificuldade para ligar."

"Barulho estranho na suspensão."

"Arranhão na lateral."

"Ar-condicionado não está funcionando."

"Nenhuma observação."

Caso exista uma observação, criar automaticamente uma ocorrência vinculada:

Ao veículo.

Ao motorista.

À movimentação.

À data/hora.

Ao texto informado.

5. MÓDULO DE OBSERVAÇÕES / OCORRÊNCIAS

Criar um módulo específico:

OCORRÊNCIAS

Esse módulo será responsável por centralizar todas as observações informadas pelos motoristas.

Cada ocorrência deverá possuir um status de acompanhamento.

Os status obrigatórios são:

🔵 VISUALIZADA

A observação foi lida pelo responsável, mas ainda não houve uma ação ou conclusão.

🟡 PENDENTE

A observação exige alguma ação, mas ainda não foi resolvida.

🟢 REALIZADA

A ação necessária foi executada e o problema foi resolvido.

🔴 RECUSADA

A observação foi analisada e o responsável decidiu que nenhuma ação será realizada.

IMPORTANTE:

"Visualizada" e "Pendente" são estados diferentes.

Exemplo:

Motorista relata:

"Pneu traseiro está perdendo pressão."

O responsável abre a ocorrência.

Status muda de:

NOVA → VISUALIZADA

Depois decide que precisa levar o veículo à borracharia:

VISUALIZADA → PENDENTE

Depois o pneu é reparado:

PENDENTE → REALIZADA

Caso o responsável conclua que a observação não representa um problema ou não necessita de ação:

VISUALIZADA/PENDENTE → RECUSADA

6. TELA DE OCORRÊNCIAS

Criar uma tela completa:

CENTRAL DE OCORRÊNCIAS

No topo mostrar cards:

[ TODAS ]

[ NOVAS ]

[ VISUALIZADAS ]

[ PENDENTES ]

[ REALIZADAS ]

[ RECUSADAS ]

Cada card deve mostrar a quantidade atual.

TABELA DE OCORRÊNCIAS

Colunas:

Data

Veículo

Placa

Motorista

Observação

Status

Responsável

Data da visualização

Data da resolução

Ação realizada

Filtros:

Status

Veículo

Motorista

Período

Tipo de ocorrência

Responsável

Pesquisa por texto.

7. DETALHES DA OCORRÊNCIA

Ao abrir uma ocorrência:

Mostrar:

OCORRÊNCIA #000123

Veículo:
Fiat Strada

Placa:
ABC-1234

Motorista:
João

Data:
31/08/2026

Horário:
10:32

Movimentação:
SAÍDA

Quilometragem:
15.430 km

Observação:

"Pneu dianteiro esquerdo aparentando estar murcho."

HISTÓRICO

Criar uma linha do tempo:

31/08 10:32
Ocorrência criada pelo motorista.

31/08 11:15
Visualizada por Carlos.

31/08 13:20
Alterada para PENDENTE.

01/09 09:30
Manutenção realizada.

01/09 10:00
Ocorrência marcada como REALIZADA.

AÇÕES

[ MARCAR COMO VISUALIZADA ]

[ MARCAR COMO PENDENTE ]

[ MARCAR COMO REALIZADA ]

[ MARCAR COMO RECUSADA ]

Ao marcar como realizada ou recusada, solicitar uma justificativa/observação do responsável.

Exemplo:

Ação realizada:
"Calibragem e troca do pneu."

ou

Motivo da recusa:
"Verificado que a pressão estava dentro do padrão."

8. CLASSIFICAÇÃO DAS OCORRÊNCIAS

Permitir futuramente classificar ocorrências.

Categorias sugeridas:

Pneus

Freios

Motor

Suspensão

Elétrica

Funilaria

Ar-condicionado

Documentação

Limpeza

Segurança

Equipamentos

Outros

Essa classificação poderá ser utilizada nos dashboards e relatórios.

9. ALERTAS DE OCORRÊNCIAS

Criar alertas para ocorrências pendentes.

Exemplo:

🔴 3 OCORRÊNCIAS PENDENTES

Mostrar no dashboard.

Também destacar ocorrências que estejam pendentes há muito tempo.

Exemplo:

"Ocorrência pendente há 7 dias."

Permitir configurar limites de tempo.

10. DASHBOARD PRINCIPAL

O dashboard deverá ser muito mais completo do que apenas mostrar quantidade de veículos.

Ele deve funcionar como um painel gerencial da frota.

Criar filtros globais:

Hoje

Últimos 7 dias

Últimos 30 dias

Mês atual

Mês anterior

Últimos 6 meses

Últimos 12 meses

Período personalizado

Sempre que possível, os gráficos e métricas deverão respeitar esses filtros.

11. DASHBOARD — VISÃO GERAL DA FROTA

Cards:

VEÍCULOS

Total de veículos.

DISPONÍVEIS

Quantidade.

EM USO

Quantidade.

RETORNOS PENDENTES

Quantidade.

KM RODADOS

Total no período.

OCORRÊNCIAS

Total no período.

OCORRÊNCIAS PENDENTES

Quantidade.

MANUTENÇÕES

Quantidade no período.

VALOR GASTO

Total gasto com manutenção.

12. DASHBOARD — RANKING DOS MOTORISTAS

Criar uma seção:

DESEMPENHO DOS MOTORISTAS

Mostrar métricas individuais de cada motorista.

Para cada motorista calcular:

Quantidade de saídas.

Quantidade de retornos.

KM rodados.

Quantidade de lançamentos.

Lançamentos corretos.

Lançamentos corrigidos.

Erros de veículo.

Erros de quilometragem.

Saídas duplicadas tentadas.

Retornos esquecidos.

Ocorrências registradas.

Ocorrências resolvidas.

Percentual de lançamentos corretos.

Taxa de erros.

Criar ranking:

🏆 MOTORISTAS COM MELHOR QUALIDADE DE LANÇAMENTO

Mostrar quem possui maior percentual de lançamentos corretos.

⚠️ MOTORISTAS COM MAIS ERROS

Mostrar quem mais teve lançamentos corrigidos ou inconsistentes.

🚗 MOTORISTAS QUE MAIS RODARAM

Mostrar quem acumulou maior quilometragem no período.

IMPORTANTE:

Essas métricas devem ser apresentadas de forma gerencial e objetiva, evitando criar uma lógica injusta baseada apenas na quantidade absoluta de erros.
Outro detalhe também, caso um lançamento for corrigido ou alterado, seja ele a quilometragem, status ou outra coisa, esse lançamento será considerado como erro para o motorista.

Sempre que possível, considerar:

ERROS / TOTAL DE LANÇAMENTOS

para calcular uma taxa de erro.

Exemplo:

Motorista A:
100 lançamentos
2 erros
Taxa de erro: 2%

Motorista B:
20 lançamentos
3 erros
Taxa de erro: 15%

Nesse caso, o motorista B possui maior taxa de erro, apesar de possuir menos erros absolutos.

13. MÉTRICAS DE UTILIZAÇÃO DOS VEÍCULOS

Criar seção:

UTILIZAÇÃO DA FROTA

Para cada veículo mostrar:

Quantidade de saídas.

Quantidade de viagens.

KM rodados.

Tempo total em uso.

Média de KM por viagem.

Média de duração das viagens.

Quantidade de motoristas diferentes que utilizaram o veículo.

Ocorrências.

Manutenções.

Valor gasto em manutenção.

14. RANKING DOS VEÍCULOS

Criar rankings:

🚗 CARRO MAIS UTILIZADO

Mostrar:

Veículo
Quantidade de utilizações
Percentual da frota

Exemplo:

Strada ABC-1234
87 utilizações
32% de todas as utilizações.

🛣️ CARRO QUE MAIS RODOU

Ranking por KM rodados.

🔧 CARRO COM MAIS MANUTENÇÕES

Ranking por quantidade de manutenções.

💰 CARRO COM MAIOR CUSTO DE MANUTENÇÃO

Ranking por valor total gasto.

💸 CARRO COM MAIOR CUSTO POR KM

Calcular:

Total gasto com manutenção / KM rodados

Isso permitirá identificar veículos que estão gerando custos elevados proporcionalmente à utilização.

15. MOTORISTA X VEÍCULO

Criar uma análise cruzada:

UTILIZAÇÃO MOTORISTA X VEÍCULO

Criar uma matriz mostrando quantas vezes cada motorista utilizou cada veículo.

Exemplo:

| Motorista | Strada A | Strada B | Strada C | Strada D |
| João | 32 | 8 | 4 | 2 |
| Carlos | 5 | 28 | 10 | 3 |
| Pedro | 2 | 4 | 35 | 8 |

Permitir clicar em uma combinação.

Exemplo:

João + Strada A

Mostrar:

Quantidade de utilizações.

KM rodados.

Média de KM por viagem.

Ocorrências.

Erros de lançamento.

Última utilização.

Também criar ranking:

🏆 COMBINAÇÃO MOTORISTA + VEÍCULO MAIS FREQUENTE

Exemplo:

João + Strada A
32 utilizações.

16. RELAÇÃO ENTRE MOTORISTAS E ERROS

Criar gráficos:

Erros por motorista.

Taxa de erro por motorista.

Tipos de erros mais comuns.

Evolução dos erros ao longo do tempo.

Tipos de erro:

Veículo selecionado incorretamente.

KM incorreto.

Retorno esquecido.

Saída duplicada.

Retorno sem saída.

Outros.

IMPORTANTE:

Distinguir entre:

ERRO BLOQUEADO PELO SISTEMA

Exemplo:
Motorista tentou fazer segunda saída e o sistema impediu.

e

ERRO REAL REGISTRADO

Exemplo:
Lançamento precisou ser corrigido posteriormente.

Isso permite avaliar melhor o comportamento dos lançamentos.

17. INDICADOR DE QUALIDADE DOS LANÇAMENTOS

Criar um indicador:

QUALIDADE DOS LANÇAMENTOS

Para cada motorista calcular:

Total de lançamentos.

Lançamentos sem correção.

Lançamentos corrigidos.

Percentual sem correção.

Exemplo:

João

100 lançamentos

96 sem correção
4 corrigidos

Qualidade:
96%

18. MÉTRICAS DE OCORRÊNCIAS

Dashboard:

OCORRÊNCIAS

Mostrar:

Total.

Novas.

Visualizadas.

Pendentes.

Realizadas.

Recusadas.

Gráficos:

Ocorrências por veículo.

Ocorrências por motorista.

Ocorrências por categoria.

Evolução das ocorrências.

Tempo médio para resolução.

Veículos com mais ocorrências.

Tipos de problema mais relatados.

Criar indicador:

TEMPO MÉDIO DE RESOLUÇÃO

Tempo entre:

Criação da ocorrência

até

Marcação como REALIZADA.

19. ANÁLISE DE OCORRÊNCIAS POR VEÍCULO

Para cada veículo mostrar:

Total de ocorrências.

Pendentes.

Realizadas.

Recusadas.

Categoria mais frequente.

Tempo médio de resolução.

Isso deve ajudar a identificar veículos que apresentam problemas recorrentes.

20. DASHBOARD DE MANUTENÇÕES

Criar gráficos:

Total gasto.

Gasto por veículo.

Gasto por tipo.

Gasto por prestador.

Quantidade de manutenções.

Manutenções preventivas x corretivas.

Custo por KM.

Evolução dos gastos.

Veículos com maior custo.

Veículos com maior frequência de manutenção.

21. RANKING DE PRESTADORES

Criar métricas por prestador:

Quantidade de serviços.

Valor total.

Valor médio.

Tipos de manutenção realizados.

Veículos atendidos.

22. ANÁLISE COMPLETA DE CADA VEÍCULO

Ao clicar em um veículo, abrir uma página:

DETALHES DO VEÍCULO

Mostrar:

INFORMAÇÕES

Modelo

Marca

Placa

Ano

KM atual

Status

UTILIZAÇÃO

Total de viagens.

KM rodados.

Tempo em uso.

Motoristas que utilizaram.

MANUTENÇÕES

Quantidade.

Valor total.

Última manutenção.

Próxima manutenção.

Custo por KM.

OCORRÊNCIAS

Total.

Pendentes.

Realizadas.

Recusadas.

HISTÓRICO

Linha do tempo completa do veículo:

Saídas.

Retornos.

Manutenções.

Ocorrências.

Alterações.

23. ANÁLISE COMPLETA DE CADA MOTORISTA

Ao clicar em um motorista:

PERFIL DO MOTORISTA

Mostrar:

Total de saídas.

Total de viagens.

KM rodados.

Veículos utilizados.

Veículo mais utilizado.

Quantidade de erros.

Taxa de erro.

Lançamentos corrigidos.

Percentual de lançamentos corretos.

Ocorrências registradas.

Criar gráficos de utilização por veículo.

24. CONTROLE DE SAÍDA DUPLICADA

Se o veículo estiver:

🔴 EM USO

e alguém tentar registrar outra SAÍDA:

Mostrar:

"⚠️ ATENÇÃO: ESTE VEÍCULO JÁ ESTÁ EM USO."

Mostrar:

Motorista.

Data.

Horário.

KM.

Motivo.

Bloquear para usuários comuns.

Registrar a tentativa como uma ocorrência estatística de "tentativa de saída duplicada".

25. RETORNO SEM SAÍDA

Não permitir RETORNO caso não exista uma saída aberta.

Registrar a tentativa para fins de análise, mas não criar movimentação inválida.

26. CONTROLE DE QUILOMETRAGEM

Nunca permitir que a quilometragem seja menor que a última quilometragem conhecida.

Caso:

Última KM:
152

Motorista:
145

Mostrar erro e bloquear.

Administradores poderão fazer correção manual.

27. DIFERENÇA ENTRE RETORNO E NOVA SAÍDA

Exemplo:

Retorno:
150 km

Nova saída:
152 km

Registrar:

Diferença:
+2 km

Permitir configuração dos limites:

🟢 Normal
🟡 Atenção
🔴 Crítico

Essa informação também deve alimentar os dashboards e relatórios.

28. DETECÇÃO DE RETORNO PENDENTE

Se o motorista registrar uma SAÍDA e não registrar retorno após o período configurado:

Criar automaticamente alerta:

🔴 RETORNO PENDENTE

Mostrar:

Veículo.

Motorista.

Horário.

KM.

Tempo em aberto.

29. MÓDULO DE MANUTENÇÕES

Criar módulo completo:

Campos:

Data.

Veículo.

Placa.

Modelo.

Tipo de manutenção.

Descrição.

Prestador.

Valor.

KM no momento.

Observações.

Documento/anexo futuramente.

30. MANUTENÇÃO PREVENTIVA

Permitir cadastrar regras:

Exemplo:

Óleo:
A cada 10.000 km.

ou:

A cada 6 meses.

Mostrar:

🟢 Em dia
🟡 Próxima
🔴 Atrasada

31. HISTÓRICO E AUDITORIA

Qualquer alteração importante deve gerar auditoria.

Registrar:

Usuário.

Data.

Horário.

Campo alterado.

Valor anterior.

Valor novo.

Motivo, quando aplicável.

Não excluir dados definitivamente.

Utilizar exclusão lógica.

32. RELATÓRIOS

Criar relatórios:

Frota

Utilização.

KM.

Tempo.

Motoristas

Utilização.

Erros.

Qualidade dos lançamentos.

Veículos

Utilização.

Manutenção.

Custos.

Ocorrências

Status.

Categorias.

Tempo de resolução.

Manutenção

Gastos.

Quantidade.

Prestadores.

Inconsistências

Saídas duplicadas.

Retornos pendentes.

Diferenças de KM.

Correções.

Permitir exportação:

Excel/CSV.

PDF.

33. CADASTRO DE VEÍCULOS

Campos:

ID.

Marca.

Modelo.

Placa.

Ano.

Cor.

KM atual.

Status.

Ativo/Inativo.

Observações.

34. QR CODES

Cada veículo terá um QR Code exclusivo.

Criar:

QR CODES DA FROTA

Mostrar:

Veículo.

Placa.

QR Code.

Botão:

[IMPRIMIR]

O QR Code deverá direcionar diretamente para o registro daquele veículo.

35. CADASTRO DE MOTORISTAS

Campos:

Nome.

Status.

Observações.

36. USUÁRIOS E PERMISSÕES

ADMINISTRADOR

Acesso completo.

RECEPÇÃO / OPERADOR

Acesso a:

Movimentações.

Veículos.

Alertas.

Ocorrências.

Histórico.

MOTORISTA

Acesso somente ao necessário para:

Registrar saída.

Registrar retorno.

 

37. SEGURANÇA

Todas as regras críticas deverão existir no backend.

Não depender apenas da interface.

O backend deve validar:

Status do veículo.

Última movimentação.

Quilometragem.

Permissões.

Integridade das viagens.

Alterações.

38. BANCO DE DADOS

Utilizar estrutura normalizada.

Sugestão:

users
drivers
vehicles
vehicle_movements
trips
maintenance_records
maintenance_types
maintenance_schedules
service_providers
incidents
incident_history
alerts
audit_logs
settings

Relacionamentos devem ser bem definidos.

39. EXPERIÊNCIA DO MOTORISTA

Prioridade máxima:

O motorista deve conseguir registrar em poucos segundos.

Fluxo:

Escanear QR Code.

Informar/selecionar nome.

Confirmar SAÍDA ou RETORNO.

Informar KM.

Selecionar motivo.

Adicionar observação, se houver.

Registrar.

Interface mobile-first.

Botões grandes.

Poucos elementos.

40. DASHBOARD GERENCIAL — RESUMO EXECUTIVO

O dashboard deve permitir que um responsável abra o sistema e entenda rapidamente:

FROTA

Quantos veículos existem.

Quantos estão disponíveis.

Quantos estão em uso.

UTILIZAÇÃO

Qual veículo mais roda.

Qual motorista mais roda.

Qual veículo é mais utilizado.

Qual combinação motorista + veículo é mais frequente.

QUALIDADE

Quem mais acerta os lançamentos.

Quem possui maior taxa de erro.

Quantos lançamentos foram corrigidos.

Quais erros são mais comuns.

MANUTENÇÃO

Qual veículo mais recebe manutenção.

Qual veículo gera maior custo.

Qual veículo possui maior custo por KM.

Quanto foi gasto no período.

OCORRÊNCIAS

Quantas existem.

Quantas estão pendentes.

Quais veículos possuem mais problemas.

Quais problemas aparecem com maior frequência.

Quanto tempo demora para resolver.

41. INTELIGÊNCIA DOS INDICADORES

Não limitar o sistema a simplesmente contar registros.

Sempre que possível, criar indicadores derivados.

Exemplos:

Taxa de erro

Erros / total de lançamentos.

Qualidade

Lançamentos sem correção / total.

Utilização

Viagens por veículo.

Custo por KM

Gastos com manutenção / KM rodados.

Frequência de manutenção

Manutenções / KM rodados.

Tempo médio de resolução

Tempo entre criação e conclusão da ocorrência.

Participação na frota

Utilizações do veículo / utilizações totais.

Concentração de uso

Quanto da utilização de um veículo pertence a determinado motorista.

Esses indicadores devem respeitar o período selecionado.

42. REQUISITO FINAL

Não quero simplesmente transformar o Google Forms em uma página bonita.

Quero transformar o processo em um verdadeiro sistema de controle e gestão de frota.

O sistema deve ajudar a empresa a responder:

Onde estão os veículos?

Quem está utilizando cada veículo?

Qual veículo está disponível?

Qual veículo está em uso?

Quem mais utiliza cada veículo?

Quem mais roda?

Quem registra corretamente?

Quem mais precisa corrigir lançamentos?

Qual veículo é mais utilizado?

Qual veículo mais roda?

Qual veículo mais apresenta problemas?

Qual veículo mais recebe manutenção?

Quanto gastamos com cada veículo?

Qual veículo possui maior custo por KM?

Quais observações estão pendentes?

Quais problemas já foram resolvidos?

Quanto tempo levamos para resolver problemas?

Quais são os principais problemas da frota?

Quais motoristas mais utilizam cada veículo?

O sistema deve transformar os dados operacionais em informações úteis para tomada de decisão.

Antes de finalizar, revisar toda a aplicação procurando:

Bugs.

Fluxos quebrados.

Validações ausentes.

Problemas de segurança.

Problemas de responsividade.

Problemas de banco de dados.

Duplicação de registros.

Inconsistências de quilometragem.

Problemas no fluxo SAÍDA → RETORNO.

Problemas na criação e acompanhamento de ocorrências.

Métricas calculadas incorretamente.

Problemas nos filtros e relatórios.

Corrigir os problemas encontrados.

Priorizar:

SIMPLICIDADE + VELOCIDADE + CONFIABILIDADE + RASTREABILIDADE + INFORMAÇÃO GERENCIAL.

Sobre a questão do funcionamento. Quando o motorista escanear o QRCode, ele será direcionado para a tela de preenchimento da viagem, sem precisar de login, usuário ou senha. 
Quem terá usuário e senha serão apenas o pessoal do administrativo que terá acesso a todas as demais informações. Então sem usuário, da apenas para lançar a viagem, já com ele, você tem acesso a todas as outras informações.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://giroone.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1496792e-80a9-4b2a-a0a7-8f1ed491fb48).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
