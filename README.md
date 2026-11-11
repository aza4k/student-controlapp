# FunDev Practical Lab — Virtual Practical Learning Platform

Amaliy mashg‘ulotlarni (Cisco Network Lab, Python Code Lab, Database SQL Lab, Math Simulation Lab) yagona muhitda bajarish, talaba harakatlarini (Activity Log) real vaqtda qayd etish, avtomatik tahlil qilish va o‘qituvchi baholashi uchun mo‘ljallangan veb-platforma.

## Arxitektura

- **Frontend (`web/`):** React 19, Vite, Tailwind CSS v4, Lucide Icons
- **Backend (`backend/`):** Django REST Framework, Token Authentication, Isolated Python & SQLite Sandboxes

## Ishga Tushirish

### 1. Backend (Django)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver 127.0.0.1:8000
```

### 2. Frontend (React + Vite)

```bash
cd web
npm install
npm run dev
```

Brauzerda ochish: `http://localhost:3000`

## Demo Hisoblar

- **Talaba:** Login: `student1` | Parol: `123`
- **O‘qituvchi:** Login: `ustoz` | Parol: `123`
