const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${API_URL}/api/health`);
    return res.ok;
  } catch {
    return false;
  }
}
