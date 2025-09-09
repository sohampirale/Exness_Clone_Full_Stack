import axios from "axios";

// socket.ts
let socket: WebSocket | null = null;
let WSToken: any;
export async function getSocket() {

  if (!socket) {
    console.log('making new connection');

    socket = new WebSocket(process.env.NEXT_PUBLIC_WS_URL!);

    socket.onopen = () => {
      console.log("✅ WebSocket connected");

      let IntId1 = setInterval(() => {
        if (WSToken) {
          clearInterval(IntId1)
          const obj = {
            request: 'Auth',
            WSToken
          }
          console.log('sending the msg to websocket server');
          socket.send(JSON.stringify(obj))
        }
      }, 5000)

    };

    socket.onclose = () => {
      console.log("❌ WebSocket closed, retrying in 2s...");
      setTimeout(() => getSocket(), 2000);
    };

    socket.onerror = (err) => {
      console.error("⚠️ WebSocket error:", err);
      socket?.close();
    };
  }

  if (!WSToken) {
    try {
      const { data: response } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/token/WSToken`, {
        withCredentials: true
      })
      WSToken = response.WSToken
      console.log('WSToken : ', WSToken);
    } catch (error) {
      console.log('user is not logged in ');
    }
  }

  return socket;
}
