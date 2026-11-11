from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, Course, Assignment, Submission, ActivityLog

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'full_name', 'group_name']


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError("Login yoki parol noto'g'ri!")
        data['user'] = user
        return data


class CourseSerializer(serializers.ModelSerializer):
    teacher_name = serializers.ReadOnlyField(source='teacher.full_name')

    class Meta:
        model = Course
        fields = ['id', 'title', 'code', 'description', 'teacher', 'teacher_name', 'created_at']


class AssignmentSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    course_code = serializers.ReadOnlyField(source='course.code')

    class Meta:
        model = Assignment
        fields = [
            'id', 'course', 'course_title', 'course_code',
            'title', 'description', 'lab_type',
            'requirements_json', 'initial_config', 'due_date', 'created_at'
        ]


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = [
            'id', 'timestamp', 'elapsed_seconds', 'action_type',
            'target_device', 'details', 'is_error', 'error_type', 'is_resolved'
        ]


class SubmissionSerializer(serializers.ModelSerializer):
    student = UserSerializer(read_only=True)
    assignment = AssignmentSerializer(read_only=True)
    activity_logs = ActivityLogSerializer(many=True, read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id', 'assignment', 'student', 'status',
            'started_at', 'submitted_at', 'work_time_seconds',
            'final_state',
            'ai_progress_percent', 'ai_errors_count', 'ai_corrected_errors',
            'ai_functional_status', 'ai_summary', 'ai_analyzed_at',
            'teacher_grade', 'teacher_feedback', 'graded_at',
            'activity_logs'
        ]


class GradeSubmissionSerializer(serializers.Serializer):
    grade = serializers.FloatField(min_value=0, max_value=100)
    feedback = serializers.CharField(required=False, allow_blank=True)
