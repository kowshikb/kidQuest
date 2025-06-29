export interface FirebaseError {
  code: string;
  message: string;
  name: string;
}

export class FirebaseErrorHandler {
  static handleError(error: any): {
    userMessage: string;
    shouldRetry: boolean;
    logLevel: "warn" | "error";
  } {
    const firebaseError = error as FirebaseError;

    switch (firebaseError.code) {
      case "permission-denied":
        return {
          userMessage:
            "Permission denied. Please check your account permissions.",
          shouldRetry: false,
          logLevel: "error",
        };

      case "unavailable":
        return {
          userMessage:
            "Service temporarily unavailable. Please try again in a moment.",
          shouldRetry: true,
          logLevel: "warn",
        };

      case "deadline-exceeded":
        return {
          userMessage:
            "Request timed out. Please check your connection and try again.",
          shouldRetry: true,
          logLevel: "warn",
        };

      case "resource-exhausted":
        return {
          userMessage:
            "Too many requests. Please wait a moment before trying again.",
          shouldRetry: true,
          logLevel: "warn",
        };

      case "failed-precondition":
        return {
          userMessage:
            "Operation failed due to missing requirements. Please try again.",
          shouldRetry: false,
          logLevel: "error",
        };

      case "unauthenticated":
        return {
          userMessage: "Please sign in to continue.",
          shouldRetry: false,
          logLevel: "error",
        };

      case "not-found":
        return {
          userMessage: "Requested data not found.",
          shouldRetry: false,
          logLevel: "warn",
        };

      case "already-exists":
        return {
          userMessage: "This data already exists.",
          shouldRetry: false,
          logLevel: "warn",
        };

      case "invalid-argument":
        return {
          userMessage: "Invalid data provided. Please check your input.",
          shouldRetry: false,
          logLevel: "error",
        };

      case "out-of-range":
        return {
          userMessage: "Value is out of valid range.",
          shouldRetry: false,
          logLevel: "error",
        };

      case "internal":
        return {
          userMessage: "Internal server error. Please try again later.",
          shouldRetry: true,
          logLevel: "error",
        };

      case "data-loss":
        return {
          userMessage: "Data corruption detected. Please contact support.",
          shouldRetry: false,
          logLevel: "error",
        };

      default:
        return {
          userMessage: "An unexpected error occurred. Please try again.",
          shouldRetry: true,
          logLevel: "error",
        };
    }
  }

  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const errorInfo = this.handleError(error);

        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          throw error;
        }

        const delay = baseDelay * Math.pow(2, attempt);
        console.log(
          `⏳ Retrying operation in ${delay}ms (attempt ${
            attempt + 1
          }/${maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static logError(error: any, context: string): void {
    const errorInfo = this.handleError(error);
    const logMethod =
      errorInfo.logLevel === "warn" ? console.warn : console.error;

    logMethod(`${context}:`, {
      code: error.code,
      message: error.message,
      userMessage: errorInfo.userMessage,
      shouldRetry: errorInfo.shouldRetry,
    });
  }

  static formatErrorForUser(error: any): string {
    const errorInfo = this.handleError(error);
    return errorInfo.userMessage;
  }
}
