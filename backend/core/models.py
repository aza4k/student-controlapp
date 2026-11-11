from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student'),
        ('TEACHER', 'Teacher'),
        ('ADMIN', 'Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='STUDENT')
    full_name = models.CharField(max_length=150, blank=True)
    group_name = models.CharField(max_length=50, blank=True, null=True, help_text="Masalan: SE-23")

    def __str__(self):
        return f"{self.username} ({self.role}) - {self.full_name or self.username}"


class Course(models.Model):
    title = models.CharField(max_length=200)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE, related_name='taught_courses')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.code}: {self.title}"


class Assignment(models.Model):
    LAB_TYPE_CHOICES = (
        ('NETWORK_LAB', 'Network Lab (Cisco-like)'),
        ('CODE_LAB', 'Code Lab (Programming)'),
        ('MATH_LAB', 'Math Lab (MATLAB-like)'),
        ('DATABASE_LAB', 'Database Lab (SQL)'),
    )

    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    title = models.CharField(max_length=255)
    description = models.TextField()
    lab_type = models.CharField(max_length=30, choices=LAB_TYPE_CHOICES, default='NETWORK_LAB')
    requirements_json = models.JSONField(default=dict, blank=True, help_text="Lab qoidalari va kutilayotgan holat")
    initial_config = models.JSONField(default=dict, blank=True, help_text="Boshlang'ich topologiya yoki shablon")
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.course.code} - {self.title}"


class Submission(models.Model):
    STATUS_CHOICES = (
        ('IN_PROGRESS', 'In Progress'),
        ('SUBMITTED', 'Submitted (Waiting Teacher Review)'),
        ('GRADED', 'Graded'),
    )

    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submissions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    
    started_at = models.DateTimeField(auto_now_add=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    work_time_seconds = models.PositiveIntegerField(default=0)
    
    # Talabaning yakuniy topologiyasi yoki natijasi
    final_state = models.JSONField(default=dict, blank=True)
    
    # AI tahlili natijasi
    ai_progress_percent = models.PositiveIntegerField(default=0)
    ai_errors_count = models.PositiveIntegerField(default=0)
    ai_corrected_errors = models.PositiveIntegerField(default=0)
    ai_functional_status = models.CharField(max_length=100, default="Not Verified")
    ai_summary = models.TextField(blank=True, help_text="AI tayyorlagan batafsil tahlil hisoboti")
    ai_analyzed_at = models.DateTimeField(null=True, blank=True)
    
    # Ustoz bahosi va izohi (Eng muhim prinsip: AI baho qo'ymaydi, ustoz qo'yadi)
    teacher_grade = models.FloatField(null=True, blank=True, help_text="Ustoz qo'ygan ball (masalan: 90/100)")
    teacher_feedback = models.TextField(blank=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('assignment', 'student')

    def __str__(self):
        return f"{self.student.username} - {self.assignment.title} ({self.status})"


class ActivityLog(models.Model):
    submission = models.ForeignKey(Submission, on_delete=models.CASCADE, related_name='activity_logs')
    timestamp = models.DateTimeField(auto_now_add=True)
    elapsed_seconds = models.PositiveIntegerField(default=0)
    
    action_type = models.CharField(max_length=60) # masalan: DEVICE_CREATED, CONNECTED, IP_CONFIGURED, PING_SENT
    target_device = models.CharField(max_length=100, blank=True)
    details = models.TextField(blank=True)
    
    is_error = models.BooleanField(default=False)
    error_type = models.CharField(max_length=100, blank=True)
    is_resolved = models.BooleanField(default=False)

    class Meta:
        ordering = ['timestamp']

    def __str__(self):
        return f"[{self.elapsed_seconds}s] {self.action_type} - {self.details[:50]}"
