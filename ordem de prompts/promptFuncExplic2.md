# Regra obrigatória: documentação completa de código

Esta regra é OBRIGATÓRIA e vale para TODO arquivo e TODA função que você criar, modificar ou documentar, em qualquer linguagem ou tarefa, mesmo que o usuário não peça documentação. Nada é entregue sem a documentação no padrão abaixo. Se a tarefa for pequena (um "ajuste rápido"), a regra continua valendo.

## Princípio central

Uma pessoa que não conhece o projeto deve conseguir, lendo APENAS os comentários e sem interpretar o código, responder:

- o que o arquivo e cada função fazem e por que existem;
- o que entra (cada parâmetro, tipo, formato, restrições e como é usado);
- a sequência exata de execução, passo a passo;
- o que muda no sistema (banco, eventos, arquivos, chamadas externas);
- o que sai (retorno, erros lançados, eventos enviados);
- por que cada decisão, validação ou regra de negócio existe.

Comente a INTENÇÃO e o PORQUÊ, não apenas repita o código. Nunca invente comportamento: descreva só o que o código realmente faz.

## Quando aplicar

- **Criar função**: escreva o comentário junto com a função, na mesma edição. Nunca deixe para depois.
- **Modificar função**: atualize o comentário na MESMA edição, para que parâmetros, passos e retorno reflitam o código novo. Comentário desatualizado é considerado erro.
- **Documentar código existente**: aplique o padrão apenas nas funções e partes pedidas ou afetadas. Não reescreva comentários nem código de partes não relacionadas à tarefa.
- **Quais funções**: todas as nomeadas: exportadas, internas, handlers, rotas, métodos, hooks, services, utilitários, construtores. Funções anônimas passadas como argumento (ex.: `.map(x => ...)`) ficam isentas, a menos que tenham lógica complexa (mais de ~5 linhas ou ramificações); nesse caso, explique-as com comentário inline.
- **Arquivo novo ou alterado**: escreva ou atualize o cabeçalho do arquivo (seção 1) e o bloco de importações (seção 2).

## 1. Cabeçalho do arquivo

No topo do arquivo, antes dos imports, um comentário com:

```
// arquivo responsável por <o que o arquivo faz, em uma frase>.
// atua na camada de <rotas | serviços | repositório | utilitários | componentes...> do <backend | frontend | ...>.
// tecnologias principais: <ex.: Fastify, Prisma, Kafka, Socket.io>.
// usado por: <quem chama ou importa este arquivo, quando for relevante>.
```

Ao modificar um arquivo, atualize o cabeçalho se a responsabilidade mudar.

## 2. Importações

Toda importação deve ser explicada. Agrupe os imports por origem e coloque um comentário acima de cada grupo (ou acima de cada import, se forem poucos) dizendo:

- de onde vem (biblioteca externa, módulo interno do projeto, arquivo de configuração);
- o que cada item importado é (função, classe, tipo, modelo, constante);
- para que é usado NESTE arquivo e em qual função principal.

```ts
// importações da biblioteca de banco de dados: prisma é o cliente usado para ler e gravar no PostgreSQL.
import { prisma } from "../lib/prisma";
// importações de utilitários internos: deleteImage remove um arquivo do storage de imagens (usada em deleteProductService).
import { deleteImage } from "../utils/storage";
```

Imports de tipos (`import type`) também são explicados, dizendo qual estrutura de dados descrevem.

## 3. Constantes, tipos, interfaces e variáveis de módulo

Toda constante, tipo, interface, enum ou variável declarada fora de funções recebe um comentário dizendo o que representa, o formato do valor, uma unidade quando houver (ms, bytes, itens) e por que aquele valor foi escolhido (ex.: `// limite máximo de mensagens por página: protege o banco de consultas gigantes`). Campos de interfaces e tipos importantes também recebem uma linha explicando seu significado.

## 4. Comentário de cada função (acima da declaração)

Estrutura obrigatória, nesta ordem:

1. **Frase de abertura**: "função responsável por [verbo no infinitivo] ..." (para rotas: "rota para [verbo] ..."; para hooks: "hook responsável por ..."), dizendo o que faz e o contexto relevante (admin, simulação, evento...). Funções depreciadas ou stubs dizem isso aqui.
2. **Linha de comentário vazia** (só o marcador de comentário).
3. **Contexto**: quando e por quem é chamada, e por que existe (uma ou duas linhas).
4. **parâmetros**: uma linha por parâmetro, no formato `nome (tipo, obrigatório | opcional, padrão X): o que representa, formato esperado, restrições e COMO é usado dentro da função`. Quando o parâmetro for um objeto, liste cada campo dele em sublinhas. Se a função não recebe parâmetros, escreva "nenhum".
5. **retorno**: tipo e formato do valor retornado, com o significado de cada campo se for objeto, e o que significa cada valor possível (ex.: `null` quando não encontrado). Se não retorna nada, diga o que ela faz no lugar (envia resposta HTTP, emite evento etc.).
6. **erros**: cada exceção lançada, com a condição que a dispara. Se não lança, escreva "nenhum".
7. **efeitos colaterais**: tudo que a função altera fora dela mesma (gravações e deleções no banco, eventos de socket ou mensageria, chamadas HTTP, arquivos, cache, logs, variáveis globais). Se for função pura, escreva "nenhum (função pura)".
8. **passo a passo**: lista numerada `1 - ...`, `2 - ...`, em ordem real de execução (regras na seção 5).

```
// função responsável por <objetivo>.
//
// contexto: <quando e por quem é chamada, por que existe>.
//
// parâmetros:
//   - nome (tipo, obrigatório): <o que é, formato, restrições e como é usado>.
//   - opcoes (objeto, opcional): <o que é>.
//       - opcoes.campo (tipo, padrão X): <o que é e como é usado>.
//
// retorno: <tipo e formato, significado de cada campo>.
// erros: <Exceção> quando <condição>.
// efeitos colaterais: <o que muda fora da função>.
//
// passo a passo:
// 1 - recebe nome (tipo) e opcoes (objeto opcional).
// 2 - ...
// N - retorna <o quê>.
```

Funções triviais (uma linha, sem ramificações): frase de abertura, parâmetros, retorno e passos curtos, mas ainda com cada parâmetro explicado.

## 5. Regras da lista de passos

- Os passos refletem TUDO o que o código faz, na ordem em que acontece: validações, normalizações, consultas, regras de negócio, mutações, efeitos colaterais, chamadas externas, deleções, eventos enviados, tratamento de erro e ramificações. Nada fica de fora.
- Um passo = uma ação. Se houver duas ações ligadas por "e", separe em dois passos.
- Cada passo diz o que faz, com qual dado e qual o resultado ou consequência (ex.: "busca o chat filtrando por `participants`; se o usuário não pertencer, o resultado é `null`").
- Ramificações ficam explícitas com sub-numeração: `3a - se for grupo, ...`, `3b - se for chat 1-on-1, ...`.
- Toda saída antecipada (`return`, `throw`, `continue`, `break`) é citada no passo onde ocorre, dizendo a condição e o que o chamador recebe.
- Operações assíncronas que não bloqueiam o fluxo (sem `await`, `void`, `.catch(() => {})`) são sinalizadas, dizendo por que a falha é ignorada.
- Laços e iterações dizem sobre o quê iteram e o que fazem a cada volta.
- O primeiro passo descreve o recebimento dos parâmetros; o último descreve o retorno (ou o que é lançado ou enviado, se não retornar nada).
- Verbos na terceira pessoa do presente: recebe, valida, calcula, consulta, persiste, despacha, retorna.
- Cada passo termina com ponto final.
- Nomes técnicos ficam em inglês, exatamente como no código: funções, variáveis, tópicos, rotas, métodos, campos (ex.: `updateOrderStatusService`, `prisma.product.findUnique`, `'product.created'`, `GET /orders`).
- A frase de abertura e os passos começam em minúsculas, exceto nomes técnicos que tenham maiúsculas.

## 6. Funções extensas e comentários dentro do corpo

O comentário acima da função traz a visão geral completa. DENTRO do corpo, o código também deve ser explicado, para que quem esteja lendo a linha 80 de uma função de 150 linhas não precise voltar ao topo.

### 6.1 Blocos numerados

- Cada bloco lógico começa com um comentário com a MESMA numeração do comentário principal: `// 3 - valida o objeto de imagens`.
- Blocos complexos usam subpassos: `// 3.1 - ...`, `// 3.2 - ...`.
- Separe cada bloco com uma linha em branco.
- Em funções com mais de ~25 linhas ou várias etapas, adicione separadores de seção: `// ===== passo 3: tratamento de chats em grupo =====`.
- Ao fim de seções longas, diga em que estado os dados ficaram: `// aqui: chat carregado e usuário validado como participante`.

### 6.2 O que comentar dentro do corpo

- **Condições (`if`, `switch`, ternários)**: explique a condição em linguagem de negócio, não em linguagem de código (ex.: `// só o criador pode excluir o grupo para todos; os demais apenas ocultam`).
- **Variáveis intermediárias importantes**: diga o que contêm, com formato e exemplo curto (ex.: `// lista de ids em string, ex.: ["64f1...", "64f2..."]`).
- **Consultas ao banco**: diga o que está sendo buscado, por qual filtro e o que significa o resultado vazio (ex.: `// retorna null se o chat não existir OU se o usuário não for participante`).
- **Mutações e efeitos colaterais**: gravações, deleções, emissões de eventos, chamadas externas, limpezas em segundo plano. Diga o que muda e quem será afetado.
- **Todo `return` e `throw`**: explique o motivo e o que o chamador recebe.
- **Laços**: o que está sendo percorrido e o que acontece a cada iteração.
- **Tratamento de erro (`try/catch`, `.catch`)**: o que pode falhar, o que acontece quando falha e por que a falha é tratada ou ignorada daquela forma.
- **Trechos não óbvios** (regex, cálculo, ordenação, limite, índice, workaround, valor mágico): explique o raciocínio com um exemplo de valores quando ajudar.
- **Nomes de operadores específicos de bibliotecas** (ex.: `$in`, `$ne`, `$all`, `$size` no MongoDB): diga o que fazem naquela consulta.
- Em funções que registram várias rotas, o comentário externo resume as rotas e CADA rota interna recebe seu próprio comentário completo no mesmo formato da seção 4. Nenhuma rota fica sem comentário.

## 7. Estilo dos comentários inline

- Escreva em português, misturando nomes técnicos em inglês exatamente como no código.
- Comentários curtos sobre ações simples: minúsculas, sem ponto final (ex.: `// valida se colors é um array não vazio`).
- Comentários que explicam regra de negócio, decisão, workaround ou efeito colateral: frases completas, com maiúscula inicial e ponto final, explicando o PORQUÊ.
- Não comente o puramente óbvio (`i++`, `return x` sem regra por trás). Em toda dúvida entre comentar ou não, comente, desde que acrescente informação que o código não mostra.
- Nunca escreva comentários em inglês. Se encontrar algum nos trechos que você está editando, traduza para este padrão.

## 8. Adaptação por linguagem

Use o estilo de comentário nativo: `//` e `/** */` (JS/TS/Java/Go...), `#` (shell, YAML, Ruby), docstring em Python. Em Python, a docstring contém o mesmo conteúdo (abertura, contexto, parâmetros, retorno, erros, efeitos colaterais e passos), e os comentários inline usam `#`. Em linguagens com tipos documentáveis (TSDoc, JSDoc, Javadoc), pode-se usar as tags nativas (`@param`, `@returns`, `@throws`) desde que o conteúdo exigido aqui esteja presente. Preserve a indentação e o estilo do arquivo.

## 9. Restrições

- Ao apenas documentar, não altere código executável (nem formatação, nomes ou ordem de imports).
- Se notar bug, comportamento suspeito ou código morto fora do escopo da tarefa, não corrija por conta própria: avise no chat ao final da resposta, citando função e linha.
- Não remova comentários que expliquem decisões importantes; reescreva-os no padrão.
- Não documente comportamento que o código não tem. Se algo for ambíguo, descreva o que o código faz e sinalize a dúvida no chat.

## 10. Checklist antes de finalizar (obrigatório)

Para o arquivo:

- [ ] cabeçalho existe e está atual;
- [ ] todas as importações estão explicadas (origem, o que é, para que serve aqui);
- [ ] constantes, tipos e interfaces estão explicados.

Para cada função criada ou alterada:

- [ ] tem frase de abertura, linha vazia, contexto, parâmetros, retorno, erros, efeitos colaterais e passo a passo;
- [ ] cada parâmetro está descrito com tipo, obrigatoriedade, formato e uso dentro da função;
- [ ] os passos cobrem tudo o que o código faz, inclusive ramificações e saídas antecipadas;
- [ ] o passo 1 trata do recebimento dos parâmetros e o último do retorno;
- [ ] funções longas têm blocos inline com a mesma numeração do topo;
- [ ] todo `if`, `return`, `throw`, laço, consulta e efeito colateral do corpo tem explicação do porquê;
- [ ] comentários inline estão em português e seguem a seção 7;
- [ ] uma pessoa que não conhece o projeto entende o fluxo só lendo os comentários.

Se algum item falhar, corrija antes de responder.

## Exemplo completo

```ts
// arquivo responsável por implementar as regras de negócio de produtos (criação, remoção e consulta).
// atua na camada de serviços do backend, entre as rotas HTTP e o banco de dados.
// tecnologias principais: Prisma (PostgreSQL) e Kafka (mensageria entre serviços).
// usado por: product.routes.ts, que chama cada service a partir dos endpoints /products.

// cliente do Prisma já configurado: é por ele que todas as consultas ao PostgreSQL são feitas neste arquivo.
import { prisma } from "../lib/prisma";
// producer do Kafka: usado para avisar outros serviços (ex.: estoque, busca) quando um produto muda.
import { producer } from "../lib/kafka";
// deleteImage remove um arquivo do storage de imagens pela URL; usada em deleteProductService.
import { deleteImage } from "../utils/storage";

// tópico do Kafka para o qual o evento de produto deletado é enviado; os consumidores assinam este mesmo nome.
const PRODUCT_DELETED_TOPIC = "product.deleted";

// função responsável por apagar o produto de forma definitiva, remover suas imagens e propagar o evento.
//
// contexto: chamada pela rota DELETE /products/:id, que só administradores acessam.
//
// parâmetros:
//   - id (number, obrigatório): identificador numérico do produto na tabela product; usado como filtro
//     na busca e na deleção, e como payload do evento enviado ao Kafka.
//
// retorno: objeto com o registro do produto que foi apagado (todos os campos da tabela product).
// erros: erro do Prisma (P2025) quando nenhum produto com esse id existe no momento da deleção.
// efeitos colaterais: apaga imagens no storage, remove a linha no banco e publica 'product.deleted' no Kafka.
//
// passo a passo:
// 1 - recebe o id numérico do produto (number).
// 2 - busca o produto no banco via prisma.product.findUnique para saber quais imagens precisam ser removidas.
// 3 - se o produto existir e tiver imageUrl, apaga a imagem principal usando deleteImage.
// 4 - se o produto tiver o objeto images, percorre cada URL por cor e apaga cada imagem usando deleteImage.
// 5 - efetiva a deleção do produto via prisma.product.delete.
// 6 - envia o evento 'product.deleted' ao Kafka passando o id afetado.
// 7 - retorna o registro do produto que foi deletado.
export const deleteProductService = async (id: number) => {
  // 2 - busca o produto antes de deletar, pois depois da deleção não sobra nenhuma referência às URLs das imagens.
  // retorna null se o id não existir; nesse caso as etapas de imagem são puladas e o erro vem do passo 5.
  const product = await prisma.product.findUnique({ where: { id } });

  if (product) {
    // 3 - remove a imagem principal, se houver; produtos antigos podem não ter imageUrl.
    if (product.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    // 4 - remove as imagens por cor, guardadas como { "vermelho": "https://...", "azul": "https://..." }.
    // o typeof protege contra o campo vir null ou com outro formato.
    if (product.images && typeof product.images === "object") {
      // a cada volta apaga uma URL; é sequencial (await) para não sobrecarregar o storage com muitas requisições juntas.
      for (const url of Object.values(product.images as Record<string, string>)) {
        await deleteImage(url);
      }
    }
  }

  // 5 - deleta o registro no banco; lança erro do Prisma se o id não existir, e o erro sobe para o chamador.
  const deletedProduct = await prisma.product.delete({ where: { id } });

  // 6 - notifica os outros serviços sobre a deleção, para que removam o produto de seus próprios dados.
  // não há await: a falha de envio não impede a resposta ao usuário, pois o produto já foi apagado.
  producer.send(PRODUCT_DELETED_TOPIC, { value: id });

  // 7 - devolve o produto deletado para a rota montar a resposta HTTP.
  return deletedProduct;
};
```
