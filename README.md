# projetoBoer

Aplicativo em Expo/React Native com backend Node.js e Firebase para cadastro, listagem, edicao e exclusao de produtos.

## API no Postman

A colecao do Postman desta API esta versionada no repositorio e pode ser importada diretamente:

- Arquivo da colecao: [postman/API-BOER.postman_collection.json](postman/API-BOER.postman_collection.json)
- Opcao para baixar e importar no Postman: abra o arquivo no GitHub e use `Download raw file` ou copie o JSON bruto para importar manualmente

### Como importar

1. Abra o Postman.
2. Clique em `Import`.
3. Escolha o arquivo [postman/API-BOER.postman_collection.json](postman/API-BOER.postman_collection.json).
4. Importe a colecao `API BOER`.

Tambem e possivel abrir o JSON bruto, copiar o conteudo e importar no Postman pela opcao de texto bruto.

## Como rodar o projeto

### App mobile/web

```bash
npm install
npm run web
```

### Backend

```bash
cd backend
npm install
npm run dev
```

O backend sobe por padrao em `http://localhost:3333`.

## Configuracao do backend

Crie um arquivo `.env` dentro de `backend/` com os dados necessarios:

```env
PORT=3333
API_TOKEN=teste123
FIREBASE_DATABASE_URL=sua_url_do_firebase
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Importante:

- O valor de `API_TOKEN` precisa bater com o token enviado na colecao do Postman.
- O arquivo `serviceAccountKey.json` deve existir em `backend/` ou o caminho deve ser ajustado na variavel `GOOGLE_APPLICATION_CREDENTIALS`.

## Como usar a colecao

Todas as rotas protegidas usam o header abaixo:

```http
x-api-token: teste123
```

Base URL:

```text
http://localhost:3333
```

### Endpoints incluidos

| Nome no Postman | Metodo | Rota | Descricao |
| --- | --- | --- | --- |
| `listaProdutos` | `GET` | `/api/products` | Lista todos os produtos |
| `listaProdutoID` | `GET` | `/api/products/:id` | Busca um produto por ID |
| `cadastraProduto` | `POST` | `/api/products` | Cadastra um novo produto |
| `alteraProduto` | `PUT` | `/api/products/:id` | Atualiza um produto existente |
| `deletaProduto` | `DELETE` | `/api/products/:id` | Remove um produto |
| `health` | `GET` | `/health` | Verifica se o backend esta online |

## Exemplo de payload

Para criar ou editar um produto, a colecao usa um JSON neste formato:

```json
{
  "name": "Bolo de Cenoura",
  "price": 29.9,
  "category": "Doces",
  "imageUrl": "https://exemplo.com/bolo.jpg",
  "costPrice": 15.0,
  "description": "Bolo caseiro",
  "marginPercent": 99.33
}
```

## Observacoes de uso

- Nas rotas com `SEU_ID_AQUI`, substitua pelo ID real do produto antes de enviar a requisicao.
- Se quiser compartilhar a API com outra pessoa, basta enviar o arquivo da colecao que esta em `postman/API-BOER.postman_collection.json`.
- Quem receber o arquivo pode importar normalmente no Postman sem precisar montar as requisicoes manualmente.
