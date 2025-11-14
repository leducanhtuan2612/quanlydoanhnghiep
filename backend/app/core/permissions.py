from fastapi import Depends, HTTPException, status
from app.routers.auth import get_current_user


def require_role(roles: list[str]):
    """
    Hàm kiểm tra quyền truy cập.
    Chỉ cho phép user có role nằm trong danh sách roles.
    """
    def wrapper(current_user=Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Bạn không có quyền truy cập tính năng này"
            )
        return current_user
    return wrapper
