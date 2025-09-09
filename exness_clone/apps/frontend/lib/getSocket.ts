// socket.ts
let socket: WebSocket | null = null;
let temp=0
export function getSocket() {
  if (!socket) {
    console.log('making new connection');
    
    socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");
    };

    socket.onclose = () => {
      console.log("❌ WebSocket closed, retrying in 2s...");
      setTimeout(() => getSocket(), 2000); 
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      socket?.close();
    };
  } else {
    console.log('returning existing one');
  }

  return socket;
}
