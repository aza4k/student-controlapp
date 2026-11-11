import sqlite3

FORBIDDEN_ACTIONS = {
    getattr(sqlite3, 'SQLITE_ATTACH', 24),
    getattr(sqlite3, 'SQLITE_DETACH', 25),
    getattr(sqlite3, 'SQLITE_PRAGMA', 19),
}

def sqlite_authorizer(action, arg1, arg2, dbname, source):
    if action in FORBIDDEN_ACTIONS:
        return sqlite3.SQLITE_DENY
    return sqlite3.SQLITE_OK

def init_sample_database():
    conn = sqlite3.connect(":memory:")
    cursor = conn.cursor()

    cursor.executescript("""
        CREATE TABLE departments (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            faculty TEXT NOT NULL
        );

        INSERT INTO departments VALUES
        (1, 'Dasturiy Injiniring', 'Kompyuter Injiniringi'),
        (2, 'Suniy Intellekt', 'Kompyuter Injiniringi'),
        (3, 'Kiberxavfsizlik', 'Axborot Xavfsizligi');

        CREATE TABLE students (
            id INTEGER PRIMARY KEY,
            full_name TEXT NOT NULL,
            group_name TEXT NOT NULL,
            gpa REAL NOT NULL,
            department_id INTEGER,
            FOREIGN KEY (department_id) REFERENCES departments(id)
        );

        INSERT INTO students VALUES
        (1, 'Aliyev Aziz', 'SE-23', 4.8, 1),
        (2, 'Karimov Vali', 'SE-23', 3.9, 1),
        (3, 'Qodirov Sarvar', 'SE-23', 4.5, 1),
        (4, 'Toshmatova Madina', 'AI-21', 4.9, 2),
        (5, 'Rustamov Jasur', 'CS-22', 4.1, 3);

        CREATE TABLE courses (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            credits INTEGER NOT NULL
        );

        INSERT INTO courses VALUES
        (101, 'Kompyuter Tarmoqlari', 5),
        (102, 'Algoritmlar va Malumotlar Tuzilmasi', 6),
        (103, 'Malumotlar Bazasi (SQL)', 5);

        CREATE TABLE grades (
            id INTEGER PRIMARY KEY,
            student_id INTEGER,
            course_id INTEGER,
            score INTEGER,
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (course_id) REFERENCES courses(id)
        );

        INSERT INTO grades VALUES
        (1, 1, 101, 90),
        (2, 1, 102, 95),
        (3, 2, 101, 75),
        (4, 2, 102, 80),
        (5, 3, 101, 100),
        (6, 4, 103, 98);
    """)

    conn.commit()
    conn.set_authorizer(sqlite_authorizer)
    return conn

def execute_sql_query(query: str, max_rows: int = 50) -> dict:
    query = query.strip()
    if not query:
        return {'is_error': True, 'error': 'So‘rov matni bo‘sh bo‘lishi mumkin emas', 'columns': [], 'rows': []}

    try:
        conn = init_sample_database()
        cursor = conn.cursor()
        cursor.execute(query)

        if cursor.description:
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchmany(max_rows)
            serialized_rows = [list(r) for r in rows]
            row_count = len(serialized_rows)
            conn.close()
            return {
                'is_error': False,
                'columns': columns,
                'rows': serialized_rows,
                'row_count': row_count,
                'message': f"{row_count} ta qator qaytarildi"
            }
        else:
            conn.commit()
            changes = conn.total_changes
            conn.close()
            return {
                'is_error': False,
                'columns': ['Natija'],
                'rows': [[f"So‘rov muvaffaqiyatli bajarildi ({changes} ta o‘zgarish)"]],
                'row_count': changes,
                'message': "So‘rov muvaffaqiyatli yakunlandi"
            }
    except Exception as e:
        return {
            'is_error': True,
            'error': str(e),
            'columns': [],
            'rows': [],
            'row_count': 0
        }
