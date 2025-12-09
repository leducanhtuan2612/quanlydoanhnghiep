import {
  AlertTriangle,
  Info,
  Mail,
  Phone,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { motion } from "framer-motion";

export default function EmployeeHomeUnassigned() {
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* ================= HEADER ================= */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Trang chủ nhân viên
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Xin chào, <span className="font-semibold text-gray-800">{user?.username}</span>
        </p>
      </div>

      <div className="space-y-10">

        {/* =======================================================
            GIỚI THIỆU HỆ THỐNG ERP
        ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 shadow-sm rounded-2xl p-8"
        >
          <div className="flex items-start gap-4">
            <Building2 size={40} className="text-indigo-500" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Hệ thống Quản lý Doanh nghiệp ANH TUẤN (ERP System)
              </h2>

              <p className="text-gray-600 mt-3 leading-relaxed">
                Đây là nền tảng ERP nội bộ giúp doanh nghiệp vận hành toàn diện và hiệu quả hơn thông qua việc
                <strong> tập trung dữ liệu, tối ưu quy trình và tự động hóa nghiệp vụ.</strong>
              </p>

              <div className="grid grid-cols-2 gap-3 mt-5 text-gray-700">
                <p>• Quản lý Nhân sự – Hồ sơ, chấm công, hợp đồng, lương</p>
                <p>• Quản lý Kho – Sản phẩm, tồn kho</p>
                <p>• Quản lý Đơn hàng – Khách hàng (CRM)</p>
                <p>• Công việc – Phân quyền – Báo cáo</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* =======================================================
            CẢNH BÁO
        ======================================================== */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-300 rounded-2xl p-8 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle size={38} className="text-amber-600 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-amber-800">
                Tài khoản chưa được gắn với hồ sơ nhân viên
              </h2>

              <p className="text-amber-800 mt-3">
                Hệ thống không tìm thấy hồ sơ nhân viên tương ứng với tài khoản của bạn.
                Điều này khiến bạn không thể sử dụng các chức năng quan trọng:
              </p>

              <ul className="mt-4 space-y-1 text-amber-900">
                <li>• Hồ sơ cá nhân</li>
                <li>• Chấm công – Lương – Hợp đồng</li>
                <li>• Công việc được giao</li>
                <li>• Thông báo – Phúc lợi nội bộ</li>
              </ul>

              <p className="mt-4 font-medium text-amber-900">
                ➝ Vui lòng liên hệ quản trị viên hoặc phòng nhân sự để được gắn mã nhân viên.
              </p>
            </div>
          </div>
        </motion.div>

        {/* =======================================================
            GRID 2 CARD — HỖ TRỢ + CHỨC NĂNG
        ======================================================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* Card hỗ trợ */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white border border-gray-200 p-8 rounded-2xl shadow-sm"
          >
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Info size={20} className="text-blue-600" />
              Thông tin hỗ trợ
            </h2>

            <p className="text-gray-600 mt-3">
              Bộ phận quản trị sẵn sàng hỗ trợ bạn gắn hồ sơ nhân viên hoặc kích hoạt các tính năng liên quan.
            </p>

            <div className="mt-5 space-y-3 text-gray-700">
              <p className="flex items-center gap-3">
                <Mail size={20} className="text-blue-700" /> leducanhtuan@gmail.com
              </p>
              <p className="flex items-center gap-3">
                <Phone size={20} className="text-green-600" /> 0334619913
              </p>
            </div>
          </motion.div>

          {/* Card chức năng còn dùng được */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-blue-50 border border-blue-200 p-8 rounded-2xl shadow-sm"
          >
            <h2 className="text-lg font-semibold text-blue-900 flex items-center gap-2">
              <CheckCircle2 size={22} className="text-emerald-600" />
              Các chức năng bạn vẫn có thể sử dụng
            </h2>

            <ul className="mt-4 text-blue-900 space-y-2">
              <li>• Xem danh sách khách hàng</li>
              <li>• Theo dõi đơn hàng</li>
              <li>• Danh mục sản phẩm</li>
              <li>• Tra cứu kho hàng</li>
            </ul>

            <p className="text-blue-800 mt-4">
              Sau khi được gắn hồ sơ, bạn sẽ mở khóa toàn bộ tính năng trong hệ thống ERP.
            </p>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
