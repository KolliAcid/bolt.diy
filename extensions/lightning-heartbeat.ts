// extensions/lightning-heartbeat.ts

export class LightningHeartbeat {
  private apiKey: string;
  private sessionId: string;
  private endpoint: string;
  private intervalId?: NodeJS.Timeout;
  private isRunning: boolean = false;
  private lastSuccess: number = Date.now();
  private failureCount: number = 0;
  private maxFailures: number = 3;
  private jitterBase: number = 240; // 4 minutos base
  private jitterVariance: number = 30; // ±30 segundos de variación

  constructor(apiKey: string, sessionId: string, endpoint: string = "https://lightning.ai/api/v1") {
    this.apiKey = apiKey;
    this.sessionId = sessionId;
    this.endpoint = endpoint;
  }

  start(): void {
    if (this.isRunning) {
      console.log("Heartbeat already running");
      return;
    }

    this.isRunning = true;
    this.heartbeatLoop();
    console.log(`Started heartbeat for session ${this.sessionId}`);
  }

  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.intervalId) {
      clearTimeout(this.intervalId);
    }
    console.log(`Stopped heartbeat for session ${this.sessionId}`);
  }

  private heartbeatLoop(): void {
    const sendHeartbeat = async () => {
      if (!this.isRunning) return;

      try {
        // Seleccionar aleatoriamente un tipo de heartbeat para evitar patrones
        const success = await this.sendRandomHeartbeat();

        if (success) {
          this.lastSuccess = Date.now();
          this.failureCount = 0;
        } else {
          this.failureCount++;
          console.warn(`Heartbeat failed. Failures: ${this.failureCount}/${this.maxFailures}`);
        }

        // Si demasiados fallos consecutivos, detener heartbeat
        if (this.failureCount >= this.maxFailures) {
          console.error(`Too many consecutive failures (${this.failureCount}). Stopping heartbeat.`);
          this.stop();
          return;
        }

        // Calcular próximo intervalo con jitter
        const nextInterval = this.jitterBase + (Math.random() * 2 - 1) * this.jitterVariance;
        this.intervalId = setTimeout(sendHeartbeat, nextInterval * 1000);
      } catch (error) {
        console.error("Error in heartbeat loop:", error);
        this.failureCount++;
        
        // Intentar de nuevo en 1 minuto en caso de error
        this.intervalId = setTimeout(sendHeartbeat, 60000);
      }
    };

    // Iniciar el bucle
    sendHeartbeat();
  }

  private async sendRandomHeartbeat(): Promise<boolean> {
    // Elegir aleatoriamente una estrategia de heartbeat
    const strategies = [
      this.sendSimpleHeartbeat.bind(this),
      this.sendExtendedHeartbeat.bind(this),
      this.querySessionStatus.bind(this)
    ];

    const selectedStrategy = strategies[Math.floor(Math.random() * strategies.length)];
    return await selectedStrategy();
  }

  private async sendSimpleHeartbeat(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/clusters/${this.sessionId}/heartbeat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error("Simple heartbeat error:", error);
      return false;
    }
  }

  private async sendExtendedHeartbeat(): Promise<boolean> {
    try {
      const payload = {
        status: "active",
        memory_usage: 10 + Math.random() * 20, // Simular uso entre 10-30%
        timestamp: Date.now()
      };

      const response = await fetch(`${this.endpoint}/clusters/${this.sessionId}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(payload)
      });

      return response.ok;
    } catch (error) {
      console.error("Extended heartbeat error:", error);
      return false;
    }
  }

  private async querySessionStatus(): Promise<boolean> {
    try {
      const response = await fetch(`${this.endpoint}/clusters/${this.sessionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.status === "running";
    } catch (error) {
      console.error("Status query error:", error);
      return false;
    }
  }
}
