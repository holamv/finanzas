
import { Charge } from "../types";

const API_URL = "https://api.backend.manzanaverde.la/api/v1/charges/get?page=35&has_country=true";
const BEARER_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2FwaS5iYWNrZW5kLm1hbnphbmF2ZXJkZS5sYS9hcGkvdjEvYXV0aC9sb2dpbiIsImlhdCI6MTczOTgxMTkzNSwibmJmIjoxNzM5ODExOTM1LCJqdGkiOiIzWG5QSU1Pc0lXVjBOUldKIiwic3ViIjoiODE2IiwicHJ2IjoiODdlMGFmMWVmOWZkMTU4MTJmZGVjOTcxNTNhMTRlMGIwNDc1NDZhYSJ9.gM3UcJnjhS92E6R-MlebVAM9URQE7jg9AsYRS4l8vck";

export const fetchCharges = async (): Promise<Charge[]> => {
  try {
    const response = await fetch(API_URL, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error API: ${response.status}`);
    }

    const data = await response.json();
    
    // Adaptamos la respuesta de la API al formato de la interfaz Charge
    // Asumiendo que la API devuelve un objeto con una propiedad 'data' que es el array
    const chargesRaw = data.data || data;
    
    return Array.isArray(chargesRaw) ? chargesRaw.map((item: any) => ({
      id: item.id,
      at: item.at || item.created_at,
      amount: parseFloat(item.amount),
      currency: item.currency || 'PEN',
      description: item.description || 'Carga de sistema',
      pais: item.country?.name || item.country_name || 'PE',
      name: item.user?.name || item.customer_name || 'Usuario MV',
      email: item.user?.email || item.customer_email || 'N/A',
      status: item.status
    })) : [];

  } catch (error) {
    console.error("Fetch API Error:", error);
    throw error;
  }
};
