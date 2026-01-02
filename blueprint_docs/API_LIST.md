
## API LIST (REST)

AUTH
POST /api/auth/login
POST /api/auth/otp

STUDENTS
POST /api/students
GET /api/students/{id}

ATTENDANCE
POST /api/attendance/mark
GET /api/attendance/student/{id}

AI CCTV
POST /api/ai/event
GET /api/ai/events

FEES
POST /api/fees/invoice
POST /api/fees/payment
