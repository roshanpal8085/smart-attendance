import type {NavigatorScreenParams} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {BottomTabScreenProps} from '@react-navigation/bottom-tabs';
import type {CompositeScreenProps} from '@react-navigation/native';
import type {AttendanceSession} from './api';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  StudentApp: NavigatorScreenParams<StudentTabParamList>;
  TeacherApp: NavigatorScreenParams<TeacherTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  ForgotPassword: {email?: string} | undefined;
};

export type StudentDashboardStackParamList = {
  StudentDashboard: undefined;
  Proximity: {
    session?: AttendanceSession;
    classroomBeaconUuid?: string;
  } | undefined;
  MarkAttendance: {
    session: AttendanceSession;
    initialRssi?: number;
  };
};

export type StudentTabParamList = {
  DashboardTab: NavigatorScreenParams<StudentDashboardStackParamList>;
  TimetableTab: undefined;
  AttendanceTab: {subjectId?: string} | undefined;
  ProfileTab: undefined;
};

export type TeacherSessionStackParamList = {
  StartSession: undefined;
  LiveSession: {
    sessionId: string;
    session: AttendanceSession;
  };
};

export type TeacherTabParamList = {
  DashboardTab: undefined;
  StartSessionTab: NavigatorScreenParams<TeacherSessionStackParamList>;
  HistoryTab: undefined;
  ProfileTab: undefined;
};

// Screen props helpers
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type AuthScreenProps<T extends keyof AuthStackParamList> =
  NativeStackScreenProps<AuthStackParamList, T>;

export type StudentDashboardScreenProps<
  T extends keyof StudentDashboardStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<StudentDashboardStackParamList, T>,
  BottomTabScreenProps<StudentTabParamList>
>;

export type StudentTabScreenProps<T extends keyof StudentTabParamList> =
  BottomTabScreenProps<StudentTabParamList, T>;

export type TeacherSessionScreenProps<
  T extends keyof TeacherSessionStackParamList,
> = CompositeScreenProps<
  NativeStackScreenProps<TeacherSessionStackParamList, T>,
  BottomTabScreenProps<TeacherTabParamList>
>;

export type TeacherTabScreenProps<T extends keyof TeacherTabParamList> =
  BottomTabScreenProps<TeacherTabParamList, T>;
