from fastapi import APIRouter
from datetime import datetime
import statistics

router = APIRouter(prefix="/reports-forecast", tags=["AI Forecast"])

REAL_REVENUE = [
    {"month": 7, "value": 120_000_000},
    {"month": 8, "value": 150_000_000},
    {"month": 9, "value": 180_000_000},
    {"month": 10, "value": 220_000_000},
    {"month": 11, "value": 260_000_000},
    {"month": 12, "value": 310_000_000},
]

# --------------------------------------------------
# 📌 1. Weighted Moving Average (WMA)
# --------------------------------------------------
def weighted_moving_average(data):
    weights = [1, 2, 3]  # tháng mới nhất quan trọng nhất
    last3 = [i["value"] for i in data[-3:]]
    wma = sum(v * w for v, w in zip(last3, weights)) / sum(weights)
    return int(wma)

# --------------------------------------------------
# 📌 2. Tính xu hướng tăng trưởng trung bình
# --------------------------------------------------
def detect_trend(data):
    diffs = []
    for i in range(1, len(data)):
        diffs.append(data[i]["value"] - data[i-1]["value"])

    avg_growth = statistics.mean(diffs)
    return avg_growth

# --------------------------------------------------
# 📌 3. Điều chỉnh theo mùa (seasonal adjustment)
# --------------------------------------------------
def seasonal_adjustment(month):
    # giả lập mô hình mùa vụ đơn giản
    if month in [11, 12, 1]:      # mùa cao điểm
        return 1.08
    if month in [2, 3, 4]:        # thấp
        return 0.97
    return 1.0                    # bình thường

# --------------------------------------------------
# 📌 4. Dự đoán 6 tháng tiếp theo
# --------------------------------------------------
def forecast_next_months():
    forecasts = []
    wma = weighted_moving_average(REAL_REVENUE)
    trend = detect_trend(REAL_REVENUE)

    current_month = REAL_REVENUE[-1]["month"]
    current_value = REAL_REVENUE[-1]["value"]

    for i in range(1, 7):
        future_month = (current_month + i - 1) % 12 + 1

        # Công thức dự đoán mới
        predicted = int(
            (current_value + trend * i) * seasonal_adjustment(future_month)
        )

        forecasts.append({
            "month": f"T{future_month}",
            "value": predicted
        })

    return forecasts

# --------------------------------------------------
# 📌 5. Gợi ý thông minh
# --------------------------------------------------
def suggestion(value_now, value_next):
    diff = value_next - value_now
    pct = diff / value_now * 100

    if pct >= 20:
        return "🚀 Dự báo doanh thu tăng rất mạnh — nên mở rộng kho, bổ sung nhân sự."
    if pct >= 10:
        return "📈 Xu hướng tích cực — tăng ngân sách marketing để tối đa hóa lợi nhuận."
    if pct >= 0:
        return "⚠ Doanh thu tăng nhẹ — tối ưu chi phí để đạt lợi nhuận tốt hơn."
    return "🔻 Doanh thu có dấu giảm — cần xem lại tồn kho & nhóm sản phẩm bán chậm."

# --------------------------------------------------
# 📌 API chính
# --------------------------------------------------
@router.get("/forecast")
def forecast():
    forecasts = forecast_next_months()

    next_month = forecasts[0]["value"]
    current_month_value = REAL_REVENUE[-1]["value"]

    return {
        "real": REAL_REVENUE,
        "forecast": forecasts,
        "summary": {
            "predicted_revenue": next_month,
            "growth_rate": round((next_month - current_month_value) / current_month_value * 100, 2),
            "suggestion": suggestion(current_month_value, next_month)
        }
    }
