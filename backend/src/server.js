require("dotenv").config();
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT || 3333);
const API_TOKEN = process.env.API_TOKEN;

if (!API_TOKEN) {
  throw new Error("API_TOKEN nao configurado no .env");
}

if (!admin.apps.length) {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./serviceAccountKey.json";
  const resolvedCredentialsPath = path.resolve(process.cwd(), credentialsPath);

  if (!fs.existsSync(resolvedCredentialsPath)) {
    throw new Error(
      `Arquivo de credencial nao encontrado em: ${resolvedCredentialsPath}. ` +
        "Defina GOOGLE_APPLICATION_CREDENTIALS no .env apontando para o JSON da conta de servico."
    );
  }

  const serviceAccount = JSON.parse(fs.readFileSync(resolvedCredentialsPath, "utf-8"));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
  });
}

const db = admin.database();
const productsRef = db.ref("products");

app.use(cors());
app.use(express.json());

function authTokenMiddleware(req, res, next) {
  const headerToken = req.headers["x-api-token"];
  const authHeader = req.headers.authorization || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  const token = headerToken || bearerToken;

  if (!token || token !== API_TOKEN) {
    return res.status(401).json({ ok: false, message: "Token invalido ou ausente." });
  }

  next();
}

function mapProduct(id, data) {
  return {
    id,
    name: data?.name || "",
    price: Number(data?.price || 0),
    category: data?.category || "",
    imageUrl: data?.imageUrl || "",
    costPrice: Number(data?.costPrice || 0),
    description: data?.description || "",
    marginPercent: Number(data?.marginPercent || 0),
    createdAt: data?.createdAt || null,
    updatedAt: data?.updatedAt || null,
  };
}

async function withTimeout(promise, ms = 10000) {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("FIREBASE_TIMEOUT")), ms);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "projetoboer-backend" });
});

app.use("/api", authTokenMiddleware);

app.get("/api/products", async (req, res) => {
  try {
    const snapshot = await withTimeout(productsRef.get());
    const data = snapshot.val() || {};

    const products = Object.keys(data)
      .map((id) => mapProduct(id, data[id]))
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

    return res.json({ ok: true, data: products });
  } catch (error) {
    if (error?.message === "FIREBASE_TIMEOUT") {
      return res.status(504).json({ ok: false, message: "Timeout ao consultar Firebase." });
    }
    return res.status(500).json({ ok: false, message: "Erro ao listar produtos." });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await withTimeout(productsRef.child(id).get());

    if (!snapshot.exists()) {
      return res.status(404).json({ ok: false, message: "Produto nao encontrado." });
    }

    return res.json({ ok: true, data: mapProduct(id, snapshot.val()) });
  } catch {
    return res.status(500).json({ ok: false, message: "Erro ao buscar produto." });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, price, category = "", imageUrl = "", costPrice = 0, description = "", marginPercent = 0 } = req.body || {};

    if (!name || Number(price) <= 0) {
      return res.status(400).json({ ok: false, message: "Payload invalido. name e price sao obrigatorios." });
    }

    const payload = {
      name: String(name).trim(),
      price: Number(price),
      category: String(category || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      costPrice: Number(costPrice || 0),
      description: String(description || "").trim(),
      marginPercent: Number(marginPercent || 0),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const newRef = productsRef.push();
    await withTimeout(newRef.set(payload));

    return res.status(201).json({ ok: true, data: mapProduct(newRef.key, payload) });
  } catch {
    return res.status(500).json({ ok: false, message: "Erro ao cadastrar produto." });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category = "", imageUrl = "", costPrice = 0, description = "", marginPercent = 0 } = req.body || {};

    if (!name || Number(price) <= 0) {
      return res.status(400).json({ ok: false, message: "Payload invalido. name e price sao obrigatorios." });
    }

    const productNode = productsRef.child(id);
    const current = await withTimeout(productNode.get());

    if (!current.exists()) {
      return res.status(404).json({ ok: false, message: "Produto nao encontrado." });
    }

    const payload = {
      name: String(name).trim(),
      price: Number(price),
      category: String(category || "").trim(),
      imageUrl: String(imageUrl || "").trim(),
      costPrice: Number(costPrice || 0),
      description: String(description || "").trim(),
      marginPercent: Number(marginPercent || 0),
      updatedAt: new Date().toISOString(),
    };

    await withTimeout(productNode.update(payload));
    const updatedSnapshot = await withTimeout(productNode.get());

    return res.json({ ok: true, data: mapProduct(id, updatedSnapshot.val()) });
  } catch {
    return res.status(500).json({ ok: false, message: "Erro ao editar produto." });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productNode = productsRef.child(id);
    const current = await withTimeout(productNode.get());

    if (!current.exists()) {
      return res.status(404).json({ ok: false, message: "Produto nao encontrado." });
    }

    await withTimeout(productNode.remove());
    return res.json({ ok: true, message: "Produto excluido com sucesso." });
  } catch {
    return res.status(500).json({ ok: false, message: "Erro ao excluir produto." });
  }
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
