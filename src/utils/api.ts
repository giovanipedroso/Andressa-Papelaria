import { AppSchema } from "../types";

const BASE_URL = ""; // Current host

export async function login(username: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ username, password }),
  });
  
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Erro de autenticação");
  }
  
  return res.json() as Promise<{
    success: boolean;
    token: string;
    user: { name: string; role: string };
  }>;
}

export async function fetchAppData(token: string): Promise<AppSchema> {
  const res = await fetch(`${BASE_URL}/api/data`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    throw new Error("Não foi possível carregar os dados do servidor.");
  }
  
  return res.json() as Promise<AppSchema>;
}

export async function saveAppData(token: string, data: AppSchema): Promise<boolean> {
  const res = await fetch(`${BASE_URL}/api/data`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  
  if (!res.ok) {
    throw new Error("Falha ao salvar dados no servidor.");
  }
  
  const result = await res.json();
  return result.success;
}

export async function trackOrderPublic(orderId: string) {
  const res = await fetch(`${BASE_URL}/api/orders/track/${orderId}`);
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || "Pedido não encontrado.");
  }
  
  return res.json();
}
