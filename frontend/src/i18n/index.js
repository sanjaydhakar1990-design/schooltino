import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      "app_name": "Schooltino",
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit",
      "add": "Add",
      "search": "Search",
      "filter": "Filter",
      "actions": "Actions",
      "status": "Status",
      "loading": "Loading...",
      "no_data": "No data found",
      "success": "Success",
      "error": "Error",
      "confirm": "Confirm",
      "back": "Back",
      "view": "View",
      "download": "Download",
      "print": "Print",
      
      // Auth
      "login": "Login",
      "logout": "Logout",
      "email": "Email",
      "password": "Password",
      "remember_me": "Remember me",
      "forgot_password": "Forgot password?",
      "welcome_back": "Welcome back",
      "login_subtitle": "Sign in to manage your school",
      
      // Navigation
      "dashboard": "Dashboard",
      "users": "User Accounts",
      "students": "Students",
      "staff": "Staff",
      "classes": "Classes",
      "attendance": "Attendance",
      "leave_management": "Leave Management",
      "fees": "Fees",
      "notices": "Notices",
      "ai_paper": "AI Paper Generator",
      "ai_content": "AI Content Studio",
      "voice_assistant": "Voice Assistant",
      "gallery": "Image Gallery",
      "sms_center": "SMS Center",
      "cctv_dashboard": "CCTV Dashboard",
      "website_integration": "Website Integration",
      "teachtino": "TeachTino",
      "school_analytics": "School Analytics",
      "settings": "Settings",
      "audit_logs": "Audit Logs",
      
      // Dashboard
      "total_students": "Total Students",
      "total_staff": "Total Staff",
      "total_classes": "Total Classes",
      "attendance_today": "Today's Attendance",
      "fee_collected": "Fee Collected",
      "pending_fees": "Pending Fees",
      "recent_notices": "Recent Notices",
      "recent_activities": "Recent Activities",
      "present": "Present",
      "absent": "Absent",
      "late": "Late",
      
      // Students
      "add_student": "Add Student",
      "student_name": "Student Name",
      "admission_no": "Admission No.",
      "class_section": "Class/Section",
      "father_name": "Father's Name",
      "mother_name": "Mother's Name",
      "dob": "Date of Birth",
      "gender": "Gender",
      "male": "Male",
      "female": "Female",
      "other": "Other",
      "address": "Address",
      "mobile": "Mobile",
      "blood_group": "Blood Group",
      
      // Staff
      "add_staff": "Add Staff",
      "employee_id": "Employee ID",
      "designation": "Designation",
      "department": "Department",
      "qualification": "Qualification",
      "joining_date": "Joining Date",
      "salary": "Salary",
      
      // Classes
      "add_class": "Add Class",
      "class_name": "Class Name",
      "section": "Section",
      "class_teacher": "Class Teacher",
      "student_count": "Student Count",
      
      // Attendance
      "mark_attendance": "Mark Attendance",
      "select_class": "Select Class",
      "select_date": "Select Date",
      "all_present": "Mark All Present",
      "all_absent": "Mark All Absent",
      "attendance_stats": "Attendance Statistics",
      
      // Fees
      "fee_plans": "Fee Plans",
      "invoices": "Invoices",
      "payments": "Payments",
      "create_invoice": "Create Invoice",
      "record_payment": "Record Payment",
      "amount": "Amount",
      "due_date": "Due Date",
      "paid": "Paid",
      "pending": "Pending",
      "overdue": "Overdue",
      "partial": "Partial",
      "discount": "Discount",
      "payment_mode": "Payment Mode",
      "cash": "Cash",
      "online": "Online",
      "cheque": "Cheque",
      
      // Notices
      "create_notice": "Create Notice",
      "title": "Title",
      "content": "Content",
      "priority": "Priority",
      "urgent": "Urgent",
      "high": "High",
      "normal": "Normal",
      "low": "Low",
      "target_audience": "Target Audience",
      "all": "All",
      "teachers": "Teachers",
      "parents": "Parents",
      
      // AI Paper Generator
      "generate_paper": "Generate Paper",
      "subject": "Subject",
      "chapter": "Chapter/Topic",
      "difficulty": "Difficulty",
      "easy": "Easy",
      "medium": "Medium",
      "hard": "Hard",
      "mixed": "Mixed",
      "question_types": "Question Types",
      "mcq": "Multiple Choice",
      "short_answer": "Short Answer",
      "long_answer": "Long Answer",
      "fill_blanks": "Fill in the Blanks",
      "total_marks": "Total Marks",
      "duration": "Duration (minutes)",
      "generating": "Generating paper...",
      "paper_ready": "Your paper is ready!",
      
      // Audit Logs
      "user": "User",
      "action": "Action",
      "module": "Module",
      "timestamp": "Timestamp",
      "details": "Details",
      
      // Roles
      "director": "Director",
      "principal": "Principal",
      "vice_principal": "Vice Principal",
      "teacher": "Teacher",
      "accountant": "Accountant",
      "exam_controller": "Exam Controller",
      
      // Messages
      "saved_successfully": "Saved successfully",
      "deleted_successfully": "Deleted successfully",
      "something_went_wrong": "Something went wrong",
      "confirm_delete": "Are you sure you want to delete this?",
      "no_permission": "You don't have permission for this action"
    }
  },
  hi: {
    translation: {
      // Common
      "app_name": "स्कूलटीनो",
      "save": "सहेजें",
      "cancel": "रद्द करें",
      "delete": "हटाएं",
      "edit": "संपादित करें",
      "add": "जोड़ें",
      "search": "खोजें",
      "filter": "फ़िल्टर",
      "actions": "कार्रवाई",
      "status": "स्थिति",
      "loading": "लोड हो रहा है...",
      "no_data": "कोई डेटा नहीं मिला",
      "success": "सफल",
      "error": "त्रुटि",
      "confirm": "पुष्टि करें",
      "back": "वापस",
      "view": "देखें",
      "download": "डाउनलोड",
      "print": "प्रिंट",
      
      // Auth
      "login": "लॉगिन",
      "logout": "लॉगआउट",
      "email": "ईमेल",
      "password": "पासवर्ड",
      "remember_me": "मुझे याद रखें",
      "forgot_password": "पासवर्ड भूल गए?",
      "welcome_back": "वापसी पर स्वागत है",
      "login_subtitle": "अपने स्कूल को प्रबंधित करने के लिए साइन इन करें",
      
      // Navigation
      "dashboard": "डैशबोर्ड",
      "users": "यूजर अकाउंट्स",
      "students": "छात्र",
      "staff": "कर्मचारी",
      "classes": "कक्षाएं",
      "attendance": "उपस्थिति",
      "leave_management": "छुट्टी प्रबंधन",
      "fees": "शुल्क",
      "notices": "सूचनाएं",
      "ai_paper": "AI पेपर जनरेटर",
      "ai_content": "AI कंटेंट स्टूडियो",
      "voice_assistant": "वॉइस असिस्टेंट",
      "gallery": "फोटो गैलरी",
      "sms_center": "SMS सेंटर",
      "cctv_dashboard": "CCTV डैशबोर्ड",
      "website_integration": "वेबसाइट कनेक्ट",
      "teachtino": "टीचटीनो",
      "settings": "सेटिंग्स",
      "audit_logs": "ऑडिट लॉग",
      
      // Dashboard
      "total_students": "कुल छात्र",
      "total_staff": "कुल कर्मचारी",
      "total_classes": "कुल कक्षाएं",
      "attendance_today": "आज की उपस्थिति",
      "fee_collected": "वसूल शुल्क",
      "pending_fees": "बकाया शुल्क",
      "recent_notices": "हाल की सूचनाएं",
      "recent_activities": "हाल की गतिविधियां",
      "present": "उपस्थित",
      "absent": "अनुपस्थित",
      "late": "देर से",
      
      // Students
      "add_student": "छात्र जोड़ें",
      "student_name": "छात्र का नाम",
      "admission_no": "प्रवेश संख्या",
      "class_section": "कक्षा/अनुभाग",
      "father_name": "पिता का नाम",
      "mother_name": "माता का नाम",
      "dob": "जन्म तिथि",
      "gender": "लिंग",
      "male": "पुरुष",
      "female": "महिला",
      "other": "अन्य",
      "address": "पता",
      "mobile": "मोबाइल",
      "blood_group": "रक्त समूह",
      
      // Staff
      "add_staff": "कर्मचारी जोड़ें",
      "employee_id": "कर्मचारी आईडी",
      "designation": "पदनाम",
      "department": "विभाग",
      "qualification": "योग्यता",
      "joining_date": "शामिल होने की तारीख",
      "salary": "वेतन",
      
      // Classes
      "add_class": "कक्षा जोड़ें",
      "class_name": "कक्षा का नाम",
      "section": "अनुभाग",
      "class_teacher": "क्लास टीचर",
      "student_count": "छात्र संख्या",
      
      // Attendance
      "mark_attendance": "उपस्थिति दर्ज करें",
      "select_class": "कक्षा चुनें",
      "select_date": "तारीख चुनें",
      "all_present": "सभी उपस्थित",
      "all_absent": "सभी अनुपस्थित",
      "attendance_stats": "उपस्थिति आंकड़े",
      
      // Fees
      "fee_plans": "शुल्क योजनाएं",
      "invoices": "बिल",
      "payments": "भुगतान",
      "create_invoice": "बिल बनाएं",
      "record_payment": "भुगतान दर्ज करें",
      "amount": "राशि",
      "due_date": "देय तिथि",
      "paid": "भुगतान",
      "pending": "बकाया",
      "overdue": "अतिदेय",
      "partial": "आंशिक",
      "discount": "छूट",
      "payment_mode": "भुगतान मोड",
      "cash": "नकद",
      "online": "ऑनलाइन",
      "cheque": "चेक",
      
      // Notices
      "create_notice": "सूचना बनाएं",
      "title": "शीर्षक",
      "content": "सामग्री",
      "priority": "प्राथमिकता",
      "urgent": "अत्यावश्यक",
      "high": "उच्च",
      "normal": "सामान्य",
      "low": "निम्न",
      "target_audience": "लक्षित दर्शक",
      "all": "सभी",
      "teachers": "शिक्षक",
      "parents": "अभिभावक",
      
      // AI Paper Generator
      "generate_paper": "पेपर बनाएं",
      "subject": "विषय",
      "chapter": "अध्याय/टॉपिक",
      "difficulty": "कठिनाई स्तर",
      "easy": "आसान",
      "medium": "मध्यम",
      "hard": "कठिन",
      "mixed": "मिश्रित",
      "question_types": "प्रश्न प्रकार",
      "mcq": "बहुविकल्पी",
      "short_answer": "लघु उत्तर",
      "long_answer": "दीर्घ उत्तर",
      "fill_blanks": "रिक्त स्थान भरें",
      "total_marks": "कुल अंक",
      "duration": "समय (मिनट)",
      "generating": "पेपर बन रहा है...",
      "paper_ready": "आपका पेपर तैयार है!",
      
      // Audit Logs
      "user": "उपयोगकर्ता",
      "action": "कार्रवाई",
      "module": "मॉड्यूल",
      "timestamp": "समय",
      "details": "विवरण",
      
      // Roles
      "director": "निदेशक",
      "principal": "प्राचार्य",
      "vice_principal": "उप प्राचार्य",
      "teacher": "शिक्षक",
      "accountant": "लेखाकार",
      "exam_controller": "परीक्षा नियंत्रक",
      
      // Messages
      "saved_successfully": "सफलतापूर्वक सहेजा गया",
      "deleted_successfully": "सफलतापूर्वक हटाया गया",
      "something_went_wrong": "कुछ गलत हो गया",
      "confirm_delete": "क्या आप इसे हटाना चाहते हैं?",
      "no_permission": "इस कार्रवाई के लिए अनुमति नहीं है"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
