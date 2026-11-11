import csv
from io import StringIO
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Avg, Count
from rest_framework import views, status, generics, permissions
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from .models import User, Course, Assignment, Submission, ActivityLog
from .serializers import (
    UserSerializer, LoginSerializer, CourseSerializer,
    AssignmentSerializer, SubmissionSerializer, ActivityLogSerializer,
    GradeSubmissionSerializer
)
from .ai_service import analyze_activity_logs
from .code_runner import execute_python_code
from .sql_runner import execute_sql_query

class LoginView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        full_name = request.data.get('full_name')
        email = request.data.get('email')
        new_password = request.data.get('new_password')

        if full_name:
            user.full_name = full_name
        if email:
            user.email = email
        if new_password and len(new_password) >= 6:
            user.set_password(new_password)
        user.save()

        return Response({
            'message': 'Profil muvaffaqiyatli yangilandi',
            'user': UserSerializer(user).data
        })


class CourseListView(generics.ListCreateAPIView):
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Course.objects.all()

    def perform_create(self, serializer):
        serializer.save(teacher=self.request.user)


class AssignmentListView(generics.ListCreateAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course_id')
        queryset = Assignment.objects.all().order_by('-created_at')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

    def create(self, request, *args, **kwargs):
        if request.user.role != 'TEACHER' and not request.user.is_staff:
            return Response({'error': 'Faqat o\'qituvchi yangi topshiriq yarata oladi!'}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)


class AssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class StartSubmissionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        assignment_id = request.data.get('assignment_id')
        reopen = request.data.get('reopen', False)
        if not assignment_id:
            return Response({'error': 'assignment_id talab qilinadi'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            assignment = Assignment.objects.get(id=assignment_id)
        except Assignment.DoesNotExist:
            return Response({'error': 'Topshiriq topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        submission, created = Submission.objects.get_or_create(
            assignment=assignment,
            student=request.user,
            defaults={'status': 'IN_PROGRESS'}
        )

        if reopen and submission.status in ['SUBMITTED', 'GRADED']:
            submission.status = 'IN_PROGRESS'
            submission.save()

        return Response(SubmissionSerializer(submission).data)


class AddActivityLogView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        try:
            submission = Submission.objects.get(id=submission_id, student=request.user)
        except Submission.DoesNotExist:
            return Response({'error': 'Topshiriq topilmadi yoki ruxsat yoq'}, status=status.HTTP_404_NOT_FOUND)

        data = request.data
        elapsed_seconds = data.get('elapsed_seconds', 0)
        action_type = data.get('action_type', 'GENERAL_ACTION')
        target_device = data.get('target_device', '')
        details = data.get('details', '')
        is_error = data.get('is_error', False)
        error_type = data.get('error_type', '')
        is_resolved = data.get('is_resolved', False)

        log = ActivityLog.objects.create(
            submission=submission,
            elapsed_seconds=elapsed_seconds,
            action_type=action_type,
            target_device=target_device,
            details=details,
            is_error=is_error,
            error_type=error_type,
            is_resolved=is_resolved
        )

        return Response(ActivityLogSerializer(log).data, status=status.HTTP_201_CREATED)


class SubmitAssignmentView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        try:
            submission = Submission.objects.get(id=submission_id, student=request.user)
        except Submission.DoesNotExist:
            return Response({'error': 'Topshiriq topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        final_state = request.data.get('final_state', {})
        work_time_seconds = request.data.get('work_time_seconds', submission.work_time_seconds)

        submission.final_state = final_state
        submission.work_time_seconds = work_time_seconds
        submission.submitted_at = timezone.now()
        submission.status = 'SUBMITTED'
        submission.save()

        # AI tahlilini ishga tushirish
        ai_res = analyze_activity_logs(submission)

        submission.ai_progress_percent = ai_res.get('progress_percent', 0)
        submission.ai_errors_count = ai_res.get('errors_count', 0)
        submission.ai_corrected_errors = ai_res.get('corrected_errors', 0)
        submission.ai_functional_status = ai_res.get('functional_status', 'N/A')
        submission.ai_summary = ai_res.get('summary', '')
        submission.ai_analyzed_at = timezone.now()
        submission.save()

        return Response(SubmissionSerializer(submission).data)


class SubmissionDetailView(generics.RetrieveAPIView):
    queryset = Submission.objects.all()
    serializer_class = SubmissionSerializer
    permission_classes = [permissions.IsAuthenticated]


class TeacherSubmissionsListView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        assignment_id = request.query_params.get('assignment_id')
        group_name = request.query_params.get('group')
        sub_status = request.query_params.get('status')

        submissions = Submission.objects.all().select_related('student', 'assignment', 'assignment__course').order_by('-submitted_at', '-started_at')

        if request.user.role != 'TEACHER' and not request.user.is_staff:
            submissions = submissions.filter(student=request.user)
        
        if assignment_id:
            submissions = submissions.filter(assignment_id=assignment_id)
        if group_name:
            submissions = submissions.filter(student__group_name=group_name)
        if sub_status:
            submissions = submissions.filter(status=sub_status)

        serializer = SubmissionSerializer(submissions, many=True)
        return Response(serializer.data)


class GradeSubmissionView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, submission_id):
        if request.user.role != 'TEACHER' and not request.user.is_staff:
            return Response({'error': 'Faqat o\'qituvchilar baholay oladi!'}, status=status.HTTP_403_FORBIDDEN)

        try:
            submission = Submission.objects.get(id=submission_id)
        except Submission.DoesNotExist:
            return Response({'error': 'Topshiriq topilmadi'}, status=status.HTTP_404_NOT_FOUND)

        serializer = GradeSubmissionSerializer(data=request.data)
        if serializer.is_valid():
            submission.teacher_grade = serializer.validated_data['grade']
            submission.teacher_feedback = serializer.validated_data.get('feedback', '')
            submission.graded_at = timezone.now()
            submission.status = 'GRADED'
            submission.save()

            return Response(SubmissionSerializer(submission).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RunCodeView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '')
        test_input = request.data.get('input', '')
        timeout = request.data.get('timeout', 4)

        if not code.strip():
            return Response({'error': 'Kod bo\'sh bo\'lishi mumkin emas'}, status=status.HTTP_400_BAD_REQUEST)

        result = execute_python_code(code, test_input=test_input, timeout_seconds=timeout)
        return Response(result)


class RunSQLView(views.APIView):
    """
    SQL / Database Lab uchun so'rovlarni bajarish APIsi.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        query = request.data.get('query', '')
        if not query.strip():
            return Response({'error': 'SQL so\'rovi bo\'sh bo\'lishi mumkin emas'}, status=status.HTTP_400_BAD_REQUEST)

        result = execute_sql_query(query)
        return Response(result)


class StudentStatsView(views.APIView):
    """
    Talaba uchun shaxsiy statistika (topshiriqlar soni, o'rtacha ball, xatolar tahlili).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        student_id = request.query_params.get('student_id')
        target_student = user
        if student_id and user.role == 'TEACHER':
            try:
                target_student = User.objects.get(id=student_id)
            except User.DoesNotExist:
                pass

        submissions = Submission.objects.filter(student=target_student)
        total = submissions.count()
        graded = submissions.filter(status='GRADED').count()
        avg_grade = submissions.filter(status='GRADED').aggregate(Avg('teacher_grade'))['teacher_grade__avg'] or 0
        avg_errors = submissions.aggregate(Avg('ai_errors_count'))['ai_errors_count__avg'] or 0

        return Response({
            'student_name': target_student.full_name or target_student.username,
            'group_name': target_student.group_name or 'SE-23',
            'total_submissions': total,
            'graded_submissions': graded,
            'average_grade': round(avg_grade, 1),
            'average_errors': round(avg_errors, 1),
        })


class NotificationListView(views.APIView):
    """
    Foydalanuvchi bildirishnomalari (dinamik va real).
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        notifications = []

        if user.role == 'STUDENT':
            # Baholangan ishlar haqida bildirishnoma
            graded_subs = Submission.objects.filter(student=user, status='GRADED').order_by('-graded_at')[:5]
            for sub in graded_subs:
                notifications.append({
                    'id': f"sub_{sub.id}",
                    'title': 'Amaliyot baholandi!',
                    'message': f"Ustoz '{sub.assignment.title}' ishingizga {int(sub.teacher_grade)} ball qo‘ydi.",
                    'time': sub.graded_at.strftime("%d.%m.%Y %H:%M") if sub.graded_at else "Yaqinda",
                    'type': 'grade',
                    'unread': False
                })

            # Yangi topshiriqlar
            new_assigns = Assignment.objects.all().order_by('-created_at')[:3]
            for a in new_assigns:
                notifications.append({
                    'id': f"assign_{a.id}",
                    'title': 'Yangi topshiriq yuklandi',
                    'message': f"{a.course.code}: {a.title}",
                    'time': a.created_at.strftime("%d.%m.%Y") if a.created_at else "Yaqinda",
                    'type': 'assignment',
                    'unread': True
                })
        else:
            # Ustoz uchun: yangi topshirilgan ishlar
            submitted_subs = Submission.objects.filter(status='SUBMITTED').order_by('-submitted_at')[:5]
            for sub in submitted_subs:
                notifications.append({
                    'id': f"sub_{sub.id}",
                    'title': 'Yangi amaliyot topshirildi',
                    'message': f"{sub.student.full_name or sub.student.username} '{sub.assignment.title}' ishini yakunladi.",
                    'time': sub.submitted_at.strftime("%d.%m.%Y %H:%M") if sub.submitted_at else "Yaqinda",
                    'type': 'submission',
                    'unread': True
                })

        return Response(notifications)


class ExportGradesView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'TEACHER' and not request.user.is_staff:
            return Response({'error': 'Ruxsat berilmagan'}, status=status.HTTP_403_FORBIDDEN)

        assignment_id = request.query_params.get('assignment_id')
        submissions = Submission.objects.all().select_related('student', 'assignment', 'assignment__course')
        if assignment_id:
            submissions = submissions.filter(assignment_id=assignment_id)

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(['Talaba ID', 'Talaba Ismi', 'Guruh', 'Fan', 'Topshiriq', 'Status', 'Progress %', 'Xatolar', 'Vaqt (daq)', 'Ustoz Bahosi'])

        for sub in submissions:
            student = sub.student
            assign = sub.assignment
            writer.writerow([
                student.username,
                student.full_name or student.username,
                student.group_name or 'N/A',
                assign.course.title,
                assign.title,
                sub.status,
                f"{sub.ai_progress_percent}%",
                sub.ai_errors_count,
                sub.work_time_seconds // 60,
                sub.teacher_grade if sub.teacher_grade is not None else 'Kutilmoqda'
            ])

        response = HttpResponse(output.getvalue(), content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="fundev_grades_hemis.csv"'
        return response


class StatisticsView(views.APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        total_students = User.objects.filter(role='STUDENT').count()
        total_submissions = Submission.objects.count()
        graded_submissions = Submission.objects.filter(status='GRADED').count()
        in_progress = Submission.objects.filter(status='IN_PROGRESS').count()
        submitted = Submission.objects.filter(status='SUBMITTED').count()

        avg_errors = Submission.objects.aggregate(Avg('ai_errors_count'))['ai_errors_count__avg'] or 0
        avg_grade = Submission.objects.filter(status='GRADED').aggregate(Avg('teacher_grade'))['teacher_grade__avg'] or 0

        groups_stat = User.objects.filter(role='STUDENT').values('group_name').annotate(
            count=Count('id')
        )

        return Response({
            'total_students': total_students,
            'total_submissions': total_submissions,
            'graded_submissions': graded_submissions,
            'in_progress': in_progress,
            'submitted': submitted,
            'average_errors': round(avg_errors, 1),
            'average_grade': round(avg_grade, 1),
            'groups': list(groups_stat),
        })
