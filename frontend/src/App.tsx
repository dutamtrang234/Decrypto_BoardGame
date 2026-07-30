import { Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import { Toaster } from "./components/common/Toast";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import RoomPage from "./pages/Room";

export default function App() {
  return (
    <SocketProvider>
      <Toaster>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room/:roomCode" element={<RoomPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </Toaster>
    </SocketProvider>
  );
}
