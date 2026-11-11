import sys
import subprocess
import tempfile
import os

FORBIDDEN_PATTERNS = [
    'import os',
    'from os',
    'import subprocess',
    'from subprocess',
    'import shutil',
    'from shutil',
    'import socket',
    'from socket',
    'import urllib',
    'import requests',
    'import pathlib',
    '__import__',
    'eval(',
    'exec(',
    'open(',
    'compile(',
]

def execute_python_code(code: str, test_input: str = "", timeout_seconds: int = 4) -> dict:
    timeout_seconds = max(1, min(int(timeout_seconds or 4), 5))
    lowered = code.lower()
    for pattern in FORBIDDEN_PATTERNS:
        if pattern in lowered:
            return {
                'stdout': '',
                'stderr': f"SecurityError: '{pattern}' xavfsizlik sababli sandbox muhitida taqiqlangan.",
                'exit_code': 1,
                'is_error': True,
                'error_type': 'SECURITY_VIOLATION',
                'message': 'Xavfsizlik cheklovi'
            }

    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file_path = f.name

    try:
        safe_env = {
            'PYTHONIOENCODING': 'utf-8',
            'PYTHONDONTWRITEBYTECODE': '1',
        }
        if 'SYSTEMROOT' in os.environ:
            safe_env['SYSTEMROOT'] = os.environ['SYSTEMROOT']

        process = subprocess.Popen(
            [sys.executable, '-I', temp_file_path],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            env=safe_env
        )

        stdout, stderr = process.communicate(input=test_input, timeout=timeout_seconds)
        exit_code = process.returncode

        is_error = exit_code != 0
        return {
            'stdout': stdout[:10000],
            'stderr': stderr[:10000],
            'exit_code': exit_code,
            'is_error': is_error,
            'error_type': 'Runtime/Syntax Error' if is_error else '',
            'message': 'Muvaffaqiyatli bajarildi' if not is_error else 'Xatolik yuz berdi'
        }
    except subprocess.TimeoutExpired:
        process.kill()
        return {
            'stdout': '',
            'stderr': f"TimeLimitExceeded: Kod {timeout_seconds} soniyadan ko'p ishladi.",
            'exit_code': -1,
            'is_error': True,
            'error_type': 'TIMEOUT',
            'message': 'Vaqt chegarasi oshib ketdi'
        }
    except Exception as e:
        return {
            'stdout': '',
            'stderr': str(e),
            'exit_code': -1,
            'is_error': True,
            'error_type': 'SYSTEM_ERROR',
            'message': str(e)
        }
    finally:
        if os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except OSError:
                pass
