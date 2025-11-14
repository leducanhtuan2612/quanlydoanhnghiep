# app/routers/settings.py
from typing import Dict, Optional
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Body, status
from sqlalchemy.orm import Session

from app import models, database

router = APIRouter(prefix="/settings", tags=["settings"])
get_db = database.get_db

# Các key mặc định và giá trị default
DEFAULTS: Dict[str, Optional[str]] = {
    "company_name": "Công ty TNHH ABC",
    "email": "contact@example.com",
    "phone": "0123456789",
    "address": "Hà Nội, Việt Nam",
    "theme_color": "#2563eb",
    "logo_url": "",   # để rỗng nếu chưa có
}

ALLOWED_IMAGE_SUFFIXES = {".png", ".jpg", ".jpeg", ".webp", ".gif"}


def _load_settings(db: Session) -> Dict[str, Optional[str]]:
    rows = db.query(models.Setting).all()
    kv = {r.key: (r.value if r.value is not None else "") for r in rows}
    # merge defaults (chỉ bổ sung key chưa có)
    for k, v in DEFAULTS.items():
        kv.setdefault(k, v)
    return kv


def _upsert_setting(db: Session, key: str, value: Optional[str]) -> None:
    row = db.query(models.Setting).filter(models.Setting.key == key).first()
    if row:
        row.value = value
    else:
        row = models.Setting(key=key, value=value)
        db.add(row)


# =========================
#         ENDPOINTS
# =========================

# ✅ GET trả về map key->value (đã merge với default)
@router.get("", response_model=Dict[str, Optional[str]], status_code=status.HTTP_200_OK)
def get_settings(db: Session = Depends(get_db)):
    return _load_settings(db)


# ✅ PUT bulk update (truyền bất kỳ field nào trong số các key chuẩn)
# Ví dụ body:
# {
#   "company_name": "Công ty A",
#   "email": "a@example.com",
#   "theme_color": "#ff0000"
# }
@router.put("", response_model=Dict[str, Optional[str]], status_code=status.HTTP_200_OK)
def update_settings(
    payload: Dict[str, Optional[str]] = Body(..., description="Key-value của settings cần cập nhật"),
    db: Session = Depends(get_db),
):
    if not isinstance(payload, dict):
        raise HTTPException(status_code=400, detail="Payload phải là object JSON (key-value).")

    # Chỉ nhận các key đã xác định trong DEFAULTS (tránh rác)
    for k, v in payload.items():
        if k not in DEFAULTS:
            raise HTTPException(status_code=400, detail=f"Key không hợp lệ: {k}")
        _upsert_setting(db, k, "" if v is None else str(v))

    db.commit()
    return _load_settings(db)


# ✅ Upload logo: lưu vào static/images và cập nhật logo_url
@router.post("/upload-logo", status_code=status.HTTP_200_OK)
def upload_logo(file: UploadFile = File(...), db: Session = Depends(get_db)):
    media_dir = Path("static/images")
    media_dir.mkdir(parents=True, exist_ok=True)

    suffix = Path(file.filename).suffix.lower()
    if suffix not in ALLOWED_IMAGE_SUFFIXES:
        raise HTTPException(status_code=400, detail="Định dạng ảnh không hợp lệ")

    save_name = f"logo{suffix}"
    save_path = media_dir / save_name

    # Ghi file
    with open(save_path, "wb") as f:
        f.write(file.file.read())

    # URL public (hãy mount StaticFiles trong main.py như ghi chú bên dưới)
    url = f"/images/{save_name}"
    _upsert_setting(db, "logo_url", url)
    db.commit()
    return {"url": url}
