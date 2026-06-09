# projetoBoer

Aplicativo em Expo/React Native com backend Node.js e Firebase para cadastro, listagem, edicao e exclusao de produtos.

## API no Postman

A colecao do Postman desta API esta versionada no repositorio e pode ser importada diretamente:

- Arquivo da colecao: [postman/API-BOER.postman_collection.json](postman/API-BOER.postman_collection.json)
- Quem quiser pode baixar o arquivo no GitHub, copiar o JSON bruto e importar manualmente no Postman

### Como importar

1. Abra o Postman.
2. Clique em `Import`.
3. Escolha o arquivo [postman/API-BOER.postman_collection.json](postman/API-BOER.postman_collection.json).
4. Importe a colecao `API BOER`.

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

Crie um arquivo `.env` dentro de `backend/` com os dados abaixo e preencha com as suas configuracoes:

```env
PORT=3333
API_TOKEN=PREENCHA_O_TOKEN_DA_API
FIREBASE_DATABASE_URL=PREENCHA_A_URL_DO_FIREBASE
GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json
```

Preencha tambem o arquivo [src/services/connectionFirebase.ts](src/services/connectionFirebase.ts) com os dados do seu projeto Firebase.

Importante:

- Nao deixe credenciais reais versionadas no repositorio.
- O valor de `API_TOKEN` deve ser o mesmo usado nas requisicoes.
- O arquivo `serviceAccountKey.json` deve existir em `backend/` ou o caminho deve ser ajustado na variavel `GOOGLE_APPLICATION_CREDENTIALS`.

## Endpoints da API

### Listar produtos

GET: `http://localhost:3333/api/products`

HEADER: `x-api-token: VALOR`

### Buscar produto por ID

GET: `http://localhost:3333/api/products/SEU_ID_AQUI`

HEADER: `x-api-token: VALOR`

### Cadastrar produto

POST: `http://localhost:3333/api/products`

HEADER: `x-api-token: VALOR`

BODY:

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

### Atualizar produto

PUT: `http://localhost:3333/api/products/SEU_ID_AQUI`

HEADER: `x-api-token: VALOR`

BODY:

```json
{
  "name": "Bolo de Cenoura Premium",
  "price": 34.9,
  "category": "Doces",
  "imageUrl": "https://exemplo.com/bolo-premium.jpg",
  "costPrice": 17.0,
  "description": "Com cobertura especial",
  "marginPercent": 105.29
}
```

### Excluir produto

DELETE: `http://localhost:3333/api/products/SEU_ID_AQUI`

HEADER: `x-api-token: VALOR`

### Health check

GET: `http://localhost:3333/health`

HEADER: `nao obrigatorio`

## Observacoes

- Nas rotas com `SEU_ID_AQUI`, substitua pelo ID real do produto antes de enviar a requisicao.
- O endpoint `/health` existe para verificar se o backend esta online.
- Se quiser compartilhar a API com outra pessoa, basta enviar o arquivo da colecao em `postman/API-BOER.postman_collection.json`.
- Quem receber o arquivo pode importar normalmente no Postman sem precisar montar as requisicoes manualmente.
