// Mock AppSync WebSocket service
class MockWebSocket {
  private callbacks: { [key: string]: (data: any) => void } = {};

  connect() {
    console.log('WebSocket connected');
  }

  subscribe(event: string, callback: (data: any) => void) {
    this.callbacks[event] = callback;
    console.log(`Subscribed to ${event}`);
  }

  emit(event: string, data: any) {
    console.log(`Emitting ${event}:`, data);
    if (this.callbacks[event]) {
      this.callbacks[event](data);
    }
  }

  disconnect() {
    console.log('WebSocket disconnected');
    this.callbacks = {};
  }
}

export const websocket = new MockWebSocket();
