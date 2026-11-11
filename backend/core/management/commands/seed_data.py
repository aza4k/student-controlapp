from django.core.management.base import BaseCommand
from django.utils import timezone
from core.models import User, Course, Assignment, Submission, ActivityLog
from rest_framework.authtoken.models import Token

class Command(BaseCommand):
    help = 'Demo malumotlarni bazaga yuklaydi'

    def handle(self, *args, **kwargs):
        teachers_info = [
            ('ustoz', '123', 'Prof. Rustam Rahimov'),
            ('teacher_01', 'teacher123', 'Prof. Rustam Rahimov'),
        ]
        teachers = []
        for username, pwd, full_name in teachers_info:
            t, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'role': 'TEACHER',
                    'full_name': full_name,
                    'email': f'{username}@fundev.uz',
                    'is_staff': True
                }
            )
            t.set_password(pwd)
            t.save()
            Token.objects.get_or_create(user=t)
            teachers.append(t)

        teacher = teachers[0]

        students_info = [
            ('student1', '123', 'Aliyev Aziz', 'SE-23'),
            ('student_024', 'student123', 'Aliyev Aziz', 'SE-23'),
            ('student_025', 'student123', 'Karimov Vali', 'SE-23'),
            ('student_026', 'student123', 'Qodirov Sarvar', 'SE-23'),
        ]
        students = []
        for username, pwd, full_name, group in students_info:
            stu, _ = User.objects.get_or_create(
                username=username,
                defaults={
                    'role': 'STUDENT',
                    'full_name': full_name,
                    'group_name': group,
                    'email': f'{username}@fundev.uz'
                }
            )
            stu.set_password(pwd)
            stu.save()
            Token.objects.get_or_create(user=stu)
            students.append(stu)

        course_net, _ = Course.objects.get_or_create(
            code='CN-201',
            defaults={
                'title': 'Computer Networks & Telecommunications',
                'description': 'Tarmoq protokollari, Cisco topologiyalari, routing va kommutatsiya asoslari.',
                'teacher': teacher
            }
        )

        course_cs, _ = Course.objects.get_or_create(
            code='CS-102',
            defaults={
                'title': 'Dasturlash va Algoritmlar',
                'description': 'Algoritmlar, malumotlar tuzilmalari, SQL va matematik modellashtirish.',
                'teacher': teacher
            }
        )

        assign1, _ = Assignment.objects.get_or_create(
            course=course_net,
            title='Amaliy 1: Cisco network topology yaratish',
            defaults={
                'description': '2 ta PC va 1 ta Switch ulab, IP manzillarni (192.168.1.10 va 192.168.1.20) sozlang hamda Ping testidan oting.',
                'lab_type': 'NETWORK_LAB',
                'requirements_json': {
                    'required_devices': ['PC1', 'PC2', 'Switch1'],
                    'subnet': '192.168.1.0/24',
                },
            }
        )

        Assignment.objects.get_or_create(
            course=course_cs,
            title='Amaliy 2: Massivlarni tartiblash algoritmlari (Code Lab)',
            defaults={
                'description': 'Python tilida QuickSort algoritmini yozing va test massivi ustida ishga tushiring.',
                'lab_type': 'CODE_LAB',
                'requirements_json': {'language': 'python'},
            }
        )

        Assignment.objects.get_or_create(
            course=course_cs,
            title='Amaliy 3: Relyatsion bazalar va SQL JOIN sorovlari (SQL Lab)',
            defaults={
                'description': 'Talabalar va kafedralar jadvallarini LEFT JOIN orqali birlashtirib, GPA boyicha saralang.',
                'lab_type': 'DATABASE_LAB',
                'requirements_json': {'engine': 'sqlite'},
            }
        )

        Assignment.objects.get_or_create(
            course=course_cs,
            title='Amaliy 4: Matritsalar va Chiziqli Algebra (Math Lab)',
            defaults={
                'description': 'Ikki olchovli matritsalarni kopaytirish va determinantni hisoblash dasturini tuzing.',
                'lab_type': 'MATH_LAB',
                'requirements_json': {'engine': 'python_math'},
            }
        )

        sub1, _ = Submission.objects.get_or_create(
            assignment=assign1,
            student=students[0],
            defaults={
                'status': 'SUBMITTED',
                'work_time_seconds': 1920,
                'submitted_at': timezone.now(),
                'final_state': {
                    'devices': [
                        {'id': 'pc_1', 'type': 'PC', 'name': 'PC1', 'ip': '192.168.1.10', 'subnet': '255.255.255.0', 'gateway': '192.168.1.1', 'x': 120, 'y': 180},
                        {'id': 'sw_1', 'type': 'Switch', 'name': 'Switch1', 'x': 380, 'y': 180, 'ip': '', 'subnet': '', 'gateway': ''},
                        {'id': 'pc_2', 'type': 'PC', 'name': 'PC2', 'ip': '192.168.1.20', 'subnet': '255.255.255.0', 'gateway': '192.168.1.1', 'x': 640, 'y': 180},
                    ],
                    'connections': [
                        {'from': 'pc_1', 'to': 'sw_1'},
                        {'from': 'sw_1', 'to': 'pc_2'}
                    ]
                },
                'ai_progress_percent': 90,
                'ai_errors_count': 2,
                'ai_corrected_errors': 2,
                'ai_functional_status': 'Functional',
                'ai_summary': 'Talaba tarmoq konfiguratsiyasida 2 ta xatoga yol qoydi va ularni mustaqil tuzatdi. Yakuniy Ping testi muvaffaqiyatli (0% loss) yakunlandi.',
                'ai_analyzed_at': timezone.now()
            }
        )

        ActivityLog.objects.filter(submission=sub1).delete()
        logs_data = [
            (60, 'DEVICE_CREATED', 'PC1', 'PC1 tarmoq maydoniga joylashtirildi', False, '', False),
            (120, 'CONNECTED', 'PC1-Switch1', 'FastEthernet kabel ulandi', False, '', False),
            (240, 'CONFIG_ERROR', 'PC2', 'IP Conflict qayd etildi: 192.168.1.10', True, 'IP_CONFLICT', False),
            (310, 'IP_CONFIGURED', 'PC2', 'IP manzil 192.168.1.20 ga ozgartirildi', False, '', True),
            (400, 'PING_SUCCESS', 'PC1->PC2', 'Ping 192.168.1.20 muvaffaqiyatli: 0% loss', False, '', True),
        ]
        for elapsed, atype, target, details, is_err, err_type, is_res in logs_data:
            ActivityLog.objects.create(
                submission=sub1,
                elapsed_seconds=elapsed,
                action_type=atype,
                target_device=target,
                details=details,
                is_error=is_err,
                error_type=err_type,
                is_resolved=is_res
            )

        self.stdout.write(self.style.SUCCESS("Boshlangich malumotlar muvaffaqiyatli yuklandi."))
