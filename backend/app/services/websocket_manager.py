import json
import logging
import uuid
from typing import Any
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections subscribed to attendance sessions."""

    def __init__(self) -> None:
        # session_id (str) -> list of WebSocket connections
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, session_id: uuid.UUID | str, websocket: WebSocket) -> None:
        """Accept WebSocket connection and register listener for session."""
        await websocket.accept()
        key = str(session_id)
        if key not in self.active_connections:
            self.active_connections[key] = []
        self.active_connections[key].append(websocket)
        logger.info("Client connected to session WS %s. Total: %d", key, len(self.active_connections[key]))

    def disconnect(self, session_id: uuid.UUID | str, websocket: WebSocket) -> None:
        """Deregister disconnected WebSocket."""
        key = str(session_id)
        if key in self.active_connections:
            if websocket in self.active_connections[key]:
                self.active_connections[key].remove(websocket)
            if not self.active_connections[key]:
                del self.active_connections[key]
        logger.info("Client disconnected from session WS %s", key)

    async def broadcast(self, session_id: uuid.UUID | str, data: dict[str, Any]) -> None:
        """Broadcast JSON payload to all connected listeners of a session."""
        key = str(session_id)
        if key not in self.active_connections:
            return

        dead_connections = []
        for connection in list(self.active_connections[key]):
            try:
                await connection.send_json(data)
            except Exception as e:
                logger.warning("Failed to send WS message to client: %s", e)
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(key, dead)


ws_manager = ConnectionManager()
