from fastapi import Depends, HTTPException
from app.core.security import get_current_user


def require_role(roles: list):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(status_code=403, detail="Không đủ quyền truy cập")
        return current_user
    return role_checker
