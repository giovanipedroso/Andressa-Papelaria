import "dotenv/config";
import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import { AppSchema } from "./src/types.js"; // note: Vite & Node resolution

const app = express();
const PORT = 3000;
const DB_FILE = path.join(process.cwd(), "database.json");

app.use(express.json());

// Seed data to make the experience complete right away
const defaultData: AppSchema = {
  stock: [
    {
      id: "STK-101",
      name: "Papel Glossy Fotográfico 180g (A4)",
      category: "Papel",
      quantity: 120,
      unit: "folhas",
      minQuantity: 20,
      unitCost: 1.5,
      updatedAt: "2026-06-12",
    },
    {
      id: "STK-102",
      name: "Papel Mate Fosco 230g (A4)",
      category: "Papel",
      quantity: 80,
      unit: "folhas",
      minQuantity: 15,
      unitCost: 1.8,
      updatedAt: "2026-06-11",
    },
    {
      id: "STK-103",
      name: "Fita de Cetim Rosa Bebê 15mm",
      category: "Fita",
      quantity: 45,
      unit: "metros",
      minQuantity: 10,
      unitCost: 0.8,
      updatedAt: "2026-06-12",
    },
    {
      id: "STK-104",
      name: "Fita de Cetim Azul Marinho 15mm",
      category: "Fita",
      quantity: 50,
      unit: "metros",
      minQuantity: 10,
      unitCost: 0.8,
      updatedAt: "2026-06-10",
    },
    {
      id: "STK-105",
      name: "Fita Dupla Face FixaFácil",
      category: "Cola",
      quantity: 5,
      unit: "rolos",
      minQuantity: 2,
      unitCost: 12.0,
      updatedAt: "2026-06-08",
    },
    {
      id: "STK-106",
      name: "Tintas Epson L8050 Kit (6 cores)",
      category: "Impressão",
      quantity: 1,
      unit: "kit",
      minQuantity: 1,
      unitCost: 220.0,
      updatedAt: "2026-06-01",
    },
    {
      id: "STK-107",
      name: "Embalagem Padrão Caixas Grandes",
      category: "Embalagem",
      quantity: 35,
      unit: "unidades",
      minQuantity: 10,
      unitCost: 3.5,
      updatedAt: "2026-06-10",
    },
  ],
  customers: [
    {
      id: "CLI-1",
      name: "Mariana Souza",
      phone: "(11) 99999-1111",
      email: "mariana@email.com",
      address: "Rua das Flores, 123 - Jardins, São Paulo - SP",
      createdAt: "2026-06-10",
      notes: "Prefere papéis foscos de alta gramatura. Tema de preferência para o filho: Fundo do Mar.",
    },
    {
      id: "CLI-2",
      name: "Carlos Eduardo Santos",
      phone: "(11) 98888-2222",
      email: "carlos@email.com",
      address: "Av. Paulista, 1500 - Bela Vista, São Paulo - SP",
      createdAt: "2026-06-08",
      notes: "Sempre pede cardápios corporativos e de batizado. Gosta de papéis rústicos e papel vegetal.",
    },
    {
      id: "CLI-3",
      name: "Juliana Mendes",
      phone: "(21) 97777-3333",
      email: "juliana@email.com",
      address: "Rua Copacabana, 450 - Copacabana, Rio de Janeiro - RJ",
      createdAt: "2026-06-05",
      notes: "Pede etiquetas autoadesivas redondas frequentemente para seus potes de doce gourmet.",
    },
  ],
  orders: [
    {
      id: "PED-1001",
      customerId: "CLI-1",
      customerName: "Mariana Souza",
      productType: "Caixinha",
      details: "30 caixinhas milk personalizadas, Tema 'Fundo do Mar', nome 'Pedro - 3 anos', com fitas de cetim rosa bebê.",
      quantity: 30,
      totalPrice: 350.0,
      paidAmount: 175.0,
      status: "Em Produção",
      orderDate: "2026-06-10",
      deliveryDate: "2026-06-25",
      notes: "Sinal de 50% pago. Restante na entrega.",
      trackingHistory: [
        { status: "Aguardando Início", changedAt: "2026-06-10 14:30", note: "Pedido recebido e sinal confirmado." },
        { status: "Em Produção", changedAt: "2026-06-12 09:15", note: "Impressão dos moldes e corte iniciados." },
      ],
    },
    {
      id: "PED-1002",
      customerId: "CLI-2",
      customerName: "Carlos Eduardo Santos",
      productType: "Cardápio",
      details: "50 cardápios individuais personalizados modelo rústico, papel Kraft 200g e fechamento em fita de cetim azul marinho.",
      quantity: 50,
      totalPrice: 450.0,
      paidAmount: 450.0,
      status: "Montagem e Acabamento",
      orderDate: "2026-06-08",
      deliveryDate: "2026-06-18",
      notes: "Valor integral pago via Pix. Produção quase concluída.",
      trackingHistory: [
        { status: "Aguardando Início", changedAt: "2026-06-08 10:00", note: "Pedido registrado e comprovante validado." },
        { status: "Em Produção", changedAt: "2026-06-09 11:00", note: "Impressão do miolo em papel vegetal concluída." },
        { status: "Montagem e Acabamento", changedAt: "2026-06-12 16:00", note: "Dobradura e amarração das fitas de cetim." },
      ],
    },
    {
      id: "PED-1003",
      customerId: "CLI-3",
      customerName: "Juliana Mendes",
      productType: "Etiqueta",
      details: "150 etiquetas adesivas redondas (5x5cm) para potes gourmets, brilho resistente à água.",
      quantity: 150,
      totalPrice: 120.0,
      paidAmount: 120.0,
      status: "Concluído",
      orderDate: "2026-06-05",
      deliveryDate: "2026-06-12",
      notes: "Entregar via portador ou retirada.",
      trackingHistory: [
        { status: "Aguardando Início", changedAt: "2026-06-05 09:00", note: "Pedido criado." },
        { status: "Em Produção", changedAt: "2026-06-06 14:00", note: "Impressão na plotter." },
        { status: "Concluído", changedAt: "2026-06-11 11:30", note: "Pacote finalizado e pronto para retirada!" },
      ],
    },
  ],
  quotes: [
    {
      id: "ORC-2001",
      customerName: "Patrícia Lima",
      customerPhone: "(21) 96666-4444",
      customerEmail: "patricia@email.com",
      items: [
        { description: "Caixinha Milk modelo pirâmide (Tema Jardim das Borboletas)", quantity: 40, unitPrice: 6.0, subtotal: 240.0 },
      ],
      discount: 0,
      total: 240.0,
      status: "Pendente",
      createdAt: "2026-06-12",
      expiryDate: "2026-06-25",
      notes: "Cliente analisando orçamento.",
    },
    {
      id: "ORC-2002",
      customerName: "Amanda Ferreira",
      customerPhone: "(11) 95555-5555",
      customerEmail: "amanda@ferreira.com",
      items: [
        { description: "Etiqueta autocolante vinil de alta duração", quantity: 200, unitPrice: 0.8, subtotal: 160.0 },
        { description: "Cardápios individuais para batizado", quantity: 30, unitPrice: 5.0, subtotal: 150.0 },
      ],
      discount: 10.0,
      total: 300.0,
      status: "Aprovado",
      createdAt: "2026-06-08",
      expiryDate: "2026-06-18",
      notes: "Aprovado e já convertido no pedido PED-1004.",
    },
  ],
  finance: [
    {
      id: "FIN-301",
      type: "receita",
      category: "Venda de Pedido",
      amount: 175.0,
      date: "2026-06-10",
      description: "Sinal de 50% PED-1001 - Mariana Souza",
      relatedId: "PED-1001",
    },
    {
      id: "FIN-302",
      type: "receita",
      category: "Venda de Pedido",
      amount: 450.0,
      date: "2026-06-08",
      description: "Pagamento integral PED-1002 - Carlos Eduardo Santos",
      relatedId: "PED-1002",
    },
    {
      id: "FIN-303",
      type: "receita",
      category: "Venda de Pedido",
      amount: 120.0,
      date: "2026-06-05",
      description: "Pagamento integral PED-1003 - Juliana Mendes",
      relatedId: "PED-1003",
    },
    {
      id: "FIN-304",
      type: "despesa",
      category: "Material de Estoque",
      amount: 80.0,
      date: "2026-06-03",
      description: "Papéis Glossy e Mate para estoque",
      relatedId: "STK-101",
    },
    {
      id: "FIN-305",
      type: "despesa",
      category: "Outros",
      amount: 45.0,
      date: "2026-06-04",
      description: "Fitas de cetim rosa e azul",
      relatedId: "STK-103",
    },
    {
      id: "FIN-306",
      type: "despesa",
      category: "Tintas",
      amount: 220.0,
      date: "2026-06-01",
      description: "Kit de Recarga Tintas Epson L8050 Original",
      relatedId: "STK-106",
    },
  ],
};

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || "";

let supabaseClient: any = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log("Supabase Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize Supabase Client:", err);
  }
} else {
  console.log("Supabase credentials not configured. Running with local database.json fallback.");
}

async function readDb(): Promise<{ data: AppSchema; provider: "supabase" | "local"; error?: string }> {
  if (supabaseClient) {
    try {
      const { data, error } = await supabaseClient
        .from("atelier_state")
        .select("data")
        .eq("id", "singleton")
        .single();

      if (error) {
        // Code PGRST116 means zero rows; 42P01 means table does not exist
        if (error.code === "PGRST116" || error.code === "42P01" || error.message?.includes("does not exist")) {
          console.log("Row 'singleton' or table 'atelier_state' not found in Supabase. Attempting auto-seed...");
          try {
            await writeSupabase(defaultData);
            return { data: defaultData, provider: "supabase" };
          } catch (seedErr: any) {
            console.warn("Could not auto-seed Supabase database:", seedErr.message || seedErr);
            return { data: readLocalDb(), provider: "local", error: `Erro no Supabase (${seedErr.message || seedErr}). Certifique-se de criar a tabela 'atelier_state' no Supabase.` };
          }
        }
        throw error;
      }

      if (data && data.data) {
        return { data: data.data as AppSchema, provider: "supabase" };
      }
    } catch (err: any) {
      console.error("Error reading from Supabase. Falling back to local database.json:", err.message || err);
      return { data: readLocalDb(), provider: "local", error: `Erro de conexão Supabase: ${err.message || err}` };
    }
  }

  return { data: readLocalDb(), provider: "local" };
}

async function writeDb(data: AppSchema): Promise<{ success: boolean; provider: "supabase" | "local"; error?: string }> {
  // Direct backup write locally
  writeLocalDb(data);

  if (supabaseClient) {
    try {
      await writeSupabase(data);
      return { success: true, provider: "supabase" };
    } catch (err: any) {
      console.error("Error writing to Supabase:", err.message || err);
      return { success: false, provider: "local", error: `Erro de escrita Supabase: ${err.message || err}` };
    }
  }

  return { success: true, provider: "local" };
}

async function writeSupabase(data: AppSchema): Promise<boolean> {
  if (!supabaseClient) return false;
  const { error } = await supabaseClient
    .from("atelier_state")
    .upsert({ id: "singleton", data: data, updated_at: new Date().toISOString() });

  if (error) {
    console.error("Supabase upsert failed:", error);
    throw error;
  }
  return true;
}

function readLocalDb(): AppSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), "utf-8");
      return defaultData;
    }
    const content = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    console.error("Erro ao carregar banco de dados local:", error);
    return defaultData;
  }
}

function writeLocalDb(data: AppSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Erro ao salvar no banco de dados local:", error);
  }
}

// Ensure database file is initialized at startup
readLocalDb();

// Authentication middleware check (Bearer tokens)
const validateAndressaToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || authHeader !== "Bearer andressa-session-token-140418") {
    res.status(401).json({ error: "Acesso negado. Token de autenticação inválido ou ausente." });
    return;
  }
  next();
};

// --- AUTH ENDPOINTS ---
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username &&
    username.trim().toLowerCase() === "andressa" &&
    password === "140418"
  ) {
    res.json({
      success: true,
      token: "andressa-session-token-140418",
      user: { name: "Andressa", role: "Manager" },
    });
  } else {
    res.status(401).json({
      success: false,
      error: "Usuário ou senha inválidos. Tente novamente.",
    });
  }
});

// --- PUBLIC TRACKING ENDPOINT ---
// Clients can check their individual order status with any PED-XXXX order code without logging in
app.get("/api/orders/track/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const dbResult = await readDb();
  const db = dbResult.data;
  
  const searchId = orderId.toUpperCase().trim();
  const order = db.orders.find(
    (o) => o.id === searchId || o.id.replace("PED-", "") === searchId
  );

  if (!order) {
    res.status(404).json({
      success: false,
      error: "Pedido não encontrado. Verifique o número e tente novamente.",
    });
    return;
  }

  // To respect privacy, we can mask the client phone/email, but return active status, visual history, product type, details and delivery date
  const maskedName = order.customerName.split(" ").map((word, i) => {
     if (i === 0) return word;
     return word[0] + "****";
  }).join(" ");

  res.json({
    success: true,
    id: order.id,
    customerName: maskedName,
    productType: order.productType,
    details: order.details,
    quantity: order.quantity,
    status: order.status,
    deliveryDate: order.deliveryDate,
    orderDate: order.orderDate,
    notes: order.notes,
    trackingHistory: order.trackingHistory || [],
  });
});

// --- DATA ACCESS ENDPOINTS (requires Andressa Authorized Session) ---
app.get("/api/data", validateAndressaToken, async (req, res) => {
  const dbResult = await readDb();
  res.json({
    ...dbResult.data,
    _supabaseStatus: {
      provider: dbResult.provider,
      configured: !!supabaseClient,
      error: dbResult.error || null,
      credentialsDemo: {
        SUPABASE_URL: !!SUPABASE_URL,
        SUPABASE_KEY: !!SUPABASE_KEY
      }
    }
  });
});

app.post("/api/data", validateAndressaToken, async (req, res) => {
  const newData = req.body as AppSchema;
  if (!newData || !Array.isArray(newData.stock) || !Array.isArray(newData.orders)) {
    res.status(400).json({ error: "Formato de dados para sincronização inválido." });
    return;
  }
  
  // Clean off Supabase metadata properties
  const cleanData = { ...newData };
  delete (cleanData as any)._supabaseStatus;

  const result = await writeDb(cleanData);
  res.json({ 
    success: true, 
    provider: result.provider,
    error: result.error || null,
    message: result.provider === "supabase" 
      ? "Sincronizado no Supabase com sucesso!" 
      : "Sincronizado em backup de segurança local." 
  });
});


// Set up Vite in development, static build in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware mounted in Development mode.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static files directory served in Production mode.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
