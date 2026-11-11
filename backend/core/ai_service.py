import os
import json
import requests
from typing import Dict, Any

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

def analyze_activity_logs(submission) -> Dict[str, Any]:
    logs = submission.activity_logs.all().order_by('elapsed_seconds', 'timestamp')
    final_state = submission.final_state or {}
    assignment = submission.assignment
    requirements = assignment.requirements_json or {}
    lab_type = assignment.lab_type

    error_logs = [l for l in logs if l.is_error]
    error_count = len(error_logs)
    resolved_errors = len([l for l in error_logs if l.is_resolved])

    log_lines = []
    for log in logs:
        err_mark = " [ERROR]" if log.is_error else ""
        res_mark = " [RESOLVED]" if log.is_resolved else ""
        log_lines.append(f"{log.elapsed_seconds}s: {log.action_type} on '{log.target_device}' - {log.details}{err_mark}{res_mark}")

    logs_text = "\n".join(log_lines) if log_lines else "Harakat qayd etilmadi."

    gemini_summary = None
    if GEMINI_API_KEY:
        try:
            gemini_summary = call_gemini_analysis(
                student_name=submission.student.full_name or submission.student.username,
                assignment_title=assignment.title,
                lab_type=lab_type,
                requirements=requirements,
                final_state=final_state,
                logs_text=logs_text,
                duration_sec=submission.work_time_seconds,
                error_count=error_count,
                resolved_errors=resolved_errors
            )
        except Exception:
            gemini_summary = None

    if not gemini_summary:
        if lab_type == 'CODE_LAB' or lab_type == 'MATH_LAB':
            gemini_summary = generate_code_lab_analysis(
                final_state=final_state,
                logs=logs,
                error_count=error_count,
                resolved_errors=resolved_errors,
                duration_sec=submission.work_time_seconds
            )
        elif lab_type == 'DATABASE_LAB':
            gemini_summary = generate_sql_lab_analysis(
                final_state=final_state,
                logs=logs,
                error_count=error_count,
                resolved_errors=resolved_errors,
                duration_sec=submission.work_time_seconds
            )
        else:
            gemini_summary = generate_network_lab_analysis(
                final_state=final_state,
                logs=logs,
                error_count=error_count,
                resolved_errors=resolved_errors,
                duration_sec=submission.work_time_seconds
            )

    progress_percent = gemini_summary.get("progress_percent", 85)
    functional_status = gemini_summary.get("functional_status", "Functional")
    summary_text = gemini_summary.get("summary_text", "")

    return {
        "progress_percent": progress_percent,
        "errors_count": error_count,
        "corrected_errors": resolved_errors,
        "functional_status": functional_status,
        "summary": summary_text
    }


def call_gemini_analysis(student_name, assignment_title, lab_type, requirements, final_state, logs_text, duration_sec, error_count, resolved_errors) -> Dict[str, Any]:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    
    prompt = f"""
Siz FunDev Practical Lab platformasining AI tahlilchisisiz.
QAT'IY QOIDA: Talabaga ball qo'ymang. Emojilardan foydalanmang.
Faqat talaba nima qilgani, qanday xatolar qilgani va ularni qanday tuzatgani haqida xolis hisobot bering.

Ma'lumotlar:
- Talaba: {student_name}
- Topshiriq: {assignment_title} ({lab_type})
- Talablar: {json.dumps(requirements, ensure_ascii=False)}
- Vaqt: {duration_sec // 60} daqiqa {duration_sec % 60} soniya
- Yakuniy holat: {json.dumps(final_state, ensure_ascii=False)}
- Activity Log:
{logs_text}

JSON formatda javob bering:
{{
  "progress_percent": 0 dan 100 gacha butun son,
  "functional_status": "Functional" yoki "Partly Functional" yoki "Non-functional",
  "summary_text": "O'zbek tilida xolis tahliliy hisobot (emojilarsiz)"
}}
"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "response_mime_type": "application/json"}
    }
    
    res = requests.post(url, json=payload, timeout=20)
    if res.status_code == 200:
        data = res.json()
        raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(raw_text)
    return None


def generate_network_lab_analysis(final_state, logs, error_count, resolved_errors, duration_sec) -> Dict[str, Any]:
    minutes = max(1, duration_sec // 60)
    devices = final_state.get("devices", [])
    connections = final_state.get("connections", [])
    has_successful_ping = any(l.action_type in ["PING_SUCCESS", "PING_SUCCESSFUL"] for l in logs)
    has_failed_ping = any(l.action_type in ["PING_FAILED", "CONFIG_ERROR"] for l in logs)

    progress = 40
    if len(devices) >= 3:
        progress += 25
    if len(connections) >= 2:
        progress += 20
    if has_successful_ping:
        progress += 15
    progress = min(100, max(15, progress))

    if has_successful_ping:
        functional_status = "Functional"
    elif len(devices) >= 2 and len(connections) >= 1:
        functional_status = "Partly Functional"
    else:
        functional_status = "Non-functional"

    summary_parts = [
        f"Talaba amaliyot ustida {minutes} daqiqa ishladi.",
        f"Topologiyada {len(devices)} ta tarmoq qurilmasi joylashtirilib, {len(connections)} ta aloqa liniyasi ulandi."
    ]
    
    if error_count > 0:
        summary_parts.append(f"Jarayon davomida {error_count} ta xato qayd etildi, ulardan {resolved_errors} tasi talaba tomonidan mustaqil bartaraf etildi.")
    else:
        summary_parts.append("Konfiguratsiya jarayonida xatoliklar kuzatilmadi.")

    if has_successful_ping:
        summary_parts.append("Yakuniy Ping sinovida paketlar muvaffaqiyatli yetib bordi (0% yo'qotish).")
    elif has_failed_ping:
        summary_parts.append("Ping testida paketlar uzilishi kuzatildi, tarmoq sozlamalari yakunlanmagan.")

    return {
        "progress_percent": progress,
        "functional_status": functional_status,
        "summary_text": " ".join(summary_parts)
    }


def generate_code_lab_analysis(final_state, logs, error_count, resolved_errors, duration_sec) -> Dict[str, Any]:
    minutes = max(1, duration_sec // 60)
    code = final_state.get("code", "")
    lines = len(code.splitlines()) if code else 0
    runs_count = len([l for l in logs if l.action_type == "CODE_RUN"])
    has_success_run = any(l.action_type == "CODE_SUCCESS" for l in logs)
    
    progress = 50
    if lines > 5:
        progress += 20
    if runs_count >= 1:
        progress += 15
    if has_success_run:
        progress += 15
    progress = min(100, max(15, progress))

    if has_success_run:
        functional_status = "Functional"
    elif runs_count > 0:
        functional_status = "Partly Functional"
    else:
        functional_status = "Non-functional"

    summary_parts = [
        f"Talaba {minutes} daqiqa davomida {lines} qatorli dastur kodi ustida ishladi va kodni {runs_count} marta ishga tushirdi."
    ]

    if error_count > 0:
        summary_parts.append(f"Ishlash jarayonida {error_count} ta sintaktik yoki mantiqiy xato yuzaga keldi, ulardan {resolved_errors} tasi tuzatildi.")
    else:
        summary_parts.append("Kodni ishga tushirishda xatoliklar qayd etilmadi.")

    if has_success_run:
        summary_parts.append("Dastur muvaffaqiyatli kompilatsiya bo'ldi va to'g'ri natija qaytardi.")
    else:
        summary_parts.append("Yakuniy urinishda dastur kutilgan natijani bermadi.")

    return {
        "progress_percent": progress,
        "functional_status": functional_status,
        "summary_text": " ".join(summary_parts)
    }


def generate_sql_lab_analysis(final_state, logs, error_count, resolved_errors, duration_sec) -> Dict[str, Any]:
    minutes = max(1, duration_sec // 60)
    query = final_state.get("query", "")
    runs_count = len([l for l in logs if l.action_type == "SQL_EXECUTE"])
    has_success = any(l.action_type == "SQL_SUCCESS" for l in logs)

    progress = 50
    if len(query.strip()) > 15:
        progress += 20
    if runs_count >= 1:
        progress += 15
    if has_success:
        progress += 15
    progress = min(100, max(15, progress))

    functional_status = "Functional" if has_success else ("Partly Functional" if runs_count > 0 else "Non-functional")

    summary_parts = [
        f"Talaba SQL laboratoriyasida {minutes} daqiqa ishladi va {runs_count} marta so'rov bajardi."
    ]
    if error_count > 0:
        summary_parts.append(f"SQL so'rovlarida {error_count} marta sintaktik xatolik kuzatildi va {resolved_errors} tasi to'g'rilandi.")
    if has_success:
        summary_parts.append("Yakuniy SQL so'rovi ma'lumotlar bazasidan to'g'ri yozuvlarni qaytardi.")

    return {
        "progress_percent": progress,
        "functional_status": functional_status,
        "summary_text": " ".join(summary_parts)
    }
