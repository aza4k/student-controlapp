const BASE_URL = '/api';

function getHeaders() {
  const token = localStorage.getItem('fundev_token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }
  return headers;
}

export const api = {
  async login(username, password) {
    const res = await fetch(`${BASE_URL}/auth/login/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.non_field_errors?.[0] || data.detail || 'Login xatosi');
    localStorage.setItem('fundev_token', data.token);
    localStorage.setItem('fundev_user', JSON.stringify(data.user));
    return data;
  },

  logout() {
    localStorage.removeItem('fundev_token');
    localStorage.removeItem('fundev_user');
  },

  getUser() {
    const u = localStorage.getItem('fundev_user');
    return u ? JSON.parse(u) : null;
  },

  async updateProfile(payload) {
    const res = await fetch(`${BASE_URL}/auth/me/`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Profilni yangilab bo‘lmadi');
    if (data.user) {
      localStorage.setItem('fundev_user', JSON.stringify(data.user));
    }
    return data;
  },

  async getNotifications() {
    const res = await fetch(`${BASE_URL}/notifications/`, { headers: getHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getStudentStats(studentId = null) {
    let url = `${BASE_URL}/student/stats/`;
    if (studentId) url += `?student_id=${studentId}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return null;
    return res.json();
  },

  async getCourses() {
    const res = await fetch(`${BASE_URL}/courses/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Kurslarni yuklab bo‘lmadi');
    return res.json();
  },

  async getAssignments(courseId = null) {
    let url = `${BASE_URL}/assignments/`;
    if (courseId) url += `?course_id=${courseId}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Topshiriqlarni yuklab bo‘lmadi');
    return res.json();
  },

  async createAssignment(payload) {
    const res = await fetch(`${BASE_URL}/assignments/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Topshiriq yaratib bo‘lmadi');
    return data;
  },

  async startSubmission(assignmentId, reopen = false) {
    const res = await fetch(`${BASE_URL}/submissions/start/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ assignment_id: assignmentId, reopen }),
    });
    if (!res.ok) throw new Error('Amaliyotni boshlab bo‘lmadi');
    return res.json();
  },

  async logActivity(submissionId, payload) {
    try {
      await fetch(`${BASE_URL}/submissions/${submissionId}/log/`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });
    } catch (_) {}
  },

  async submitAssignment(submissionId, finalState, workTimeSeconds) {
    const res = await fetch(`${BASE_URL}/submissions/${submissionId}/submit/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ final_state: finalState, work_time_seconds: workTimeSeconds }),
    });
    if (!res.ok) throw new Error('Topshirishda xatolik yuz berdi');
    return res.json();
  },

  async getSubmissionDetail(id) {
    const res = await fetch(`${BASE_URL}/submissions/${id}/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Topshiriq ma‘lumotini olib bo‘lmadi');
    return res.json();
  },

  async runCode(code, input = '') {
    const res = await fetch(`${BASE_URL}/code/run/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ code, input }),
    });
    if (!res.ok) throw new Error('Kodni bajarishda xatolik');
    return res.json();
  },

  async runSQL(query) {
    const res = await fetch(`${BASE_URL}/sql/run/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error('SQL so‘rovini bajarishda xatolik');
    return res.json();
  },

  async getTeacherSubmissions(group = '', status = '') {
    let url = `${BASE_URL}/teacher/submissions/?`;
    if (group && group !== 'Hammasi') url += `group=${encodeURIComponent(group)}&`;
    if (status && status !== 'Hammasi') {
      url += `status=${status === 'Baholangan' ? 'GRADED' : 'SUBMITTED'}&`;
    }
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Natijalarni olib bo‘lmadi');
    return res.json();
  },

  async gradeSubmission(submissionId, grade, feedback = '') {
    const res = await fetch(`${BASE_URL}/teacher/grade/${submissionId}/`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ grade: parseFloat(grade), feedback }),
    });
    if (!res.ok) throw new Error('Baholashda xatolik');
    return res.json();
  },

  async getStatistics() {
    const res = await fetch(`${BASE_URL}/statistics/`, { headers: getHeaders() });
    if (!res.ok) return {};
    return res.json();
  },

  async exportGradesCSV() {
    const res = await fetch(`${BASE_URL}/teacher/export/`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Eksport qilishda xatolik');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'fundev_grades_hemis.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getExportUrl() {
    return `${BASE_URL}/teacher/export/`;
  }
};
