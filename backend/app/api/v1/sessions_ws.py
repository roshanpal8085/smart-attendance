import logging
import uuid
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.websocket_manager import ws_manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws/sessions/{session_id}")
async def session_live_websocket(
    websocket: WebSocket,
    session_id: uuid.UUID,
) -> None:
    """Real-time live WebSocket endpoint for attendance session progress."""
    await ws_manager.connect(session_id, websocket)
    try:
        while True:
            # Keep connection alive and accept any client pings / messages
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(session_id, websocket)
    except Exception as e:
        logger.warning("Session WS error on session %s: %s", session_id, e)
        ws_manager.disconnect(session_id, websocket)
