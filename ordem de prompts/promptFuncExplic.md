# Regra obrigatória: documentação de funções

Esta regra é OBRIGATÓRIA e vale para TODA função que você criar, modificar ou documentar, em qualquer arquivo, linguagem ou tarefa, mesmo que o usuário não peça documentação. Nenhuma função pode ser entregue sem o comentário no padrão abaixo. Se a tarefa for pequena (um "ajuste rápido"), a regra continua valendo.

## Quando aplicar

- **Criar função**: escreva o comentário junto com a função, na mesma edição. Nunca deixe para depois.
- **Modificar função**: atualize o comentário na MESMA edição, para que a lista de passos reflita o código novo. Comentário desatualizado é considerado erro.
- **Documentar código existente**: aplique o padrão apenas nas funções pedidas ou afetadas. Não reescreva comentários nem código de partes não relacionadas à tarefa.
- **Quais funções**: todas as nomeadas: exportadas, internas, handlers, rotas, métodos, hooks, services, utilitários. Funções anônimas passadas como argumento (ex.: `.map(x => ...)`) ficam isentas, a menos que tenham lógica complexa (mais de ~5 linhas ou ramificações).
- **Arquivo novo**: escreva também o cabeçalho do arquivo (seção 1).

## 1. Cabeçalho do arquivo

No topo do arquivo, antes dos imports, um comentário de 2 a 3 linhas começando com "arquivo responsável por ...", dizendo o que o arquivo faz, a camada em que atua (rotas, serviço, utilitário...) e as tecnologias principais (ex.: Fastify, Prisma, Kafka). Ao modificar um arquivo, atualize o cabeçalho se a responsabilidade mudar.

## 2. Comentário de cada função

Logo acima da declaração, sempre com três partes:

1. **Frase de abertura**: "função responsável por [verbo no infinitivo] ..." (para rotas: "rota para [verbo] ..."), dizendo o que faz e o contexto relevante (admin, simulação, evento...).
2. **Linha de comentário vazia** (só o marcador de comentário).
3. **Lista numerada** `1 - ...`, `2 - ...`, em ordem de execução:
   - o passo 1 descreve os parâmetros: "recebe X (tipo), Y (tipo) e Z (opcional)", dizendo o que cada um representa e o que se espera dele;
   - os passos do meio descrevem o que é feito, uma ação por passo;
   - o último passo descreve o que a função retorna (ou lança, ou envia, se não retornar nada).

## 3. Regras da lista de passos

- Os passos devem refletir TUDO o que o código faz: validações, efeitos colaterais, chamadas externas, deleções, eventos enviados, tratamento de erro e ramificações (if/else, switch). Nada fica de fora.
- Não invente comportamento: descreva só o que o código realmente faz.
- Um passo = uma ação. Se houver duas ações ligadas por "e", separe em dois passos.
- Verbos na terceira pessoa do presente: recebe, valida, calcula, consulta, persiste, despacha, retorna.
- Cada passo termina com ponto final.
- Nomes técnicos ficam em inglês, exatamente como no código: funções, variáveis, tópicos, rotas, métodos (ex.: `updateOrderStatusService`, `prisma.product.findUnique`, `'product.created'`, `GET /orders`).
- A frase de abertura e os passos começam em minúsculas, exceto nomes técnicos que tenham maiúsculas.
- Função trivial (uma linha, sem ramificações): frase de abertura mais uma lista curta com os passos "recebe" e "retorna".
- Função depreciada ou stub: diga isso na frase de abertura.

## 4. Funções extensas

Se a função tiver mais de ~25 linhas ou várias etapas distintas, quebre-a em blocos lógicos:

- O comentário acima da função traz a visão geral completa (abertura + lista numerada).
- No corpo, separe cada bloco com uma linha em branco e um comentário inline com a MESMA numeração do comentário principal. Ex.: `// 3 - valida o objeto de imagens`.
- Em blocos complexos, adicione subpassos: `// 3.1 - ...`.
- Em funções que registram várias rotas, o comentário externo resume as rotas e CADA rota interna recebe seu próprio comentário completo no mesmo formato. Nenhuma rota fica sem comentário.

## 5. Comentários inline

- Português, minúsculas, curtos, sem ponto final, misturados com nomes de variáveis e funções em inglês exatamente como no código. Ex.: `// valida se colors é um array não vazio`.
- Exceção: em trechos complexos (regra de negócio não óbvia, regex, cálculo, workaround, efeito colateral sutil), use frases completas, com maiúscula inicial e ponto final, explicando o PORQUÊ.
- Não comente o óbvio. Comente intenção, regra de negócio, validação, efeito colateral e decisões não evidentes.
- Nunca escreva comentários em inglês. Se encontrar algum nos trechos que você está editando, traduza para este padrão.

## 6. Adaptação por linguagem

Use o estilo de comentário nativo (`//`, `#`, `/** */`). Em Python, use docstring com o mesmo conteúdo (abertura, parâmetros, passos, retorno). Preserve a indentação e o estilo do arquivo.

## 7. Restrições

- Ao apenas documentar, não altere código executável.
- Se notar bug ou comportamento suspeito fora do escopo da tarefa, não corrija por conta própria: avise no chat ao final da resposta.
- Não remova comentários que expliquem decisões importantes; reescreva-os no padrão.

## 8. Checklist antes de finalizar (obrigatório)

Antes de dar a tarefa por concluída, confira para cada função criada ou alterada:

- [ ] tem comentário com frase de abertura, linha vazia e lista numerada;
- [ ] o passo 1 lista os parâmetros e o último descreve o retorno;
- [ ] os passos cobrem tudo o que o código faz, inclusive o que foi alterado agora;
- [ ] funções longas estão quebradas em blocos com numeração correspondente;
- [ ] comentários inline estão em português e minúsculos (salvo exceção de complexidade);
- [ ] o cabeçalho do arquivo existe e está atual.

Se algum item falhar, corrija antes de responder.

## Exemplo

```ts
// função responsável por apagar o produto de forma definitiva, remover suas imagens e propagar o evento.
//
// 1 - recebe o id numérico do produto (number).
// 2 - busca o produto no banco via prisma.product.findUnique.
// 3 - se o produto existir, apaga a imagem principal (imageUrl) usando deleteImage.
// 4 - se o produto tiver o objeto images, apaga cada imagem por cor usando deleteImage.
// 5 - efetiva a deleção do produto via prisma.product.delete.
// 6 - envia o evento 'product.deleted' ao Kafka passando o id afetado.
// 7 - retorna o registro do produto que foi deletado.
export const deleteProductService = async (id: number) => {
  // 2 - busca o produto antes de deletar, para saber quais imagens remover
  const product = await prisma.product.findUnique({ where: { id } });

  if (product) {
    // 3 - remove a imagem principal
    if (product.imageUrl) {
      await deleteImage(product.imageUrl);
    }

    // 4 - remove as imagens por cor, guardadas como { color: url }
    if (product.images && typeof product.images === "object") {
      for (const url of Object.values(product.images as Record<string, string>)) {
        await deleteImage(url);
      }
    }
  }

  // 5 - deleta o registro no banco
  const deletedProduct = await prisma.product.delete({ where: { id } });

  // 6 - notifica os outros serviços sobre a deleção
  producer.send("product.deleted", { value: id });

  // 7 - devolve o produto deletado
  return deletedProduct;
};
```