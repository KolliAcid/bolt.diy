// extensions/bolt-gpu-extension.ts

import { GPUProvider, ProviderType } from './gpu-providers';

export class BoltGPUExtension {
  private providers: GPUProvider[] = [];
  
  constructor() {
    // Registrar proveedores usando variables de entorno
    const lightningApiKey = process.env.LIGHTNING_API_KEY;
    const runpodApiKey = process.env.RUNPOD_API_KEY;
    
    if (lightningApiKey) {
      this.registerProvider(new GPUProvider({
        type: ProviderType.LIGHTNING,
        apiKey: lightningApiKey
      }));
    }
    
    if (runpodApiKey) {
      this.registerProvider(new GPUProvider({
        type: ProviderType.RUNPOD,
        apiKey: runpodApiKey
      }));
    }
  }
  
  private registerProvider(provider: GPUProvider) {
    this.providers.push(provider);
  }
  
  async initialize() {
    const initPromises = this.providers.map(p => p.initialize());
    await Promise.all(initPromises);
    console.log("GPU Extension initialized with providers:", this.providers.length);
  }
  
  async executeGPUTask(task: any) {
    const availableProviders = this.providers.filter(p => p.isAvailable());
    
    if (!availableProviders.length) {
      throw new Error('No GPU providers available');
    }
    
    // Seleccionar mejor proveedor (implementación simple)
    const provider = availableProviders[0];
    
    // Ejecutar tarea
    return await provider.executeTask(task);
  }
}
