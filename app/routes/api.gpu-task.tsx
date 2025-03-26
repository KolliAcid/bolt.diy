// app/routes/api.gpu-task.tsx

import { json } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { BoltGPUExtension } from "../../extensions/bolt-gpu-extension";

// Inicializa la extensión GPU
const gpuExtension = new BoltGPUExtension();
gpuExtension.initialize().catch(console.error);

export const action: ActionFunction = async ({ request }) => {
  try {
    // Extraer datos de la solicitud
    const data = await request.json();
    
    // Validar que la solicitud tiene los campos necesarios
    if (!data.type || !data.params) {
      return json({ error: "Invalid request format" }, { status: 400 });
    }
    
    // Ejecutar tarea GPU
    const result = await gpuExtension.executeGPUTask({
      type: data.type,
      params: data.params
    });
    
    return json({ success: true, result });
  } catch (error: any) {
    console.error("GPU task error:", error);
    return json({ error: error.message || "Unknown error" }, { status: 500 });
  }
};
