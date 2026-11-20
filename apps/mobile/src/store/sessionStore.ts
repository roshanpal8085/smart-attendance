import {create} from 'zustand';
import type {AttendanceSession} from '../types/api';

export interface SessionState {
  activeSession: AttendanceSession | null;
  isAdvertising: boolean;
  attendanceMarked: boolean;
  setActiveSession: (session: AttendanceSession | null) => void;
  setAdvertising: (val: boolean) => void;
  setAttendanceMarked: (val: boolean) => void;
  resetSession: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  activeSession: null,
  isAdvertising: false,
  attendanceMarked: false,

  setActiveSession: (session: AttendanceSession | null) => {
    set({
      activeSession: session,
      attendanceMarked: false,
    });
  },

  setAdvertising: (val: boolean) => {
    set({isAdvertising: val});
  },

  setAttendanceMarked: (val: boolean) => {
    set({attendanceMarked: val});
  },

  resetSession: () => {
    set({
      activeSession: null,
      isAdvertising: false,
      attendanceMarked: false,
    });
  },
}));
