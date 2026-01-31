# SchoolTino AI Paper Generator - API Documentation for n8n Workflow

## 🔑 API Endpoint

**Base URL:** `https://learnportal-132.preview.emergentagent.com`  
**Endpoint:** `POST /api/ai/generate-paper`  
**Authentication:** Bearer Token (JWT)

---

## 📋 Step 1: Login to Get Token

### Request:
```bash
curl -X POST "https://learnportal-132.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "director@test.com",
    "password": "test1234"
  }'
```

### Response:
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": "user-id",
    "name": "Director Name",
    "role": "director"
  }
}
```

**Save the `token` value for next requests!**

---

## 📝 Step 2: Generate Question Paper

### Request Format:

```bash
curl -X POST "https://learnportal-132.preview.emergentagent.com/api/ai/generate-paper" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "subject": "विज्ञान",
    "class_name": "Class 8",
    "chapter": "फसल उत्पादन एवं प्रबंध, सूक्ष्मजीव",
    "chapters": ["फसल उत्पादन एवं प्रबंध", "सूक्ष्मजीव: मित्र एवं शत्रु"],
    "exam_name": "Unit Test 1",
    "difficulty": "moderate",
    "question_types": ["mcq", "short", "long", "diagram"],
    "total_marks": 50,
    "time_duration": 120,
    "language": "hindi",
    "include_all_chapters": false
  }'
```

---

## 📥 Request Parameters (JSON Body):

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `subject` | string | ✅ Yes | Subject name (Hindi or English) | `"विज्ञान"` or `"Science"` |
| `class_name` | string | ✅ Yes | Class name | `"Class 8"`, `"Class 10"` |
| `chapter` | string | ✅ Yes | Comma-separated chapter names | `"Chapter 1, Chapter 2"` |
| `chapters` | array | No | List of specific chapters | `["Chapter 1", "Chapter 2"]` |
| `exam_name` | string | No | Name of exam | `"Half Yearly"`, `"Unit Test 1"` |
| `difficulty` | string | ✅ Yes | Difficulty level | `"easy"`, `"moderate"`, `"hard"` |
| `question_types` | array | ✅ Yes | Types of questions to include | `["mcq", "short", "long", "diagram"]` |
| `total_marks` | integer | ✅ Yes | Total marks for paper | `50`, `80`, `100` |
| `time_duration` | integer | ✅ Yes | Duration in minutes | `60`, `120`, `180` |
| `language` | string | ✅ Yes | Paper language | `"hindi"` or `"english"` |
| `include_all_chapters` | boolean | No | Include all chapters of subject | `true` or `false` |

---

## 📤 Response Format:

```json
{
  "id": "paper-uuid-here",
  "subject": "विज्ञान",
  "class_name": "Class 8",
  "chapter": "फसल उत्पादन एवं प्रबंध, सूक्ष्मजीव",
  "exam_name": "Unit Test 1",
  "questions": [
    {
      "type": "mcq",
      "question": "पौधों में प्रकाश संश्लेषण की प्रक्रिया क्या है?",
      "options": ["(a) विकल्प 1", "(b) विकल्प 2", "(c) विकल्प 3", "(d) विकल्प 4"],
      "answer": "(c) विकल्प 3 - व्याख्या",
      "marks": 1,
      "difficulty": "easy"
    },
    {
      "type": "short",
      "question": "प्रकाश संश्लेषण की प्रक्रिया को समझाइए।",
      "answer": "प्रकाश संश्लेषण वह प्रक्रिया है जिसमें...",
      "marks": 3,
      "difficulty": "medium"
    }
  ],
  "total_marks": 50,
  "generated_at": "2025-01-25T03:00:00Z"
}
```

---

## 🎯 n8n Workflow Setup:

### Node 1: HTTP Request (Login)
- **Method:** POST
- **URL:** `https://learnportal-132.preview.emergentagent.com/api/auth/login`
- **Body:**
```json
{
  "email": "director@test.com",
  "password": "test1234"
}
```
- **Extract:** `{{ $json.token }}` → Save to variable

### Node 2: HTTP Request (Generate Paper)
- **Method:** POST
- **URL:** `https://learnportal-132.preview.emergentagent.com/api/ai/generate-paper`
- **Headers:**
  - `Content-Type`: `application/json`
  - `Authorization`: `Bearer {{ $node["Login"].json.token }}`
- **Body:**
```json
{
  "subject": "विज्ञान",
  "class_name": "Class 8",
  "chapter": "फसल उत्पादन एवं प्रबंध",
  "exam_name": "Unit Test 1",
  "difficulty": "moderate",
  "question_types": ["mcq", "short", "long"],
  "total_marks": 50,
  "time_duration": 120,
  "language": "hindi"
}
```

### Node 3: Process Response
- Extract questions from `{{ $json.questions }}`
- Format as needed
- Save to file/database/send email

---

## 🔧 Available Question Types:

| Type | Description | Marks (typical) |
|------|-------------|-----------------|
| `mcq` | Multiple Choice Questions | 1 mark |
| `fill_blank` | Fill in the Blanks | 1 mark |
| `short` | Short Answer | 3 marks |
| `long` | Long Answer | 4-5 marks |
| `diagram` | Diagram-based Questions | 3 marks |
| `hots` | Higher Order Thinking | 4 marks |
| `case_study` | Case Study Questions | 4 marks |

---

## ✅ Example n8n Workflow (Complete):

```json
{
  "nodes": [
    {
      "parameters": {
        "url": "https://learnportal-132.preview.emergentagent.com/api/auth/login",
        "method": "POST",
        "jsonParameters": true,
        "options": {},
        "bodyParametersJson": "{\n  \"email\": \"director@test.com\",\n  \"password\": \"test1234\"\n}"
      },
      "name": "Login",
      "type": "n8n-nodes-base.httpRequest"
    },
    {
      "parameters": {
        "url": "https://learnportal-132.preview.emergentagent.com/api/ai/generate-paper",
        "method": "POST",
        "jsonParameters": true,
        "headerParametersJson": "{\n  \"Authorization\": \"Bearer {{ $json.token }}\"\n}",
        "bodyParametersJson": "{\n  \"subject\": \"विज्ञान\",\n  \"class_name\": \"Class 8\",\n  \"chapter\": \"फसल उत्पादन\",\n  \"exam_name\": \"Unit Test 1\",\n  \"difficulty\": \"moderate\",\n  \"question_types\": [\"mcq\", \"short\", \"long\"],\n  \"total_marks\": 50,\n  \"time_duration\": 120,\n  \"language\": \"hindi\"\n}"
      },
      "name": "Generate Paper",
      "type": "n8n-nodes-base.httpRequest"
    }
  ]
}
```

---

## 🎯 Quick Test (Using curl):

```bash
# Step 1: Get Token
TOKEN=$(curl -s -X POST "https://learnportal-132.preview.emergentagent.com/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"director@test.com","password":"test1234"}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# Step 2: Generate Paper
curl -X POST "https://learnportal-132.preview.emergentagent.com/api/ai/generate-paper" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "subject": "Science",
    "class_name": "Class 8",
    "chapter": "Crop Production and Management",
    "exam_name": "Unit Test 1",
    "difficulty": "moderate",
    "question_types": ["mcq", "short", "long"],
    "total_marks": 20,
    "time_duration": 60,
    "language": "english"
  }' | python3 -m json.tool
```

---

## 📚 Subject Names (for reference):

### Hindi Medium:
- `"हिंदी"`, `"अंग्रेजी"`, `"गणित"`, `"विज्ञान"`, `"सामाजिक विज्ञान"`, `"संस्कृत"`

### English Medium:
- `"Hindi"`, `"English"`, `"Mathematics"`, `"Science"`, `"Social Science"`, `"Sanskrit"`

---

## 🚀 Advanced n8n Features:

### 1. **Batch Paper Generation:**
Loop through multiple classes/subjects and generate papers

### 2. **Scheduled Generation:**
Use n8n schedule trigger to generate papers weekly

### 3. **PDF Conversion:**
Use n8n PDF node to convert JSON response to PDF

### 4. **Email Distribution:**
Send generated papers to teachers via email

### 5. **Database Storage:**
Store generated papers in database for later use

---

## ⚠️ Important Notes:

1. **Token expires in 24 hours** - You'll need to re-authenticate
2. **Rate limiting:** Backend uses gpt-4o-mini, so generation is fast
3. **Language consistency:** If subject is Hindi name, use `language: "hindi"`
4. **Chapter names:** Must match exactly with syllabus data

---

**Is API ko n8n me use karke tum perfect workflow bana sakte ho!** 🎯

Agar koi doubt ho to poocho!
