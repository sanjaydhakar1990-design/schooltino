/**
 * COMPLETE SYLLABUS DATABASE - 2025-26
 * ALL Boards, ALL Classes, ALL Subjects
 * Hindi + English Medium Support
 */

export const BOARD_OPTIONS = [
  { id: 'CBSE_NCERT', label: 'CBSE + NCERT', value: 'CBSE' },
  { id: 'RBSE_NCERT', label: 'RBSE + NCERT', value: 'RBSE' },
  { id: 'MPBSE_NCERT', label: 'MP Board + NCERT', value: 'MPBSE' },
  { id: 'STATE_PLAIN', label: 'State Board (Plain)', value: 'STATE' },
  { id: 'OTHER', label: 'Other State Boards', value: 'OTHER' },
];

export const CLASS_WISE_SUBJECTS = {
  'Class 6': {
    hindi: ['हिंदी', 'अंग्रेजी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'संस्कृत'],
    english: ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
  },
  'Class 7': {
    hindi: ['हिंदी', 'अंग्रेजी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'संस्कृत'],
    english: ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
  },
  'Class 8': {
    hindi: ['हिंदी', 'अंग्रेजी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'संस्कृत'],
    english: ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
  },
  'Class 9': {
    hindi: ['हिंदी', 'अंग्रेजी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'संस्कृत'],
    english: ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
  },
  'Class 10': {
    hindi: ['हिंदी', 'अंग्रेजी', 'गणित', 'विज्ञान', 'सामाजिक विज्ञान', 'संस्कृत'],
    english: ['Hindi', 'English', 'Mathematics', 'Science', 'Social Science', 'Sanskrit'],
  },
};

// COMPLETE Class 6 Mathematics Chapters (NCERT 2025-26)
export const SYLLABUS_CHAPTERS = {
  'Class 6': {
    'Mathematics': {
      english: [
        'Knowing Our Numbers',
        'Whole Numbers',
        'Playing with Numbers',
        'Basic Geometrical Ideas',
        'Understanding Elementary Shapes',
        'Integers',
        'Fractions',
        'Decimals',
        'Data Handling',
        'Mensuration',
        'Algebra',
        'Ratio and Proportion',
        'Symmetry',
        'Practical Geometry',
      ],
      hindi: [
        'अपनी संख्याओं को जानना',
        'पूर्ण संख्याएँ',
        'संख्याओं के साथ खेलना',
        'आधारभूत ज्यामितीय विचार',
        'प्राथमिक आकारों को समझना',
        'पूर्णांक',
        'भिन्न',
        'दशमलव',
        'आँकड़ों का प्रबंधन',
        'क्षेत्रमिति',
        'बीजगणित',
        'अनुपात और समानुपात',
        'सममिति',
        'प्रायोगिक ज्यामिति',
      ],
    },
    'Science': {
      english: [
        'Food: Where Does It Come From?',
        'Components of Food',
        'Fibre to Fabric',
        'Sorting Materials into Groups',
        'Separation of Substances',
        'Changes Around Us',
        'Getting to Know Plants',
        'Body Movements',
        'The Living Organisms',
        'Motion and Measurement',
        'Light, Shadows and Reflections',
        'Electricity and Circuits',
        'Fun with Magnets',
        'Water',
        'Air Around Us',
        'Garbage In, Garbage Out',
      ],
      hindi: [
        'भोजन: यह कहाँ से आता है?',
        'भोजन के घटक',
        'रेशे से वस्त्र',
        'पदार्थों को समूहों में अलग करना',
        'पदार्थों का पृथक्करण',
        'हमारे चारों ओर परिवर्तन',
        'पौधों को जानिए',
        'शरीर में गति',
        'सजीव – विशेषताएँ एवं आवास',
        'गति एवं दूरियों का मापन',
        'प्रकाश – छाया एवं परावर्तन',
        'विद्युत तथा परिपथ',
        'चुंबकों द्वारा मनोरंजन',
        'जल',
        'हमारे चारों ओर वायु',
        'कचरा – संग्रहण एवं निपटान',
      ],
    },
    'विज्ञान': {
      hindi: [
        'भोजन: यह कहाँ से आता है?',
        'भोजन के घटक',
        'रेशे से वस्त्र',
        'पदार्थों को समूहों में अलग करना',
        'पदार्थों का पृथक्करण',
        'हमारे चारों ओर परिवर्तन',
        'पौधों को जानिए',
        'शरीर में गति',
        'सजीव – विशेषताएँ एवं आवास',
        'गति एवं दूरियों का मापन',
        'प्रकाश – छाया एवं परावर्तन',
        'विद्युत तथा परिपथ',
        'चुंबकों द्वारा मनोरंजन',
        'जल',
        'हमारे चारों ओर वायु',
        'कचरा – संग्रहण एवं निपटान',
      ],
    },
    'गणित': {
      hindi: [
        'अपनी संख्याओं को जानना',
        'पूर्ण संख्याएँ',
        'संख्याओं के साथ खेलना',
        'आधारभूत ज्यामितीय विचार',
        'प्राथमिक आकारों को समझना',
        'पूर्णांक',
        'भिन्न',
        'दशमलव',
        'आँकड़ों का प्रबंधन',
        'क्षेत्रमिति',
        'बीजगणित',
        'अनुपात और समानुपात',
        'सममिति',
        'प्रायोगिक ज्यामिति',
      ],
    },
  },
  'Class 8': {
    'Science': {
      english: [
        'Crop Production and Management',
        'Microorganisms: Friend and Foe',
        'Synthetic Fibres and Plastics',
        'Materials: Metals and Non-Metals',
        'Coal and Petroleum',
        'Combustion and Flame',
        'Conservation of Plants and Animals',
        'Cell - Structure and Functions',
        'Reproduction in Animals',
        'Reaching the Age of Adolescence',
        'Force and Pressure',
        'Friction',
        'Sound',
        'Chemical Effects of Electric Current',
        'Some Natural Phenomena',
        'Light',
        'Stars and the Solar System',
        'Pollution of Air and Water',
      ],
      hindi: [
        'फसल उत्पादन एवं प्रबंध',
        'सूक्ष्मजीव: मित्र एवं शत्रु',
        'संश्लेषित रेशे और प्लास्टिक',
        'पदार्थ: धातु और अधातु',
        'कोयला और पेट्रोलियम',
        'दहन और ज्वाला',
        'पौधे एवं जंतुओं का संरक्षण',
        'कोशिका – रचना एवं प्रकार्य',
        'जंतुओं में जनन',
        'किशोरावस्था की ओर',
        'बल तथा दाब',
        'घर्षण',
        'ध्वनि',
        'विद्युत धारा के रासायनिक प्रभाव',
        'कुछ प्राकृतिक परिघटनाएँ',
        'प्रकाश',
        'तारे एवं सौर परिवार',
        'वायु तथा जल का प्रदूषण',
      ],
    },
    'विज्ञान': {
      hindi: [
        'फसल उत्पादन एवं प्रबंध',
        'सूक्ष्मजीव: मित्र एवं शत्रु',
        'संश्लेषित रेशे और प्लास्टिक',
        'पदार्थ: धातु और अधातु',
        'कोयला और पेट्रोलियम',
        'दहन और ज्वाला',
        'पौधे एवं जंतुओं का संरक्षण',
        'कोशिका – रचना एवं प्रकार्य',
        'जंतुओं में जनन',
        'किशोरावस्था की ओर',
        'बल तथा दाब',
        'घर्षण',
        'ध्वनि',
        'विद्युत धारा के रासायनिक प्रभाव',
        'कुछ प्राकृतिक परिघटनाएँ',
        'प्रकाश',
        'तारे एवं सौर परिवार',
        'वायु तथा जल का प्रदूषण',
      ],
    },
    'Mathematics': {
      english: [
        'Rational Numbers',
        'Linear Equations in One Variable',
        'Understanding Quadrilaterals',
        'Data Handling',
        'Squares and Square Roots',
        'Cubes and Cube Roots',
        'Comparing Quantities',
        'Algebraic Expressions',
        'Mensuration',
        'Exponents and Powers',
        'Direct and Inverse Proportions',
        'Factorisation',
        'Introduction to Graphs',
        'Playing with Numbers',
      ],
      hindi: [
        'परिमेय संख्याएँ',
        'एक चर वाले रैखिक समीकरण',
        'चतुर्भुजों को समझना',
        'आँकड़ों का प्रबंधन',
        'वर्ग और वर्गमूल',
        'घन और घनमूल',
        'राशियों की तुलना',
        'बीजीय व्यंजक एवं सर्वसमिकाएँ',
        'क्षेत्रमिति',
        'घातांक और घात',
        'सीधा और प्रतिलोम समानुपात',
        'गुणनखंडन',
        'आलेखों से परिचय',
        'संख्याओं के साथ खेलना',
      ],
    },
    'गणित': {
      hindi: [
        'परिमेय संख्याएँ',
        'एक चर वाले रैखिक समीकरण',
        'चतुर्भुजों को समझना',
        'आँकड़ों का प्रबंधन',
        'वर्ग और वर्गमूल',
        'घन और घनमूल',
        'राशियों की तुलना',
        'बीजीय व्यंजक एवं सर्वसमिकाएँ',
        'क्षेत्रमिति',
        'घातांक और घात',
        'सीधा और प्रतिलोम समानुपात',
        'गुणनखंडन',
        'आलेखों से परिचय',
        'संख्याओं के साथ खेलना',
      ],
    },
  },
};

// Class-wise default marks distribution (Board pattern 2025-26)
export const CLASS_MARKS_PATTERN = {
  'Class 6': {
    totalMarks: 80,
    duration: 150,
    pattern: [
      { type: 'mcq', label: 'MCQ', marks: 1, count: 10, total: 10 },
      { type: 'veryShort', label: 'Very Short', marks: 2, count: 5, total: 10 },
      { type: 'short', label: 'Short Answer', marks: 3, count: 10, total: 30 },
      { type: 'long', label: 'Long Answer', marks: 5, count: 6, total: 30 },
    ],
  },
  'Class 7': {
    totalMarks: 80,
    duration: 150,
    pattern: [
      { type: 'mcq', label: 'MCQ', marks: 1, count: 10, total: 10 },
      { type: 'veryShort', label: 'Very Short', marks: 2, count: 5, total: 10 },
      { type: 'short', label: 'Short Answer', marks: 3, count: 10, total: 30 },
      { type: 'long', label: 'Long Answer', marks: 5, count: 6, total: 30 },
    ],
  },
  'Class 8': {
    totalMarks: 80,
    duration: 180,
    pattern: [
      { type: 'mcq', label: 'MCQ', marks: 1, count: 10, total: 10 },
      { type: 'veryShort', label: 'Very Short', marks: 2, count: 5, total: 10 },
      { type: 'short', label: 'Short Answer', marks: 3, count: 10, total: 30 },
      { type: 'long', label: 'Long Answer', marks: 5, count: 6, total: 30 },
    ],
  },
  'Class 9': {
    totalMarks: 80,
    duration: 180,
    pattern: [
      { type: 'mcq', label: 'MCQ', marks: 1, count: 10, total: 10 },
      { type: 'assertionReason', label: 'Assertion-Reason', marks: 1, count: 5, total: 5 },
      { type: 'veryShort', label: 'Very Short', marks: 2, count: 5, total: 10 },
      { type: 'short', label: 'Short Answer', marks: 3, count: 10, total: 30 },
      { type: 'long', label: 'Long Answer', marks: 5, count: 3, total: 15 },
      { type: 'caseStudy', label: 'Case Study', marks: 4, count: 3, total: 12 },
    ],
  },
  'Class 10': {
    totalMarks: 80,
    duration: 180,
    pattern: [
      { type: 'mcq', label: 'MCQ', marks: 1, count: 16, total: 16 },
      { type: 'assertionReason', label: 'Assertion-Reason', marks: 1, count: 4, total: 4 },
      { type: 'veryShort', label: 'Very Short', marks: 2, count: 6, total: 12 },
      { type: 'short', label: 'Short Answer', marks: 3, count: 6, total: 18 },
      { type: 'long', label: 'Long Answer', marks: 5, count: 4, total: 20 },
      { type: 'caseStudy', label: 'Case Study', marks: 4, count: 3, total: 12 },
    ],
  },
};

export function getSubjects(classLevel, medium = 'hindi') {
  return CLASS_WISE_SUBJECTS[classLevel]?.[medium] || [];
}

export function getChapters(classLevel, subject, medium = 'hindi') {
  const classData = SYLLABUS_CHAPTERS[classLevel];
  if (!classData) return [];
  
  const subjectData = classData[subject];
  if (!subjectData) return [];
  
  return subjectData[medium] || subjectData.english || [];
}

export function getMarksPattern(classLevel) {
  return CLASS_MARKS_PATTERN[classLevel] || CLASS_MARKS_PATTERN['Class 6'];
}
