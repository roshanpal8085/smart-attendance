import {useState, useEffect, useRef, useCallback} from 'react';
import {DEFAULT_WS_BASE_URL} from '../utils/constants';
import type {LiveSessionStatus} from '../types/api';
import {teacherApi} from '../services/teacherApi';

interface UseWebSocketOptions {
  sessionId: string | null;
  enabled?: boolean;
}

export function useWebSocket({sessionId, enabled = true}: UseWebSocketOptions) {
  const [liveStatus, setLiveStatus] = useState<LiveSessionStatus | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isUnmountedRef = useRef(false);

  // Fetch initial state via REST API as immediate baseline
  const fetchInitialStatus = useCallback(async () => {
    if (!sessionId) return;
    try {
      const data = await teacherApi.getSessionStatus(sessionId);
      if (!isUnmountedRef.current) {
        setLiveStatus(data);
      }
    } catch (err: any) {
      console.warn('[useWebSocket] Failed to fetch initial session status:', err);
    }
  }, [sessionId]);

  const connect = useCallback(() => {
    if (!sessionId || !enabled) return;

    const baseUrl = process.env.WS_BASE_URL || DEFAULT_WS_BASE_URL;
    const wsUrl = `${baseUrl}/ws/sessions/${sessionId}`;

    try {
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
      };

      socket.onmessage = (event) => {
        if (isUnmountedRef.current) return;
        try {
          const payload = JSON.parse(event.data);
          // If message is a full status update or student event
          if (payload.type === 'STATUS_UPDATE' || payload.session_id) {
            setLiveStatus(payload.data || payload);
          } else if (payload.type === 'STUDENT_MARKED') {
            setLiveStatus((prev) => {
              if (!prev) return prev;
              const updatedStudents = prev.students.map((st) =>
                st.student_id === payload.student.student_id
                  ? {...st, status: 'present' as const, marked_at: payload.student.marked_at}
                  : st,
              );
              return {
                ...prev,
                present_count: prev.present_count + 1,
                verifying_count: Math.max(0, prev.verifying_count - 1),
                students: updatedStudents,
              };
            });
          }
        } catch (parseErr) {
          console.warn('[useWebSocket] Parse error:', parseErr);
        }
      };

      socket.onerror = (e: any) => {
        if (isUnmountedRef.current) return;
        setError(e.message || 'WebSocket connection error');
      };

      socket.onclose = () => {
        if (isUnmountedRef.current) return;
        setIsConnected(false);

        // Attempt exponential backoff reconnect up to 5 times
        if (reconnectAttemptsRef.current < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    } catch (err: any) {
      setError(err?.message || 'Failed to establish WebSocket');
    }
  }, [sessionId, enabled]);

  useEffect(() => {
    isUnmountedRef.current = false;
    fetchInitialStatus();
    connect();

    return () => {
      isUnmountedRef.current = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [fetchInitialStatus, connect]);

  return {
    liveStatus,
    isConnected,
    error,
    refreshStatus: fetchInitialStatus,
  };
}
