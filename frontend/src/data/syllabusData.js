const SYLLABUS_DATA = {
  'CBSE': {
    name: 'CBSE (NCERT)',
    classes: {
      'Nursery': {
        subjects: {
          'English': ['Alphabets A-Z', 'Phonics', 'Simple Words', 'Rhymes & Stories'],
          'Hindi': ['स्वर (अ-अः)', 'व्यंजन (क-ज्ञ)', 'मात्राएं', 'सरल शब्द'],
          'Mathematics': ['Numbers 1-20', 'Shapes', 'Colors', 'Patterns', 'Comparison (Big-Small)'],
          'EVS': ['My Body', 'My Family', 'Animals', 'Fruits & Vegetables', 'Good Habits'],
          'Drawing': ['Coloring', 'Tracing', 'Simple Shapes', 'Free Drawing']
        }
      },
      'LKG': {
        subjects: {
          'English': ['Alphabets & Phonics', 'Three Letter Words', 'Rhyming Words', 'Simple Sentences', 'Stories'],
          'Hindi': ['स्वर व व्यंजन', 'मात्राएं (आ, इ, ई)', 'दो अक्षर के शब्द', 'कविताएं'],
          'Mathematics': ['Numbers 1-50', 'Counting', 'Addition (Single Digit)', 'Shapes & Patterns', 'Before-After-Between'],
          'EVS': ['My School', 'My Family', 'Festivals', 'Weather & Seasons', 'Safety Rules'],
          'Drawing': ['Object Drawing', 'Coloring', 'Pattern Making', 'Scenery']
        }
      },
      'UKG': {
        subjects: {
          'English': ['Reading Simple Words', 'Sight Words', 'Sentence Formation', 'Picture Composition', 'Stories & Comprehension'],
          'Hindi': ['मात्राएं (सभी)', 'तीन अक्षर के शब्द', 'वाक्य बनाओ', 'कहानी', 'अपठित गद्यांश'],
          'Mathematics': ['Numbers 1-100', 'Addition & Subtraction', 'Money', 'Time', 'Measurement', 'Word Problems'],
          'EVS': ['Plants & Trees', 'Animals & Birds', 'Transport', 'Festivals of India', 'Our Helpers', 'Food & Nutrition'],
          'Drawing': ['Nature Drawing', 'Animal Drawing', 'Festival Drawing', 'Imagination Drawing']
        }
      },
      'Class 1': {
        subjects: {
          'English': ['The Alphabet', 'A Happy Child', 'Three Little Pigs', 'After a Bath', 'The Bubble, the Straw, and the Shoe', 'One Little Kitten', 'Lalu and Peelu', 'Once I Saw a Little Bird', 'Mittu and the Yellow Mango'],
          'Hindi': ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छोटी का कमाल', 'मेला', 'पतंग', 'दही वाली मांगम्मा'],
          'Mathematics': ['Shapes and Space', 'Numbers from One to Nine', 'Addition', 'Subtraction', 'Numbers from Ten to Twenty', 'Time', 'Measurement', 'Numbers to 21-50', 'Data Handling', 'Patterns', 'Numbers (51-100)', 'Money', 'How Many'],
          'EVS': ['Me and My Family', 'My Body', 'Food We Eat', 'Our Clothes', 'Animals Around Us', 'Plants Around Us']
        }
      },
      'Class 2': {
        subjects: {
          'English': ['First Day at School', 'Haldi\'s Adventure', 'I am Lucky!', 'I Want', 'A Smile', 'The Wind and the Sun', 'Rain', 'Storm in the Garden', 'Zoo Manners', 'The Grasshopper and the Ant'],
          'Hindi': ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'सूरज जल्दी आना जी', 'बस के नीचे बाघ', 'दोस्त की मदद', 'बहुत हुआ', 'मेरी किताब', 'तितली और कली', 'बुलबुल'],
          'Mathematics': ['What is Long, What is Round?', 'Counting in Groups', 'How Much Can You Carry?', 'Counting in Tens', 'Patterns', 'Footprints', 'Jugs and Mugs', 'Tens and Ones', 'My Funday', 'Add Our Points', 'Lines and Lines', 'Give and Take', 'The Longest Step', 'Birds Come, Birds Go', 'How Many Ponytails?'],
          'EVS': ['My Family and Friends', 'Animals and Birds', 'Plants and Trees', 'Food and Water', 'Shelter', 'Games and Sports']
        }
      },
      'Class 3': {
        subjects: {
          'English': ['Good Morning', 'The Magic Garden', 'Bird Talk', 'Nina and the Baby Sparrows', 'The Enormous Turnip', 'Sea Song', 'A Little Fish Story', 'The Balloon Man', 'The Enormous Turnip', 'Trains'],
          'Hindi': ['कक्कू', 'शेखीबाज़ मक्खी', 'चांद वाली अम्मा', 'मन करता है', 'बहादुर बित्तो', 'हम भी सीखें', 'टिपटिपवा', 'बंदर बांट'],
          'Mathematics': ['Where to Look From', 'Fun with Numbers', 'Give and Take', 'Long and Short', 'Shapes and Designs', 'Fun with Give and Take', 'Time Goes On', 'Who is Heavier?', 'How Many Times?', 'Play with Patterns', 'Jugs and Mugs', 'Can We Share?', 'Smart Charts'],
          'EVS': ['Poonam\'s Day Out', 'The Plant Fairy', 'Water O Water', 'Our First School', 'Chhotu\'s House', 'Foods We Eat', 'Saying Without Speaking', 'Flying High', 'It\'s Raining', 'What is Cooking', 'From Here to There', 'Work We Do'],
          'Science': ['Living and Non-Living Things', 'Plants', 'Animals', 'Birds', 'Food', 'Water', 'Shelter', 'Our Body']
        }
      },
      'Class 4': {
        subjects: {
          'English': ['Wake Up!', 'Neha\'s Alarm Clock', 'Noses', 'The Little Fir Tree', 'Run!', 'Nasruddin\'s Aim', 'Why?', 'Alice in Wonderland', 'Don\'t be Afraid of the Dark', 'The Donkey'],
          'Hindi': ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'दोस्त की पोशाक', 'चिड़िया की बच्ची', 'अनोखी दौड़', 'ज़रूरत', 'सबसे अच्छा पेड़'],
          'Mathematics': ['Building with Bricks', 'Long and Short', 'A Trip to Bhopal', 'Tick-Tick-Tick', 'The Way the World Looks', 'The Junk Seller', 'Jugs and Mugs', 'Carts and Wheels', 'Halves and Quarters', 'Play with Patterns', 'Tables and Shares', 'How Heavy? How Light?', 'Fields and Fences', 'Smart Charts'],
          'EVS': ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'The Story of Amrita', 'Anita and the Honeybees', 'Omana\'s Journey', 'From the Window', 'Reaching Grandmother\'s House', 'Changing Families', 'Hu Tu Tu, Hu Tu Tu', 'Valley of Flowers', 'Changing Times', 'A River\'s Tale', 'Basva\'s Farm', 'From Market to Home'],
          'Science': ['Plants and Animals', 'Food and Digestion', 'Teeth and Microbes', 'Our Environment', 'Weather and Seasons']
        }
      },
      'Class 5': {
        subjects: {
          'English': ['Ice-cream Man', 'Wonderful Waste!', 'Teamwork', 'Flying Together', 'My Shadow', 'Robinson Crusoe', 'Crying', 'My Elder Brother', 'The Lazy Frog', 'Who Will be Ningthou?'],
          'Hindi': ['राख की रस्सी', 'फ़सलों के त्योहार', 'खिलौने वाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह', 'चिट्ठी का सफ़र', 'डाकिये की कहानी', 'वे दिन भी क्या दिन थे', 'एक माँ की बेबसी'],
          'Mathematics': ['The Fish Tale', 'Shapes and Angles', 'How Many Squares?', 'Parts and Wholes', 'Does it Look the Same?', 'Be My Multiple, I\'ll be Your Factor', 'Can You See the Pattern?', 'Mapping Your Way', 'Boxes and Sketches', 'Tenths and Hundredths', 'Area and its Boundary', 'Smart Charts', 'Ways to Multiply and Divide', 'How Big? How Heavy?'],
          'EVS': ['Super Senses', 'A Snake Charmer\'s Story', 'From Tasting to Digesting', 'Mangoes Round the Year', 'Seeds and Seeds', 'Every Drop Counts', 'Experiments with Water', 'A Treat for Mosquitoes', 'Up You Go!', 'Walls Tell Stories', 'Sunita in Space', 'What if it Finishes?', 'A Shelter so High!', 'When the Earth Shook!', 'Blow Hot Blow Cold'],
          'Science': ['Living Things', 'Human Body Systems', 'Food and Health', 'Materials and Their Properties', 'Force and Energy', 'Earth and Universe']
        }
      },
      'Class 6': {
        subjects: {
          'English': ['Who Did Patrick\'s Homework?', 'How the Dog Found Himself a New Master!', 'Taro\'s Reward', 'An Indian - American Woman in Space', 'A Different Kind of School', 'Who I Am', 'Fair Play', 'A Game of Chance', 'Desert Animals', 'The Banyan Tree'],
          'Hindi': ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व', 'पार नज़र के', 'साथी हाथ बढ़ाना', 'ऐसे-ऐसे', 'टिकट अलबम', 'झांसी की रानी'],
          'Mathematics': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra', 'Ratio and Proportion', 'Symmetry', 'Practical Geometry'],
          'Science': ['Food: Where Does it Come From?', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials into Groups', 'Separation of Substances', 'Changes Around Us', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms and Their Surroundings', 'Motion and Measurement of Distances', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Water', 'Air Around Us', 'Garbage In, Garbage Out'],
          'Social Science': ['What, Where, How and When?', 'From Hunting-Gathering to Growing Food', 'In the Earliest Cities', 'What Books and Burials Tell Us', 'Kingdoms, Kings and an Early Republic', 'New Questions and Ideas', 'The Earth in the Solar System', 'Globe: Latitudes and Longitudes', 'Motions of the Earth', 'Maps', 'Major Domains of the Earth', 'Our Country - India', 'Understanding Diversity', 'Diversity and Discrimination', 'What is Government?', 'Key Elements of a Democratic Government', 'Panchayati Raj', 'Rural Administration', 'Urban Administration'],
          'Sanskrit': ['शब्द परिचयः', 'अकारान्त-पुल्लिंग', 'अकारान्त-स्त्रीलिंग', 'क्रियापदानि', 'सर्वनामपदानि', 'अव्ययपदानि']
        }
      },
      'Class 7': {
        subjects: {
          'English': ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'The Ashes That Made Trees Bloom', 'Quality', 'Expert Detectives', 'The Invention of Vita-Wonk', 'Fire: Friend and Foe', 'A Bicycle in Good Repair', 'The Story of Cricket'],
          'Hindi': ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'रक्त और हमारा शरीर', 'पापा खो गए', 'शाम एक किसान', 'चिड़िया की बच्ची', 'अपूर्व अनुभव'],
          'Mathematics': ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'The Triangle and its Properties', 'Congruence of Triangles', 'Comparing Quantities', 'Rational Numbers', 'Practical Geometry', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers', 'Symmetry', 'Visualising Solid Shapes'],
          'Science': ['Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Weather, Climate and Adaptations of Animals', 'Winds, Storms and Cyclones', 'Soil', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current and Its Effects', 'Light', 'Water: A Precious Resource', 'Forests: Our Lifeline', 'Wastewater Story'],
          'Social Science': ['Tracing Changes Through a Thousand Years', 'New Kings and Kingdoms', 'The Delhi Sultans', 'The Mughal Empire', 'Rulers and Buildings', 'Environment', 'Inside Our Earth', 'Our Changing Earth', 'Air', 'Water', 'Natural Vegetation and Wildlife', 'On Equality', 'Role of the Government in Health', 'How the State Government Works', 'Growing Up as Boys and Girls', 'Understanding Media', 'Markets Around Us'],
          'Sanskrit': ['सुभाषितानि', 'दुर्बुद्धिः विनश्यति', 'स्वावलम्बनम्', 'हास्यबालकविसम्मेलनम्', 'पण्डिता रमाबाई', 'सदाचारः']
        }
      },
      'Class 8': {
        subjects: {
          'English': ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury\'s Lapse of Memory', 'The Summit Within', 'This is Jody\'s Fawn', 'A Visit to Cambridge', 'A Short Monsoon Diary', 'The Great Stone Face I', 'The Great Stone Face II'],
          'Hindi': ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिये', 'क्या निराश हुआ जाए', 'यह सबसे कठिन समय नहीं', 'कबीर की साखियाँ', 'कामचोर'],
          'Mathematics': ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Practical Geometry', 'Data Handling', 'Squares and Square Roots', 'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions and Identities', 'Visualising Solid Shapes', 'Mensuration', 'Exponents and Powers', 'Direct and Inverse Proportions', 'Factorisation', 'Introduction to Graphs', 'Playing with Numbers'],
          'Science': ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Synthetic Fibres and Plastics', 'Materials: Metals and Non-Metals', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Cell - Structure and Functions', 'Reproduction in Animals', 'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light', 'Stars and the Solar System', 'Pollution of Air and Water'],
          'Social Science': ['How, When and Where', 'From Trade to Territory', 'Ruling the Countryside', 'Tribals, Dikus and the Vision of a Golden Age', 'When People Rebel', 'Resources', 'Land, Soil, Water, Natural Vegetation and Wildlife', 'Agriculture', 'Industries', 'Human Resources', 'The Indian Constitution', 'Understanding Secularism', 'Why Do We Need a Parliament?', 'Understanding Laws', 'Judiciary', 'Understanding Our Criminal Justice System', 'Understanding Marginalisation'],
          'Sanskrit': ['सुभाषितानि', 'बिलस्य वाणी न कदापि मे श्रुता', 'डिजीभारतम्', 'सदैव पुरतो निधेहि चरणम्', 'कण्टकेनैव कण्टकम्', 'गृहं शून्यं सुतां विना']
        }
      },
      'Class 9': {
        subjects: {
          'English': ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Packing', 'Reach for the Top', 'The Bond of Love', 'Kathmandu', 'If I Were You'],
          'Hindi': ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'नाना साहब की पुत्री', 'प्रेमचंद के फटे जूते', 'मेरे बचपन के दिन', 'एक कुत्ता और एक मैना', 'साखियाँ एवं सबद', 'वाख', 'सवैये', 'कैदी और कोकिला', 'मेरे संग की औरतें'],
          'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', 'Introduction to Euclid\'s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms and Triangles', 'Circles', 'Constructions', 'Heron\'s Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill?', 'Natural Resources', 'Improvement in Food Resources'],
          'Social Science': ['The French Revolution', 'Socialism in Europe and the Russian Revolution', 'Nazism and the Rise of Hitler', 'Forest Society and Colonialism', 'Pastoralists in the Modern World', 'India - Size and Location', 'Physical Features of India', 'Drainage', 'Climate', 'Natural Vegetation and Wildlife', 'Population', 'What is Democracy? Why Democracy?', 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'Democratic Rights', 'The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India'],
          'Sanskrit': ['भारतीवसन्तगीतिः', 'स्वर्णकाकः', 'गोदोहनम्', 'कल्पतरुः', 'सूक्तिमौक्तिकम्']
        }
      },
      'Class 10': {
        subjects: {
          'English': ['A Letter to God', 'Nelson Mandela: Long Walk to Freedom', 'Two Stories about Flying', 'From the Diary of Anne Frank', 'The Hundred Dresses I', 'The Hundred Dresses II', 'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus', 'The Sermon at Benares', 'The Proposal'],
          'Hindi': ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'आत्मकथ्य', 'उत्साह', 'अट नहीं रही है', 'यह दंतुरित मुसकान', 'फसल', 'छाया मत छूना', 'कन्यादान', 'संगतकार', 'बालगोबिन भगत', 'लखनवी अंदाज़', 'मानवीय करुणा की दिव्य चमक', 'एक कहानी यह भी', 'स्त्री शिक्षा के विरोधी कुतर्कों का खंडन', 'नौबतखाने में इबादत'],
          'Mathematics': ['Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification of Elements', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce?', 'Heredity and Evolution', 'Light - Reflection and Refraction', 'Human Eye and Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy', 'Our Environment', 'Management of Natural Resources'],
          'Social Science': ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture and the Modern World', 'Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy', 'Power Sharing', 'Federalism', 'Democracy and Diversity', 'Gender, Religion and Caste', 'Popular Struggles and Movements', 'Political Parties', 'Outcomes of Democracy', 'Challenges to Democracy', 'Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy', 'Consumer Rights'],
          'Sanskrit': ['शुचिपर्यावरणम्', 'बुद्धिर्बलवती सदा', 'व्यायामः सर्वदा पथ्यः', 'शिशुलालनम्', 'जननी तुल्यवत्सला', 'सुभाषितानि']
        }
      },
      'Class 11': {
        subjects: {
          'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
          'Chemistry': ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements and Periodicity', 'Chemical Bonding and Molecular Structure', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 'The s-Block Elements', 'The p-Block Elements', 'Organic Chemistry - Some Basic Principles', 'Hydrocarbons', 'Environmental Chemistry'],
          'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Principle of Mathematical Induction', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', 'Introduction to Three Dimensional Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability'],
          'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division', 'Transport in Plants', 'Mineral Nutrition', 'Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development', 'Digestion and Absorption', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products and their Elimination', 'Locomotion and Movement', 'Neural Control and Coordination', 'Chemical Coordination and Integration'],
          'English': ['The Portrait of a Lady', 'We\'re Not Afraid to Die', 'Discovering Tut: The Saga Continues', 'Landscape of the Soul', 'The Ailing Planet', 'The Browning Version', 'The Adventure', 'Silk Road'],
          'Hindi': ['नमक का दारोगा', 'मियाँ नसीरुद्दीन', 'अपू के साथ ढाई साल', 'विदाई संभाषण', 'गलता लोहा', 'स्पीति में बारिश', 'रजनी', 'जामुन का पेड़'],
          'Accountancy': ['Introduction to Accounting', 'Theory Base of Accounting', 'Recording of Transactions I', 'Recording of Transactions II', 'Bank Reconciliation Statement', 'Trial Balance and Rectification of Errors', 'Depreciation, Provisions and Reserves', 'Bill of Exchange', 'Financial Statements I', 'Financial Statements II', 'Accounts from Incomplete Records', 'Applications of Computers in Accounting'],
          'Business Studies': ['Nature and Purpose of Business', 'Forms of Business Organisation', 'Private, Public and Global Enterprises', 'Business Services', 'Emerging Modes of Business', 'Social Responsibilities of Business and Business Ethics', 'Formation of a Company', 'Sources of Business Finance', 'Small Business', 'Internal Trade', 'International Business'],
          'Economics': ['Introduction to Economics', 'Collection of Data', 'Organisation of Data', 'Presentation of Data', 'Measures of Central Tendency', 'Measures of Dispersion', 'Correlation', 'Index Numbers', 'Indian Economy on the Eve of Independence', 'Indian Economy 1950-1990', 'Liberalisation, Privatisation and Globalisation', 'Poverty', 'Human Capital Formation', 'Rural Development', 'Employment', 'Infrastructure', 'Environment and Sustainable Development'],
          'Political Science': ['Constitution: Why and How?', 'Rights in the Indian Constitution', 'Election and Representation', 'Executive', 'Legislature', 'Judiciary', 'Federalism', 'Local Governments', 'Constitution as a Living Document', 'The Philosophy of the Constitution'],
          'History': ['From the Beginning of Time', 'Writing and City Life', 'An Empire Across Three Continents', 'The Central Islamic Lands', 'Nomadic Empires', 'The Three Orders', 'Changing Cultural Traditions', 'Confrontation of Cultures', 'The Industrial Revolution', 'Displacing Indigenous Peoples', 'Paths to Modernisation'],
          'Geography': ['Geography as a Discipline', 'The Origin and Evolution of the Earth', 'Interior of the Earth', 'Distribution of Oceans and Continents', 'Minerals and Rocks', 'Geomorphic Processes', 'Landforms and Their Evolution', 'Composition and Structure of Atmosphere', 'Solar Radiation, Heat Balance and Temperature', 'Atmospheric Circulation and Weather Systems', 'Water in the Atmosphere', 'World Climate and Climate Change', 'Water (Oceans)', 'Movements of Ocean Water', 'Life on the Earth', 'Biodiversity and Conservation'],
          'Computer Science': ['Computer Systems and Organisation', 'Number Systems', 'Introduction to Python', 'Data Types and Operators', 'Flow of Control', 'Strings', 'Lists', 'Tuples and Dictionaries', 'Society, Law and Ethics']
        }
      },
      'Class 12': {
        subjects: {
          'Physics': ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics'],
          'Chemistry': ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'General Principles and Processes of Isolation of Elements', 'The p-Block Elements', 'The d- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
          'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Application of Derivatives', 'Integrals', 'Application of Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability'],
          'Biology': ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Strategies for Enhancement in Food Production', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes', 'Biotechnology and Its Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues'],
          'English': ['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places', 'My Mother at Sixty-six', 'An Elementary School Classroom in a Slum', 'Keeping Quiet', 'A Thing of Beauty', 'Aunt Jennifer\'s Tigers'],
          'Hindi': ['आत्म-परिचय', 'पतंग', 'कविता के बहाने', 'कैमरे में बंद अपाहिज', 'सहर्ष स्वीकारा है', 'उषा', 'बादल राग', 'कवितावली', 'रुबाइयाँ', 'छोटा मेरा खेत', 'भक्तिन', 'बाज़ार दर्शन', 'काले मेघा पानी दे', 'पहलवान की ढोलक', 'चार्ली चैप्लिन यानी हम सब'],
          'Accountancy': ['Accounting for Not-for-Profit Organisations', 'Accounting for Partnership: Basic Concepts', 'Reconstitution of a Partnership Firm: Admission of a Partner', 'Reconstitution of a Partnership Firm: Retirement/Death of a Partner', 'Dissolution of Partnership Firm', 'Accounting for Share Capital', 'Issue and Redemption of Debentures', 'Financial Statements of a Company', 'Analysis of Financial Statements', 'Accounting Ratios', 'Cash Flow Statement'],
          'Business Studies': ['Nature and Significance of Management', 'Principles of Management', 'Business Environment', 'Planning', 'Organising', 'Staffing', 'Directing', 'Controlling', 'Financial Management', 'Financial Markets', 'Marketing Management', 'Consumer Protection'],
          'Economics': ['Introduction to Macroeconomics', 'National Income Accounting', 'Money and Banking', 'Determination of Income and Employment', 'Government Budget and the Economy', 'Open Economy Macroeconomics', 'Introduction to Microeconomics', 'Theory of Consumer Behaviour', 'Production and Costs', 'Theory of the Firm Under Perfect Competition', 'Market Equilibrium', 'Non-Competitive Markets'],
          'Political Science': ['The Cold War Era', 'The End of Bipolarity', 'US Hegemony in World Politics', 'Alternative Centres of Power', 'Contemporary South Asia', 'International Organisations', 'Security in the Contemporary World', 'Environment and Natural Resources', 'Globalisation', 'Challenges of Nation Building', 'Era of One-Party Dominance', 'Politics of Planned Development', 'India\'s External Relations', 'Challenges to and Restoration of the Congress System', 'The Crisis of Democratic Order', 'Rise of Popular Movements', 'Regional Aspirations', 'Recent Developments in Indian Politics'],
          'History': ['Bricks, Beads and Bones', 'Kings, Farmers and Towns', 'Kinship, Caste and Class', 'Thinkers, Beliefs and Buildings', 'Through the Eyes of Travellers', 'Bhakti-Sufi Traditions', 'An Imperial Capital: Vijayanagara', 'Peasants, Zamindars and the State', 'Kings and Chronicles', 'Colonialism and the Countryside', 'Rebels and the Raj', 'Colonial Cities', 'Mahatma Gandhi and the Nationalist Movement', 'Understanding Partition', 'Framing the Constitution'],
          'Geography': ['Human Geography: Nature and Scope', 'The World Population: Distribution, Density and Growth', 'Population Composition', 'Human Development', 'Primary Activities', 'Secondary Activities', 'Tertiary and Quaternary Activities', 'Transport and Communication', 'International Trade', 'Human Settlements', 'Population: Distribution, Density, Growth and Composition (India)', 'Migration', 'Human Development (India)', 'Human Settlements (India)', 'Land Resources and Agriculture', 'Water Resources', 'Mineral and Energy Resources', 'Manufacturing Industries', 'Planning and Sustainable Development', 'Transport and Communication (India)', 'International Trade (India)', 'Geographical Perspective on Selected Issues and Problems'],
          'Computer Science': ['Python Revision Tour', 'Functions in Python', 'File Handling in Python', 'Data Structures: Stack and Queue', 'Computer Networks', 'Database Concepts', 'Structured Query Language (SQL)', 'Communication Technologies', 'Society, Law and Ethics - II']
        }
      }
    }
  },
  'MP Board': {
    name: 'MP Board (MPBSE + NCERT)',
    classes: {
      'Nursery': {
        subjects: {
          'English': ['Alphabets A-Z', 'Phonics', 'Simple Words', 'Rhymes'],
          'Hindi': ['स्वर (अ-अः)', 'व्यंजन (क-ज्ञ)', 'मात्राएं', 'सरल शब्द'],
          'Mathematics': ['Numbers 1-20', 'Shapes', 'Colors', 'Patterns'],
          'Drawing': ['Coloring', 'Tracing', 'Simple Shapes']
        }
      },
      'LKG': {
        subjects: {
          'English': ['Alphabets & Phonics', 'Three Letter Words', 'Rhyming Words', 'Simple Sentences'],
          'Hindi': ['स्वर व व्यंजन', 'मात्राएं', 'दो अक्षर के शब्द', 'कविताएं'],
          'Mathematics': ['Numbers 1-50', 'Counting', 'Addition', 'Shapes & Patterns'],
          'Drawing': ['Object Drawing', 'Coloring', 'Pattern Making']
        }
      },
      'UKG': {
        subjects: {
          'English': ['Reading Words', 'Sight Words', 'Sentence Making', 'Picture Reading'],
          'Hindi': ['मात्राएं (सभी)', 'तीन अक्षर के शब्द', 'वाक्य बनाओ', 'कहानी'],
          'Mathematics': ['Numbers 1-100', 'Addition & Subtraction', 'Money', 'Time'],
          'Drawing': ['Nature Drawing', 'Animal Drawing', 'Imagination Drawing']
        }
      },
      'Class 1': {
        subjects: {
          'Hindi': ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छोटी का कमाल', 'मेला', 'पतंग'],
          'English': ['The Alphabet', 'A Happy Child', 'Three Little Pigs', 'After a Bath', 'Mittu and the Yellow Mango'],
          'Mathematics': ['Shapes and Space', 'Numbers 1-9', 'Addition', 'Subtraction', 'Numbers 10-20', 'Time', 'Measurement', 'Money'],
          'EVS': ['Me and My Family', 'My Body', 'Food We Eat', 'Animals Around Us', 'Plants Around Us']
        }
      },
      'Class 2': {
        subjects: {
          'Hindi': ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'सूरज जल्दी आना जी', 'बस के नीचे बाघ', 'दोस्त की मदद', 'मेरी किताब'],
          'English': ['First Day at School', 'Haldi\'s Adventure', 'I am Lucky!', 'A Smile', 'The Wind and the Sun'],
          'Mathematics': ['Counting in Groups', 'How Much Can You Carry?', 'Patterns', 'Tens and Ones', 'Add Our Points', 'Give and Take'],
          'EVS': ['My Family', 'Animals and Birds', 'Plants and Trees', 'Food and Water', 'Shelter']
        }
      },
      'Class 3': {
        subjects: {
          'Hindi': ['कक्कू', 'शेखीबाज़ मक्खी', 'चांद वाली अम्मा', 'बहादुर बित्तो', 'हम भी सीखें', 'टिपटिपवा', 'बंदर बांट'],
          'English': ['Good Morning', 'The Magic Garden', 'Bird Talk', 'Nina and the Baby Sparrows', 'The Balloon Man'],
          'Mathematics': ['Where to Look From', 'Fun with Numbers', 'Give and Take', 'Shapes and Designs', 'Time Goes On', 'How Many Times?', 'Play with Patterns'],
          'EVS': ['Poonam\'s Day Out', 'The Plant Fairy', 'Water O Water', 'Foods We Eat', 'Flying High', 'It\'s Raining'],
          'Science': ['Living and Non-Living Things', 'Plants', 'Animals', 'Food', 'Water']
        }
      },
      'Class 4': {
        subjects: {
          'Hindi': ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'चिड़िया की बच्ची', 'ज़रूरत'],
          'English': ['Wake Up!', 'Neha\'s Alarm Clock', 'Noses', 'The Little Fir Tree', 'Run!', 'Alice in Wonderland'],
          'Mathematics': ['Building with Bricks', 'Long and Short', 'Tick-Tick-Tick', 'The Way the World Looks', 'Halves and Quarters', 'Fields and Fences'],
          'EVS': ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'Anita and the Honeybees', 'Valley of Flowers', 'A River\'s Tale'],
          'Science': ['Plants and Animals', 'Food and Digestion', 'Our Environment', 'Weather and Seasons']
        }
      },
      'Class 5': {
        subjects: {
          'Hindi': ['राख की रस्सी', 'फ़सलों के त्योहार', 'खिलौने वाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह', 'चिट्ठी का सफ़र'],
          'English': ['Ice-cream Man', 'Wonderful Waste!', 'Teamwork', 'My Shadow', 'Robinson Crusoe', 'Who Will be Ningthou?'],
          'Mathematics': ['The Fish Tale', 'Shapes and Angles', 'Parts and Wholes', 'Be My Multiple', 'Can You See the Pattern?', 'How Big? How Heavy?'],
          'EVS': ['Super Senses', 'From Tasting to Digesting', 'Every Drop Counts', 'A Treat for Mosquitoes', 'Walls Tell Stories', 'What if it Finishes?'],
          'Science': ['Living Things', 'Human Body Systems', 'Food and Health', 'Force and Energy']
        }
      },
      'Class 6': {
        subjects: {
          'Hindi': ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व', 'साथी हाथ बढ़ाना', 'ऐसे-ऐसे', 'झांसी की रानी'],
          'English': ['Who Did Patrick\'s Homework?', 'How the Dog Found Himself a New Master!', 'Taro\'s Reward', 'A Different Kind of School', 'Who I Am', 'Fair Play', 'Desert Animals'],
          'Mathematics': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra', 'Ratio and Proportion', 'Symmetry'],
          'Science': ['Food: Where Does it Come From?', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials into Groups', 'Separation of Substances', 'Changes Around Us', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms', 'Motion and Measurement', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Water', 'Air Around Us', 'Garbage In, Garbage Out'],
          'Social Science': ['What, Where, How and When?', 'From Hunting-Gathering to Growing Food', 'In the Earliest Cities', 'Kingdoms, Kings and an Early Republic', 'The Earth in the Solar System', 'Globe: Latitudes and Longitudes', 'Maps', 'Major Domains of the Earth', 'Understanding Diversity', 'What is Government?', 'Panchayati Raj'],
          'Sanskrit': ['शब्द परिचयः', 'अकारान्त-पुल्लिंग', 'क्रियापदानि', 'सर्वनामपदानि']
        }
      },
      'Class 7': {
        subjects: {
          'Hindi': ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'रक्त और हमारा शरीर', 'शाम एक किसान'],
          'English': ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'The Ashes That Made Trees Bloom', 'Expert Detectives', 'Fire: Friend and Foe', 'The Story of Cricket'],
          'Mathematics': ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'The Triangle and its Properties', 'Congruence of Triangles', 'Comparing Quantities', 'Rational Numbers', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers', 'Symmetry'],
          'Science': ['Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Weather, Climate', 'Winds, Storms and Cyclones', 'Soil', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current', 'Light', 'Water: A Precious Resource', 'Forests: Our Lifeline'],
          'Social Science': ['Tracing Changes Through a Thousand Years', 'New Kings and Kingdoms', 'The Delhi Sultans', 'The Mughal Empire', 'Environment', 'Inside Our Earth', 'Air', 'Water', 'On Equality', 'Role of Government in Health', 'Markets Around Us'],
          'Sanskrit': ['सुभाषितानि', 'दुर्बुद्धिः विनश्यति', 'स्वावलम्बनम्', 'पण्डिता रमाबाई']
        }
      },
      'Class 8': {
        subjects: {
          'Hindi': ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिये', 'कबीर की साखियाँ', 'कामचोर'],
          'English': ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', 'Bepin Choudhury\'s Lapse of Memory', 'The Summit Within', 'A Visit to Cambridge'],
          'Mathematics': ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Data Handling', 'Squares and Square Roots', 'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions', 'Mensuration', 'Exponents and Powers', 'Direct and Inverse Proportions', 'Factorisation', 'Introduction to Graphs'],
          'Science': ['Crop Production and Management', 'Microorganisms', 'Synthetic Fibres and Plastics', 'Metals and Non-Metals', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Cell Structure and Functions', 'Reproduction in Animals', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Light', 'Stars and the Solar System', 'Pollution of Air and Water'],
          'Social Science': ['How, When and Where', 'From Trade to Territory', 'Ruling the Countryside', 'When People Rebel', 'Resources', 'Agriculture', 'Industries', 'The Indian Constitution', 'Understanding Secularism', 'Why Do We Need a Parliament?', 'Judiciary'],
          'Sanskrit': ['सुभाषितानि', 'बिलस्य वाणी न कदापि मे श्रुता', 'डिजीभारतम्', 'सदैव पुरतो निधेहि चरणम्']
        }
      },
      'Class 9': {
        subjects: {
          'Hindi': ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'नाना साहब की पुत्री', 'प्रेमचंद के फटे जूते', 'मेरे बचपन के दिन', 'साखियाँ एवं सबद', 'वाख', 'सवैये', 'कैदी और कोकिला'],
          'English': ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Packing', 'Reach for the Top', 'The Bond of Love', 'If I Were You'],
          'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', 'Introduction to Euclid\'s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms and Triangles', 'Circles', 'Constructions', 'Heron\'s Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill?', 'Natural Resources', 'Improvement in Food Resources'],
          'Social Science': ['The French Revolution', 'Socialism in Europe', 'Nazism and the Rise of Hitler', 'Forest Society and Colonialism', 'India - Size and Location', 'Physical Features of India', 'Drainage', 'Climate', 'Natural Vegetation and Wildlife', 'What is Democracy?', 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'Democratic Rights', 'The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India'],
          'Sanskrit': ['भारतीवसन्तगीतिः', 'स्वर्णकाकः', 'गोदोहनम्', 'कल्पतरुः', 'सूक्तिमौक्तिकम्']
        }
      },
      'Class 10': {
        subjects: {
          'Hindi': ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'आत्मकथ्य', 'उत्साह', 'यह दंतुरित मुसकान', 'फसल', 'छाया मत छूना', 'कन्यादान', 'बालगोबिन भगत', 'लखनवी अंदाज़', 'नौबतखाने में इबादत'],
          'English': ['A Letter to God', 'Nelson Mandela', 'Two Stories about Flying', 'From the Diary of Anne Frank', 'The Hundred Dresses', 'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus', 'The Sermon at Benares', 'The Proposal'],
          'Mathematics': ['Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification of Elements', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce?', 'Heredity and Evolution', 'Light - Reflection and Refraction', 'Human Eye and Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy', 'Our Environment', 'Management of Natural Resources'],
          'Social Science': ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture', 'Resources and Development', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Power Sharing', 'Federalism', 'Political Parties', 'Outcomes of Democracy', 'Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation', 'Consumer Rights'],
          'Sanskrit': ['शुचिपर्यावरणम्', 'बुद्धिर्बलवती सदा', 'व्यायामः सर्वदा पथ्यः', 'शिशुलालनम्', 'जननी तुल्यवत्सला']
        }
      },
      'Class 11': {
        subjects: {
          'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
          'Chemistry': ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 'The s-Block Elements', 'The p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry'],
          'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Mathematical Induction', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', 'Three Dimensional Geometry', 'Limits and Derivatives', 'Mathematical Reasoning', 'Statistics', 'Probability'],
          'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division', 'Transport in Plants', 'Photosynthesis', 'Respiration in Plants', 'Digestion and Absorption', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products', 'Locomotion and Movement', 'Neural Control', 'Chemical Coordination'],
          'Hindi': ['नमक का दारोगा', 'मियाँ नसीरुद्दीन', 'अपू के साथ ढाई साल', 'विदाई संभाषण', 'गलता लोहा', 'रजनी'],
          'English': ['The Portrait of a Lady', 'We\'re Not Afraid to Die', 'Discovering Tut', 'Landscape of the Soul', 'The Ailing Planet', 'The Browning Version', 'Silk Road'],
          'Accountancy': ['Introduction to Accounting', 'Theory Base of Accounting', 'Recording of Transactions I', 'Recording of Transactions II', 'Bank Reconciliation', 'Trial Balance', 'Depreciation', 'Financial Statements I', 'Financial Statements II'],
          'Business Studies': ['Nature and Purpose of Business', 'Forms of Business Organisation', 'Business Services', 'Emerging Modes of Business', 'Sources of Business Finance', 'Small Business', 'Internal Trade'],
          'Economics': ['Introduction to Economics', 'Collection of Data', 'Organisation of Data', 'Measures of Central Tendency', 'Measures of Dispersion', 'Indian Economy 1950-1990', 'Liberalisation', 'Poverty', 'Human Capital Formation', 'Infrastructure'],
          'Computer Science': ['Computer Systems', 'Number Systems', 'Introduction to Python', 'Data Types', 'Flow of Control', 'Strings', 'Lists', 'Tuples and Dictionaries']
        }
      },
      'Class 12': {
        subjects: {
          'Physics': ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics'],
          'Chemistry': ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'Isolation of Elements', 'The p-Block Elements', 'The d- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
          'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Application of Derivatives', 'Integrals', 'Application of Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability'],
          'Biology': ['Reproduction in Organisms', 'Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Food Production', 'Microbes in Human Welfare', 'Biotechnology Principles', 'Biotechnology Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation', 'Environmental Issues'],
          'Hindi': ['आत्म-परिचय', 'पतंग', 'कविता के बहाने', 'कैमरे में बंद अपाहिज', 'उषा', 'बादल राग', 'भक्तिन', 'बाज़ार दर्शन', 'काले मेघा पानी दे', 'पहलवान की ढोलक'],
          'English': ['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places'],
          'Accountancy': ['Accounting for Not-for-Profit Organisations', 'Partnership: Basic Concepts', 'Admission of a Partner', 'Retirement/Death of a Partner', 'Dissolution of Partnership Firm', 'Accounting for Share Capital', 'Issue and Redemption of Debentures', 'Financial Statements of a Company', 'Cash Flow Statement'],
          'Business Studies': ['Nature of Management', 'Principles of Management', 'Business Environment', 'Planning', 'Organising', 'Staffing', 'Directing', 'Controlling', 'Financial Management', 'Marketing Management', 'Consumer Protection'],
          'Economics': ['National Income Accounting', 'Money and Banking', 'Determination of Income and Employment', 'Government Budget', 'Open Economy', 'Theory of Consumer Behaviour', 'Production and Costs', 'Perfect Competition', 'Market Equilibrium', 'Non-Competitive Markets'],
          'Computer Science': ['Python Revision', 'Functions in Python', 'File Handling', 'Data Structures', 'Computer Networks', 'Database Concepts', 'SQL']
        }
      }
    }
  },
  'RBSE': {
    name: 'RBSE (Rajasthan Board + NCERT)',
    classes: {
      'Nursery': {
        subjects: {
          'English': ['Alphabets A-Z', 'Phonics', 'Simple Words', 'Rhymes'],
          'Hindi': ['स्वर (अ-अः)', 'व्यंजन (क-ज्ञ)', 'मात्राएं', 'सरल शब्द'],
          'Mathematics': ['Numbers 1-20', 'Shapes', 'Colors', 'Patterns'],
          'Drawing': ['Coloring', 'Tracing', 'Simple Shapes']
        }
      },
      'LKG': {
        subjects: {
          'English': ['Alphabets & Phonics', 'Three Letter Words', 'Rhyming Words', 'Simple Sentences'],
          'Hindi': ['स्वर व व्यंजन', 'मात्राएं', 'दो अक्षर के शब्द', 'कविताएं'],
          'Mathematics': ['Numbers 1-50', 'Counting', 'Addition', 'Shapes & Patterns'],
          'Drawing': ['Object Drawing', 'Coloring', 'Pattern Making']
        }
      },
      'UKG': {
        subjects: {
          'English': ['Reading Words', 'Sight Words', 'Sentence Making', 'Picture Reading'],
          'Hindi': ['मात्राएं (सभी)', 'तीन अक्षर के शब्द', 'वाक्य बनाओ', 'कहानी'],
          'Mathematics': ['Numbers 1-100', 'Addition & Subtraction', 'Money', 'Time'],
          'Drawing': ['Nature Drawing', 'Animal Drawing', 'Imagination Drawing']
        }
      },
      'Class 1': {
        subjects: {
          'Hindi': ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छोटी का कमाल', 'मेला'],
          'English': ['The Alphabet', 'A Happy Child', 'Three Little Pigs', 'After a Bath'],
          'Mathematics': ['Shapes and Space', 'Numbers 1-9', 'Addition', 'Subtraction', 'Numbers 10-20', 'Time', 'Money'],
          'EVS': ['Me and My Family', 'My Body', 'Food We Eat', 'Animals Around Us']
        }
      },
      'Class 2': {
        subjects: {
          'Hindi': ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'सूरज जल्दी आना जी', 'दोस्त की मदद', 'मेरी किताब'],
          'English': ['First Day at School', 'I am Lucky!', 'A Smile', 'The Wind and the Sun'],
          'Mathematics': ['Counting in Groups', 'Patterns', 'Tens and Ones', 'Add Our Points', 'Give and Take'],
          'EVS': ['My Family', 'Animals and Birds', 'Plants', 'Food and Water']
        }
      },
      'Class 3': {
        subjects: {
          'Hindi': ['कक्कू', 'शेखीबाज़ मक्खी', 'चांद वाली अम्मा', 'बहादुर बित्तो', 'हम भी सीखें'],
          'English': ['Good Morning', 'The Magic Garden', 'Bird Talk', 'The Balloon Man'],
          'Mathematics': ['Fun with Numbers', 'Give and Take', 'Shapes and Designs', 'Time Goes On', 'Play with Patterns'],
          'EVS': ['Poonam\'s Day Out', 'The Plant Fairy', 'Water O Water', 'Foods We Eat', 'Flying High'],
          'Science': ['Living and Non-Living Things', 'Plants', 'Animals', 'Food']
        }
      },
      'Class 4': {
        subjects: {
          'Hindi': ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'चिड़िया की बच्ची'],
          'English': ['Wake Up!', 'Neha\'s Alarm Clock', 'Noses', 'The Little Fir Tree', 'Run!'],
          'Mathematics': ['Building with Bricks', 'Long and Short', 'Tick-Tick-Tick', 'Halves and Quarters', 'Fields and Fences'],
          'EVS': ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'Valley of Flowers'],
          'Science': ['Plants and Animals', 'Food and Digestion', 'Our Environment']
        }
      },
      'Class 5': {
        subjects: {
          'Hindi': ['राख की रस्सी', 'फ़सलों के त्योहार', 'खिलौने वाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह'],
          'English': ['Ice-cream Man', 'Wonderful Waste!', 'Teamwork', 'My Shadow', 'Robinson Crusoe'],
          'Mathematics': ['The Fish Tale', 'Shapes and Angles', 'Parts and Wholes', 'Can You See the Pattern?', 'How Big? How Heavy?'],
          'EVS': ['Super Senses', 'From Tasting to Digesting', 'Every Drop Counts', 'What if it Finishes?'],
          'Science': ['Living Things', 'Human Body', 'Food and Health', 'Force and Energy']
        }
      },
      'Class 6': {
        subjects: {
          'Hindi': ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'अक्षरों का महत्व', 'साथी हाथ बढ़ाना', 'झांसी की रानी'],
          'English': ['Who Did Patrick\'s Homework?', 'How the Dog Found Himself a New Master!', 'Taro\'s Reward', 'A Different Kind of School', 'Fair Play', 'Desert Animals'],
          'Mathematics': ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra', 'Ratio and Proportion'],
          'Science': ['Food: Where Does it Come From?', 'Components of Food', 'Fibre to Fabric', 'Sorting Materials', 'Separation of Substances', 'Changes Around Us', 'Getting to Know Plants', 'Body Movements', 'Living Organisms', 'Motion and Measurement', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Magnets', 'Water', 'Air Around Us'],
          'Social Science': ['What, Where, How and When?', 'From Hunting-Gathering to Growing Food', 'In the Earliest Cities', 'The Earth in the Solar System', 'Globe: Latitudes and Longitudes', 'Maps', 'Understanding Diversity', 'What is Government?', 'Panchayati Raj'],
          'Sanskrit': ['शब्द परिचयः', 'अकारान्त-पुल्लिंग', 'क्रियापदानि']
        }
      },
      'Class 7': {
        subjects: {
          'Hindi': ['हम पंछी उन्मुक्त गगन के', 'दादी माँ', 'हिमालय की बेटियाँ', 'कठपुतली', 'मिठाईवाला', 'रक्त और हमारा शरीर'],
          'English': ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'Quality', 'Expert Detectives', 'Fire: Friend and Foe'],
          'Mathematics': ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'Triangles', 'Comparing Quantities', 'Rational Numbers', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers'],
          'Science': ['Nutrition in Plants', 'Nutrition in Animals', 'Fibre to Fabric', 'Heat', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Weather and Climate', 'Winds, Storms and Cyclones', 'Soil', 'Respiration', 'Reproduction in Plants', 'Motion and Time', 'Electric Current', 'Light', 'Forests: Our Lifeline'],
          'Social Science': ['Tracing Changes', 'New Kings and Kingdoms', 'The Delhi Sultans', 'The Mughal Empire', 'Environment', 'Inside Our Earth', 'Air', 'Water', 'On Equality', 'How the State Government Works'],
          'Sanskrit': ['सुभाषितानि', 'दुर्बुद्धिः विनश्यति', 'स्वावलम्बनम्']
        }
      },
      'Class 8': {
        subjects: {
          'Hindi': ['ध्वनि', 'लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'चिट्ठियों की अनूठी दुनिया', 'भगवान के डाकिये', 'कामचोर'],
          'English': ['The Best Christmas Present', 'The Tsunami', 'Glimpses of the Past', 'The Summit Within', 'A Visit to Cambridge'],
          'Mathematics': ['Rational Numbers', 'Linear Equations', 'Understanding Quadrilaterals', 'Data Handling', 'Squares and Square Roots', 'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions', 'Mensuration', 'Exponents and Powers', 'Factorisation', 'Introduction to Graphs'],
          'Science': ['Crop Production and Management', 'Microorganisms', 'Synthetic Fibres', 'Metals and Non-Metals', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants', 'Cell Structure', 'Reproduction in Animals', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Light', 'Stars and Solar System', 'Pollution'],
          'Social Science': ['How, When and Where', 'From Trade to Territory', 'When People Rebel', 'Resources', 'Agriculture', 'Industries', 'The Indian Constitution', 'Why Do We Need a Parliament?', 'Judiciary'],
          'Sanskrit': ['सुभाषितानि', 'बिलस्य वाणी न कदापि मे श्रुता', 'डिजीभारतम्']
        }
      },
      'Class 9': {
        subjects: {
          'Hindi': ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'नाना साहब की पुत्री', 'प्रेमचंद के फटे जूते', 'मेरे बचपन के दिन', 'साखियाँ एवं सबद', 'वाख', 'कैदी और कोकिला'],
          'English': ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Packing', 'Reach for the Top', 'If I Were You'],
          'Mathematics': ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', 'Euclid\'s Geometry', 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Areas of Parallelograms', 'Circles', 'Constructions', 'Heron\'s Formula', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Matter in Our Surroundings', 'Is Matter Around Us Pure?', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Diversity in Living Organisms', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Why Do We Fall Ill?', 'Natural Resources', 'Improvement in Food Resources'],
          'Social Science': ['The French Revolution', 'Socialism in Europe', 'Nazism', 'Forest Society', 'India - Size and Location', 'Physical Features of India', 'Drainage', 'Climate', 'Natural Vegetation', 'What is Democracy?', 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'The Story of Village Palampur', 'People as Resource', 'Poverty', 'Food Security'],
          'Sanskrit': ['भारतीवसन्तगीतिः', 'स्वर्णकाकः', 'गोदोहनम्', 'कल्पतरुः']
        }
      },
      'Class 10': {
        subjects: {
          'Hindi': ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'आत्मकथ्य', 'उत्साह', 'यह दंतुरित मुसकान', 'फसल', 'कन्यादान', 'बालगोबिन भगत', 'लखनवी अंदाज़', 'नौबतखाने में इबादत'],
          'English': ['A Letter to God', 'Nelson Mandela', 'Two Stories about Flying', 'Anne Frank', 'The Hundred Dresses', 'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus', 'The Sermon at Benares'],
          'Mathematics': ['Real Numbers', 'Polynomials', 'Pair of Linear Equations', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Applications of Trigonometry', 'Circles', 'Constructions', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability'],
          'Science': ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Periodic Classification', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce?', 'Heredity and Evolution', 'Light - Reflection and Refraction', 'Human Eye', 'Electricity', 'Magnetic Effects of Electric Current', 'Sources of Energy', 'Our Environment', 'Natural Resources'],
          'Social Science': ['Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'Age of Industrialisation', 'Print Culture', 'Resources and Development', 'Water Resources', 'Agriculture', 'Minerals and Energy', 'Manufacturing Industries', 'Power Sharing', 'Federalism', 'Political Parties', 'Outcomes of Democracy', 'Development', 'Sectors of Indian Economy', 'Money and Credit', 'Globalisation', 'Consumer Rights'],
          'Sanskrit': ['शुचिपर्यावरणम्', 'बुद्धिर्बलवती सदा', 'व्यायामः सर्वदा पथ्यः', 'शिशुलालनम्']
        }
      },
      'Class 11': {
        subjects: {
          'Physics': ['Physical World', 'Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves'],
          'Chemistry': ['Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements', 'Chemical Bonding', 'States of Matter', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Hydrogen', 's-Block Elements', 'p-Block Elements', 'Organic Chemistry Basics', 'Hydrocarbons', 'Environmental Chemistry'],
          'Mathematics': ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Mathematical Induction', 'Complex Numbers', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', 'Three Dimensional Geometry', 'Limits and Derivatives', 'Statistics', 'Probability'],
          'Biology': ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Division', 'Transport in Plants', 'Photosynthesis', 'Respiration in Plants', 'Digestion', 'Breathing', 'Body Fluids', 'Excretion', 'Locomotion', 'Neural Control', 'Chemical Coordination'],
          'Hindi': ['नमक का दारोगा', 'मियाँ नसीरुद्दीन', 'अपू के साथ ढाई साल', 'विदाई संभाषण', 'गलता लोहा'],
          'English': ['The Portrait of a Lady', 'We\'re Not Afraid to Die', 'Discovering Tut', 'The Ailing Planet', 'The Browning Version', 'Silk Road'],
          'Accountancy': ['Introduction to Accounting', 'Theory Base of Accounting', 'Recording of Transactions', 'Bank Reconciliation', 'Trial Balance', 'Depreciation', 'Financial Statements'],
          'Business Studies': ['Nature of Business', 'Forms of Business Organisation', 'Business Services', 'Sources of Finance', 'Small Business'],
          'Economics': ['Introduction to Economics', 'Collection of Data', 'Measures of Central Tendency', 'Indian Economy', 'Liberalisation', 'Poverty', 'Human Capital'],
          'Computer Science': ['Computer Systems', 'Number Systems', 'Introduction to Python', 'Data Types', 'Flow of Control', 'Strings', 'Lists']
        }
      },
      'Class 12': {
        subjects: {
          'Physics': ['Electric Charges and Fields', 'Electrostatic Potential', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics', 'Wave Optics', 'Dual Nature of Radiation', 'Atoms', 'Nuclei', 'Semiconductor Electronics'],
          'Chemistry': ['The Solid State', 'Solutions', 'Electrochemistry', 'Chemical Kinetics', 'Surface Chemistry', 'Isolation of Elements', 'p-Block Elements', 'd- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes', 'Alcohols and Phenols', 'Aldehydes and Ketones', 'Amines', 'Biomolecules', 'Polymers', 'Chemistry in Everyday Life'],
          'Mathematics': ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Application of Derivatives', 'Integrals', 'Application of Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability'],
          'Biology': ['Reproduction in Organisms', 'Sexual Reproduction in Plants', 'Human Reproduction', 'Reproductive Health', 'Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Food Production', 'Microbes', 'Biotechnology Principles', 'Biotechnology Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity', 'Environmental Issues'],
          'Hindi': ['आत्म-परिचय', 'पतंग', 'कविता के बहाने', 'उषा', 'बादल राग', 'भक्तिन', 'बाज़ार दर्शन', 'पहलवान की ढोलक'],
          'English': ['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview'],
          'Accountancy': ['Not-for-Profit Organisations', 'Partnership Basics', 'Admission of Partner', 'Retirement/Death of Partner', 'Dissolution', 'Share Capital', 'Debentures', 'Financial Statements', 'Cash Flow Statement'],
          'Business Studies': ['Nature of Management', 'Principles of Management', 'Business Environment', 'Planning', 'Organising', 'Staffing', 'Directing', 'Controlling', 'Financial Management', 'Marketing'],
          'Economics': ['National Income Accounting', 'Money and Banking', 'Income and Employment', 'Government Budget', 'Consumer Behaviour', 'Production and Costs', 'Perfect Competition', 'Market Equilibrium'],
          'Computer Science': ['Python Revision', 'Functions', 'File Handling', 'Data Structures', 'Computer Networks', 'Database Concepts', 'SQL']
        }
      }
    }
  }
};

export default SYLLABUS_DATA;
