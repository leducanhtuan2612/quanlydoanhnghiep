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
    {"month": 12, "value": 310_000_000}
]

def forecast_sma():
    last_values = [i["value"] for i in REAL_REVENUE[-3:]]
    sma = statistics.mean(last_values)

    next_month_val = int(sma * 1.08)
    next_2_month_val = int(next_month_val * 1.05)

    growth = round(
        ((next_month_val - REAL_REVENUE[-1]["value"]) / REAL_REVENUE[-1]["value"]) * 100,
        2
    )

    return next_month_val, next_2_month_val, growth

def suggestion(growth):
    if growth >= 15:
        return "📈 Doanh thu sẽ tăng mạnh — nên nhập thêm hàng bán chạy!"
    if growth >= 5:
        return "👍 Doanh thu tăng ổn — tiếp tục đẩy marketing."
    if growth >= 0:
        return "⚠ Tăng nhẹ — cần theo dõi chi phí."
    return "🔻 Doanh thu có dấu hiệu giảm — nên tối ưu tồn kho."

@router.get("/forecast")
def forecast():
    m1, m2, g = forecast_sma()

    return {
        "real": REAL_REVENUE,
        "forecast": [
            {"month": 1, "value": m1},
            {"month": 2, "value": m2}
        ],
        "summary": {
            "predicted_revenue": m1,
            "growth_rate": g,
            "suggestion": suggestion(g)
        }
    }
