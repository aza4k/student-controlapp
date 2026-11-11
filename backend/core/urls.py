from django.urls import path
from .views import (
    LoginView, MeView, CourseListView,
    AssignmentListView, AssignmentDetailView,
    StartSubmissionView, AddActivityLogView, SubmitAssignmentView,
    SubmissionDetailView, TeacherSubmissionsListView, GradeSubmissionView,
    StatisticsView, RunCodeView, RunSQLView, StudentStatsView,
    NotificationListView, ExportGradesView
)

urlpatterns = [
    # Auth & Profile
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/me/', MeView.as_view(), name='me'),

    # Courses & Assignments
    path('courses/', CourseListView.as_view(), name='courses'),
    path('assignments/', AssignmentListView.as_view(), name='assignments'),
    path('assignments/<int:pk>/', AssignmentDetailView.as_view(), name='assignment-detail'),

    # Student Lab & Submissions
    path('submissions/start/', StartSubmissionView.as_view(), name='start-submission'),
    path('submissions/<int:submission_id>/log/', AddActivityLogView.as_view(), name='add-log'),
    path('submissions/<int:submission_id>/submit/', SubmitAssignmentView.as_view(), name='submit-assignment'),
    path('submissions/<int:pk>/', SubmissionDetailView.as_view(), name='submission-detail'),

    # Lab Runners
    path('code/run/', RunCodeView.as_view(), name='run-code'),
    path('sql/run/', RunSQLView.as_view(), name='run-sql'),

    # Stats & Notifications
    path('student/stats/', StudentStatsView.as_view(), name='student-stats'),
    path('notifications/', NotificationListView.as_view(), name='notifications'),

    # Teacher Review & Grading
    path('teacher/submissions/', TeacherSubmissionsListView.as_view(), name='teacher-submissions'),
    path('teacher/grade/<int:submission_id>/', GradeSubmissionView.as_view(), name='teacher-grade'),
    path('teacher/export/', ExportGradesView.as_view(), name='teacher-export'),

    # General Statistics
    path('statistics/', StatisticsView.as_view(), name='statistics'),
]
