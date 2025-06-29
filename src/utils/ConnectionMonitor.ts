export class ConnectionMonitor {
  private static instance: ConnectionMonitor;
  private isOnline: boolean = navigator.onLine;
  private listeners: ((isOnline: boolean) => void)[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 1000;

  static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor();
    }
    return ConnectionMonitor.instance;
  }

  constructor() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.reconnectAttempts = 0;
      console.log("🌐 Connection restored");
      this.notifyListeners();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      console.log("🚫 Connection lost");
      this.notifyListeners();
    });

    // Periodic connectivity check
    this.startPeriodicCheck();
  }

  public getIsOnline(): boolean {
    return this.isOnline;
  }

  public addListener(callback: (isOnline: boolean) => void): void {
    this.listeners.push(callback);
  }

  public removeListener(callback: (isOnline: boolean) => void): void {
    this.listeners = this.listeners.filter((listener) => listener !== callback);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => {
      try {
        listener(this.isOnline);
      } catch (error) {
        console.error("Error in connection listener:", error);
      }
    });
  }

  private startPeriodicCheck(): void {
    setInterval(() => {
      this.checkConnectivity();
    }, 30000); // Check every 30 seconds
  }

  private async checkConnectivity(): Promise<void> {
    try {
      // Try to fetch a small resource to verify connectivity
      const response = await fetch("/favicon.ico", {
        method: "HEAD",
        cache: "no-cache",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      const wasOnline = this.isOnline;
      this.isOnline = response.ok;

      if (wasOnline !== this.isOnline) {
        this.notifyListeners();
      }
    } catch (error) {
      const wasOnline = this.isOnline;
      this.isOnline = false;

      if (wasOnline !== this.isOnline) {
        console.log("🚫 Connectivity check failed");
        this.notifyListeners();
      }
    }
  }

  public async waitForConnection(timeout: number = 30000): Promise<boolean> {
    if (this.isOnline) {
      return true;
    }

    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        this.removeListener(onlineListener);
        resolve(false);
      }, timeout);

      const onlineListener = (isOnline: boolean) => {
        if (isOnline) {
          clearTimeout(timeoutId);
          this.removeListener(onlineListener);
          resolve(true);
        }
      };

      this.addListener(onlineListener);
    });
  }

  public getConnectionInfo(): {
    isOnline: boolean;
    reconnectAttempts: number;
    networkType?: string;
  } {
    const connection =
      (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      isOnline: this.isOnline,
      reconnectAttempts: this.reconnectAttempts,
      networkType: connection?.effectiveType || "unknown",
    };
  }
}
