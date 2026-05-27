# Backend API - ProjetoBoer

## 1) Configurar
- Entre na pasta `backend`
- Copie `.env.example` para `.env`
- Preencha `API_TOKEN`
- Coloque o arquivo de credencial do Firebase Admin em `backend/serviceAccountKey.json`

## 2) Instalar e rodar
```bash
cd backend
npm install
npm run dev
```

Servidor: `http://localhost:3333`

## 3) Autenticacao
Use um destes headers:
- `x-api-token: SEU_TOKEN`
- ou `Authorization: Bearer SEU_TOKEN`

## 4) Endpoints CRUD Produtos

### Listar produtos
`GET /api/products`

### Buscar produto por id
`GET /api/products/:id`

### Cadastrar produto
`POST /api/products`

Payload JSON simples:
```json
{
  "name": "Bolo de Cenoura",
  "price": 29.9,
  "category": "Doces",
  "imageUrl": "https://...",
  "costPrice": 15,
  "description": "Bolo caseiro",
  "marginPercent": 99.33
}
```

### Editar produto
`PUT /api/products/:id`

Payload JSON simples:
```json
{
  "name": "Bolo de Cenoura Premium",
  "price": 34.9,
  "category": "Doces",
  "imageUrl": "https://...",
  "costPrice": 17,
  "description": "Com cobertura",
  "marginPercent": 105.29
}
```

### Excluir produto
`DELETE /api/products/:id`

## 5) Teste rapido com cURL
```bash
curl -H "x-api-token: SEU_TOKEN" http://localhost:3333/api/products
```
