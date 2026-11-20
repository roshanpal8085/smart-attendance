"""
Smart College Attendance System — Database Seeding Script
Populates the database with demo colleges, departments, classrooms,
BLE beacons, users (admin, teachers, students), subjects, sections,
enrollments, and timetables.

Usage:
    python scripts/seed_data.py
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, time, timezone
import uuid
from pathlib import Path

# Add project root and backend to path
ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "backend"))

# Load environment
try:
    from dotenv import load_dotenv
    load_dotenv(ROOT / "backend" / ".env")
    load_dotenv(ROOT / ".env")
except ImportError:
    pass

try:
    import psycopg
    from argon2 import PasswordHasher
except ImportError as exc:
    sys.exit(
        f"[error] Missing dependency: {exc}\n"
        "Run: pip install psycopg[binary] argon2-cffi python-dotenv"
    )

DATABASE_URL: str = os.environ.get(
    "DATABASE_URL",
    "postgresql://attendance_user:roshan@8962042946@127.0.0.1:5432/attendance_db",
)

# psycopg3 uses postgresql://, strip asyncio driver prefix if present
_conn_str = DATABASE_URL.replace("postgresql+psycopg://", "postgresql://")

ph = PasswordHasher()


def _now():
    return datetime.now(timezone.utc)


def _hash(password: str) -> str:
    return ph.hash(password)


def seed() -> None:
    print("\n══════════════════════════════════════════")
    print("  Smart Attendance — Database Seeder")
    print("══════════════════════════════════════════\n")

    with psycopg.connect(_conn_str) as conn:
        with conn.cursor() as cur:
            now = _now()

            # ── College ──────────────────────────────────────────
            print("▶ College")
            cur.execute("SELECT id FROM colleges WHERE code = 'DU'")
            row = cur.fetchone()
            if not row:
                college_id = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO colleges (id, name, code, address, city, state, country, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (college_id, "Demo University", "DU", "123 Campus Road", "Bangalore", "Karnataka", "India", now, now),
                )
                print("  [+] College: Demo University (DU)")
            else:
                college_id = row[0]
                print("  [~] College already exists: DU")

            # ── Departments ──────────────────────────────────────
            print("\n▶ Departments")
            cur.execute("SELECT id FROM departments WHERE code = 'CS' AND college_id = %s", (college_id,))
            row = cur.fetchone()
            if not row:
                cs_dept_id = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO departments (id, college_id, name, code, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (cs_dept_id, college_id, "Computer Science & Engineering", "CS", now, now),
                )
                print("  [+] Department: Computer Science (CS)")
            else:
                cs_dept_id = row[0]
                print("  [~] Department already exists: CS")

            cur.execute("SELECT id FROM departments WHERE code = 'EC' AND college_id = %s", (college_id,))
            row = cur.fetchone()
            if not row:
                ec_dept_id = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO departments (id, college_id, name, code, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    """,
                    (ec_dept_id, college_id, "Electronics & Communication", "EC", now, now),
                )
                print("  [+] Department: Electronics (EC)")
            else:
                ec_dept_id = row[0]
                print("  [~] Department already exists: EC")

            # ── Classrooms ───────────────────────────────────────
            print("\n▶ Classrooms")
            rooms = [
                ("CS-101", "CR-CS101", "CS Block", 1, 60, "BEACON"),
                ("CS-102", "CR-CS102", "CS Block", 1, 60, "TEACHER_PHONE"),
                ("EC-101", "CR-EC101", "EC Block", 1, 60, "BEACON"),
            ]
            room_ids = {}
            for name, code, bld, flr, cap, mode in rooms:
                cur.execute("SELECT id FROM classrooms WHERE code = %s", (code,))
                row = cur.fetchone()
                if not row:
                    rid = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO classrooms (id, name, code, building, floor, capacity, college_id, proximity_mode, is_active, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (rid, name, code, bld, flr, cap, college_id, mode, True, now, now),
                    )
                    room_ids[name] = rid
                    print(f"  [+] Classroom: {name} ({code}, mode={mode})")
                else:
                    room_ids[name] = row[0]
                    print(f"  [~] Classroom already exists: {name}")

            # ── BLE Beacons ──────────────────────────────────────
            print("\n▶ BLE Beacons")
            beacons_data = [
                (room_ids["CS-101"], "f47ac10b-58cc-4372-a567-0e02b2c3d479", 100, 1, "CS-101 Dedicated Beacon"),
                (room_ids["EC-101"], "6ba7b810-9dad-11d1-80b4-00c04fd430c8", 200, 1, "EC-101 Dedicated Beacon"),
            ]
            for room_id, b_uuid, major, minor, label in beacons_data:
                cur.execute("SELECT id FROM beacons WHERE uuid = %s", (b_uuid,))
                row = cur.fetchone()
                if not row:
                    cur.execute(
                        """
                        INSERT INTO beacons (id, uuid, major, minor, classroom_id, label, is_active, installed_at, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (uuid.uuid4(), b_uuid, major, minor, room_id, label, True, now, now, now),
                    )
                    print(f"  [+] BLE Beacon: {label} (uuid={b_uuid})")
                else:
                    print(f"  [~] Beacon already exists: {b_uuid}")

            # ── Admin User ────────────────────────────────────────
            print("\n▶ Admin user")
            cur.execute("SELECT id FROM users WHERE email = 'admin@demo.edu'")
            row = cur.fetchone()
            if not row:
                admin_id = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO users (id, email, password_hash, role, is_active, is_verified, full_name, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (admin_id, "admin@demo.edu", _hash("Admin@1234"), "ADMIN", True, True, "System Admin", now, now),
                )
                print("  [+] Admin user: admin@demo.edu (pw: Admin@1234)")
            else:
                admin_id = row[0]
                print("  [~] Admin already exists: admin@demo.edu")

            # ── Teacher Users & Profiles ──────────────────────────
            print("\n▶ Teachers")
            teacher_profile_ids = []
            teachers_data = [
                ("teacher1@demo.edu", "Dr. Alan Turing", "EMP001", "Professor", True),
                ("teacher2@demo.edu", "Dr. Ada Lovelace", "EMP002", "Associate Professor", False),
                ("teacher3@demo.edu", "Dr. Claude Shannon", "EMP003", "Assistant Professor", False),
            ]
            for email, name, emp_id, desig, is_hod in teachers_data:
                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
                if not row:
                    u_id = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO users (id, email, password_hash, role, is_active, is_verified, full_name, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (u_id, email, _hash("Teacher@1234"), "TEACHER", True, True, name, now, now),
                    )
                else:
                    u_id = row[0]

                cur.execute("SELECT id FROM teacher_profiles WHERE user_id = %s", (u_id,))
                tp_row = cur.fetchone()
                if not tp_row:
                    tp_id = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO teacher_profiles (id, user_id, college_id, department_id, employee_id, designation, is_hod, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (tp_id, u_id, college_id, cs_dept_id, emp_id, desig, is_hod, now, now),
                    )
                    teacher_profile_ids.append(tp_id)
                    print(f"  [+] Teacher: {name} ({email}, pw: Teacher@1234)")
                else:
                    teacher_profile_ids.append(tp_row[0])
                    print(f"  [~] Teacher already exists: {email}")

            # ── Student Users & Profiles ──────────────────────────
            print("\n▶ Students (10)")
            student_profile_ids = []
            for i in range(1, 11):
                email = f"student{i:02d}@demo.edu"
                roll = f"CS2026{i:03d}"
                enroll_num = f"ENR2026{i:04d}"
                name = f"Student {i:02d}"

                cur.execute("SELECT id FROM users WHERE email = %s", (email,))
                row = cur.fetchone()
                if not row:
                    u_id = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO users (id, email, password_hash, role, is_active, is_verified, full_name, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (u_id, email, _hash("Student@1234"), "STUDENT", True, True, name, now, now),
                    )
                else:
                    u_id = row[0]

                cur.execute("SELECT id FROM student_profiles WHERE user_id = %s", (u_id,))
                sp_row = cur.fetchone()
                if not sp_row:
                    sp_id = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO student_profiles (id, user_id, college_id, department_id, roll_number, enrollment_number, semester, section_name, year_of_admission, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (sp_id, u_id, college_id, cs_dept_id, roll, enroll_num, 5, "A", 2024, now, now),
                    )
                    student_profile_ids.append(sp_id)
                    print(f"  [+] Student: {name} ({email}, roll={roll}, pw: Student@1234)")
                else:
                    student_profile_ids.append(sp_row[0])
                    print(f"  [~] Student already exists: {email}")

            # ── Subjects ─────────────────────────────────────────
            print("\n▶ Subjects")
            subjects_data = [
                ("Data Structures & Algorithms", "CS301", cs_dept_id, 4, "theory", 5),
                ("Database Management Systems", "CS302", cs_dept_id, 4, "theory", 5),
                ("Digital Electronics", "EC201", ec_dept_id, 3, "theory", 3),
            ]
            subj_ids = {}
            for s_name, s_code, d_id, credits, s_type, sem in subjects_data:
                cur.execute("SELECT id FROM subjects WHERE code = %s AND department_id = %s", (s_code, d_id))
                row = cur.fetchone()
                if not row:
                    s_id = uuid.uuid4()
                    cur.execute(
                        """
                        INSERT INTO subjects (id, name, code, department_id, college_id, credits, type, semester, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (s_id, s_name, s_code, d_id, college_id, credits, s_type, sem, now, now),
                    )
                    subj_ids[s_code] = s_id
                    print(f"  [+] Subject: {s_name} ({s_code})")
                else:
                    subj_ids[s_code] = row[0]
                    print(f"  [~] Subject already exists: {s_code}")

            # ── Sections ─────────────────────────────────────────
            print("\n▶ Sections")
            cur.execute("SELECT id FROM sections WHERE name = 'A' AND department_id = %s AND semester = 5", (cs_dept_id,))
            row = cur.fetchone()
            if not row:
                cs_sec_a = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO sections (id, name, department_id, semester, year, max_students, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (cs_sec_a, "A", cs_dept_id, 5, 2026, 60, now, now),
                )
                print("  [+] Section: CSE - 5th Sem - Section A")
            else:
                cs_sec_a = row[0]
                print("  [~] Section already exists: CSE-A")

            # ── Enrollments ───────────────────────────────────────
            print("\n▶ Enrollments (Students → CS301 / Section A)")
            for sp_id in student_profile_ids:
                cur.execute(
                    "SELECT id FROM enrollments WHERE student_id = %s AND subject_id = %s AND section_id = %s",
                    (sp_id, subj_ids["CS301"], cs_sec_a),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO enrollments (id, student_id, subject_id, section_id, academic_year, is_active, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (uuid.uuid4(), sp_id, subj_ids["CS301"], cs_sec_a, "2026-2027", True, now, now),
                    )
            print(f"  [+] Enrolled {len(student_profile_ids)} students in CS301 (Section A)")

            # ── Teacher Assignment ────────────────────────────────
            print("\n▶ Teacher Assignment")
            cur.execute(
                "SELECT id FROM teacher_subject_assignments WHERE teacher_id = %s AND subject_id = %s AND section_id = %s",
                (teacher_profile_ids[0], subj_ids["CS301"], cs_sec_a),
            )
            row = cur.fetchone()
            if not row:
                assignment_id = uuid.uuid4()
                cur.execute(
                    """
                    INSERT INTO teacher_subject_assignments (id, teacher_id, subject_id, section_id, classroom_id, academic_year, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (assignment_id, teacher_profile_ids[0], subj_ids["CS301"], cs_sec_a, room_ids["CS-101"], "2026-2027", True, now, now),
                )
                print("  [+] Assigned Teacher 1 (Dr. Alan Turing) → CS301 / Sec A / Room CS-101")
            else:
                assignment_id = row[0]
                print("  [~] Teacher assignment already exists")

            # ── Timetable Slots ───────────────────────────────────
            print("\n▶ Timetable Slots (Mon-Fri 09:00 - 10:00)")
            for day in range(0, 5):  # 0=Monday .. 4=Friday
                cur.execute(
                    "SELECT id FROM timetable_slots WHERE teacher_subject_id = %s AND day_of_week = %s",
                    (assignment_id, day),
                )
                if not cur.fetchone():
                    cur.execute(
                        """
                        INSERT INTO timetable_slots (id, teacher_subject_id, day_of_week, start_time, end_time, academic_year, created_at, updated_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                        """,
                        (uuid.uuid4(), assignment_id, day, time(9, 0), time(10, 0), "2026-2027", now, now),
                    )
            print("  [+] Timetable configured: Mon-Fri 09:00 - 10:00")

        conn.commit()

    print("\n══════════════════════════════════════════")
    print("✓ Seeding complete! All demo data loaded.")
    print("══════════════════════════════════════════\n")


if __name__ == "__main__":
    seed()
