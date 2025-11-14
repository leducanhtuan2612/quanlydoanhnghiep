import { useEffect, useState } from "react";
import { Save, Upload, Building2 } from "lucide-react";

const API = "http://127.0.0.1:8000";

type SettingsData = {
  company_name: string;
  email: string;
  phone: string;
  address: string;
  theme_color: string;
  logo_url?: string;
};

export default function Settings() {
  const [form, setForm] = useState<SettingsData>({
    company_name: "",
    email: "",
    phone: "",
    address: "",
    theme_color: "#2563eb",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 🧠 Hàm tải dữ liệu từ backend
  const loadSettings = async () => {
    try {
      const res = await fetch(`${API}/settings`);
      if (!res.ok) throw new Error("Không thể tải settings");
      const data = await res.json();
      console.log("Dữ liệu nhận từ backend:", data);
      setForm({
        company_name: data.company_name || "",
        email: data.email || "",
        phone: data.phone || "",
        address: data.address || "",
        theme_color: data.theme_color || "#2563eb",
        logo_url: data.logo_url || "",
      });
    } catch (err) {
      console.error("Lỗi tải settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  // 🧩 Cập nhật state khi nhập input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // 📸 Upload logo
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API}/settings/upload-logo`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload logo thất bại");
      const data = await res.json();
      setForm((prev) => ({ ...prev, logo_url: data.url }));
      await loadSettings(); // reload lại toàn bộ sau khi upload
    } catch (error) {
      console.error(error);
      alert("❌ Upload logo thất bại!");
    }
  };

  // 💾 Gửi dữ liệu cập nhật lên server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Chỉ gửi những field backend cho phép
    const payload = {
      company_name: form.company_name,
      email: form.email,
      phone: form.phone,
      address: form.address,
      theme_color: form.theme_color,
    };

    try {
      const res = await fetch(`${API}/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("Lỗi khi lưu:", errText);
        alert("❌ Lưu thất bại. Kiểm tra console để xem chi tiết.");
        return;
      }

      const data = await res.json();
      console.log("Đã lưu:", data);

      await loadSettings(); // cập nhật lại form
      alert("✅ Đã lưu thay đổi!");
    } catch (error) {
      console.error("Lỗi khi gửi request:", error);
      alert("❌ Không thể kết nối đến server!");
    } finally {
      setSaving(false);
    }
  };

  // 🎨 Cập nhật màu chủ đạo ngay khi chọn
  useEffect(() => {
    document.documentElement.style.setProperty("--theme-color", form.theme_color);
  }, [form.theme_color]);

  // ⏳ Loading ban đầu
  if (loading) {
    return <div className="p-6 text-gray-500">Đang tải cấu hình hệ thống...</div>;
  }

  // 🧱 Giao diện chính
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-2xl font-semibold text-gray-800">
        <Building2 size={28} className="text-blue-600" />
        Cài đặt hệ thống
      </div>
      <p className="text-gray-500">
        Tùy chỉnh thông tin doanh nghiệp, logo và màu giao diện.
      </p>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow rounded-2xl p-6 space-y-4"
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Tên công ty
            </label>
            <input
              type="text"
              name="company_name"
              value={form.company_name}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Số điện thoại
            </label>
            <input
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Địa chỉ
            </label>
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleChange}
              className="w-full border rounded-lg p-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Màu chủ đạo
            </label>
            <input
              type="color"
              name="theme_color"
              value={form.theme_color}
              onChange={handleChange}
              className="w-16 h-10 mt-1 border rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Logo công ty
            </label>
            <div className="flex items-center gap-3 mt-1">
              {form.logo_url ? (
                <img
                  src={`${API}${form.logo_url}`}
                  alt="Logo"
                  className="w-12 h-12 rounded border object-cover"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center border rounded text-gray-400 text-xs">
                  Logo
                </div>
              )}
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg cursor-pointer hover:bg-gray-200">
                <Upload size={16} /> Tải logo
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleUpload}
                />
              </label>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Save size={18} /> {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </button>
        </div>
      </form>
    </div>
  );
}
