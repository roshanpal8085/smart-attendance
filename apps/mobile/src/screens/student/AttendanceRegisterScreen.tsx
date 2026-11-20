import React, {useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Share,
  RefreshControl,
} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import Icon from 'react-native-vector-icons/Ionicons';
import dayjs from 'dayjs';
import {studentApi} from '../../services/studentApi';
import {AttendanceCalendar} from '../../components/student/AttendanceCalendar';
import {AttendanceBar} from '../../components/common/AttendanceBar';
import {AttendanceHistoryItem} from '../../components/student/AttendanceHistoryItem';
import {LoadingSpinner} from '../../components/common/LoadingSpinner';
import {EmptyState} from '../../components/common/EmptyState';
import {COLORS} from '../../utils/constants';
import type {StudentTabScreenProps} from '../../types/navigation';
import type {SubjectInfo, AttendanceDateMatrix, AttendanceSummary} from '../../types/api';

export const AttendanceRegisterScreen: React.FC<
  StudentTabScreenProps<'AttendanceTab'>
> = ({route}) => {
  const initialSubjectId = route.params?.subjectId;
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(
    initialSubjectId || null,
  );
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  // 1. Fetch Student Subjects
  const {data: subjects} = useQuery<SubjectInfo[]>({
    queryKey: ['studentSubjects'],
    queryFn: studentApi.getSubjects,
  });

  // Default to first subject when list loads
  const activeSubjectId =
    selectedSubjectId || (subjects && subjects[0]?.id) || '';

  // 2. Fetch Attendance Matrix for selected subject & month
  const {
    data: matrix = {},
    isLoading: isMatrixLoading,
    refetch: refetchMatrix,
    isRefetching: isMatrixRefetching,
  } = useQuery<AttendanceDateMatrix>({
    queryKey: [
      'attendanceMatrix',
      activeSubjectId,
      currentMonth.month() + 1,
      currentMonth.year(),
    ],
    queryFn: () =>
      studentApi.getAttendanceMatrix(
        activeSubjectId,
        currentMonth.month() + 1,
        currentMonth.year(),
      ),
    enabled: Boolean(activeSubjectId),
  });

  // 3. Fetch Summary for Subject
  const {data: summary} = useQuery<AttendanceSummary>({
    queryKey: ['attendanceSummary', activeSubjectId],
    queryFn: () => studentApi.getAttendanceSummary(activeSubjectId),
    enabled: Boolean(activeSubjectId),
  });

  // 4. Fetch History list for list view
  const {data: historyList = []} = useQuery({
    queryKey: ['attendanceHistory', activeSubjectId],
    queryFn: () =>
      studentApi.getAttendanceHistory({subject_id: activeSubjectId, limit: 30}),
    enabled: Boolean(activeSubjectId),
  });

  // Export Attendance to CSV Share Sheet
  const handleExportCSV = async () => {
    try {
      const activeSub = subjects?.find((s) => s.id === activeSubjectId);
      const subName = activeSub ? `${activeSub.code} - ${activeSub.name}` : 'Subject';

      let csvContent = `Date,Subject,Status\n`;
      Object.entries(matrix).forEach(([date, item]) => {
        csvContent += `${date},${subName},${item.status}\n`;
      });

      await Share.share({
        title: `${subName} Attendance Report`,
        message: csvContent,
      });
    } catch (err) {
      console.warn('Error sharing CSV export:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Subject Selector Bar */}
      <View style={styles.subjectBar}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.subjectScroll}>
          {subjects?.map((sub) => {
            const isSelected = sub.id === activeSubjectId;
            return (
              <TouchableOpacity
                key={sub.id}
                style={[
                  styles.subjectPill,
                  isSelected && styles.subjectPillSelected,
                ]}
                onPress={() => setSelectedSubjectId(sub.id)}
                activeOpacity={0.75}>
                <Text
                  style={[
                    styles.subjectPillText,
                    isSelected && styles.subjectPillTextSelected,
                  ]}>
                  {sub.code}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isMatrixRefetching}
            onRefresh={refetchMatrix}
            colors={[COLORS.primary]}
          />
        }>
        {/* Summary Card for active subject */}
        {summary && (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View>
                <Text style={styles.summaryTitle}>
                  {subjects?.find((s) => s.id === activeSubjectId)?.name || 'Course Attendance'}
                </Text>
                <Text style={styles.summarySub}>Academic Term Progress</Text>
              </View>

              <TouchableOpacity
                style={styles.exportButton}
                onPress={handleExportCSV}
                activeOpacity={0.8}>
                <Icon name="download-outline" size={16} color={COLORS.primary} />
                <Text style={styles.exportButtonText}>Export</Text>
              </TouchableOpacity>
            </View>

            <AttendanceBar percentage={summary.attendance_percentage} height={12} />

            <View style={styles.statsGrid}>
              <View style={styles.statCol}>
                <Text style={styles.statNumber}>{summary.total_classes}</Text>
                <Text style={styles.statCaption}>Conducted</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, {color: COLORS.success}]}>
                  {summary.attended_classes}
                </Text>
                <Text style={styles.statCaption}>Attended</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, {color: COLORS.error}]}>
                  {summary.absent_classes}
                </Text>
                <Text style={styles.statCaption}>Missed</Text>
              </View>
              <View style={styles.statCol}>
                <Text style={[styles.statNumber, {color: COLORS.warning}]}>
                  {summary.late_classes}
                </Text>
                <Text style={styles.statCaption}>Late</Text>
              </View>
            </View>
          </View>
        )}

        {/* View Mode Toggle (Calendar vs List) */}
        <View style={styles.toggleRow}>
          <Text style={styles.sectionHeading}>Register Record</Text>
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeOption,
                viewMode === 'calendar' && styles.modeOptionActive,
              ]}
              onPress={() => setViewMode('calendar')}
              activeOpacity={0.8}>
              <Icon
                name="calendar"
                size={14}
                color={viewMode === 'calendar' ? '#ffffff' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.modeOptionText,
                  viewMode === 'calendar' && styles.modeOptionTextActive,
                ]}>
                Calendar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeOption,
                viewMode === 'list' && styles.modeOptionActive,
              ]}
              onPress={() => setViewMode('list')}
              activeOpacity={0.8}>
              <Icon
                name="list"
                size={14}
                color={viewMode === 'list' ? '#ffffff' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.modeOptionText,
                  viewMode === 'list' && styles.modeOptionTextActive,
                ]}>
                List
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {isMatrixLoading ? (
          <LoadingSpinner message="Loading attendance register..." />
        ) : viewMode === 'calendar' ? (
          <AttendanceCalendar
            currentDate={currentMonth}
            matrix={matrix}
            onMonthChange={setCurrentMonth}
          />
        ) : (
          <View style={styles.listView}>
            {historyList.length > 0 ? (
              historyList.map((item) => (
                <AttendanceHistoryItem key={item.id} item={item} />
              ))
            ) : (
              <EmptyState
                icon="document-text-outline"
                title="No Records Found"
                description="No attendance entries recorded for this subject."
              />
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  subjectBar: {
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  subjectScroll: {
    paddingHorizontal: 12,
  },
  subjectPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  subjectPillSelected: {
    backgroundColor: COLORS.primary,
  },
  subjectPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subjectPillTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  summarySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  exportButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  statCol: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  statCaption: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 8,
    padding: 2,
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modeOptionActive: {
    backgroundColor: COLORS.primary,
  },
  modeOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: 4,
  },
  modeOptionTextActive: {
    color: '#ffffff',
  },
  listView: {
    marginTop: 8,
  },
});
