// extensions/runpod-optimizer.ts

export class RunPodOptimizer {
  private apiKey: string;
  private endpoint: string;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private creditHistory: Array<{timestamp: number, credits: number}> = [];
  private maxPods: number = 2;
  private minCredits: number = 10;
  private creditThreshold: number = 50;
  private activePods: string[] = [];

  constructor(apiKey: string, endpoint: string = "https://api.runpod.io/v2") {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  async start(checkIntervalMinutes: number = 30): Promise<void> {
    if (this.isRunning) {
      console.log("RunPod optimizer already running");
      return;
    }

    this.isRunning = true;
    
    // Verificación inicial
    await this.checkState();
    
    // Configurar monitoreo periódico
    this.intervalId = setInterval(() => this.checkState(), checkIntervalMinutes * 60 * 1000);
    
    console.log("RunPod optimizer started");
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    console.log("RunPod optimizer stopped");
  }

  private async checkState(): Promise<void> {
    try {
      // Verificar créditos
      const credits = await this.checkCredits();
      
      // Verificar pods activos
      const activePods = await this.getActivePods();
      this.activePods = activePods.map(pod => pod.id);
      
      // Calcular tasa de consumo
      const burnRate = this.calculateBurnRate();
      
      // Optimizar uso de pods
      await this.optimizePodUsage(credits, burnRate);
      
    } catch (error) {
      console.error("Error in RunPod optimizer:", error);
    }
  }

  private async checkCredits(): Promise<number> {
    try {
      const response = await fetch(`${this.endpoint}/me/credits`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get credits: ${response.statusText}`);
      }

      const data = await response.json();
      const credits = data.credits || 0;
      
      // Registrar en historial
      this.creditHistory.push({
        timestamp: Date.now(),
        credits
      });
      
      // Mantener historial de tamaño razonable
      if (this.creditHistory.length > 100) {
        this.creditHistory = this.creditHistory.slice(-100);
      }
      
      console.log(`Current RunPod credits: ${credits}`);
      return credits;
    } catch (error) {
      console.error("Error checking credits:", error);
      return 0;
    }
  }

  private async getActivePods(): Promise<any[]> {
    try {
      const response = await fetch(`${this.endpoint}/me/pods`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get pods: ${response.statusText}`);
      }

      const data = await response.json();
      const pods = data.pods || [];
      
      const activePods = pods.filter((pod: any) => pod.status === "RUNNING");
      console.log(`Active RunPod pods: ${activePods.length}`);
      return activePods;
    } catch (error) {
      console.error("Error checking pods:", error);
      return [];
    }
  }

  private calculateBurnRate(): number {
    if (this.creditHistory.length < 2) {
      return 0;
    }
    
    // Tomar los últimos dos puntos de datos
    const latest = this.creditHistory[this.creditHistory.length - 1];
    const previous = this.creditHistory[this.creditHistory.length - 2];
    
    const timeDiff = (latest.timestamp - previous.timestamp) / 1000 / 60 / 60; // en horas
    const creditDiff = previous.credits - latest.credits;
    
    if (timeDiff <= 0) {
      return 0;
    }
    
    // Calcular tasa por hora
    const hourlyRate = creditDiff / timeDiff;
    console.log(`Current RunPod burn rate: ${hourlyRate.toFixed(2)} credits/hour`);
    
    return hourlyRate;
  }

  private async optimizePodUsage(credits: number, burnRate: number): Promise<void> {
    // Si pocos créditos, detener algunos pods
    if (credits < this.creditThreshold && this.activePods.length > 0) {
      console.warn(`Credits below threshold (${credits} < ${this.creditThreshold}). Stopping pods.`);
      
      // Dejar un pod activo si hay más de uno
      const podsToStop = this.activePods.length > 1 ? this.activePods.slice(0, -1) : [];
      
      for (const podId of podsToStop) {
        try {
          await this.stopPod(podId);
        } catch (error) {
          console.error(`Error stopping pod ${podId}:`, error);
        }
      }
    }
    
    // Si alta tasa de consumo, también detener pods
    if (burnRate > 5 && this.activePods.length > 1) {  // 5 créditos por hora es alto
      console.warn(`High burn rate (${burnRate.toFixed(2)} credits/hour). Stopping excess pods.`);
      
      // Mantener solo un pod
      const podsToStop = this.activePods.slice(0, -1);
      
      for (const podId of podsToStop) {
        try {
          await this.stopPod(podId);
        } catch (error) {
          console.error(`Error stopping pod ${podId}:`, error);
        }
      }
    }
  }

  private async stopPod(podId: string): Promise<void> {
    try {
      const response = await fetch(`${this.endpoint}/pods/${podId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to stop pod: ${response.statusText}`);
      }

      console.log(`Stopped pod: ${podId}`);
    } catch (error) {
      console.error(`Error stopping pod ${podId}:`, error);
      throw error;
    }
  }
}
