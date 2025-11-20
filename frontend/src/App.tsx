import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import { Outlet, Navigate } from "react-router-dom";

export default function App() {
  const token = localStorage.getItem("token");

  // Nếu chưa đăng nhập → chuyển đến trang login
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          <div className="mx-auto max-w-7xl">
            <Outlet /> {/* Dashboard hoặc Admin sẽ render ở đây */}
          </div>
        </main>
      </div>
    </div>
  );
}
