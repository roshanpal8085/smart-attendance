from fastapi import APIRouter

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.sessions_ws import router as ws_router
from app.api.v1.students import router as students_router
from app.api.v1.teachers import router as teachers_router

api_v1_router = APIRouter()

api_v1_router.include_router(auth_router)
api_v1_router.include_router(students_router)
api_v1_router.include_router(teachers_router)
api_v1_router.include_router(admin_router)
api_v1_router.include_router(ws_router)
