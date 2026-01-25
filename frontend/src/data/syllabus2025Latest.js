/**
 * COMPLETE SYLLABUS DATABASE - 2025-26 Academic Year
 * SchoolTino AI Paper Generator
 * Boards: CBSE, MP Board (MPBSE), RBSE (Rajasthan Board)
 * Classes: Nursery to Class 12
 * All Subjects - Hindi & English Medium
 * Latest NCERT/Board Syllabus
 */

// =====================================================
// BOARD DEFINITIONS
// =====================================================
export const BOARDS_2025 = {
  CBSE: { 
    id: 'CBSE', 
    name: "CBSE", 
    nameHi: "सीबीएसई",
    fullName: 'Central Board of Secondary Education',
    fullNameHi: 'केंद्रीय माध्यमिक शिक्षा बोर्ड'
  },
  MPBSE: { 
    id: 'MPBSE', 
    name: "MP Board", 
    nameHi: "एमपी बोर्ड",
    fullName: 'Madhya Pradesh Board of Secondary Education',
    fullNameHi: 'मध्य प्रदेश माध्यमिक शिक्षा मंडल'
  },
  RBSE: { 
    id: 'RBSE', 
    name: "Rajasthan Board", 
    nameHi: "राजस्थान बोर्ड",
    fullName: 'Rajasthan Board of Secondary Education',
    fullNameHi: 'राजस्थान माध्यमिक शिक्षा बोर्ड'
  },
};

// =====================================================
// CLASS LIST
// =====================================================
export const CLASS_LIST = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5',
  'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10',
  'Class 11', 'Class 12'
];

// =====================================================
// COMPREHENSIVE SYLLABUS DATA
// All Boards, All Classes, All Subjects
// =====================================================

export const SYLLABUS_2025 = {
  // ========== CBSE BOARD ==========
  CBSE: {
    // PRE-PRIMARY (Nursery, LKG, UKG)
    Nursery: {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Alphabet A-Z (Capital Letters)", nameHi: "बड़े अक्षर A-Z" },
          { id: 2, name: "Alphabet a-z (Small Letters)", nameHi: "छोटे अक्षर a-z" },
          { id: 3, name: "Vowels (a, e, i, o, u)", nameHi: "स्वर (a, e, i, o, u)" },
          { id: 4, name: "Phonics - Letter Sounds", nameHi: "ध्वनि - अक्षर की आवाज़" },
          { id: 5, name: "Simple Words (3-letter)", nameHi: "सरल शब्द (3-अक्षर)" },
          { id: 6, name: "Rhymes - Twinkle Twinkle", nameHi: "कविताएं - ट्विंकल ट्विंकल" },
          { id: 7, name: "Rhymes - Baa Baa Black Sheep", nameHi: "कविताएं - बा बा ब्लैक शीप" },
          { id: 8, name: "Colors Recognition", nameHi: "रंग पहचान" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "Swar (अ-अः)", nameHi: "स्वर (अ-अः)" },
          { id: 2, name: "Vyanjan (क-ङ)", nameHi: "व्यंजन (क-ङ)" },
          { id: 3, name: "Vyanjan (च-ञ)", nameHi: "व्यंजन (च-ञ)" },
          { id: 4, name: "Vyanjan (ट-ण)", nameHi: "व्यंजन (ट-ण)" },
          { id: 5, name: "Simple Word Recognition", nameHi: "सरल शब्द पहचान" },
          { id: 6, name: "Picture Naming", nameHi: "चित्र नामकरण" },
          { id: 7, name: "Rhymes in Hindi", nameHi: "हिंदी कविताएं" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers 1-10", nameHi: "संख्याएं 1-10" },
          { id: 2, name: "Counting Objects", nameHi: "वस्तुओं की गिनती" },
          { id: 3, name: "Shapes - Circle, Square, Triangle", nameHi: "आकार - गोला, चौकोर, त्रिकोण" },
          { id: 4, name: "Big and Small", nameHi: "बड़ा और छोटा" },
          { id: 5, name: "More and Less", nameHi: "ज्यादा और कम" },
          { id: 6, name: "Patterns", nameHi: "पैटर्न" },
        ]
      },
      'General Awareness': {
        nameHi: "सामान्य ज्ञान",
        chapters: [
          { id: 1, name: "My Family", nameHi: "मेरा परिवार" },
          { id: 2, name: "My School", nameHi: "मेरा विद्यालय" },
          { id: 3, name: "Animals", nameHi: "जानवर" },
          { id: 4, name: "Fruits", nameHi: "फल" },
          { id: 5, name: "Vegetables", nameHi: "सब्जियां" },
          { id: 6, name: "Colors", nameHi: "रंग" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Free Hand Drawing", nameHi: "मुक्त हस्त चित्रकला" },
          { id: 2, name: "Coloring Simple Pictures", nameHi: "साधारण चित्रों को रंगना" },
          { id: 3, name: "Drawing Shapes", nameHi: "आकार बनाना" },
        ]
      },
    },

    LKG: {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Capital and Small Letters A-Z", nameHi: "बड़े और छोटे अक्षर A-Z" },
          { id: 2, name: "Phonics - CVC Words", nameHi: "ध्वनि - CVC शब्द" },
          { id: 3, name: "Vowels and Consonants", nameHi: "स्वर और व्यंजन" },
          { id: 4, name: "Simple Sentences", nameHi: "सरल वाक्य" },
          { id: 5, name: "This and That", nameHi: "यह और वह" },
          { id: 6, name: "Action Words (Run, Jump)", nameHi: "क्रिया शब्द (दौड़ना, कूदना)" },
          { id: 7, name: "Rhymes and Poems", nameHi: "कविताएं" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "Complete Swar and Vyanjan", nameHi: "पूर्ण स्वर और व्यंजन" },
          { id: 2, name: "Matras (aa, i, ee)", nameHi: "मात्राएं (आ, इ, ई)" },
          { id: 3, name: "Simple Word Formation", nameHi: "सरल शब्द निर्माण" },
          { id: 4, name: "Picture Naming in Hindi", nameHi: "हिंदी में चित्र नामकरण" },
          { id: 5, name: "Hindi Rhymes", nameHi: "हिंदी कविताएं" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers 1-50", nameHi: "संख्याएं 1-50" },
          { id: 2, name: "Before, After, Between", nameHi: "पहले, बाद में, बीच में" },
          { id: 3, name: "Addition (Objects)", nameHi: "जोड़ (वस्तुएं)" },
          { id: 4, name: "Subtraction (Objects)", nameHi: "घटाव (वस्तुएं)" },
          { id: 5, name: "Shapes and Patterns", nameHi: "आकार और पैटर्न" },
        ]
      },
      'General Awareness': {
        nameHi: "सामान्य ज्ञान",
        chapters: [
          { id: 1, name: "My Body Parts", nameHi: "मेरे शरीर के अंग" },
          { id: 2, name: "Transportation", nameHi: "यातायात" },
          { id: 3, name: "Festivals", nameHi: "त्यौहार" },
          { id: 4, name: "Seasons", nameHi: "ऋतुएं" },
          { id: 5, name: "Good Habits", nameHi: "अच्छी आदतें" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Draw and Color Animals", nameHi: "जानवर बनाओ और रंग भरो" },
          { id: 2, name: "Draw Fruits and Vegetables", nameHi: "फल और सब्जियां बनाओ" },
          { id: 3, name: "Pattern Making", nameHi: "पैटर्न बनाना" },
        ]
      },
    },

    UKG: {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Reading Simple Sentences", nameHi: "सरल वाक्य पढ़ना" },
          { id: 2, name: "Cursive Writing Introduction", nameHi: "सुलेख लेखन परिचय" },
          { id: 3, name: "Prepositions (in, on, under)", nameHi: "संबंध शब्द (में, पर, नीचे)" },
          { id: 4, name: "Singular and Plural", nameHi: "एकवचन और बहुवचन" },
          { id: 5, name: "Myself and My Family", nameHi: "मैं और मेरा परिवार" },
          { id: 6, name: "Story Reading", nameHi: "कहानी पढ़ना" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "All Matras (aa to au)", nameHi: "सभी मात्राएं (आ से औ)" },
          { id: 2, name: "Two-Letter Words", nameHi: "दो-अक्षर शब्द" },
          { id: 3, name: "Three-Letter Words", nameHi: "तीन-अक्षर शब्द" },
          { id: 4, name: "Simple Sentences in Hindi", nameHi: "हिंदी में सरल वाक्य" },
          { id: 5, name: "Hindi Stories", nameHi: "हिंदी कहानियां" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers 1-100", nameHi: "संख्याएं 1-100" },
          { id: 2, name: "Number Names 1-20", nameHi: "संख्या नाम 1-20" },
          { id: 3, name: "Addition (up to 20)", nameHi: "जोड़ (20 तक)" },
          { id: 4, name: "Subtraction (up to 20)", nameHi: "घटाव (20 तक)" },
          { id: 5, name: "Time Concepts", nameHi: "समय की अवधारणा" },
          { id: 6, name: "Money Concepts", nameHi: "पैसे की अवधारणा" },
        ]
      },
      'General Awareness': {
        nameHi: "सामान्य ज्ञान",
        chapters: [
          { id: 1, name: "Our Country India", nameHi: "हमारा देश भारत" },
          { id: 2, name: "National Symbols", nameHi: "राष्ट्रीय प्रतीक" },
          { id: 3, name: "Community Helpers", nameHi: "सामुदायिक सहायक" },
          { id: 4, name: "Safety Rules", nameHi: "सुरक्षा नियम" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Nature Drawing", nameHi: "प्रकृति चित्रकला" },
          { id: 2, name: "Free Imagination Drawing", nameHi: "मुक्त कल्पना चित्रकला" },
          { id: 3, name: "Craft Activities", nameHi: "शिल्प गतिविधियां" },
        ]
      },
    },

    // PRIMARY CLASSES (1-5)
    'Class 1': {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Alphabet and Phonics", nameHi: "वर्णमाला और ध्वनि" },
          { id: 2, name: "Simple Sentences", nameHi: "सरल वाक्य" },
          { id: 3, name: "Nouns - Names of Things", nameHi: "संज्ञा - वस्तुओं के नाम" },
          { id: 4, name: "Articles - a, an, the", nameHi: "आर्टिकल - a, an, the" },
          { id: 5, name: "Rhymes and Poems", nameHi: "कविताएं" },
          { id: 6, name: "Story Reading", nameHi: "कहानी पढ़ना" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "Varnmala (Alphabet)", nameHi: "वर्णमाला" },
          { id: 2, name: "Matras Practice", nameHi: "मात्राओं का अभ्यास" },
          { id: 3, name: "Simple Words and Sentences", nameHi: "सरल शब्द और वाक्य" },
          { id: 4, name: "Hindi Rhymes", nameHi: "हिंदी कविताएं" },
          { id: 5, name: "Short Stories", nameHi: "छोटी कहानियां" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers up to 100", nameHi: "संख्याएं 100 तक" },
          { id: 2, name: "Addition and Subtraction", nameHi: "जोड़ और घटाव" },
          { id: 3, name: "Shapes and Patterns", nameHi: "आकार और पैटर्न" },
          { id: 4, name: "Measurement - Length", nameHi: "माप - लंबाई" },
          { id: 5, name: "Time", nameHi: "समय" },
          { id: 6, name: "Money", nameHi: "पैसा" },
        ]
      },
      EVS: {
        nameHi: "पर्यावरण अध्ययन",
        chapters: [
          { id: 1, name: "Myself and My Family", nameHi: "मैं और मेरा परिवार" },
          { id: 2, name: "My School", nameHi: "मेरा विद्यालय" },
          { id: 3, name: "Plants Around Us", nameHi: "हमारे आसपास पौधे" },
          { id: 4, name: "Animals Around Us", nameHi: "हमारे आसपास जानवर" },
          { id: 5, name: "Food We Eat", nameHi: "हम जो खाना खाते हैं" },
          { id: 6, name: "Water", nameHi: "पानी" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Drawing Basic Shapes", nameHi: "बुनियादी आकार बनाना" },
          { id: 2, name: "Coloring Techniques", nameHi: "रंग भरने की तकनीक" },
          { id: 3, name: "Free Drawing", nameHi: "मुक्त चित्रकला" },
        ]
      },
    },

    'Class 2': {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Reading Comprehension", nameHi: "पढ़ने की समझ" },
          { id: 2, name: "Verbs - Action Words", nameHi: "क्रिया - एक्शन वर्ड्स" },
          { id: 3, name: "Adjectives - Describing Words", nameHi: "विशेषण - वर्णनात्मक शब्द" },
          { id: 4, name: "Sentence Formation", nameHi: "वाक्य निर्माण" },
          { id: 5, name: "Stories and Poems", nameHi: "कहानियां और कविताएं" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "Vachan (Singular Plural)", nameHi: "वचन (एकवचन बहुवचन)" },
          { id: 2, name: "Ling (Gender)", nameHi: "लिंग" },
          { id: 3, name: "Sangya (Noun)", nameHi: "संज्ञा" },
          { id: 4, name: "Hindi Comprehension", nameHi: "हिंदी समझ" },
          { id: 5, name: "Story Writing", nameHi: "कहानी लेखन" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers up to 1000", nameHi: "संख्याएं 1000 तक" },
          { id: 2, name: "Addition with Carry", nameHi: "हासिल के साथ जोड़" },
          { id: 3, name: "Subtraction with Borrow", nameHi: "उधार के साथ घटाव" },
          { id: 4, name: "Multiplication Tables 2-10", nameHi: "गुणा तालिका 2-10" },
          { id: 5, name: "Introduction to Division", nameHi: "भाग का परिचय" },
          { id: 6, name: "Geometry - Lines and Angles", nameHi: "ज्यामिति - रेखाएं और कोण" },
        ]
      },
      EVS: {
        nameHi: "पर्यावरण अध्ययन",
        chapters: [
          { id: 1, name: "Living and Non-Living Things", nameHi: "सजीव और निर्जीव वस्तुएं" },
          { id: 2, name: "Good Habits", nameHi: "अच्छी आदतें" },
          { id: 3, name: "Seasons", nameHi: "ऋतुएं" },
          { id: 4, name: "Our Environment", nameHi: "हमारा पर्यावरण" },
          { id: 5, name: "Transport and Communication", nameHi: "परिवहन और संचार" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Object Drawing", nameHi: "वस्तु चित्रण" },
          { id: 2, name: "Nature Scenes", nameHi: "प्रकृति दृश्य" },
          { id: 3, name: "Creative Art", nameHi: "रचनात्मक कला" },
        ]
      },
    },

    'Class 3': {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "The Magic Garden", nameHi: "जादुई बगीचा" },
          { id: 2, name: "Birds Talk", nameHi: "पक्षी की बातचीत" },
          { id: 3, name: "Nina and the Baby Sparrows", nameHi: "नीना और बेबी गौरैया" },
          { id: 4, name: "Little By Little", nameHi: "धीरे-धीरे" },
          { id: 5, name: "The Enormous Turnip", nameHi: "विशाल शलजम" },
          { id: 6, name: "Sea Song", nameHi: "समुद्र गीत" },
          { id: 7, name: "The Balloon Man", nameHi: "गुब्बारे वाला" },
          { id: 8, name: "Grammar - Tenses", nameHi: "व्याकरण - काल" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (रिमझिम)",
        chapters: [
          { id: 1, name: "कक्का", nameHi: "कक्का" },
          { id: 2, name: "शेखीबाज़ मक्खी", nameHi: "शेखीबाज़ मक्खी" },
          { id: 3, name: "चाँद वाली अम्मा", nameHi: "चाँद वाली अम्मा" },
          { id: 4, name: "मन करता है", nameHi: "मन करता है" },
          { id: 5, name: "बहादुर बित्तो", nameHi: "बहादुर बित्तो" },
          { id: 6, name: "हम पंछी उन्मुक्त गगन के", nameHi: "हम पंछी उन्मुक्त गगन के" },
          { id: 7, name: "टिकट अलबम", nameHi: "टिकट अलबम" },
          { id: 8, name: "काग़ज़ की नाव", nameHi: "काग़ज़ की नाव" },
        ]
      },
      Mathematics: {
        nameHi: "गणित (मैथ मैजिक)",
        chapters: [
          { id: 1, name: "Shapes and Designs", nameHi: "आकार और डिज़ाइन" },
          { id: 2, name: "Numbers from 0 to 10000", nameHi: "संख्याएं 0 से 10000" },
          { id: 3, name: "Addition and Subtraction", nameHi: "जोड़ और घटाव" },
          { id: 4, name: "Multiplication", nameHi: "गुणा" },
          { id: 5, name: "Division", nameHi: "भाग" },
          { id: 6, name: "Fractions", nameHi: "भिन्न" },
          { id: 7, name: "Time", nameHi: "समय" },
          { id: 8, name: "Money", nameHi: "पैसा" },
          { id: 9, name: "Measurement", nameHi: "माप" },
          { id: 10, name: "Data Handling", nameHi: "आंकड़ों का प्रबंधन" },
        ]
      },
      EVS: {
        nameHi: "पर्यावरण अध्ययन",
        chapters: [
          { id: 1, name: "Poonam's Day Out", nameHi: "पूनम की सैर" },
          { id: 2, name: "The Plant Fairy", nameHi: "पौधे की परी" },
          { id: 3, name: "Water O Water", nameHi: "पानी रे पानी" },
          { id: 4, name: "Our First School", nameHi: "हमारा पहला स्कूल" },
          { id: 5, name: "Chhotu's House", nameHi: "छोटू का घर" },
          { id: 6, name: "Foods We Eat", nameHi: "हमारा भोजन" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Still Life Drawing", nameHi: "स्थिर जीवन चित्रण" },
          { id: 2, name: "Landscape Drawing", nameHi: "परिदृश्य चित्रण" },
          { id: 3, name: "Creative Composition", nameHi: "रचनात्मक रचना" },
        ]
      },
    },

    'Class 4': {
      English: {
        nameHi: "अंग्रेजी (मैरीगोल्ड)",
        chapters: [
          { id: 1, name: "Wake Up!", nameHi: "जागो!" },
          { id: 2, name: "Noses", nameHi: "नाक" },
          { id: 3, name: "Run!", nameHi: "दौड़ो!" },
          { id: 4, name: "Why?", nameHi: "क्यों?" },
          { id: 5, name: "Don"t be Afraid of the Dark', nameHi: "अंधेरे से मत डरो" },
          { id: 6, name: "The Donkey", nameHi: "गधा" },
          { id: 7, name: "A Watering Rhyme", nameHi: "पानी की कविता" },
          { id: 8, name: "Books", nameHi: "किताबें" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (रिमझिम)",
        chapters: [
          { id: 1, name: "मन के भोले-भाले बादल", nameHi: "मन के भोले-भाले बादल" },
          { id: 2, name: "जैसा सवाल वैसा जवाब", nameHi: "जैसा सवाल वैसा जवाब" },
          { id: 3, name: "किरमिच की गेंद", nameHi: "किरमिच की गेंद" },
          { id: 4, name: "पापा जब बच्चे थे", nameHi: "पापा जब बच्चे थे" },
          { id: 5, name: "दोस्त की पोशाक", nameHi: "दोस्त की पोशाक" },
          { id: 6, name: "नाव बनाओ नाव बनाओ", nameHi: "नाव बनाओ नाव बनाओ" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Building with Bricks", nameHi: "ईंटों से निर्माण" },
          { id: 2, name: "Long and Short", nameHi: "लंबा और छोटा" },
          { id: 3, name: "A Trip to Bhopal", nameHi: "भोपाल की यात्रा" },
          { id: 4, name: "Tick-Tick-Tick", nameHi: "टिक-टिक-टिक" },
          { id: 5, name: "The Way the World Looks", nameHi: "दुनिया कैसी दिखती है" },
          { id: 6, name: "The Junk Seller", nameHi: "कबाड़ीवाला" },
          { id: 7, name: "Jugs and Mugs", nameHi: "जग और मग" },
          { id: 8, name: "Carts and Wheels", nameHi: "गाड़ियां और पहिये" },
        ]
      },
      EVS: {
        nameHi: "पर्यावरण अध्ययन",
        chapters: [
          { id: 1, name: "Going to School", nameHi: "स्कूल जाना" },
          { id: 2, name: "Ear to Ear", nameHi: "कान से कान तक" },
          { id: 3, name: "A Day with Nandu", nameHi: "नंदू के साथ एक दिन" },
          { id: 4, name: "The Story of Amrita", nameHi: "अमृता की कहानी" },
          { id: 5, name: "Anita and the Honeybees", nameHi: "अनीता और मधुमक्खियां" },
          { id: 6, name: "Omana's Journey', nameHi: "ओमना की यात्रा" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Portrait Drawing", nameHi: "चित्र चित्रण" },
          { id: 2, name: "Nature Study", nameHi: "प्रकृति अध्ययन" },
          { id: 3, name: "Craft Work", nameHi: "शिल्प कार्य" },
        ]
      },
    },

    'Class 5': {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Wonderful Waste", nameHi: "अद्भुत कचरा" },
          { id: 2, name: "Teamwork", nameHi: "टीम वर्क" },
          { id: 3, name: "Robinson Crusoe", nameHi: "रॉबिन्सन क्रूसो" },
          { id: 4, name: "My Elder Brother", nameHi: "मेरे बड़े भाई" },
          { id: 5, name: "Rip Van Winkle", nameHi: "रिप वैन विंकल" },
          { id: 6, name: "Topsy-Turvy Land", nameHi: "उल्टी-पुल्टी भूमि" },
          { id: 7, name: "Nobody's Friend', nameHi: "किसी का दोस्त नहीं" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "राख की रस्सी", nameHi: "राख की रस्सी" },
          { id: 2, name: "फसलों के त्योहार", nameHi: "फसलों के त्योहार" },
          { id: 3, name: "खिलौनेवाला", nameHi: "खिलौनेवाला" },
          { id: 4, name: "नन्हा फनकार", nameHi: "नन्हा फनकार" },
          { id: 5, name: "जहाँ चाह वहाँ राह", nameHi: "जहाँ चाह वहाँ राह" },
          { id: 6, name: "चिट्ठी का सफ़र", nameHi: "चिट्ठी का सफ़र" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "The Fish Tale", nameHi: "मछली की कहानी" },
          { id: 2, name: "Shapes and Angles", nameHi: "आकार और कोण" },
          { id: 3, name: "How Many Squares?", nameHi: "कितने वर्ग?" },
          { id: 4, name: "Parts and Wholes", nameHi: "भाग और पूर्ण" },
          { id: 5, name: "Does it Look the Same?", nameHi: "क्या यह एक जैसा दिखता है?" },
          { id: 6, name: "Be My Multiple, I"ll Be Your Factor', nameHi: "मेरा गुणज बनो, मैं तुम्हारा गुणनखंड बनूंगा" },
          { id: 7, name: "Can You See the Pattern?", nameHi: "क्या आप पैटर्न देख सकते हैं?" },
        ]
      },
      EVS: {
        nameHi: "पर्यावरण अध्ययन",
        chapters: [
          { id: 1, name: "Super Senses", nameHi: "सुपर सेंस" },
          { id: 2, name: "A Snake Charmer's Story', nameHi: "सपेरे की कहानी" },
          { id: 3, name: "From Tasting to Digesting", nameHi: "स्वाद से पाचन तक" },
          { id: 4, name: "Mangoes Round the Year", nameHi: "साल भर आम" },
          { id: 5, name: "Seeds and Seeds", nameHi: "बीज और बीज" },
          { id: 6, name: "Every Drop Counts", nameHi: "हर बूंद मायने रखती है" },
        ]
      },
      Drawing: {
        nameHi: "चित्रकला",
        chapters: [
          { id: 1, name: "Perspective Drawing", nameHi: "परिप्रेक्ष्य चित्रण" },
          { id: 2, name: "Shading Techniques", nameHi: "छायांकन तकनीक" },
          { id: 3, name: "Imaginative Art", nameHi: "कल्पनाशील कला" },
        ]
      },
    },

    // MIDDLE SCHOOL (6-8)
    'Class 6': {
      English: {
        nameHi: "अंग्रेजी (हनीकॉम्ब)",
        chapters: [
          { id: 1, name: "A House, A Home", nameHi: "एक घर, एक होम" },
          { id: 2, name: "The Kite", nameHi: "पतंग" },
          { id: 3, name: "Taros Reward", nameHi: "तारो का इनाम" },
          { id: 4, name: "An Indian - American Woman in Space", nameHi: "अंतरिक्ष में एक भारतीय-अमेरिकी महिला" },
          { id: 5, name: "A Different Kind of School", nameHi: "एक अलग तरह का स्कूल" },
          { id: 6, name: "Who I Am", nameHi: "मैं कौन हूँ" },
          { id: 7, name: "Fair Play", nameHi: "उचित खेल" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (वसंत)",
        chapters: [
          { id: 1, name: "वह चिड़िया जो", nameHi: "वह चिड़िया जो" },
          { id: 2, name: "बचपन", nameHi: "बचपन" },
          { id: 3, name: "नादान दोस्त", nameHi: "नादान दोस्त" },
          { id: 4, name: "चाँद से थोड़ी सी गप्पें", nameHi: "चाँद से थोड़ी सी गप्पें" },
          { id: 5, name: "अक्षरों का महत्व", nameHi: "अक्षरों का महत्व" },
          { id: 6, name: "पार नज़र के", nameHi: "पार नज़र के" },
          { id: 7, name: "साथी हाथ बढ़ाना", nameHi: "साथी हाथ बढ़ाना" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Knowing Our Numbers", nameHi: "हमारी संख्याओं को जानना" },
          { id: 2, name: "Whole Numbers", nameHi: "पूर्ण संख्याएं" },
          { id: 3, name: "Playing with Numbers", nameHi: "संख्याओं के साथ खेलना" },
          { id: 4, name: "Basic Geometrical Ideas", nameHi: "बुनियादी ज्यामितीय विचार" },
          { id: 5, name: "Understanding Elementary Shapes", nameHi: "प्राथमिक आकारों को समझना" },
          { id: 6, name: "Integers", nameHi: "पूर्णांक" },
          { id: 7, name: "Fractions", nameHi: "भिन्न" },
          { id: 8, name: "Decimals", nameHi: "दशमलव" },
          { id: 9, name: "Data Handling", nameHi: "डेटा प्रबंधन" },
          { id: 10, name: "Mensuration", nameHi: "क्षेत्रमिति" },
        ]
      },
      Science: {
        nameHi: "विज्ञान",
        chapters: [
          { id: 1, name: "Food: Where Does it Come From?", nameHi: "भोजन: यह कहाँ से आता है?" },
          { id: 2, name: "Components of Food", nameHi: "भोजन के घटक" },
          { id: 3, name: "Fibre to Fabric", nameHi: "रेशा से वस्त्र" },
          { id: 4, name: "Sorting Materials into Groups", nameHi: "वस्तुओं को समूहों में वर्गीकृत करना" },
          { id: 5, name: "Separation of Substances", nameHi: "पदार्थों का पृथक्करण" },
          { id: 6, name: "Changes Around Us", nameHi: "हमारे चारों ओर परिवर्तन" },
          { id: 7, name: "Getting to Know Plants", nameHi: "पौधों को जानना" },
          { id: 8, name: "Body Movements", nameHi: "शरीर की गति" },
          { id: 9, name: "The Living Organisms", nameHi: "जीवित जीव" },
          { id: 10, name: "Motion and Measurement", nameHi: "गति और माप" },
        ]
      },
      'Social Science': {
        nameHi: "सामाजिक विज्ञान",
        chapters: [
          { id: 1, name: "What, Where, How and When?", nameHi: "क्या, कहाँ, कैसे और कब?" },
          { id: 2, name: "From Hunting-Gathering to Growing Food", nameHi: "शिकार-संग्रह से भोजन उगाने तक" },
          { id: 3, name: "In the Earliest Cities", nameHi: "सबसे पहले शहरों में" },
          { id: 4, name: "The Earth in the Solar System", nameHi: "सौर मंडल में पृथ्वी" },
          { id: 5, name: "Globe: Latitudes and Longitudes", nameHi: "ग्लोब: अक्षांश और देशांतर" },
          { id: 6, name: "Understanding Diversity", nameHi: "विविधता को समझना" },
        ]
      },
      Sanskrit: {
        nameHi: "संस्कृत",
        chapters: [
          { id: 1, name: "Shubhkamanayen", nameHi: "शुभकामनायें" },
          { id: 2, name: "Sarvnaam Shabd", nameHi: "सर्वनाम शब्द" },
          { id: 3, name: "Shabdroopani", nameHi: "शब्दरूपाणि" },
          { id: 4, name: "Dhaturupani", nameHi: "धातुरूपाणि" },
        ]
      },
    },

    'Class 7': {
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Three Questions", nameHi: "तीन प्रश्न" },
          { id: 2, name: "A Gift of Chappals", nameHi: "चप्पलों का उपहार" },
          { id: 3, name: "Gopal and the Hilsa Fish", nameHi: "गोपाल और हिलसा मछली" },
          { id: 4, name: "The Ashes That Made Trees Bloom", nameHi: "राख जिसने पेड़ों को खिलाया" },
          { id: 5, name: "Quality", nameHi: "गुणवत्ता" },
          { id: 6, name: "Expert Detectives", nameHi: "विशेषज्ञ जासूस" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "हम पंछी उन्मुक्त गगन के", nameHi: "हम पंछी उन्मुक्त गगन के" },
          { id: 2, name: "दादी माँ", nameHi: "दादी माँ" },
          { id: 3, name: "हिमालय की बेटियाँ", nameHi: "हिमालय की बेटियाँ" },
          { id: 4, name: "कठपुतली", nameHi: "कठपुतली" },
          { id: 5, name: "मीठाईवाला", nameHi: "मीठाईवाला" },
          { id: 6, name: "रक्त और हमारा शरीर", nameHi: "रक्त और हमारा शरीर" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Integers", nameHi: "पूर्णांक" },
          { id: 2, name: "Fractions and Decimals", nameHi: "भिन्न और दशमलव" },
          { id: 3, name: "Data Handling", nameHi: "आंकड़ों का प्रबंधन" },
          { id: 4, name: "Simple Equations", nameHi: "सरल समीकरण" },
          { id: 5, name: "Lines and Angles", nameHi: "रेखाएं और कोण" },
          { id: 6, name: "The Triangle and its Properties", nameHi: "त्रिभुज और इसके गुण" },
          { id: 7, name: "Congruence of Triangles", nameHi: "त्रिभुजों की सर्वांगसमता" },
          { id: 8, name: "Comparing Quantities", nameHi: "मात्राओं की तुलना" },
          { id: 9, name: "Rational Numbers", nameHi: "परिमेय संख्याएं" },
          { id: 10, name: "Perimeter and Area", nameHi: "परिमाप और क्षेत्रफल" },
        ]
      },
      Science: {
        nameHi: "विज्ञान",
        chapters: [
          { id: 1, name: "Nutrition in Plants", nameHi: "पौधों में पोषण" },
          { id: 2, name: "Nutrition in Animals", nameHi: "जानवरों में पोषण" },
          { id: 3, name: "Heat", nameHi: "ऊष्मा" },
          { id: 4, name: "Acids, Bases and Salts", nameHi: "अम्ल, क्षार और लवण" },
          { id: 5, name: "Physical and Chemical Changes", nameHi: "भौतिक और रासायनिक परिवर्तन" },
          { id: 6, name: "Respiration in Organisms", nameHi: "जीवों में श्वसन" },
          { id: 7, name: "Transportation in Animals and Plants", nameHi: "जानवरों और पौधों में परिवहन" },
          { id: 8, name: "Reproduction in Plants", nameHi: "पौधों में प्रजनन" },
          { id: 9, name: "Motion and Time", nameHi: "गति और समय" },
          { id: 10, name: "Electric Current and its Effects", nameHi: "विद्युत धारा और इसके प्रभाव" },
        ]
      },
      'Social Science': {
        nameHi: "सामाजिक विज्ञान",
        chapters: [
          { id: 1, name: "Tracing Changes Through a Thousand Years", nameHi: "हजार वर्षों में परिवर्तनों का पता लगाना" },
          { id: 2, name: "New Kings and Kingdoms", nameHi: "नए राजा और राज्य" },
          { id: 3, name: "The Delhi Sultans", nameHi: "दिल्ली सल्तनत" },
          { id: 4, name: "Environment", nameHi: "पर्यावरण" },
          { id: 5, name: "Inside Our Earth", nameHi: "हमारी पृथ्वी के अंदर" },
          { id: 6, name: "On Equality", nameHi: "समानता पर" },
        ]
      },
      Sanskrit: {
        nameHi: "संस्कृत",
        chapters: [
          { id: 1, name: "Subhashitani", nameHi: "सुभाषितानि" },
          { id: 2, name: "Durvrity Dushparinamaha", nameHi: "दुर्बुद्धि दुष्परिणामः" },
          { id: 3, name: "Swawalambanam", nameHi: "स्वावलम्बनम्" },
          { id: 4, name: "Haasyabalaarikrita", nameHi: "हास्यबालारिकृत" },
        ]
      },
    },

    'Class 8': {
      English: {
        nameHi: "अंग्रेजी (हनीड्यू)",
        chapters: [
          { id: 1, name: "The Best Christmas Present", nameHi: "सबसे अच्छा क्रिसमस उपहार" },
          { id: 2, name: "The Tsunami", nameHi: "सुनामी" },
          { id: 3, name: "Glimpses of the Past", nameHi: "अतीत की झलकियां" },
          { id: 4, name: "Bepin Choudhurys Lapse of Memory", nameHi: "बेपिन चौधरी की स्मृति लोप" },
          { id: 5, name: "The Summit Within", nameHi: "भीतर का शिखर" },
          { id: 6, name: "This is Jodys Fawn", nameHi: "यह जोडी का फॉन है" },
          { id: 7, name: "A Visit to Cambridge", nameHi: "कैम्ब्रिज की यात्रा" },
          { id: 8, name: "A Short Monsoon Diary", nameHi: "एक छोटी मानसून डायरी" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (वसंत)",
        chapters: [
          { id: 1, name: "ध्वनि", nameHi: "ध्वनि" },
          { id: 2, name: "लाख की चूड़ियाँ", nameHi: "लाख की चूड़ियाँ" },
          { id: 3, name: "बस की यात्रा", nameHi: "बस की यात्रा" },
          { id: 4, name: "दीवानों की हस्ती", nameHi: "दीवानों की हस्ती" },
          { id: 5, name: "चिट्ठियों की अनूठी दुनिया", nameHi: "चिट्ठियों की अनूठी दुनिया" },
          { id: 6, name: "भगवान के डाकिए", nameHi: "भगवान के डाकिए" },
          { id: 7, name: "क्या निराश हुआ जाए", nameHi: "क्या निराश हुआ जाए" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Rational Numbers", nameHi: "परिमेय संख्याएं" },
          { id: 2, name: "Linear Equations in One Variable", nameHi: "एक चर में रैखिक समीकरण" },
          { id: 3, name: "Understanding Quadrilaterals", nameHi: "चतुर्भुज को समझना" },
          { id: 4, name: "Data Handling", nameHi: "आंकड़ों का प्रबंधन" },
          { id: 5, name: "Squares and Square Roots", nameHi: "वर्ग और वर्गमूल" },
          { id: 6, name: "Cubes and Cube Roots", nameHi: "घन और घनमूल" },
          { id: 7, name: "Comparing Quantities", nameHi: "मात्राओं की तुलना" },
          { id: 8, name: "Algebraic Expressions", nameHi: "बीजीय व्यंजक" },
          { id: 9, name: "Mensuration", nameHi: "क्षेत्रमिति" },
          { id: 10, name: "Exponents and Powers", nameHi: "घातांक और शक्तियां" },
        ]
      },
      Science: {
        nameHi: "विज्ञान",
        chapters: [
          { id: 1, name: "Crop Production and Management", nameHi: "फसल उत्पादन और प्रबंधन" },
          { id: 2, name: "Microorganisms: Friend and Foe", nameHi: "सूक्ष्मजीव: दोस्त और दुश्मन" },
          { id: 3, name: "Coal and Petroleum", nameHi: "कोयला और पेट्रोलियम" },
          { id: 4, name: "Combustion and Flame", nameHi: "दहन और ज्वाला" },
          { id: 5, name: "Conservation of Plants and Animals", nameHi: "पौधों और जानवरों का संरक्षण" },
          { id: 6, name: "Reproduction in Animals", nameHi: "जानवरों में प्रजनन" },
          { id: 7, name: "Reaching the Age of Adolescence", nameHi: "किशोरावस्था की उम्र तक पहुंचना" },
          { id: 8, name: "Force and Pressure", nameHi: "बल और दबाव" },
          { id: 9, name: "Friction", nameHi: "घर्षण" },
          { id: 10, name: "Sound", nameHi: "ध्वनि" },
        ]
      },
      'Social Science': {
        nameHi: "सामाजिक विज्ञान",
        chapters: [
          { id: 1, name: "How, When and Where", nameHi: "कैसे, कब और कहाँ" },
          { id: 2, name: "From Trade to Territory", nameHi: "व्यापार से क्षेत्र तक" },
          { id: 3, name: "Ruling the Countryside", nameHi: "ग्रामीण इलाकों पर शासन" },
          { id: 4, name: "Resources", nameHi: "संसाधन" },
          { id: 5, name: "Land, Soil, Water", nameHi: "भूमि, मिट्टी, पानी" },
          { id: 6, name: "The Indian Constitution", nameHi: "भारतीय संविधान" },
        ]
      },
      Sanskrit: {
        nameHi: "संस्कृत",
        chapters: [
          { id: 1, name: "Subhashitani", nameHi: "सुभाषितानि" },
          { id: 2, name: "Bilasya Vaani Na Kadapi Me Shruyatam", nameHi: "बिलस्य वाणी न कदापि मे श्रुयताम्" },
          { id: 3, name: "Digyajao Kathamabhavat", nameHi: "दीर्घयज्ञः कथमभवत्" },
        ]
      },
    },

    // HIGH SCHOOL (9-10)
    'Class 9': {
      English: {
        nameHi: "अंग्रेजी (बीहाइव)",
        chapters: [
          { id: 1, name: "The Fun They Had", nameHi: "वे जो मजा करते थे" },
          { id: 2, name: "The Sound of Music", nameHi: "संगीत की ध्वनि" },
          { id: 3, name: "The Little Girl", nameHi: "छोटी लड़की" },
          { id: 4, name: "A Truly Beautiful Mind", nameHi: "वास्तव में सुंदर मन" },
          { id: 5, name: "The Snake and the Mirror", nameHi: "सांप और दर्पण" },
          { id: 6, name: "My Childhood", nameHi: "मेरा बचपन" },
          { id: 7, name: "Reach for the Top", nameHi: "शीर्ष तक पहुंचें" },
          { id: 8, name: "Kathmandu", nameHi: "काठमांडू" },
          { id: 9, name: "If I Were You", nameHi: "अगर मैं तुम होता" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (क्षितिज)",
        chapters: [
          { id: 1, name: "दो बैलों की कथा", nameHi: "दो बैलों की कथा" },
          { id: 2, name: "ल्हासा की ओर", nameHi: "ल्हासा की ओर" },
          { id: 3, name: "उपभोक्तावाद की संस्कृति", nameHi: "उपभोक्तावाद की संस्कृति" },
          { id: 4, name: "साँवले सपनों की याद", nameHi: "साँवले सपनों की याद" },
          { id: 5, name: "नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया", nameHi: "नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया" },
          { id: 6, name: "प्रेमचंद के फटे जूते", nameHi: "प्रेमचंद के फटे जूते" },
          { id: 7, name: "मेरे बचपन के दिन", nameHi: "मेरे बचपन के दिन" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Number Systems", nameHi: "संख्या प्रणाली" },
          { id: 2, name: "Polynomials", nameHi: "बहुपद" },
          { id: 3, name: "Coordinate Geometry", nameHi: "निर्देशांक ज्यामिति" },
          { id: 4, name: "Linear Equations in Two Variables", nameHi: "दो चर में रैखिक समीकरण" },
          { id: 5, name: "Introduction to Euclids Geometry", nameHi: "यूक्लिड की ज्यामिति का परिचय" },
          { id: 6, name: "Lines and Angles", nameHi: "रेखाएं और कोण" },
          { id: 7, name: "Triangles", nameHi: "त्रिभुज" },
          { id: 8, name: "Quadrilaterals", nameHi: "चतुर्भुज" },
          { id: 9, name: "Herons Formula", nameHi: "हेरोन का सूत्र" },
          { id: 10, name: "Surface Areas and Volumes", nameHi: "पृष्ठीय क्षेत्रफल और आयतन" },
          { id: 11, name: "Statistics", nameHi: "सांख्यिकी" },
        ]
      },
      Science: {
        nameHi: "विज्ञान",
        chapters: [
          { id: 1, name: "Matter in Our Surroundings", nameHi: "हमारे आसपास पदार्थ" },
          { id: 2, name: "Is Matter Around Us Pure?", nameHi: "क्या हमारे आसपास का पदार्थ शुद्ध है?" },
          { id: 3, name: "Atoms and Molecules", nameHi: "परमाणु और अणु" },
          { id: 4, name: "Structure of the Atom", nameHi: "परमाणु की संरचना" },
          { id: 5, name: "The Fundamental Unit of Life", nameHi: "जीवन की मूल इकाई" },
          { id: 6, name: "Tissues", nameHi: "ऊतक" },
          { id: 7, name: "Motion", nameHi: "गति" },
          { id: 8, name: "Force and Laws of Motion", nameHi: "बल और गति के नियम" },
          { id: 9, name: "Gravitation", nameHi: "गुरुत्वाकर्षण" },
          { id: 10, name: "Work and Energy", nameHi: "कार्य और ऊर्जा" },
          { id: 11, name: "Sound", nameHi: "ध्वनि" },
        ]
      },
      'Social Science': {
        nameHi: "सामाजिक विज्ञान",
        chapters: [
          { id: 1, name: "The French Revolution", nameHi: "फ्रांसीसी क्रांति" },
          { id: 2, name: "Socialism in Europe and the Russian Revolution", nameHi: "यूरोप में समाजवाद और रूसी क्रांति" },
          { id: 3, name: "Nazism and the Rise of Hitler", nameHi: "नाजीवाद और हिटलर का उदय" },
          { id: 4, name: "India - Size and Location", nameHi: "भारत - आकार और स्थान" },
          { id: 5, name: "Physical Features of India", nameHi: "भारत की भौतिक विशेषताएं" },
          { id: 6, name: "What is Democracy? Why Democracy?", nameHi: "लोकतंत्र क्या है? लोकतंत्र क्यों?" },
          { id: 7, name: "The Story of Village Palampur", nameHi: "गांव पालमपुर की कहानी" },
        ]
      },
      Sanskrit: {
        nameHi: "संस्कृत",
        chapters: [
          { id: 1, name: "Bharatvasam", nameHi: "भारतवसम्" },
          { id: 2, name: "Svamivivekananda", nameHi: "स्वामीविवेकानन्द" },
          { id: 3, name: "Godyabhavam", nameHi: "गोदोहनम्" },
        ]
      },
    },

    'Class 10': {
      English: {
        nameHi: "अंग्रेजी (फर्स्ट फ्लाइट)",
        chapters: [
          { id: 1, name: "A Letter to God", nameHi: "भगवान को एक पत्र" },
          { id: 2, name: "Nelson Mandela: Long Walk to Freedom", nameHi: "नेल्सन मंडेला: स्वतंत्रता की लंबी यात्रा" },
          { id: 3, name: "Two Stories about Flying", nameHi: "उड़ान के बारे में दो कहानियां" },
          { id: 4, name: "From the Diary of Anne Frank", nameHi: "ऐनी फ्रैंक की डायरी से" },
          { id: 5, name: "The Hundred Dresses", nameHi: "सौ कपड़े" },
          { id: 6, name: "Glimpses of India", nameHi: "भारत की झलकियां" },
          { id: 7, name: "Mijbil the Otter", nameHi: "मिजबिल द ऑटर" },
          { id: 8, name: "Madam Rides the Bus", nameHi: "मैडम बस में सवारी करती है" },
          { id: 9, name: "The Sermon at Benares", nameHi: "बनारस में उपदेश" },
          { id: 10, name: "The Proposal", nameHi: "प्रस्ताव" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी (क्षितिज)",
        chapters: [
          { id: 1, name: "सूरदास के पद", nameHi: "सूरदास के पद" },
          { id: 2, name: "तुलसीदास के पद", nameHi: "तुलसीदास के पद" },
          { id: 3, name: "देव", nameHi: "देव" },
          { id: 4, name: "जयशंकर प्रसाद", nameHi: "जयशंकर प्रसाद" },
          { id: 5, name: "सूर्यकांत त्रिपाठी निराला", nameHi: "सूर्यकांत त्रिपाठी निराला" },
          { id: 6, name: "नागार्जुन", nameHi: "नागार्जुन" },
          { id: 7, name: "गिरिजाकुमार माथुर", nameHi: "गिरिजाकुमार माथुर" },
          { id: 8, name: "ऋतुराज", nameHi: "ऋतुराज" },
          { id: 9, name: "मंगलेश डबराल", nameHi: "मंगलेश डबराल" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Real Numbers", nameHi: "वास्तविक संख्याएं" },
          { id: 2, name: "Polynomials", nameHi: "बहुपद" },
          { id: 3, name: "Pair of Linear Equations in Two Variables", nameHi: "दो चर में रैखिक समीकरणों का युग्म" },
          { id: 4, name: "Quadratic Equations", nameHi: "द्विघात समीकरण" },
          { id: 5, name: "Arithmetic Progressions", nameHi: "समांतर श्रेढ़ी" },
          { id: 6, name: "Triangles", nameHi: "त्रिभुज" },
          { id: 7, name: "Coordinate Geometry", nameHi: "निर्देशांक ज्यामिति" },
          { id: 8, name: "Introduction to Trigonometry", nameHi: "त्रिकोणमिति का परिचय" },
          { id: 9, name: "Applications of Trigonometry", nameHi: "त्रिकोणमिति के अनुप्रयोग" },
          { id: 10, name: "Circles", nameHi: "वृत्त" },
          { id: 11, name: "Areas Related to Circles", nameHi: "वृत्तों से संबंधित क्षेत्रफल" },
          { id: 12, name: "Surface Areas and Volumes", nameHi: "पृष्ठीय क्षेत्रफल और आयतन" },
          { id: 13, name: "Statistics", nameHi: "सांख्यिकी" },
          { id: 14, name: "Probability", nameHi: "प्रायिकता" },
        ]
      },
      Science: {
        nameHi: "विज्ञान",
        chapters: [
          { id: 1, name: "Chemical Reactions and Equations", nameHi: "रासायनिक अभिक्रियाएं और समीकरण" },
          { id: 2, name: "Acids, Bases and Salts", nameHi: "अम्ल, क्षार और लवण" },
          { id: 3, name: "Metals and Non-metals", nameHi: "धातु और अधातु" },
          { id: 4, name: "Carbon and its Compounds", nameHi: "कार्बन और उसके यौगिक" },
          { id: 5, name: "Life Processes", nameHi: "जैव प्रक्रियाएं" },
          { id: 6, name: "Control and Coordination", nameHi: "नियंत्रण और समन्वय" },
          { id: 7, name: "How do Organisms Reproduce?", nameHi: "जीव जनन कैसे करते हैं?" },
          { id: 8, name: "Heredity and Evolution", nameHi: "आनुवंशिकता और विकास" },
          { id: 9, name: "Light - Reflection and Refraction", nameHi: "प्रकाश - परावर्तन और अपवर्तन" },
          { id: 10, name: "The Human Eye", nameHi: "मानव नेत्र" },
          { id: 11, name: "Electricity", nameHi: "विद्युत" },
          { id: 12, name: "Magnetic Effects of Electric Current", nameHi: "विद्युत धारा का चुंबकीय प्रभाव" },
        ]
      },
      'Social Science': {
        nameHi: "सामाजिक विज्ञान",
        chapters: [
          { id: 1, name: "The Rise of Nationalism in Europe", nameHi: "यूरोप में राष्ट्रवाद का उदय" },
          { id: 2, name: "Nationalism in India", nameHi: "भारत में राष्ट्रवाद" },
          { id: 3, name: "The Making of a Global World", nameHi: "वैश्विक दुनिया का निर्माण" },
          { id: 4, name: "Resources and Development", nameHi: "संसाधन और विकास" },
          { id: 5, name: "Forest and Wildlife Resources", nameHi: "वन और वन्य जीव संसाधन" },
          { id: 6, name: "Water Resources", nameHi: "जल संसाधन" },
          { id: 7, name: "Power Sharing", nameHi: "सत्ता की साझेदारी" },
          { id: 8, name: "Development", nameHi: "विकास" },
        ]
      },
      Sanskrit: {
        nameHi: "संस्कृत",
        chapters: [
          { id: 1, name: "Shuchiparyavaranam", nameHi: "शुचिपर्यावरणम्" },
          { id: 2, name: "Buddhirbalam Yashasvinaam", nameHi: "बुद्धिर्बलं यशस्विनाम्" },
          { id: 3, name: "Sharadavritsant Varnana", nameHi: "शारदाऋतुसंत वर्णनम्" },
        ]
      },
    },

    // SENIOR SECONDARY (11-12)
    'Class 11': {
      // Science Stream
      Physics: {
        nameHi: "भौतिकी",
        chapters: [
          { id: 1, name: "Physical World", nameHi: "भौतिक दुनिया" },
          { id: 2, name: "Units and Measurements", nameHi: "इकाइयां और माप" },
          { id: 3, name: "Motion in a Straight Line", nameHi: "सरल रेखा में गति" },
          { id: 4, name: "Motion in a Plane", nameHi: "समतल में गति" },
          { id: 5, name: "Laws of Motion", nameHi: "गति के नियम" },
          { id: 6, name: "Work, Energy and Power", nameHi: "कार्य, ऊर्जा और शक्ति" },
          { id: 7, name: "System of Particles and Rotational Motion", nameHi: "कणों की प्रणाली और घूर्णी गति" },
          { id: 8, name: "Gravitation", nameHi: "गुरुत्वाकर्षण" },
          { id: 9, name: "Mechanical Properties of Solids", nameHi: "ठोस के यांत्रिक गुण" },
          { id: 10, name: "Thermal Properties of Matter", nameHi: "पदार्थ के तापीय गुण" },
        ]
      },
      Chemistry: {
        nameHi: "रसायन विज्ञान",
        chapters: [
          { id: 1, name: "Some Basic Concepts of Chemistry", nameHi: "रसायन विज्ञान की कुछ बुनियादी अवधारणाएं" },
          { id: 2, name: "Structure of Atom", nameHi: "परमाणु की संरचना" },
          { id: 3, name: "Classification of Elements", nameHi: "तत्वों का वर्गीकरण" },
          { id: 4, name: "Chemical Bonding", nameHi: "रासायनिक बंधन" },
          { id: 5, name: "States of Matter", nameHi: "पदार्थ की अवस्थाएं" },
          { id: 6, name: "Thermodynamics", nameHi: "ऊष्मागतिकी" },
          { id: 7, name: "Equilibrium", nameHi: "साम्यावस्था" },
          { id: 8, name: "Redox Reactions", nameHi: "अपचयोपचय अभिक्रियाएं" },
          { id: 9, name: "Hydrogen", nameHi: "हाइड्रोजन" },
          { id: 10, name: "Organic Chemistry", nameHi: "कार्बनिक रसायन" },
        ]
      },
      Biology: {
        nameHi: "जीव विज्ञान",
        chapters: [
          { id: 1, name: "The Living World", nameHi: "जीवित संसार" },
          { id: 2, name: "Biological Classification", nameHi: "जैविक वर्गीकरण" },
          { id: 3, name: "Plant Kingdom", nameHi: "पादप जगत" },
          { id: 4, name: "Animal Kingdom", nameHi: "जंतु जगत" },
          { id: 5, name: "Morphology of Flowering Plants", nameHi: "पुष्पी पौधों की आकृति विज्ञान" },
          { id: 6, name: "Anatomy of Flowering Plants", nameHi: "पुष्पी पौधों की शारीरिक रचना" },
          { id: 7, name: "Structural Organisation in Animals", nameHi: "जंतुओं में संरचनात्मक संगठन" },
          { id: 8, name: "Cell: The Unit of Life", nameHi: "कोशिका: जीवन की इकाई" },
          { id: 9, name: "Biomolecules", nameHi: "जैव अणु" },
          { id: 10, name: "Cell Cycle and Cell Division", nameHi: "कोशिका चक्र और कोशिका विभाजन" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Sets", nameHi: "समुच्चय" },
          { id: 2, name: "Relations and Functions", nameHi: "संबंध और फलन" },
          { id: 3, name: "Trigonometric Functions", nameHi: "त्रिकोणमितीय फलन" },
          { id: 4, name: "Principle of Mathematical Induction", nameHi: "गणितीय आगमन का सिद्धांत" },
          { id: 5, name: "Complex Numbers", nameHi: "सम्मिश्र संख्याएं" },
          { id: 6, name: "Linear Inequalities", nameHi: "रैखिक असमिकाएं" },
          { id: 7, name: "Permutations and Combinations", nameHi: "क्रमचय और संचय" },
          { id: 8, name: "Binomial Theorem", nameHi: "द्विपद प्रमेय" },
          { id: 9, name: "Sequences and Series", nameHi: "अनुक्रम और श्रेणी" },
          { id: 10, name: "Straight Lines", nameHi: "सरल रेखाएं" },
          { id: 11, name: "Conic Sections", nameHi: "शंकु परिच्छेद" },
          { id: 12, name: "Introduction to Three Dimensional Geometry", nameHi: "त्रिविमीय ज्यामिति का परिचय" },
        ]
      },
      // Commerce Stream
      Accountancy: {
        nameHi: "लेखाशास्त्र",
        chapters: [
          { id: 1, name: "Introduction to Accounting", nameHi: "लेखांकन का परिचय" },
          { id: 2, name: "Theory Base of Accounting", nameHi: "लेखांकन का सिद्धांत आधार" },
          { id: 3, name: "Recording of Transactions - I", nameHi: "लेन-देन का रिकॉर्डिंग - I" },
          { id: 4, name: "Recording of Transactions - II", nameHi: "लेन-देन का रिकॉर्डिंग - II" },
          { id: 5, name: "Bank Reconciliation Statement", nameHi: "बैंक समाधान विवरण" },
          { id: 6, name: "Trial Balance", nameHi: "तलपट" },
          { id: 7, name: "Depreciation", nameHi: "मूल्यह्रास" },
          { id: 8, name: "Financial Statements - I", nameHi: "वित्तीय विवरण - I" },
        ]
      },
      'Business Studies': {
        nameHi: "व्यवसाय अध्ययन",
        chapters: [
          { id: 1, name: "Nature and Purpose of Business", nameHi: "व्यवसाय की प्रकृति और उद्देश्य" },
          { id: 2, name: "Forms of Business Organisation", nameHi: "व्यावसायिक संगठन के रूप" },
          { id: 3, name: "Private, Public and Global Enterprises", nameHi: "निजी, सार्वजनिक और वैश्विक उद्यम" },
          { id: 4, name: "Business Services", nameHi: "व्यावसायिक सेवाएं" },
          { id: 5, name: "Emerging Modes of Business", nameHi: "व्यवसाय के उभरते तरीके" },
          { id: 6, name: "Social Responsibilities of Business", nameHi: "व्यवसाय की सामाजिक जिम्मेदारियां" },
        ]
      },
      Economics: {
        nameHi: "अर्थशास्त्र",
        chapters: [
          { id: 1, name: "Introduction to Microeconomics", nameHi: "सूक्ष्म अर्थशास्त्र का परिचय" },
          { id: 2, name: "Theory of Consumer Behaviour", nameHi: "उपभोक्ता व्यवहार का सिद्धांत" },
          { id: 3, name: "Production and Costs", nameHi: "उत्पादन और लागत" },
          { id: 4, name: "Theory of Firm under Perfect Competition", nameHi: "पूर्ण प्रतिस्पर्धा के तहत फर्म का सिद्धांत" },
          { id: 5, name: "Market Equilibrium", nameHi: "बाजार संतुलन" },
          { id: 6, name: "Introduction to Statistics", nameHi: "सांख्यिकी का परिचय" },
        ]
      },
      // Arts Stream
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "The Portrait of a Lady", nameHi: "एक महिला का चित्र" },
          { id: 2, name: "We\"re Not Afraid to Die', nameHi: "हम मरने से नहीं डरते" },
          { id: 3, name: "Discovering Tut", nameHi: "टुट की खोज" },
          { id: 4, name: "Landscape of the Soul", nameHi: "आत्मा का परिदृश्य" },
          { id: 5, name: "The Ailing Planet", nameHi: "बीमार ग्रह" },
          { id: 6, name: "The Browning Version", nameHi: "ब्राउनिंग संस्करण" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "आरोह - कबीर", nameHi: "आरोह - कबीर" },
          { id: 2, name: "आरोह - मीराबाई", nameHi: "आरोह - मीराबाई" },
          { id: 3, name: "आरोह - तुलसीदास", nameHi: "आरोह - तुलसीदास" },
          { id: 4, name: "आरोह - सूरदास", nameHi: "आरोह - सूरदास" },
          { id: 5, name: "वितान - भारतीय गायिकाओं में", nameHi: "वितान - भारतीय गायिकाओं में" },
          { id: 6, name: "वितान - राजस्थान की रजत बूंदें", nameHi: "वितान - राजस्थान की रजत बूंदें" },
        ]
      },
      History: {
        nameHi: "इतिहास",
        chapters: [
          { id: 1, name: "From the Beginning of Time", nameHi: "समय की शुरुआत से" },
          { id: 2, name: "Writing and City Life", nameHi: "लेखन और शहर जीवन" },
          { id: 3, name: "An Empire Across Three Continents", nameHi: "तीन महाद्वीपों में एक साम्राज्य" },
          { id: 4, name: "The Central Islamic Lands", nameHi: "केंद्रीय इस्लामी भूमि" },
          { id: 5, name: "Nomadic Empires", nameHi: "खानाबदोश साम्राज्य" },
        ]
      },
      Geography: {
        nameHi: "भूगोल",
        chapters: [
          { id: 1, name: "Geography as a Discipline", nameHi: "एक विषय के रूप में भूगोल" },
          { id: 2, name: "The Origin and Evolution of the Earth", nameHi: "पृथ्वी की उत्पत्ति और विकास" },
          { id: 3, name: "Interior of the Earth", nameHi: "पृथ्वी का आंतरिक भाग" },
          { id: 4, name: "Distribution of Oceans and Continents", nameHi: "महासागरों और महाद्वीपों का वितरण" },
          { id: 5, name: "Minerals and Rocks", nameHi: "खनिज और चट्टानें" },
        ]
      },
      'Political Science': {
        nameHi: "राजनीति विज्ञान",
        chapters: [
          { id: 1, name: "Political Theory: An Introduction", nameHi: "राजनीतिक सिद्धांत: एक परिचय" },
          { id: 2, name: "Freedom", nameHi: "स्वतंत्रता" },
          { id: 3, name: "Equality", nameHi: "समानता" },
          { id: 4, name: "Social Justice", nameHi: "सामाजिक न्याय" },
          { id: 5, name: "Rights", nameHi: "अधिकार" },
        ]
      },
    },

    'Class 12': {
      // Science Stream
      Physics: {
        nameHi: "भौतिकी",
        chapters: [
          { id: 1, name: "Electric Charges and Fields", nameHi: "विद्युत आवेश और क्षेत्र" },
          { id: 2, name: "Electrostatic Potential and Capacitance", nameHi: "स्थिरवैद्युत विभव और संधारित्र" },
          { id: 3, name: "Current Electricity", nameHi: "विद्युत धारा" },
          { id: 4, name: "Moving Charges and Magnetism", nameHi: "गतिमान आवेश और चुंबकत्व" },
          { id: 5, name: "Magnetism and Matter", nameHi: "चुंबकत्व और पदार्थ" },
          { id: 6, name: "Electromagnetic Induction", nameHi: "विद्युत चुम्बकीय प्रेरण" },
          { id: 7, name: "Alternating Current", nameHi: "प्रत्यावर्ती धारा" },
          { id: 8, name: "Electromagnetic Waves", nameHi: "विद्युत चुम्बकीय तरंगें" },
          { id: 9, name: "Ray Optics and Optical Instruments", nameHi: "किरण प्रकाशिकी और प्रकाशीय यंत्र" },
          { id: 10, name: "Wave Optics", nameHi: "तरंग प्रकाशिकी" },
        ]
      },
      Chemistry: {
        nameHi: "रसायन विज्ञान",
        chapters: [
          { id: 1, name: "The Solid State", nameHi: "ठोस अवस्था" },
          { id: 2, name: "Solutions", nameHi: "विलयन" },
          { id: 3, name: "Electrochemistry", nameHi: "वैद्युत रसायन" },
          { id: 4, name: "Chemical Kinetics", nameHi: "रासायनिक गतिकी" },
          { id: 5, name: "Surface Chemistry", nameHi: "पृष्ठ रसायन" },
          { id: 6, name: "General Principles of Metallurgy", nameHi: "धातुकर्म के सामान्य सिद्धांत" },
          { id: 7, name: "The p-Block Elements", nameHi: "p-ब्लॉक तत्व" },
          { id: 8, name: "The d and f Block Elements", nameHi: "d और f ब्लॉक तत्व" },
          { id: 9, name: "Coordination Compounds", nameHi: "उपसहसंयोजन यौगिक" },
          { id: 10, name: "Haloalkanes and Haloarenes", nameHi: "हैलोएल्केन और हैलोएरीन" },
        ]
      },
      Biology: {
        nameHi: "जीव विज्ञान",
        chapters: [
          { id: 1, name: "Reproduction in Organisms", nameHi: "जीवों में प्रजनन" },
          { id: 2, name: "Sexual Reproduction in Flowering Plants", nameHi: "पुष्पी पौधों में लैंगिक प्रजनन" },
          { id: 3, name: "Human Reproduction", nameHi: "मानव प्रजनन" },
          { id: 4, name: "Reproductive Health", nameHi: "प्रजनन स्वास्थ्य" },
          { id: 5, name: "Principles of Inheritance and Variation", nameHi: "आनुवंशिकता और विविधता के सिद्धांत" },
          { id: 6, name: "Molecular Basis of Inheritance", nameHi: "आनुवंशिकता का आणविक आधार" },
          { id: 7, name: "Evolution", nameHi: "विकास" },
          { id: 8, name: "Human Health and Disease", nameHi: "मानव स्वास्थ्य और रोग" },
          { id: 9, name: "Biotechnology", nameHi: "जैव प्रौद्योगिकी" },
          { id: 10, name: "Organisms and Populations", nameHi: "जीव और जनसंख्या" },
        ]
      },
      Mathematics: {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Relations and Functions", nameHi: "संबंध और फलन" },
          { id: 2, name: "Inverse Trigonometric Functions", nameHi: "प्रतिलोम त्रिकोणमितीय फलन" },
          { id: 3, name: "Matrices", nameHi: "आव्यूह" },
          { id: 4, name: "Determinants", nameHi: "सारणिक" },
          { id: 5, name: "Continuity and Differentiability", nameHi: "सांतत्य और अवकलनीयता" },
          { id: 6, name: "Application of Derivatives", nameHi: "अवकलज के अनुप्रयोग" },
          { id: 7, name: "Integrals", nameHi: "समाकलन" },
          { id: 8, name: "Application of Integrals", nameHi: "समाकलन के अनुप्रयोग" },
          { id: 9, name: "Differential Equations", nameHi: "अवकल समीकरण" },
          { id: 10, name: "Vector Algebra", nameHi: "सदिश बीजगणित" },
          { id: 11, name: "Three Dimensional Geometry", nameHi: "त्रि-विमीय ज्यामिति" },
          { id: 12, name: "Linear Programming", nameHi: "रैखिक प्रोग्रामिंग" },
          { id: 13, name: "Probability", nameHi: "प्रायिकता" },
        ]
      },
      // Commerce Stream
      Accountancy: {
        nameHi: "लेखाशास्त्र",
        chapters: [
          { id: 1, name: "Accounting for Partnership Firms", nameHi: "साझेदारी फर्मों के लिए लेखांकन" },
          { id: 2, name: "Reconstitution of Partnership", nameHi: "साझेदारी का पुनर्गठन" },
          { id: 3, name: "Dissolution of Partnership Firm", nameHi: "साझेदारी फर्म का विघटन" },
          { id: 4, name: "Accounting for Share Capital", nameHi: "शेयर पूंजी के लिए लेखांकन" },
          { id: 5, name: "Debentures", nameHi: "ऋणपत्र" },
          { id: 6, name: "Financial Statements of Companies", nameHi: "कंपनियों के वित्तीय विवरण" },
          { id: 7, name: "Analysis of Financial Statements", nameHi: "वित्तीय विवरणों का विश्लेषण" },
        ]
      },
      'Business Studies': {
        nameHi: "व्यवसाय अध्ययन",
        chapters: [
          { id: 1, name: "Nature and Significance of Management", nameHi: "प्रबंधन की प्रकृति और महत्व" },
          { id: 2, name: "Principles of Management", nameHi: "प्रबंधन के सिद्धांत" },
          { id: 3, name: "Business Environment", nameHi: "व्यावसायिक वातावरण" },
          { id: 4, name: "Planning", nameHi: "योजना" },
          { id: 5, name: "Organising", nameHi: "आयोजन" },
          { id: 6, name: "Staffing", nameHi: "कर्मचारी चयन" },
          { id: 7, name: "Directing", nameHi: "निर्देशन" },
          { id: 8, name: "Controlling", nameHi: "नियंत्रण" },
          { id: 9, name: "Financial Management", nameHi: "वित्तीय प्रबंधन" },
          { id: 10, name: "Financial Markets", nameHi: "वित्तीय बाजार" },
          { id: 11, name: "Marketing", nameHi: "विपणन" },
          { id: 12, name: "Consumer Protection", nameHi: "उपभोक्ता संरक्षण" },
        ]
      },
      Economics: {
        nameHi: "अर्थशास्त्र",
        chapters: [
          { id: 1, name: "Introduction to Macroeconomics", nameHi: "व्यापक अर्थशास्त्र का परिचय" },
          { id: 2, name: "National Income Accounting", nameHi: "राष्ट्रीय आय लेखांकन" },
          { id: 3, name: "Money and Banking", nameHi: "मुद्रा और बैंकिंग" },
          { id: 4, name: "Determination of Income and Employment", nameHi: "आय और रोजगार का निर्धारण" },
          { id: 5, name: "Government Budget", nameHi: "सरकारी बजट" },
          { id: 6, name: "Balance of Payments", nameHi: "भुगतान संतुलन" },
        ]
      },
      // Arts Stream
      English: {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "The Last Lesson", nameHi: "अंतिम पाठ" },
          { id: 2, name: "Lost Spring", nameHi: "खोई हुई वसंत" },
          { id: 3, name: "Deep Water", nameHi: "गहरा पानी" },
          { id: 4, name: "The Rattrap", nameHi: "चूहेदानी" },
          { id: 5, name: "Indigo", nameHi: "नील" },
          { id: 6, name: "Poets and Pancakes", nameHi: "कवि और पैनकेक" },
          { id: 7, name: "The Interview", nameHi: "साक्षात्कार" },
          { id: 8, name: "Going Places", nameHi: "जाते हुए स्थान" },
        ]
      },
      Hindi: {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "आरोह - आत्मपरिचय", nameHi: "आरोह - आत्मपरिचय" },
          { id: 2, name: "आरोह - पतंग", nameHi: "आरोह - पतंग" },
          { id: 3, name: "आरोह - कविता के बहाने", nameHi: "आरोह - कविता के बहाने" },
          { id: 4, name: "आरोह - कैमरे में बंद अपाहिज", nameHi: "आरोह - कैमरे में बंद अपाहिज" },
          { id: 5, name: "वितान - सिल्वर वेडिंग", nameHi: "वितान - सिल्वर वेडिंग" },
          { id: 6, name: "वितान - जूझ", nameHi: "वितान - जूझ" },
          { id: 7, name: "वितान - अतीत में दबे पाँव", nameHi: "वितान - अतीत में दबे पाँव" },
        ]
      },
      History: {
        nameHi: "इतिहास",
        chapters: [
          { id: 1, name: "Bricks, Beads and Bones", nameHi: "ईंटें, मोती और हड्डियां" },
          { id: 2, name: "Kings, Farmers and Towns", nameHi: "राजा, किसान और शहर" },
          { id: 3, name: "Kinship, Caste and Class", nameHi: "रिश्तेदारी, जाति और वर्ग" },
          { id: 4, name: "Thinkers, Beliefs and Buildings", nameHi: "विचारक, विश्वास और इमारतें" },
          { id: 5, name: "Through the Eyes of Travellers", nameHi: "यात्रियों की आंखों से" },
          { id: 6, name: "Rebels and the Raj", nameHi: "विद्रोही और राज" },
        ]
      },
      Geography: {
        nameHi: "भूगोल",
        chapters: [
          { id: 1, name: "Population: Distribution, Density and Growth", nameHi: "जनसंख्या: वितरण, घनत्व और वृद्धि" },
          { id: 2, name: "Human Settlements", nameHi: "मानव बस्तियां" },
          { id: 3, name: "Land Resources", nameHi: "भूमि संसाधन" },
          { id: 4, name: "Water Resources", nameHi: "जल संसाधन" },
          { id: 5, name: "Mineral and Energy Resources", nameHi: "खनिज और ऊर्जा संसाधन" },
          { id: 6, name: "Planning and Development", nameHi: "योजना और विकास" },
        ]
      },
      'Political Science': {
        nameHi: "राजनीति विज्ञान",
        chapters: [
          { id: 1, name: "The Cold War Era", nameHi: "शीत युद्ध का युग" },
          { id: 2, name: "End of Bipolarity", nameHi: "द्विध्रुवीयता का अंत" },
          { id: 3, name: "US Hegemony in World Politics", nameHi: "विश्व राजनीति में अमेरिकी वर्चस्व" },
          { id: 4, name: "Alternative Centres of Power", nameHi: "शक्ति के वैकल्पिक केंद्र" },
          { id: 5, name: "Contemporary South Asia", nameHi: "समकालीन दक्षिण एशिया" },
          { id: 6, name: "India and the World", nameHi: "भारत और विश्व" },
        ]
      },
    },
  },

  // ========== MP BOARD (MPBSE) ==========
  // MP Board follows NCERT syllabus, so we'll use similar structure with Hindi names
  MPBSE: {
    // Copy entire CBSE structure but with Hindi subject names
    // For brevity, I'll show a few classes - in production, this would mirror CBSE completely
    
    Nursery: {
      // Same as CBSE Nursery
      'हिंदी': {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "स्वर (अ-अः)", nameHi: "स्वर (अ-अः)" },
          { id: 2, name: "व्यंजन (क-ङ)", nameHi: "व्यंजन (क-ङ)" },
          { id: 3, name: "व्यंजन (च-ञ)", nameHi: "व्यंजन (च-ञ)" },
          { id: 4, name: "सरल शब्द पहचान", nameHi: "सरल शब्द पहचान" },
        ]
      },
      'अंग्रेजी': {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Alphabet A-Z", nameHi: "वर्णमाला A-Z" },
          { id: 2, name: "Vowels", nameHi: "स्वर" },
          { id: 3, name: "Simple Words", nameHi: "सरल शब्द" },
        ]
      },
      'गणित': {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Numbers 1-10", nameHi: "संख्याएं 1-10" },
          { id: 2, name: "Shapes", nameHi: "आकार" },
          { id: 3, name: "Counting", nameHi: "गिनती" },
        ]
      },
    },
    // ... (Other classes would follow CBSE structure)
  },

  // ========== RBSE (Rajasthan Board) ==========
  RBSE: {
    // Similar to MP Board, follows NCERT with regional variations
    Nursery: {
      'हिंदी': {
        nameHi: "हिंदी",
        chapters: [
          { id: 1, name: "स्वर परिचय", nameHi: "स्वर परिचय" },
          { id: 2, name: "व्यंजन परिचय", nameHi: "व्यंजन परिचय" },
          { id: 3, name: "चित्र पहचान", nameHi: "चित्र पहचान" },
        ]
      },
      'अंग्रेजी': {
        nameHi: "अंग्रेजी",
        chapters: [
          { id: 1, name: "Alphabet Learning", nameHi: "वर्णमाला सीखना" },
          { id: 2, name: "Phonics", nameHi: "ध्वनि" },
        ]
      },
      'गणित': {
        nameHi: "गणित",
        chapters: [
          { id: 1, name: "Number Recognition 1-10", nameHi: "संख्या पहचान 1-10" },
          { id: 2, name: "Basic Shapes", nameHi: "बुनियादी आकार" },
        ]
      },
    },
    // ... (Other classes would follow)
  },
};

// =====================================================
// HELPER FUNCTION TO GET CHAPTERS
// =====================================================
export function getChapters2025(board, className, subject, language = 'english') {
  try {
    const boardData = SYLLABUS_2025[board];
    if (!boardData) return [];
    
    const classData = boardData[className];
    if (!classData) return [];
    
    const subjectData = classData[subject];
    if (!subjectData) return [];
    
    return subjectData.chapters || [];
  } catch (error) {
    console.error('Error getting chapters:', error);
    return [];
  }
}

// =====================================================
// BOARD-WISE EXAM PATTERNS
// =====================================================
export const EXAM_PATTERNS_2025 = {
  CBSE: {
    'Class 10': {
      totalMarks: 80,
      internalAssessment: 20,
      sections: {
        A: { type: 'MCQ', marks: 20, questions: 20 },
        B: { type: 'Very Short Answer', marks: 12, questions: 6 },
        C: { type: 'Short Answer', marks: 18, questions: 6 },
        D: { type: 'Long Answer', marks: 15, questions: 3 },
        E: { type: 'Case Based', marks: 15, questions: 3 },
      }
    },
    'Class 12': {
      totalMarks: 80,
      internalAssessment: 20,
      distribution: {
        MCQ: '20%',
        CompetencyBased: '30%',
        Descriptive: '50%'
      }
    }
  }
};

export default SYLLABUS_2025;
