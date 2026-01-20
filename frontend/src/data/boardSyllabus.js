// Board-wise Syllabus Data for India - 2024-25
// CBSE, MP Board (MPBSE), RBSE (Rajasthan Board), NCERT

export const BOARDS = {
  CBSE: { name: 'CBSE (Central Board)', fullName: 'Central Board of Secondary Education', website: 'https://www.cbse.gov.in' },
  MPBSE: { name: 'MP Board', fullName: 'Madhya Pradesh Board of Secondary Education', website: 'https://mpbse.nic.in' },
  RBSE: { name: 'RBSE (Rajasthan Board)', fullName: 'Rajasthan Board of Secondary Education', website: 'https://rajeduboard.rajasthan.gov.in' },
  NCERT: { name: 'NCERT', fullName: 'National Council of Educational Research and Training', website: 'https://ncert.nic.in' },
};

// Class-wise subjects for each board
export const BOARD_SUBJECTS = {
  CBSE: {
    'Class 1': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 2': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 3': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
    'Class 4': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
    'Class 5': ['Hindi', 'English', 'Mathematics', 'EVS', 'Computer'],
    'Class 6': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
    'Class 7': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
    'Class 8': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Computer'],
    'Class 9': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Information Technology'],
    'Class 10': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit', 'Information Technology'],
    'Class 11': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science'],
    'Class 12': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Computer Science', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science'],
  },
  MPBSE: {
    'Class 1': ['Hindi', 'English', 'Ganit (Mathematics)', 'Paryavaran (EVS)'],
    'Class 2': ['Hindi', 'English', 'Ganit', 'Paryavaran'],
    'Class 3': ['Hindi', 'English', 'Ganit', 'Paryavaran'],
    'Class 4': ['Hindi', 'English', 'Ganit', 'Paryavaran'],
    'Class 5': ['Hindi', 'English', 'Ganit', 'Paryavaran'],
    'Class 6': ['Hindi', 'English', 'Ganit', 'Vigyan (Science)', 'Samajik Vigyan (Social Science)', 'Sanskrit'],
    'Class 7': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit'],
    'Class 8': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit'],
    'Class 9': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit', 'Computer'],
    'Class 10': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit', 'Computer'],
    'Class 11': ['Hindi', 'English', 'Bhautik Vigyan (Physics)', 'Rasayan Vigyan (Chemistry)', 'Jeev Vigyan (Biology)', 'Ganit', 'Computer', 'Vanijya (Commerce)', 'Arthashastra (Economics)'],
    'Class 12': ['Hindi', 'English', 'Bhautik Vigyan', 'Rasayan Vigyan', 'Jeev Vigyan', 'Ganit', 'Computer', 'Vanijya', 'Arthashastra'],
  },
  RBSE: {
    'Class 1': ['Hindi', 'English', 'Ganit', 'Paryavaran Adhyayan'],
    'Class 2': ['Hindi', 'English', 'Ganit', 'Paryavaran Adhyayan'],
    'Class 3': ['Hindi', 'English', 'Ganit', 'Paryavaran Adhyayan'],
    'Class 4': ['Hindi', 'English', 'Ganit', 'Paryavaran Adhyayan'],
    'Class 5': ['Hindi', 'English', 'Ganit', 'Paryavaran Adhyayan'],
    'Class 6': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit', 'Third Language'],
    'Class 7': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit'],
    'Class 8': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit'],
    'Class 9': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit', 'Computer', 'Rajasthan Adhyayan'],
    'Class 10': ['Hindi', 'English', 'Ganit', 'Vigyan', 'Samajik Vigyan', 'Sanskrit', 'Computer', 'Rajasthan Adhyayan'],
    'Class 11': ['Hindi', 'English', 'Bhautiki', 'Rasayan Shastra', 'Jeev Vigyan', 'Ganit', 'Computer', 'Vanijya Shastra', 'Lekhashastra'],
    'Class 12': ['Hindi', 'English', 'Bhautiki', 'Rasayan Shastra', 'Jeev Vigyan', 'Ganit', 'Computer', 'Vanijya Shastra', 'Lekhashastra'],
  },
  NCERT: {
    'Class 1': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 2': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 3': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 4': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 5': ['Hindi', 'English', 'Mathematics', 'EVS'],
    'Class 6': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
    'Class 7': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
    'Class 8': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
    'Class 9': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
    'Class 10': ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
    'Class 11': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science'],
    'Class 12': ['Hindi', 'English', 'Physics', 'Chemistry', 'Biology', 'Mathematics', 'Economics', 'Accountancy', 'Business Studies', 'History', 'Geography', 'Political Science'],
  },
};

// CBSE 2024-25 Rationalized Syllabus Chapters
export const CBSE_CHAPTERS = {
  '10_Mathematics': [
    { id: 'ch1', name: 'Real Numbers' },
    { id: 'ch2', name: 'Polynomials' },
    { id: 'ch3', name: 'Pair of Linear Equations in Two Variables' },
    { id: 'ch4', name: 'Quadratic Equations' },
    { id: 'ch5', name: 'Arithmetic Progressions' },
    { id: 'ch6', name: 'Triangles' },
    { id: 'ch7', name: 'Coordinate Geometry' },
    { id: 'ch8', name: 'Introduction to Trigonometry' },
    { id: 'ch9', name: 'Some Applications of Trigonometry' },
    { id: 'ch10', name: 'Circles' },
    { id: 'ch11', name: 'Areas Related to Circles' },
    { id: 'ch12', name: 'Surface Areas and Volumes' },
    { id: 'ch13', name: 'Statistics' },
    { id: 'ch14', name: 'Probability' },
  ],
  '10_Science': [
    { id: 'ch1', name: 'Chemical Reactions and Equations' },
    { id: 'ch2', name: 'Acids, Bases and Salts' },
    { id: 'ch3', name: 'Metals and Non-metals' },
    { id: 'ch4', name: 'Carbon and its Compounds' },
    { id: 'ch5', name: 'Life Processes' },
    { id: 'ch6', name: 'Control and Coordination' },
    { id: 'ch7', name: 'How do Organisms Reproduce' },
    { id: 'ch8', name: 'Heredity' },
    { id: 'ch9', name: 'Light - Reflection and Refraction' },
    { id: 'ch10', name: 'Human Eye and Colourful World' },
    { id: 'ch11', name: 'Electricity' },
    { id: 'ch12', name: 'Magnetic Effects of Electric Current' },
    { id: 'ch13', name: 'Our Environment' },
  ],
  '10_Social Science': [
    { id: 'hist1', name: 'The Rise of Nationalism in Europe' },
    { id: 'hist2', name: 'Nationalism in India' },
    { id: 'hist3', name: 'The Making of a Global World' },
    { id: 'hist4', name: 'The Age of Industrialisation' },
    { id: 'hist5', name: 'Print Culture and the Modern World' },
    { id: 'geo1', name: 'Resources and Development' },
    { id: 'geo2', name: 'Forest and Wildlife Resources' },
    { id: 'geo3', name: 'Water Resources' },
    { id: 'geo4', name: 'Agriculture' },
    { id: 'geo5', name: 'Minerals and Energy Resources' },
    { id: 'geo6', name: 'Manufacturing Industries' },
    { id: 'geo7', name: 'Lifelines of National Economy' },
    { id: 'pol1', name: 'Power Sharing' },
    { id: 'pol2', name: 'Federalism' },
    { id: 'pol3', name: 'Democracy and Diversity' },
    { id: 'pol4', name: 'Gender, Religion and Caste' },
    { id: 'pol5', name: 'Political Parties' },
    { id: 'pol6', name: 'Outcomes of Democracy' },
    { id: 'eco1', name: 'Development' },
    { id: 'eco2', name: 'Sectors of Indian Economy' },
    { id: 'eco3', name: 'Money and Credit' },
    { id: 'eco4', name: 'Globalisation and the Indian Economy' },
    { id: 'eco5', name: 'Consumer Rights' },
  ],
  '9_Mathematics': [
    { id: 'ch1', name: 'Number Systems' },
    { id: 'ch2', name: 'Polynomials' },
    { id: 'ch3', name: 'Coordinate Geometry' },
    { id: 'ch4', name: 'Linear Equations in Two Variables' },
    { id: 'ch5', name: 'Introduction to Euclid\'s Geometry' },
    { id: 'ch6', name: 'Lines and Angles' },
    { id: 'ch7', name: 'Triangles' },
    { id: 'ch8', name: 'Quadrilaterals' },
    { id: 'ch9', name: 'Circles' },
    { id: 'ch10', name: 'Heron\'s Formula' },
    { id: 'ch11', name: 'Surface Areas and Volumes' },
    { id: 'ch12', name: 'Statistics' },
  ],
  '9_Science': [
    { id: 'ch1', name: 'Matter in Our Surroundings' },
    { id: 'ch2', name: 'Is Matter Around Us Pure' },
    { id: 'ch3', name: 'Atoms and Molecules' },
    { id: 'ch4', name: 'Structure of the Atom' },
    { id: 'ch5', name: 'The Fundamental Unit of Life' },
    { id: 'ch6', name: 'Tissues' },
    { id: 'ch7', name: 'Motion' },
    { id: 'ch8', name: 'Force and Laws of Motion' },
    { id: 'ch9', name: 'Gravitation' },
    { id: 'ch10', name: 'Work and Energy' },
    { id: 'ch11', name: 'Sound' },
    { id: 'ch12', name: 'Improvement in Food Resources' },
  ],
};

// MP Board 2024-25 Syllabus Chapters
export const MPBSE_CHAPTERS = {
  '10_Ganit': [
    { id: 'ch1', name: 'वास्तविक संख्याएँ (Real Numbers)' },
    { id: 'ch2', name: 'बहुपद (Polynomials)' },
    { id: 'ch3', name: 'दो चरों वाले रैखिक समीकरण युग्म' },
    { id: 'ch4', name: 'द्विघात समीकरण (Quadratic Equations)' },
    { id: 'ch5', name: 'समांतर श्रेढ़ी (Arithmetic Progression)' },
    { id: 'ch6', name: 'त्रिभुज (Triangles)' },
    { id: 'ch7', name: 'निर्देशांक ज्यामिति (Coordinate Geometry)' },
    { id: 'ch8', name: 'त्रिकोणमिति का परिचय' },
    { id: 'ch9', name: 'त्रिकोणमिति के कुछ अनुप्रयोग' },
    { id: 'ch10', name: 'वृत्त (Circles)' },
    { id: 'ch11', name: 'वृत्तों से संबंधित क्षेत्रफल' },
    { id: 'ch12', name: 'पृष्ठीय क्षेत्रफल और आयतन' },
    { id: 'ch13', name: 'सांख्यिकी (Statistics)' },
    { id: 'ch14', name: 'प्रायिकता (Probability)' },
  ],
  '10_Vigyan': [
    { id: 'ch1', name: 'रासायनिक अभिक्रियाएँ एवं समीकरण' },
    { id: 'ch2', name: 'अम्ल, क्षारक एवं लवण' },
    { id: 'ch3', name: 'धातु एवं अधातु' },
    { id: 'ch4', name: 'कार्बन एवं उसके यौगिक' },
    { id: 'ch5', name: 'जैव प्रक्रम (Life Processes)' },
    { id: 'ch6', name: 'नियंत्रण एवं समन्वय' },
    { id: 'ch7', name: 'जीव जनन कैसे करते हैं' },
    { id: 'ch8', name: 'आनुवंशिकता (Heredity)' },
    { id: 'ch9', name: 'प्रकाश - परावर्तन तथा अपवर्तन' },
    { id: 'ch10', name: 'मानव नेत्र तथा रंगबिरंगा संसार' },
    { id: 'ch11', name: 'विद्युत (Electricity)' },
    { id: 'ch12', name: 'विद्युत धारा के चुंबकीय प्रभाव' },
    { id: 'ch13', name: 'हमारा पर्यावरण' },
  ],
  '10_Samajik Vigyan': [
    { id: 'hist1', name: 'यूरोप में राष्ट्रवाद का उदय' },
    { id: 'hist2', name: 'भारत में राष्ट्रवाद' },
    { id: 'hist3', name: 'भूमंडलीकृत विश्व का बनना' },
    { id: 'hist4', name: 'औद्योगीकरण का युग' },
    { id: 'hist5', name: 'मुद्रण संस्कृति और आधुनिक दुनिया' },
    { id: 'geo1', name: 'संसाधन एवं विकास' },
    { id: 'geo2', name: 'वन एवं वन्य जीव संसाधन' },
    { id: 'geo3', name: 'जल संसाधन' },
    { id: 'geo4', name: 'कृषि' },
    { id: 'geo5', name: 'खनिज तथा ऊर्जा संसाधन' },
    { id: 'geo6', name: 'विनिर्माण उद्योग' },
    { id: 'geo7', name: 'राष्ट्रीय अर्थव्यवस्था की जीवन रेखाएँ' },
    { id: 'pol1', name: 'सत्ता की साझेदारी' },
    { id: 'pol2', name: 'संघवाद' },
    { id: 'pol3', name: 'लोकतंत्र और विविधता' },
    { id: 'pol4', name: 'जाति, धर्म और लैंगिक मसले' },
    { id: 'pol5', name: 'राजनीतिक दल' },
    { id: 'pol6', name: 'लोकतंत्र के परिणाम' },
    { id: 'eco1', name: 'विकास' },
    { id: 'eco2', name: 'भारतीय अर्थव्यवस्था के क्षेत्रक' },
    { id: 'eco3', name: 'मुद्रा और साख' },
    { id: 'eco4', name: 'वैश्वीकरण और भारतीय अर्थव्यवस्था' },
    { id: 'eco5', name: 'उपभोक्ता अधिकार' },
  ],
};

// RBSE 2024-25 Syllabus Chapters
export const RBSE_CHAPTERS = {
  '10_Ganit': [
    { id: 'ch1', name: 'वास्तविक संख्याएँ' },
    { id: 'ch2', name: 'बहुपद' },
    { id: 'ch3', name: 'दो चरों वाले रैखिक समीकरण युग्म' },
    { id: 'ch4', name: 'द्विघात समीकरण' },
    { id: 'ch5', name: 'समान्तर श्रेढ़ी' },
    { id: 'ch6', name: 'त्रिभुज' },
    { id: 'ch7', name: 'निर्देशांक ज्यामिति' },
    { id: 'ch8', name: 'त्रिकोणमिति का परिचय' },
    { id: 'ch9', name: 'त्रिकोणमिति के कुछ अनुप्रयोग' },
    { id: 'ch10', name: 'वृत्त' },
    { id: 'ch11', name: 'रचनाएँ' },
    { id: 'ch12', name: 'वृत्तों से संबंधित क्षेत्रफल' },
    { id: 'ch13', name: 'पृष्ठीय क्षेत्रफल और आयतन' },
    { id: 'ch14', name: 'सांख्यिकी' },
    { id: 'ch15', name: 'प्रायिकता' },
  ],
  '10_Vigyan': [
    { id: 'ch1', name: 'रासायनिक अभिक्रियाएँ एवं समीकरण' },
    { id: 'ch2', name: 'अम्ल, क्षार एवं लवण' },
    { id: 'ch3', name: 'धातु एवं अधातु' },
    { id: 'ch4', name: 'कार्बन एवं उसके यौगिक' },
    { id: 'ch5', name: 'तत्वों का आवर्त वर्गीकरण' },
    { id: 'ch6', name: 'जैव प्रक्रम' },
    { id: 'ch7', name: 'नियंत्रण एवं समन्वय' },
    { id: 'ch8', name: 'जीव जनन कैसे करते हैं' },
    { id: 'ch9', name: 'आनुवंशिकता एवं जैव विकास' },
    { id: 'ch10', name: 'प्रकाश - परावर्तन तथा अपवर्तन' },
    { id: 'ch11', name: 'मानव नेत्र तथा रंगबिरंगा संसार' },
    { id: 'ch12', name: 'विद्युत' },
    { id: 'ch13', name: 'विद्युत धारा के चुंबकीय प्रभाव' },
    { id: 'ch14', name: 'ऊर्जा के स्रोत' },
    { id: 'ch15', name: 'हमारा पर्यावरण' },
    { id: 'ch16', name: 'प्राकृतिक संसाधनों का प्रबंधन' },
  ],
  '10_Rajasthan Adhyayan': [
    { id: 'ch1', name: 'राजस्थान: एक परिचय' },
    { id: 'ch2', name: 'राजस्थान के भौतिक प्रदेश' },
    { id: 'ch3', name: 'राजस्थान की जलवायु' },
    { id: 'ch4', name: 'राजस्थान में जल संसाधन' },
    { id: 'ch5', name: 'राजस्थान में कृषि' },
    { id: 'ch6', name: 'राजस्थान में खनिज संसाधन' },
    { id: 'ch7', name: 'राजस्थान में उद्योग' },
    { id: 'ch8', name: 'राजस्थान में परिवहन एवं संचार' },
    { id: 'ch9', name: 'राजस्थान की कला एवं संस्कृति' },
    { id: 'ch10', name: 'राजस्थान के प्रमुख पर्यटन स्थल' },
  ],
};

// Get chapters based on board, class and subject
export const getChapters = (board, className, subject) => {
  const classNum = className.replace('Class ', '');
  
  // Normalize subject names
  const subjectMap = {
    'Mathematics': 'Mathematics',
    'Ganit': 'Ganit',
    'Ganit (Mathematics)': 'Ganit',
    'Science': 'Science',
    'Vigyan': 'Vigyan',
    'Vigyan (Science)': 'Vigyan',
    'Social Science': 'Social Science',
    'Samajik Vigyan': 'Samajik Vigyan',
    'Samajik Vigyan (Social Science)': 'Samajik Vigyan',
    'Rajasthan Adhyayan': 'Rajasthan Adhyayan',
  };
  
  const normalizedSubject = subjectMap[subject] || subject;
  const key = `${classNum}_${normalizedSubject}`;
  
  switch (board) {
    case 'CBSE':
    case 'NCERT':
      return CBSE_CHAPTERS[key] || [];
    case 'MPBSE':
      return MPBSE_CHAPTERS[key] || CBSE_CHAPTERS[key] || [];
    case 'RBSE':
      return RBSE_CHAPTERS[key] || CBSE_CHAPTERS[key] || [];
    default:
      return CBSE_CHAPTERS[key] || [];
  }
};

// Marks pattern per board
export const BOARD_MARKS_PATTERN = {
  CBSE: {
    mcq: { marks: 1, label: 'MCQ (1 mark)' },
    fill_blank: { marks: 1, label: 'Fill in Blanks (1 mark)' },
    vsaq: { marks: 2, label: 'Very Short Answer (2 marks)' },
    short: { marks: 3, label: 'Short Answer (3 marks)' },
    long: { marks: 4, label: 'Long Answer (4 marks)' },
    diagram: { marks: 3, label: 'Diagram Based (3 marks)' },
    hots: { marks: 4, label: 'HOTS (4 marks)' },
    case_study: { marks: 4, label: 'Case Study (4 marks)' },
  },
  MPBSE: {
    mcq: { marks: 1, label: 'बहुविकल्पीय (1 अंक)' },
    fill_blank: { marks: 1, label: 'रिक्त स्थान (1 अंक)' },
    ati_laghu: { marks: 2, label: 'अति लघु उत्तरीय (2 अंक)' },
    laghu: { marks: 3, label: 'लघु उत्तरीय (3 अंक)' },
    dirgha: { marks: 4, label: 'दीर्घ उत्तरीय (4 अंक)' },
    diagram: { marks: 3, label: 'चित्र आधारित (3 अंक)' },
    nibandh: { marks: 5, label: 'निबंधात्मक (5 अंक)' },
  },
  RBSE: {
    mcq: { marks: 1, label: 'बहुविकल्पीय (1 अंक)' },
    fill_blank: { marks: 1, label: 'रिक्त स्थान (1 अंक)' },
    ati_laghu: { marks: 2, label: 'अति लघु उत्तरीय (2 अंक)' },
    laghu: { marks: 3, label: 'लघु उत्तरीय (3 अंक)' },
    dirgha: { marks: 4, label: 'दीर्घ उत्तरीय (4 अंक)' },
    diagram: { marks: 3, label: 'चित्र आधारित (3 अंक)' },
  },
  NCERT: {
    mcq: { marks: 1, label: 'MCQ (1 mark)' },
    fill_blank: { marks: 1, label: 'Fill in Blanks (1 mark)' },
    vsaq: { marks: 2, label: 'Very Short Answer (2 marks)' },
    short: { marks: 3, label: 'Short Answer (3 marks)' },
    long: { marks: 4, label: 'Long Answer (4 marks)' },
    diagram: { marks: 3, label: 'Diagram Based (3 marks)' },
    hots: { marks: 4, label: 'HOTS (4 marks)' },
  },
};
