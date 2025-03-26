// extensions/gpu-providers.ts

export enum ProviderType {
  LIGHTNING = "lightning",
  RUNPOD = "runpod",
  COLAB = "colab"
}

export interface ProviderConfig {
  type: ProviderType;
  apiKey: string;
  endpoint?: string;
}

export class GPUProvider {
  private type: ProviderType;
  private apiKey: string;
  private endpoint: string;
  private isReady: boolean = false;
  private sessionId?: string;

  constructor(config: ProviderConfig) {
    this.type = config.type;
    this.apiKey = config.apiKey;
    
    // Establecer endpoints predeterminados según el tipo
    if (config.endpoint) {
      this.endpoint = config.endpoint;
    } else {
      switch (this.type) {
        case ProviderType.LIGHTNING:
          this.endpoint = "https://lightning.ai/api/v1";
          break;
        case ProviderType.RUNPOD:
          this.endpoint = "https://api.runpod.io/v2";
          break;
        case ProviderType.COLAB:
          this.endpoint = "https://colab.research.google.com/api";
          break;
        default:
          this.endpoint = "";
      }
    }
  }

  async initialize(): Promise<boolean> {
    try {
      // Inicializar según el tipo de proveedor
      if (this.type === ProviderType.LIGHTNING) {
        await this.initializeLightning();
      } else if (this.type === ProviderType.RUNPOD) {
        await this.initializeRunpod();
      }
      
      this.isReady = true;
      return true;
    } catch (error) {
      console.error(`Error initializing provider ${this.type}:`, error);
      this.isReady = false;
      return false;
    }
  }

  private async initializeLightning(): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/clusters`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          instance_type: "gpu",
          name: "bolt-diy-session"
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize Lightning: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.id;
      
      // Start simple heartbeat
      this.startHeartbeat();
      
    } catch (error) {
      console.error("Lightning initialization error:", error);
      throw error;
    }
  }

  private async initializeRunpod(): Promise<void> {
    try {
      // Similar a Lightning pero para RunPod
      const response = await fetch(`${this.endpoint}/pods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          name: "bolt-diy-pod",
          image: "runpod/pytorch:2.0.1-py3.10-cuda11.7.1-devel",
          gpu_count: 1,
          gpu_type: "NVIDIA RTX A4000", // O el tipo disponible en plan gratuito
          volume_size: 10
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to initialize RunPod: ${response.statusText}`);
      }

      const data = await response.json();
      this.sessionId = data.id;
      
    } catch (error) {
      console.error("RunPod initialization error:", error);
      throw error;
    }
  }

  async executeTask(task: any): Promise<any> {
    if (!this.isReady || !this.sessionId) {
      throw new Error("Provider not initialized");
    }

    try {
      if (this.type === ProviderType.LIGHTNING) {
        return await this.executeLightningTask(task);
      } else if (this.type === ProviderType.RUNPOD) {
        return await this.executeRunpodTask(task);
      }
    } catch (error) {
      console.error(`Error executing task on ${this.type}:`, error);
      throw error;
    }
  }

  private async executeLightningTask(task: any): Promise<any> {
    const response = await fetch(`${this.endpoint}/clusters/${this.sessionId}/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        task: task
      })
    });

    if (!response.ok) {
      throw new Error(`Task execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  private async executeRunpodTask(task: any): Promise<any> {
    // Implementación para RunPod
    const response = await fetch(`${this.endpoint}/pods/${this.sessionId}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input: task
      })
    });

    if (!response.ok) {
      throw new Error(`Task execution failed: ${response.statusText}`);
    }

    return await response.json();
  }

  isAvailable(): boolean {
    return this.isReady;
  }

  private startHeartbeat(): void {
    // Implementación simple de heartbeat
    setInterval(async () => {
      if (this.type === ProviderType.LIGHTNING && this.sessionId) {
        try {
          await fetch(`${this.endpoint}/clusters/${this.sessionId}/heartbeat`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.apiKey}`
            }
          });
        } catch (error) {
          console.error("Heartbeat error:", error);
        }
      }
    }, 240000); // Cada 4 minutos
  }
}
