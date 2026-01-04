# /app/backend/services/ncert_syllabus.py
"""
NCERT Syllabus Service
Based on official NCERT curriculum from https://ncert.nic.in/syllabus.php
Data structured from NCERT textbooks and syllabus PDFs
"""

from datetime import datetime, timezone
import uuid
from typing import List, Dict, Optional

# Complete NCERT Syllabus Data Structure
# Source: NCERT official syllabus documents

NCERT_SYLLABUS_DATA = {
    # Class 1-5 (Primary)
    "1": {
        "subjects": {
            "Hindi": {
                "book": "रिमझिम - 1",
                "chapters": [
                    {"number": 1, "name": "झूला", "type": "poem", "topics": ["झूले का वर्णन", "खेल"]},
                    {"number": 2, "name": "आम की कहानी", "type": "story", "topics": ["फलों के नाम", "आम की विशेषताएं"]},
                    {"number": 3, "name": "आम की टोकरी", "type": "poem", "topics": ["गिनती", "फल"]},
                    {"number": 4, "name": "पत्ते ही पत्ते", "type": "lesson", "topics": ["पत्तों के प्रकार", "प्रकृति"]},
                    {"number": 5, "name": "पकौड़ी", "type": "story", "topics": ["खाना बनाना", "परिवार"]},
                    {"number": 6, "name": "छुक-छुक गाड़ी", "type": "poem", "topics": ["रेलगाड़ी", "यात्रा"]},
                    {"number": 7, "name": "रसोईघर", "type": "lesson", "topics": ["घर के कमरे", "बर्तन"]},
                    {"number": 8, "name": "चूहो! म्याऊं सो रही है", "type": "poem", "topics": ["जानवर", "खेल"]},
                    {"number": 9, "name": "बंदर और गिलहरी", "type": "story", "topics": ["जानवरों की मित्रता"]},
                    {"number": 10, "name": "पगड़ी", "type": "lesson", "topics": ["पहनावा", "संस्कृति"]}
                ]
            },
            "English": {
                "book": "Marigold - 1",
                "chapters": [
                    {"number": 1, "name": "A Happy Child", "type": "poem", "topics": ["Family", "Happiness"]},
                    {"number": 2, "name": "Three Little Pigs", "type": "story", "topics": ["Animals", "Hard work"]},
                    {"number": 3, "name": "After a Bath", "type": "poem", "topics": ["Hygiene", "Daily routine"]},
                    {"number": 4, "name": "The Bubble, the Straw and the Shoe", "type": "story", "topics": ["Friendship"]},
                    {"number": 5, "name": "One Little Kitten", "type": "poem", "topics": ["Animals", "Counting"]},
                    {"number": 6, "name": "Lalu and Peelu", "type": "story", "topics": ["Birds", "Colors"]},
                    {"number": 7, "name": "Mittu and the Yellow Mango", "type": "story", "topics": ["Parrot", "Fruits"]},
                    {"number": 8, "name": "A Kite", "type": "poem", "topics": ["Toys", "Sky"]},
                    {"number": 9, "name": "Sundari", "type": "story", "topics": ["Butterfly", "Nature"]}
                ]
            },
            "Mathematics": {
                "book": "Math-Magic - 1",
                "chapters": [
                    {"number": 1, "name": "Shapes and Space", "type": "lesson", "topics": ["Shapes", "Patterns", "Position"]},
                    {"number": 2, "name": "Numbers from One to Nine", "type": "lesson", "topics": ["Counting", "Writing numbers"]},
                    {"number": 3, "name": "Addition", "type": "lesson", "topics": ["Adding numbers", "Word problems"]},
                    {"number": 4, "name": "Subtraction", "type": "lesson", "topics": ["Taking away", "Comparison"]},
                    {"number": 5, "name": "Numbers from Ten to Twenty", "type": "lesson", "topics": ["Teen numbers", "Place value"]},
                    {"number": 6, "name": "Time", "type": "lesson", "topics": ["Clock", "Daily schedule"]},
                    {"number": 7, "name": "Measurement", "type": "lesson", "topics": ["Length", "Height", "Weight"]},
                    {"number": 8, "name": "Numbers from Twenty-one to Fifty", "type": "lesson", "topics": ["Bigger numbers"]},
                    {"number": 9, "name": "Data Handling", "type": "lesson", "topics": ["Collecting data", "Counting"]},
                    {"number": 10, "name": "Patterns", "type": "lesson", "topics": ["Number patterns", "Shape patterns"]},
                    {"number": 11, "name": "Numbers", "type": "lesson", "topics": ["Numbers 51-100"]},
                    {"number": 12, "name": "Money", "type": "lesson", "topics": ["Coins", "Notes", "Buying"]},
                    {"number": 13, "name": "How Many", "type": "lesson", "topics": ["Counting objects"]}
                ]
            },
            "EVS": {
                "book": "Looking Around - 1",
                "chapters": [
                    {"number": 1, "name": "Myself", "type": "lesson", "topics": ["Body parts", "Senses"]},
                    {"number": 2, "name": "My Family", "type": "lesson", "topics": ["Family members", "Relations"]},
                    {"number": 3, "name": "My Home", "type": "lesson", "topics": ["Rooms", "Furniture"]},
                    {"number": 4, "name": "Plants Around Us", "type": "lesson", "topics": ["Types of plants", "Uses"]},
                    {"number": 5, "name": "Animals Around Us", "type": "lesson", "topics": ["Pet animals", "Wild animals"]}
                ]
            }
        }
    },
    
    # Class 6 (Middle School)
    "6": {
        "subjects": {
            "Hindi": {
                "book": "वसंत भाग-1",
                "chapters": [
                    {"number": 1, "name": "वह चिड़िया जो", "type": "poem", "topics": ["प्रकृति प्रेम", "पक्षी"]},
                    {"number": 2, "name": "बचपन", "type": "lesson", "topics": ["बचपन की यादें", "परिवार"]},
                    {"number": 3, "name": "नादान दोस्त", "type": "story", "topics": ["मित्रता", "पशु प्रेम"]},
                    {"number": 4, "name": "चाँद से थोड़ी-सी गप्पें", "type": "poem", "topics": ["कल्पना", "चंद्रमा"]},
                    {"number": 5, "name": "अक्षरों का महत्व", "type": "lesson", "topics": ["लिपि", "भाषा का विकास"]},
                    {"number": 6, "name": "पार नज़र के", "type": "lesson", "topics": ["दृष्टिबाधित व्यक्ति", "साहस"]},
                    {"number": 7, "name": "साथी हाथ बढ़ाना", "type": "poem", "topics": ["एकता", "सहयोग"]},
                    {"number": 8, "name": "ऐसे-ऐसे", "type": "drama", "topics": ["बहाने", "हास्य"]},
                    {"number": 9, "name": "टिकट-अलबम", "type": "story", "topics": ["शौक", "मित्रता"]},
                    {"number": 10, "name": "झाँसी की रानी", "type": "poem", "topics": ["देशभक्ति", "रानी लक्ष्मीबाई"]},
                    {"number": 11, "name": "जो देखकर भी नहीं देखते", "type": "lesson", "topics": ["संवेदनशीलता", "प्रकृति"]},
                    {"number": 12, "name": "संसार पुस्तक है", "type": "lesson", "topics": ["यात्रा", "ज्ञान"]}
                ]
            },
            "English": {
                "book": "Honeysuckle",
                "chapters": [
                    {"number": 1, "name": "Who Did Patrick's Homework?", "type": "story", "topics": ["Elf", "Homework", "Learning"]},
                    {"number": 2, "name": "How the Dog Found Himself a New Master!", "type": "story", "topics": ["Dog", "Loyalty", "Fable"]},
                    {"number": 3, "name": "Taro's Reward", "type": "story", "topics": ["Japan", "Obedience", "Reward"]},
                    {"number": 4, "name": "An Indian - American Woman in Space: Kalpana Chawla", "type": "biography", "topics": ["Astronaut", "Achievement", "India"]},
                    {"number": 5, "name": "A Different Kind of School", "type": "story", "topics": ["Education", "Disability", "Empathy"]},
                    {"number": 6, "name": "Who I Am", "type": "lesson", "topics": ["Identity", "Dreams", "Diversity"]},
                    {"number": 7, "name": "Fair Play", "type": "story", "topics": ["Sports", "Honesty", "Justice"]},
                    {"number": 8, "name": "A Game of Chance", "type": "story", "topics": ["Fair", "Luck", "Ethics"]},
                    {"number": 9, "name": "Desert Animals", "type": "lesson", "topics": ["Desert", "Animals", "Adaptation"]},
                    {"number": 10, "name": "The Banyan Tree", "type": "story", "topics": ["Nature", "Observation", "Wildlife"]}
                ]
            },
            "Mathematics": {
                "book": "Mathematics - 6",
                "chapters": [
                    {"number": 1, "name": "Knowing Our Numbers", "type": "lesson", "topics": ["Large numbers", "Indian system", "International system", "Estimation"]},
                    {"number": 2, "name": "Whole Numbers", "type": "lesson", "topics": ["Natural numbers", "Properties", "Number line"]},
                    {"number": 3, "name": "Playing with Numbers", "type": "lesson", "topics": ["Factors", "Multiples", "HCF", "LCM", "Prime numbers"]},
                    {"number": 4, "name": "Basic Geometrical Ideas", "type": "lesson", "topics": ["Points", "Lines", "Angles", "Triangles", "Polygons"]},
                    {"number": 5, "name": "Understanding Elementary Shapes", "type": "lesson", "topics": ["Measuring angles", "Types of angles", "Triangles", "Quadrilaterals"]},
                    {"number": 6, "name": "Integers", "type": "lesson", "topics": ["Negative numbers", "Addition", "Subtraction"]},
                    {"number": 7, "name": "Fractions", "type": "lesson", "topics": ["Types of fractions", "Equivalent fractions", "Comparison", "Operations"]},
                    {"number": 8, "name": "Decimals", "type": "lesson", "topics": ["Place value", "Comparison", "Addition", "Subtraction"]},
                    {"number": 9, "name": "Data Handling", "type": "lesson", "topics": ["Pictograph", "Bar graph", "Mean"]},
                    {"number": 10, "name": "Mensuration", "type": "lesson", "topics": ["Perimeter", "Area", "Rectangle", "Square"]},
                    {"number": 11, "name": "Algebra", "type": "lesson", "topics": ["Variables", "Expressions", "Equations"]},
                    {"number": 12, "name": "Ratio and Proportion", "type": "lesson", "topics": ["Ratio", "Proportion", "Unitary method"]},
                    {"number": 13, "name": "Symmetry", "type": "lesson", "topics": ["Lines of symmetry", "Reflection"]},
                    {"number": 14, "name": "Practical Geometry", "type": "lesson", "topics": ["Constructions", "Compass", "Protractor"]}
                ]
            },
            "Science": {
                "book": "Science - 6",
                "chapters": [
                    {"number": 1, "name": "Food: Where Does It Come From?", "type": "lesson", "topics": ["Food sources", "Plant products", "Animal products"]},
                    {"number": 2, "name": "Components of Food", "type": "lesson", "topics": ["Nutrients", "Carbohydrates", "Proteins", "Fats", "Vitamins"]},
                    {"number": 3, "name": "Fibre to Fabric", "type": "lesson", "topics": ["Natural fibres", "Cotton", "Jute", "Spinning", "Weaving"]},
                    {"number": 4, "name": "Sorting Materials into Groups", "type": "lesson", "topics": ["Properties of materials", "Classification"]},
                    {"number": 5, "name": "Separation of Substances", "type": "lesson", "topics": ["Mixtures", "Filtration", "Evaporation", "Sedimentation"]},
                    {"number": 6, "name": "Changes Around Us", "type": "lesson", "topics": ["Reversible changes", "Irreversible changes"]},
                    {"number": 7, "name": "Getting to Know Plants", "type": "lesson", "topics": ["Parts of plants", "Leaf", "Root", "Stem", "Flower"]},
                    {"number": 8, "name": "Body Movements", "type": "lesson", "topics": ["Skeleton", "Joints", "Movement in animals"]},
                    {"number": 9, "name": "The Living Organisms and Their Surroundings", "type": "lesson", "topics": ["Habitat", "Adaptation", "Biotic", "Abiotic"]},
                    {"number": 10, "name": "Motion and Measurement of Distances", "type": "lesson", "topics": ["Types of motion", "Units of measurement"]},
                    {"number": 11, "name": "Light, Shadows and Reflections", "type": "lesson", "topics": ["Light sources", "Shadows", "Mirrors"]},
                    {"number": 12, "name": "Electricity and Circuits", "type": "lesson", "topics": ["Electric circuit", "Conductors", "Insulators"]},
                    {"number": 13, "name": "Fun with Magnets", "type": "lesson", "topics": ["Magnetic materials", "Poles", "Compass"]},
                    {"number": 14, "name": "Water", "type": "lesson", "topics": ["Water cycle", "Conservation", "Sources"]},
                    {"number": 15, "name": "Air Around Us", "type": "lesson", "topics": ["Composition of air", "Properties", "Uses"]},
                    {"number": 16, "name": "Garbage In, Garbage Out", "type": "lesson", "topics": ["Waste management", "Composting", "Recycling"]}
                ]
            },
            "Social Science": {
                "book": "Our Pasts - 1 (History)",
                "chapters": [
                    {"number": 1, "name": "What, Where, How and When?", "type": "lesson", "topics": ["Introduction to History", "Sources", "Timeline"]},
                    {"number": 2, "name": "On the Trail of the Earliest People", "type": "lesson", "topics": ["Hunter-gatherers", "Stone Age", "Tools"]},
                    {"number": 3, "name": "From Gathering to Growing Food", "type": "lesson", "topics": ["Agriculture", "Domestication", "Settlements"]},
                    {"number": 4, "name": "In the Earliest Cities", "type": "lesson", "topics": ["Harappan Civilization", "Planning", "Trade"]},
                    {"number": 5, "name": "What Books and Burials Tell Us", "type": "lesson", "topics": ["Vedas", "Burials", "Social differences"]},
                    {"number": 6, "name": "Kingdoms, Kings and an Early Republic", "type": "lesson", "topics": ["Mahajanapadas", "Magadha", "Republic of Vajji"]},
                    {"number": 7, "name": "New Questions and Ideas", "type": "lesson", "topics": ["Buddha", "Jainism", "Upanishads"]},
                    {"number": 8, "name": "Ashoka, The Emperor Who Gave Up War", "type": "lesson", "topics": ["Maurya Empire", "Kalinga War", "Dhamma"]},
                    {"number": 9, "name": "Vital Villages, Thriving Towns", "type": "lesson", "topics": ["Agriculture", "Iron", "Trade routes"]},
                    {"number": 10, "name": "Traders, Kings and Pilgrims", "type": "lesson", "topics": ["Silk Route", "Buddhism spread", "Pilgrims"]},
                    {"number": 11, "name": "New Empires and Kingdoms", "type": "lesson", "topics": ["Gupta Empire", "Samudragupta", "Literature"]}
                ]
            }
        }
    },
    
    # Class 10 (Secondary)
    "10": {
        "subjects": {
            "Hindi": {
                "book": "क्षितिज भाग-2 & कृतिका भाग-2",
                "chapters": [
                    {"number": 1, "name": "सूरदास के पद", "type": "poem", "topics": ["भक्ति काव्य", "कृष्ण भक्ति"]},
                    {"number": 2, "name": "राम-लक्ष्मण-परशुराम संवाद", "type": "lesson", "topics": ["रामचरितमानस", "तुलसीदास"]},
                    {"number": 3, "name": "सवैया और कवित्त", "type": "poem", "topics": ["देव", "श्रृंगार रस"]},
                    {"number": 4, "name": "आत्मकथ्य", "type": "poem", "topics": ["जयशंकर प्रसाद", "छायावाद"]},
                    {"number": 5, "name": "उत्साह और अट नहीं रही", "type": "poem", "topics": ["सूर्यकांत त्रिपाठी निराला", "प्रकृति"]},
                    {"number": 6, "name": "यह दंतुरित मुसकान और फसल", "type": "poem", "topics": ["नागार्जुन", "ग्रामीण जीवन"]},
                    {"number": 7, "name": "छाया मत छूना", "type": "poem", "topics": ["गिरिजाकुमार माथुर"]},
                    {"number": 8, "name": "कन्यादान", "type": "poem", "topics": ["ऋतुराज", "नारी"]},
                    {"number": 9, "name": "संगतकार", "type": "poem", "topics": ["मंगलेश डबराल", "संगीत"]},
                    {"number": 10, "name": "नेताजी का चश्मा", "type": "story", "topics": ["देशभक्ति", "स्वयंप्रकाश"]},
                    {"number": 11, "name": "बालगोबिन भगत", "type": "lesson", "topics": ["रामवृक्ष बेनीपुरी", "संत स्वभाव"]},
                    {"number": 12, "name": "लखनवी अंदाज़", "type": "story", "topics": ["यशपाल", "व्यंग्य"]},
                    {"number": 13, "name": "मानवीय करुणा की दिव्य चमक", "type": "lesson", "topics": ["सर्वेश्वर दयाल सक्सेना", "मदर टेरेसा"]},
                    {"number": 14, "name": "एक कहानी यह भी", "type": "autobiography", "topics": ["मन्नू भंडारी", "आत्मकथा"]},
                    {"number": 15, "name": "स्त्री शिक्षा के विरोधी कुतर्कों का खंडन", "type": "essay", "topics": ["महावीर प्रसाद द्विवेदी", "नारी शिक्षा"]},
                    {"number": 16, "name": "नौबतखाने में इबादत", "type": "lesson", "topics": ["यतींद्र मिश्र", "बिस्मिल्ला खां"]},
                    {"number": 17, "name": "संस्कृति", "type": "essay", "topics": ["भदंत आनंद कौसल्यायन", "संस्कृति की परिभाषा"]}
                ]
            },
            "English": {
                "book": "First Flight & Footprints without Feet",
                "chapters": [
                    {"number": 1, "name": "A Letter to God", "type": "story", "topics": ["Faith", "Lencho", "G.L. Fuentes"]},
                    {"number": 2, "name": "Nelson Mandela: Long Walk to Freedom", "type": "biography", "topics": ["Apartheid", "Freedom", "South Africa"]},
                    {"number": 3, "name": "Two Stories about Flying", "type": "story", "topics": ["Fear", "Courage", "Self-belief"]},
                    {"number": 4, "name": "From the Diary of Anne Frank", "type": "diary", "topics": ["World War II", "Holocaust", "Diary writing"]},
                    {"number": 5, "name": "The Hundred Dresses - I & II", "type": "story", "topics": ["Bullying", "Compassion", "Regret"]},
                    {"number": 6, "name": "The Making of a Scientist", "type": "biography", "topics": ["Richard Ebright", "Research", "Curiosity"]},
                    {"number": 7, "name": "Glimpses of India", "type": "lesson", "topics": ["Goa", "Coorg", "Tea from Assam"]},
                    {"number": 8, "name": "Mijbil the Otter", "type": "story", "topics": ["Pet", "Otter", "Gavin Maxwell"]},
                    {"number": 9, "name": "Madam Rides the Bus", "type": "story", "topics": ["Curiosity", "Journey", "Growing up"]},
                    {"number": 10, "name": "The Sermon at Benares", "type": "lesson", "topics": ["Buddha", "Life and death", "Suffering"]},
                    {"number": 11, "name": "The Proposal", "type": "drama", "topics": ["Anton Chekhov", "Comedy", "Marriage"]}
                ]
            },
            "Mathematics": {
                "book": "Mathematics - 10",
                "chapters": [
                    {"number": 1, "name": "Real Numbers", "type": "lesson", "topics": ["Euclid's Division Lemma", "HCF", "Irrational numbers", "Decimal expansions"]},
                    {"number": 2, "name": "Polynomials", "type": "lesson", "topics": ["Zeroes of polynomial", "Relationship between zeroes and coefficients", "Division algorithm"]},
                    {"number": 3, "name": "Pair of Linear Equations in Two Variables", "type": "lesson", "topics": ["Graphical method", "Algebraic methods", "Substitution", "Elimination", "Cross-multiplication"]},
                    {"number": 4, "name": "Quadratic Equations", "type": "lesson", "topics": ["Standard form", "Factorization", "Completing square", "Quadratic formula", "Nature of roots"]},
                    {"number": 5, "name": "Arithmetic Progressions", "type": "lesson", "topics": ["nth term", "Sum of n terms", "Applications"]},
                    {"number": 6, "name": "Triangles", "type": "lesson", "topics": ["Similar triangles", "Criteria for similarity", "Area of similar triangles", "Pythagoras theorem"]},
                    {"number": 7, "name": "Coordinate Geometry", "type": "lesson", "topics": ["Distance formula", "Section formula", "Area of triangle"]},
                    {"number": 8, "name": "Introduction to Trigonometry", "type": "lesson", "topics": ["Trigonometric ratios", "Ratios of specific angles", "Trigonometric identities"]},
                    {"number": 9, "name": "Some Applications of Trigonometry", "type": "lesson", "topics": ["Heights and distances", "Angle of elevation", "Angle of depression"]},
                    {"number": 10, "name": "Circles", "type": "lesson", "topics": ["Tangent to a circle", "Number of tangents", "Theorems"]},
                    {"number": 11, "name": "Constructions", "type": "lesson", "topics": ["Division of line segment", "Similar triangles construction", "Tangent to circle"]},
                    {"number": 12, "name": "Areas Related to Circles", "type": "lesson", "topics": ["Area of sector", "Area of segment", "Combination of figures"]},
                    {"number": 13, "name": "Surface Areas and Volumes", "type": "lesson", "topics": ["Combination of solids", "Conversion of solids", "Frustum of cone"]},
                    {"number": 14, "name": "Statistics", "type": "lesson", "topics": ["Mean", "Median", "Mode", "Ogive"]},
                    {"number": 15, "name": "Probability", "type": "lesson", "topics": ["Classical definition", "Theoretical probability", "Applications"]}
                ]
            },
            "Science": {
                "book": "Science - 10",
                "chapters": [
                    {"number": 1, "name": "Chemical Reactions and Equations", "type": "lesson", "topics": ["Types of reactions", "Balancing equations", "Corrosion", "Rancidity"]},
                    {"number": 2, "name": "Acids, Bases and Salts", "type": "lesson", "topics": ["pH scale", "Indicators", "Neutralization", "Salts"]},
                    {"number": 3, "name": "Metals and Non-metals", "type": "lesson", "topics": ["Physical properties", "Chemical properties", "Reactivity series", "Corrosion"]},
                    {"number": 4, "name": "Carbon and its Compounds", "type": "lesson", "topics": ["Covalent bonding", "Hydrocarbons", "Functional groups", "Soaps and detergents"]},
                    {"number": 5, "name": "Periodic Classification of Elements", "type": "lesson", "topics": ["Mendeleev's table", "Modern periodic table", "Trends"]},
                    {"number": 6, "name": "Life Processes", "type": "lesson", "topics": ["Nutrition", "Respiration", "Transportation", "Excretion"]},
                    {"number": 7, "name": "Control and Coordination", "type": "lesson", "topics": ["Nervous system", "Reflex action", "Hormones", "Plant hormones"]},
                    {"number": 8, "name": "How do Organisms Reproduce?", "type": "lesson", "topics": ["Asexual reproduction", "Sexual reproduction", "Reproductive health"]},
                    {"number": 9, "name": "Heredity and Evolution", "type": "lesson", "topics": ["Mendel's laws", "Sex determination", "Evolution", "Speciation"]},
                    {"number": 10, "name": "Light - Reflection and Refraction", "type": "lesson", "topics": ["Laws of reflection", "Mirrors", "Refraction", "Lenses"]},
                    {"number": 11, "name": "Human Eye and Colourful World", "type": "lesson", "topics": ["Eye structure", "Defects of vision", "Prism", "Scattering"]},
                    {"number": 12, "name": "Electricity", "type": "lesson", "topics": ["Ohm's law", "Resistance", "Power", "Heating effect"]},
                    {"number": 13, "name": "Magnetic Effects of Electric Current", "type": "lesson", "topics": ["Magnetic field", "Electromagnet", "Motor", "Generator"]},
                    {"number": 14, "name": "Sources of Energy", "type": "lesson", "topics": ["Conventional sources", "Non-conventional sources", "Environmental impact"]},
                    {"number": 15, "name": "Our Environment", "type": "lesson", "topics": ["Ecosystem", "Food chains", "Ozone depletion", "Waste management"]},
                    {"number": 16, "name": "Management of Natural Resources", "type": "lesson", "topics": ["Conservation", "Water harvesting", "Forests", "Coal and petroleum"]}
                ]
            },
            "Social Science": {
                "book": "India and Contemporary World - II (History), Contemporary India - II (Geography), Democratic Politics - II, Understanding Economic Development",
                "chapters": [
                    {"number": 1, "name": "The Rise of Nationalism in Europe", "type": "history", "topics": ["French Revolution", "Nationalism", "Unification of Germany and Italy"]},
                    {"number": 2, "name": "Nationalism in India", "type": "history", "topics": ["Non-Cooperation Movement", "Civil Disobedience", "Salt March"]},
                    {"number": 3, "name": "The Making of a Global World", "type": "history", "topics": ["Trade", "Migration", "Great Depression"]},
                    {"number": 4, "name": "The Age of Industrialisation", "type": "history", "topics": ["Industrial Revolution", "Factories", "Workers"]},
                    {"number": 5, "name": "Print Culture and the Modern World", "type": "history", "topics": ["Printing press", "Books", "Newspapers"]},
                    {"number": 6, "name": "Resources and Development", "type": "geography", "topics": ["Types of resources", "Land use", "Soil types"]},
                    {"number": 7, "name": "Forest and Wildlife Resources", "type": "geography", "topics": ["Biodiversity", "Conservation", "National parks"]},
                    {"number": 8, "name": "Water Resources", "type": "geography", "topics": ["Water scarcity", "Dams", "Rainwater harvesting"]},
                    {"number": 9, "name": "Agriculture", "type": "geography", "topics": ["Types of farming", "Crops", "Food security"]},
                    {"number": 10, "name": "Minerals and Energy Resources", "type": "geography", "topics": ["Types of minerals", "Energy resources", "Conservation"]},
                    {"number": 11, "name": "Manufacturing Industries", "type": "geography", "topics": ["Types of industries", "Industrial pollution"]},
                    {"number": 12, "name": "Lifelines of National Economy", "type": "geography", "topics": ["Transport", "Communication", "Trade"]},
                    {"number": 13, "name": "Power Sharing", "type": "civics", "topics": ["Belgium and Sri Lanka", "Forms of power sharing"]},
                    {"number": 14, "name": "Federalism", "type": "civics", "topics": ["Federal system", "Decentralization", "Panchayati Raj"]},
                    {"number": 15, "name": "Democracy and Diversity", "type": "civics", "topics": ["Social differences", "Civil rights movement"]},
                    {"number": 16, "name": "Gender, Religion and Caste", "type": "civics", "topics": ["Gender inequality", "Communalism", "Caste system"]},
                    {"number": 17, "name": "Political Parties", "type": "civics", "topics": ["Functions", "National parties", "State parties"]},
                    {"number": 18, "name": "Outcomes of Democracy", "type": "civics", "topics": ["Accountable government", "Economic outcomes"]},
                    {"number": 19, "name": "Development", "type": "economics", "topics": ["Income", "HDI", "Sustainable development"]},
                    {"number": 20, "name": "Sectors of the Indian Economy", "type": "economics", "topics": ["Primary", "Secondary", "Tertiary sectors"]},
                    {"number": 21, "name": "Money and Credit", "type": "economics", "topics": ["Barter system", "Modern forms of money", "Credit"]},
                    {"number": 22, "name": "Globalisation and the Indian Economy", "type": "economics", "topics": ["MNCs", "WTO", "Impact"]},
                    {"number": 23, "name": "Consumer Rights", "type": "economics", "topics": ["Consumer protection", "Rights", "RTI"]}
                ]
            }
        }
    },
    
    # Class 12 (Senior Secondary) - NCERT 2024-25
    "12": {
        "subjects": {
            "Physics": {
                "book": "Physics Part I & II (NCERT 2024-25)",
                "units": [
                    {"unit": "I", "name": "Electrostatics", "marks": 16},
                    {"unit": "II", "name": "Current Electricity", "marks": 0},
                    {"unit": "III", "name": "Magnetic Effects of Current", "marks": 17},
                    {"unit": "IV", "name": "EMI and AC", "marks": 0},
                    {"unit": "V", "name": "Optics", "marks": 18},
                    {"unit": "VI", "name": "Dual Nature of Radiation", "marks": 12},
                    {"unit": "VII", "name": "Atoms and Nuclei", "marks": 7},
                    {"unit": "VIII", "name": "Electronic Devices", "marks": 0}
                ],
                "chapters": [
                    {"number": 1, "name": "Electric Charges and Fields", "unit": "I", "marks": 8, "type": "lesson", "topics": ["Electric charge", "Coulomb's law", "Electric field", "Electric field lines", "Electric flux", "Gauss's theorem", "Electric dipole", "Applications of Gauss's theorem"]},
                    {"number": 2, "name": "Electrostatic Potential and Capacitance", "unit": "I", "marks": 8, "type": "lesson", "topics": ["Electric potential", "Potential difference", "Electric potential due to point charge", "Dipole", "Equipotential surfaces", "Capacitors", "Combination of capacitors", "Energy stored in capacitor"]},
                    {"number": 3, "name": "Current Electricity", "unit": "II", "marks": 8, "type": "lesson", "topics": ["Electric current", "Ohm's law", "Drift velocity", "Resistance", "Resistivity", "V-I characteristics", "Electrical energy", "Power", "Kirchhoff's laws", "Wheatstone bridge", "Meter bridge", "Potentiometer"]},
                    {"number": 4, "name": "Moving Charges and Magnetism", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Magnetic force", "Motion in magnetic field", "Velocity selector", "Cyclotron", "Biot-Savart law", "Ampere's circuital law", "Solenoid", "Force between parallel conductors", "Torque on current loop", "Moving coil galvanometer"]},
                    {"number": 5, "name": "Magnetism and Matter", "unit": "III", "marks": 4, "type": "lesson", "topics": ["Bar magnet", "Magnetic field lines", "Earth's magnetism", "Magnetic elements", "Tangent galvanometer", "Vibration magnetometer", "Magnetic properties of materials", "Hysteresis"]},
                    {"number": 6, "name": "Electromagnetic Induction", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Magnetic flux", "Faraday's laws", "Induced EMF", "Lenz's law", "Eddy currents", "Self inductance", "Mutual inductance"]},
                    {"number": 7, "name": "Alternating Current", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["AC generator", "Mean and RMS values", "AC circuit with R, L, C", "LCR circuit", "Resonance", "Power in AC", "Transformer", "LC oscillations"]},
                    {"number": 8, "name": "Electromagnetic Waves", "unit": "IV", "marks": 3, "type": "lesson", "topics": ["Displacement current", "Electromagnetic waves", "EM spectrum", "Properties", "Uses"]},
                    {"number": 9, "name": "Ray Optics and Optical Instruments", "unit": "V", "marks": 9, "type": "lesson", "topics": ["Reflection at spherical surfaces", "Refraction", "Total internal reflection", "Refraction at spherical surfaces", "Lenses", "Power of lens", "Refraction through prism", "Dispersion", "Microscope", "Telescope"]},
                    {"number": 10, "name": "Wave Optics", "unit": "V", "marks": 6, "type": "lesson", "topics": ["Huygens principle", "Refraction and reflection of plane waves", "Interference", "Young's double slit", "Diffraction", "Resolving power", "Polarisation"]},
                    {"number": 11, "name": "Dual Nature of Radiation and Matter", "unit": "VI", "marks": 6, "type": "lesson", "topics": ["Photoelectric effect", "Einstein's equation", "Particle nature of light", "Wave nature of matter", "de Broglie relation", "Davisson-Germer experiment"]},
                    {"number": 12, "name": "Atoms", "unit": "VII", "marks": 3, "type": "lesson", "topics": ["Alpha particle scattering", "Rutherford model", "Bohr model", "Energy levels", "Hydrogen spectrum"]},
                    {"number": 13, "name": "Nuclei", "unit": "VII", "marks": 4, "type": "lesson", "topics": ["Composition of nucleus", "Atomic masses", "Size of nucleus", "Mass-energy relation", "Nuclear binding energy", "Nuclear force", "Radioactivity", "Nuclear reactions"]},
                    {"number": 14, "name": "Semiconductor Electronics", "unit": "VIII", "marks": 6, "type": "lesson", "topics": ["Energy bands", "Intrinsic and extrinsic semiconductors", "p-n junction", "Junction diode", "Diode as rectifier", "Zener diode", "LED", "Solar cell", "Transistor", "Logic gates"]}
                ]
            },
            "Chemistry": {
                "book": "Chemistry Part I & II (NCERT 2024-25)",
                "units": [
                    {"unit": "1", "name": "Solutions", "marks": 7},
                    {"unit": "2", "name": "Electrochemistry", "marks": 9},
                    {"unit": "3", "name": "Chemical Kinetics", "marks": 7},
                    {"unit": "4", "name": "d- and f-Block Elements", "marks": 7},
                    {"unit": "5", "name": "Coordination Compounds", "marks": 7},
                    {"unit": "6", "name": "Haloalkanes", "marks": 6},
                    {"unit": "7", "name": "Alcohols, Phenols, Ethers", "marks": 6},
                    {"unit": "8", "name": "Aldehydes, Ketones, Carboxylic Acids", "marks": 8},
                    {"unit": "9", "name": "Amines", "marks": 6},
                    {"unit": "10", "name": "Biomolecules", "marks": 7}
                ],
                "chapters": [
                    {"number": 1, "name": "Solutions", "unit": "1", "marks": 7, "type": "lesson", "topics": ["Types of solutions", "Solubility", "Concentration units", "Vapour pressure", "Raoult's law", "Colligative properties", "Relative lowering of vapour pressure", "Elevation of boiling point", "Depression of freezing point", "Osmotic pressure", "Van't Hoff factor"]},
                    {"number": 2, "name": "Electrochemistry", "unit": "2", "marks": 9, "type": "lesson", "topics": ["Electrolytic cells", "Electrolysis", "Galvanic cells", "EMF", "Standard electrode potential", "Nernst equation", "Gibbs energy and EMF", "Conductance", "Kohlrausch's law", "Electrolysis laws", "Batteries", "Fuel cells", "Corrosion"]},
                    {"number": 3, "name": "Chemical Kinetics", "unit": "3", "marks": 7, "type": "lesson", "topics": ["Rate of reaction", "Factors affecting rate", "Rate law", "Order of reaction", "Molecularity", "Integrated rate equations", "Half-life", "Pseudo first order", "Temperature dependence", "Arrhenius equation", "Collision theory"]},
                    {"number": 4, "name": "d- and f-Block Elements", "unit": "4", "marks": 7, "type": "lesson", "topics": ["Position in periodic table", "Electronic configuration", "General properties", "Transition elements characteristics", "Important compounds", "Lanthanoids", "Actinoids", "Applications"]},
                    {"number": 5, "name": "Coordination Compounds", "unit": "5", "marks": 7, "type": "lesson", "topics": ["Werner's theory", "Ligands", "Coordination number", "Nomenclature", "Isomerism", "Bonding theories", "VBT", "CFT", "Colour", "Magnetic properties", "Applications"]},
                    {"number": 6, "name": "Haloalkanes and Haloarenes", "unit": "6", "marks": 6, "type": "lesson", "topics": ["Classification", "Nomenclature", "Preparation", "Physical properties", "Chemical reactions", "SN1 and SN2 mechanisms", "Optical rotation", "Polyhalogen compounds", "Environmental effects"]},
                    {"number": 7, "name": "Alcohols, Phenols and Ethers", "unit": "7", "marks": 6, "type": "lesson", "topics": ["Classification", "Nomenclature", "Preparation methods", "Physical properties", "Chemical reactions", "Acidic nature", "Electrophilic substitution", "Ethers preparation and reactions"]},
                    {"number": 8, "name": "Aldehydes, Ketones and Carboxylic Acids", "unit": "8", "marks": 8, "type": "lesson", "topics": ["Nomenclature", "Nature of carbonyl group", "Preparation", "Physical properties", "Chemical reactions", "Nucleophilic addition", "Oxidation", "Reduction", "Aldol condensation", "Cannizzaro reaction", "Carboxylic acids properties"]},
                    {"number": 9, "name": "Amines", "unit": "9", "marks": 6, "type": "lesson", "topics": ["Classification", "Nomenclature", "Preparation", "Physical properties", "Chemical reactions", "Basic character", "Electrophilic substitution", "Diazonium salts"]},
                    {"number": 10, "name": "Biomolecules", "unit": "10", "marks": 7, "type": "lesson", "topics": ["Carbohydrates", "Classification", "Glucose", "Fructose", "Polysaccharides", "Proteins", "Amino acids", "Peptide bond", "Primary and secondary structure", "Enzymes", "Vitamins", "Nucleic acids", "DNA", "RNA"]}
                ]
            },
            "Mathematics": {
                "book": "Mathematics Part I & II (NCERT 2024-25)",
                "units": [
                    {"unit": "I", "name": "Relations and Functions", "marks": 8},
                    {"unit": "II", "name": "Algebra", "marks": 10},
                    {"unit": "III", "name": "Calculus", "marks": 35},
                    {"unit": "IV", "name": "Vectors and 3D", "marks": 14},
                    {"unit": "V", "name": "Linear Programming", "marks": 5},
                    {"unit": "VI", "name": "Probability", "marks": 8}
                ],
                "chapters": [
                    {"number": 1, "name": "Relations and Functions", "unit": "I", "marks": 4, "type": "lesson", "topics": ["Types of relations", "Reflexive", "Symmetric", "Transitive", "Equivalence relations", "Types of functions", "One-one", "Onto", "Composition of functions", "Invertible functions"]},
                    {"number": 2, "name": "Inverse Trigonometric Functions", "unit": "I", "marks": 4, "type": "lesson", "topics": ["Definition", "Range", "Domain", "Principal value branch", "Graphs", "Elementary properties"]},
                    {"number": 3, "name": "Matrices", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Concept", "Types of matrices", "Operations", "Transpose", "Symmetric matrices", "Skew symmetric", "Elementary operations", "Invertible matrices"]},
                    {"number": 4, "name": "Determinants", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Determinant of matrix", "Properties", "Area of triangle", "Minors and cofactors", "Adjoint and inverse", "Applications", "Cramer's rule"]},
                    {"number": 5, "name": "Continuity and Differentiability", "unit": "III", "marks": 8, "type": "lesson", "topics": ["Continuity", "Differentiability", "Derivatives of composite functions", "Chain rule", "Implicit functions", "Inverse trigonometric", "Exponential", "Logarithmic functions", "Logarithmic differentiation", "Derivatives of parametric", "Second order derivatives"]},
                    {"number": 6, "name": "Application of Derivatives", "unit": "III", "marks": 7, "type": "lesson", "topics": ["Rate of change", "Increasing and decreasing functions", "Tangents and normals", "Approximations", "Maxima and minima", "First and second derivative tests"]},
                    {"number": 7, "name": "Integrals", "unit": "III", "marks": 10, "type": "lesson", "topics": ["Integration as inverse of differentiation", "Standard integrals", "Integration by substitution", "By partial fractions", "By parts", "Definite integrals", "Properties", "Fundamental theorem of calculus"]},
                    {"number": 8, "name": "Application of Integrals", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Area under simple curves", "Area between curves", "Area of circles", "Parabolas", "Ellipses"]},
                    {"number": 9, "name": "Differential Equations", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Definition", "Order and degree", "General and particular solutions", "Formation", "Methods of solving", "Variable separable", "Homogeneous", "Linear differential equations"]},
                    {"number": 10, "name": "Vector Algebra", "unit": "IV", "marks": 5, "type": "lesson", "topics": ["Vectors and scalars", "Magnitude", "Direction cosines", "Types of vectors", "Position vector", "Addition", "Scalar multiplication", "Section formula", "Scalar product", "Vector product"]},
                    {"number": 11, "name": "Three Dimensional Geometry", "unit": "IV", "marks": 9, "type": "lesson", "topics": ["Direction cosines", "Direction ratios", "Equation of line", "Angle between lines", "Shortest distance", "Equation of plane", "Distance of point from plane", "Angle between planes"]},
                    {"number": 12, "name": "Linear Programming", "unit": "V", "marks": 5, "type": "lesson", "topics": ["Introduction", "LPP definition", "Mathematical formulation", "Graphical method", "Feasible region", "Optimal solution", "Different types of LPP"]},
                    {"number": 13, "name": "Probability", "unit": "VI", "marks": 8, "type": "lesson", "topics": ["Conditional probability", "Multiplication theorem", "Independent events", "Total probability", "Bayes' theorem", "Random variable", "Probability distribution", "Mean", "Variance", "Binomial distribution"]}
                ]
            },
            "Biology": {
                "book": "Biology (NCERT 2024-25 Rationalized)",
                "units": [
                    {"unit": "VI", "name": "Reproduction", "marks": 16},
                    {"unit": "VII", "name": "Genetics and Evolution", "marks": 20},
                    {"unit": "VIII", "name": "Biology and Human Welfare", "marks": 12},
                    {"unit": "IX", "name": "Biotechnology and its Applications", "marks": 12},
                    {"unit": "X", "name": "Ecology and Environment", "marks": 10}
                ],
                "chapters": [
                    {"number": 1, "name": "Sexual Reproduction in Flowering Plants", "unit": "VI", "marks": 5, "type": "lesson", "topics": ["Flower structure", "Stamen and Pistil", "Male gametophyte", "Female gametophyte", "Pollination types", "Agencies of pollination", "Outbreeding devices", "Pollen-pistil interaction", "Double fertilization", "Post-fertilization changes", "Endosperm development", "Embryo development", "Seed structure", "Fruit types", "Apomixis", "Polyembryony"]},
                    {"number": 2, "name": "Human Reproduction", "unit": "VI", "marks": 6, "type": "lesson", "topics": ["Male reproductive system", "Female reproductive system", "Spermatogenesis", "Oogenesis", "Menstrual cycle", "Fertilization", "Implantation", "Embryo development", "Placenta", "Pregnancy", "Parturition", "Lactation"]},
                    {"number": 3, "name": "Reproductive Health", "unit": "VI", "marks": 5, "type": "lesson", "topics": ["Reproductive health problems", "Population explosion", "Birth control methods", "Contraceptives", "Medical termination of pregnancy", "Sexually transmitted infections", "Infertility", "Assisted reproductive technologies", "IVF", "ZIFT", "GIFT"]},
                    {"number": 4, "name": "Principles of Inheritance and Variation", "unit": "VII", "marks": 8, "type": "lesson", "topics": ["Mendelian inheritance", "Law of dominance", "Law of segregation", "Law of independent assortment", "Incomplete dominance", "Co-dominance", "Multiple alleles", "ABO blood groups", "Pleiotropy", "Polygenic inheritance", "Chromosomal theory", "Linkage", "Recombination", "Sex determination", "Sex-linked inheritance", "Mendelian disorders", "Chromosomal disorders"]},
                    {"number": 5, "name": "Molecular Basis of Inheritance", "unit": "VII", "marks": 8, "type": "lesson", "topics": ["DNA as genetic material", "DNA structure", "Packaging of DNA helix", "DNA replication", "Central dogma", "Transcription", "Genetic code", "Translation", "Regulation of gene expression", "Lac operon", "Human genome project", "DNA fingerprinting"]},
                    {"number": 6, "name": "Evolution", "unit": "VII", "marks": 4, "type": "lesson", "topics": ["Origin of life", "Chemical evolution", "Biological evolution", "Evidence of evolution", "Darwin's theory", "Mutation theory", "Modern synthetic theory", "Hardy-Weinberg principle", "Natural selection", "Gene flow", "Genetic drift", "Adaptive radiation", "Human evolution"]},
                    {"number": 7, "name": "Human Health and Disease", "unit": "VIII", "marks": 6, "type": "lesson", "topics": ["Pathogens", "Parasites", "Common diseases", "Typhoid", "Pneumonia", "Common cold", "Malaria", "Amoebiasis", "Ascariasis", "Elephantiasis", "Ringworm", "Immunity types", "Innate immunity", "Acquired immunity", "Active immunity", "Passive immunity", "Vaccination", "Allergies", "Auto-immune diseases", "AIDS", "Cancer"]},
                    {"number": 8, "name": "Microbes in Human Welfare", "unit": "VIII", "marks": 6, "type": "lesson", "topics": ["Microbes in household products", "Fermented beverages", "Industrial products", "Antibiotics", "Chemicals", "Enzymes", "Bioactive molecules", "Sewage treatment", "Primary treatment", "Secondary treatment", "Biogas production", "Biocontrol agents", "Biofertilizers"]},
                    {"number": 9, "name": "Biotechnology: Principles and Processes", "unit": "IX", "marks": 6, "type": "lesson", "topics": ["Genetic engineering", "Recombinant DNA technology", "Tools of genetic engineering", "Restriction enzymes", "Cloning vectors", "Competent host", "DNA insertion methods", "Gel electrophoresis", "PCR", "Bioreactors", "Downstream processing"]},
                    {"number": 10, "name": "Biotechnology and its Applications", "unit": "IX", "marks": 6, "type": "lesson", "topics": ["Biotechnological applications in agriculture", "Bt crops", "Bt cotton", "Pest resistant plants", "Biotechnological applications in medicine", "Genetically engineered insulin", "Gene therapy", "Molecular diagnosis", "Transgenic animals", "Ethical issues", "Biopiracy", "Patents"]},
                    {"number": 11, "name": "Organisms and Populations", "unit": "X", "marks": 4, "type": "lesson", "topics": ["Population attributes", "Population density", "Birth rate", "Death rate", "Age distribution", "Population growth", "Exponential growth", "Logistic growth", "Life history variation", "Population interactions", "Mutualism", "Competition", "Predation", "Parasitism", "Commensalism", "Amensalism"]},
                    {"number": 12, "name": "Ecosystem", "unit": "X", "marks": 3, "type": "lesson", "topics": ["Ecosystem structure", "Productivity", "Primary productivity", "Secondary productivity", "Decomposition", "Energy flow", "Food chains", "Food webs", "Ecological pyramids", "Pyramid of number", "Pyramid of biomass", "Pyramid of energy"]},
                    {"number": 13, "name": "Biodiversity and Conservation", "unit": "X", "marks": 3, "type": "lesson", "topics": ["Biodiversity concept", "Genetic diversity", "Species diversity", "Ecosystem diversity", "Patterns of biodiversity", "Importance of species diversity", "Loss of biodiversity", "Biodiversity conservation", "In-situ conservation", "Ex-situ conservation", "Hotspots", "Sacred groves", "Biosphere reserves", "National parks", "Wildlife sanctuaries"]}
                ]
            },
            "English": {
                "book": "Flamingo & Vistas (NCERT 2024-25)",
                "chapters": [
                    {"number": 1, "name": "The Last Lesson", "marks": 5, "type": "prose", "topics": ["French language", "Patriotism", "Loss of language", "Alphonse Daudet", "Education value", "Last day of French"]},
                    {"number": 2, "name": "Lost Spring", "marks": 5, "type": "prose", "topics": ["Child labour", "Rag picking", "Bangle making", "Poverty cycle", "Social issues", "Anees Jung"]},
                    {"number": 3, "name": "Deep Water", "marks": 5, "type": "prose", "topics": ["William Douglas", "Fear of water", "Overcoming fear", "Determination", "Swimming learning", "Personal narrative"]},
                    {"number": 4, "name": "The Rattrap", "marks": 5, "type": "prose", "topics": ["Selma Lagerlof", "Human kindness", "Transformation", "Christmas story", "Rattrap metaphor", "Trust and honor"]},
                    {"number": 5, "name": "Indigo", "marks": 5, "type": "prose", "topics": ["Louis Fischer", "Mahatma Gandhi", "Champaran movement", "Civil disobedience", "Peasant struggle", "British exploitation"]},
                    {"number": 6, "name": "Poets and Pancakes", "marks": 4, "type": "prose", "topics": ["Asokamitran", "Gemini Studios", "Film industry", "Indian cinema", "Behind scenes", "Humor and satire"]},
                    {"number": 7, "name": "The Interview", "marks": 4, "type": "prose", "topics": ["Umberto Eco", "Interview format", "Writing process", "Celebrity interviews", "Modern communication", "Literary discussion"]},
                    {"number": 8, "name": "Going Places", "marks": 4, "type": "prose", "topics": ["A R Barton", "Adolescent dreams", "Reality vs fantasy", "Hero worship", "Working class", "Sophie's imagination"]},
                    {"number": 9, "name": "My Mother at Sixty-Six", "marks": 3, "type": "poem", "topics": ["Kamala Das", "Ageing mother", "Fear of loss", "Parent-child bond", "Mortality", "Poetic imagery"]},
                    {"number": 10, "name": "An Elementary School Classroom in a Slum", "marks": 3, "type": "poem", "topics": ["Stephen Spender", "Poverty education", "Social inequality", "Dreams and reality", "Hope for change", "Slum children"]},
                    {"number": 11, "name": "Keeping Quiet", "marks": 3, "type": "poem", "topics": ["Pablo Neruda", "Silence and reflection", "Peace message", "Self-introspection", "Unity of mankind", "War and violence"]},
                    {"number": 12, "name": "A Thing of Beauty", "marks": 3, "type": "poem", "topics": ["John Keats", "Beauty eternal", "Joy forever", "Nature beauty", "Human connection", "Romantic poetry"]},
                    {"number": 13, "name": "A Roadside Stand", "marks": 3, "type": "poem", "topics": ["Robert Frost", "Rural poverty", "City vs country", "Unfulfilled hopes", "Economic disparity", "Human indifference"]},
                    {"number": 14, "name": "Aunt Jennifer's Tigers", "marks": 3, "type": "poem", "topics": ["Adrienne Rich", "Women oppression", "Art as freedom", "Marriage constraint", "Feminist poetry", "Symbolism"]}
                ]
            },
            "Hindi": {
                "book": "आरोह भाग-2 & वितान भाग-2 (NCERT 2024-25)",
                "chapters": [
                    {"number": 1, "name": "आत्म-परिचय, एक गीत", "marks": 4, "type": "poem", "topics": ["हरिवंश राय बच्चन", "आत्मकथा", "जीवन दर्शन", "संघर्ष", "आशावाद"]},
                    {"number": 2, "name": "पतंग", "marks": 3, "type": "poem", "topics": ["आलोक धन्वा", "बचपन", "उड़ान", "स्वतंत्रता", "कल्पना"]},
                    {"number": 3, "name": "कविता के बहाने, बात सीधी थी पर", "marks": 3, "type": "poem", "topics": ["कुंवर नारायण", "काव्य सृजन", "भाषा", "अभिव्यक्ति", "काव्य शास्त्र"]},
                    {"number": 4, "name": "कैमरे में बंद अपाहिज", "marks": 3, "type": "poem", "topics": ["रघुवीर सहाय", "मीडिया आलोचना", "विकलांगता", "संवेदनहीनता", "व्यंग्य"]},
                    {"number": 5, "name": "सहर्ष स्वीकारा है", "marks": 3, "type": "poem", "topics": ["गजानन माधव मुक्तिबोध", "जीवन स्वीकृति", "संघर्ष", "आत्मचिंतन", "दार्शनिकता"]},
                    {"number": 6, "name": "उषा", "marks": 3, "type": "poem", "topics": ["शमशेर बहादुर सिंह", "प्रकृति चित्रण", "सुबह", "बिम्ब विधान", "सौंदर्य"]},
                    {"number": 7, "name": "बादल राग", "marks": 3, "type": "poem", "topics": ["सूर्यकांत त्रिपाठी निराला", "प्रकृति", "क्रांति", "विद्रोह", "छायावाद"]},
                    {"number": 8, "name": "कवितावली (उत्तर कांड)", "marks": 3, "type": "poem", "topics": ["तुलसीदास", "राम भक्ति", "सामाजिक यथार्थ", "भक्ति काव्य", "लोक कल्याण"]},
                    {"number": 9, "name": "रुबाइयाँ, गज़ल", "marks": 3, "type": "poem", "topics": ["फ़िराक़ गोरखपुरी", "उर्दू काव्य", "प्रेम", "जीवन दर्शन", "सौंदर्य"]},
                    {"number": 10, "name": "छोटा मेरा खेत, बगुलों के पंख", "marks": 3, "type": "poem", "topics": ["उमाशंकर जोशी", "काव्य सृजन", "प्रकृति", "गुजराती कविता", "बिम्ब"]},
                    {"number": 11, "name": "भक्तिन", "marks": 4, "type": "prose", "topics": ["महादेवी वर्मा", "स्त्री जीवन", "सेवा भाव", "ग्रामीण जीवन", "संस्मरण"]},
                    {"number": 12, "name": "बाजार दर्शन", "marks": 4, "type": "prose", "topics": ["जैनेंद्र कुमार", "उपभोक्तावाद", "बाजार", "मानवीय मूल्य", "निबंध"]},
                    {"number": 13, "name": "काले मेघा पानी दे", "marks": 4, "type": "prose", "topics": ["धर्मवीर भारती", "सूखा", "ग्रामीण जीवन", "आस्था", "प्रकृति"]},
                    {"number": 14, "name": "पहलवान की ढोलक", "marks": 4, "type": "prose", "topics": ["फणीश्वरनाथ रेणु", "ग्रामीण जीवन", "महामारी", "साहस", "लोक संस्कृति"]},
                    {"number": 15, "name": "चार्ली चैप्लिन यानी हम सब", "marks": 4, "type": "prose", "topics": ["विष्णु खरे", "हास्य कला", "फिल्म", "मानवता", "व्यंग्य"]},
                    {"number": 16, "name": "नमक", "marks": 4, "type": "prose", "topics": ["रज़िया सज्जाद ज़हीर", "विभाजन", "सीमाएं", "मानवीय संबंध", "भावुकता"]},
                    {"number": 17, "name": "शिरीष के फूल", "marks": 3, "type": "prose", "topics": ["हजारी प्रसाद द्विवेदी", "प्रकृति निबंध", "जीवन दर्शन", "ललित निबंध", "सौंदर्य"]},
                    {"number": 18, "name": "श्रम विभाजन और जाति प्रथा", "marks": 4, "type": "prose", "topics": ["भीमराव आंबेडकर", "जातिवाद", "समाज सुधार", "समानता", "श्रम"]},
                    {"number": 19, "name": "सिल्वर वैडिंग", "marks": 3, "type": "prose", "topics": ["मनोहर श्याम जोशी", "परिवार", "संबंध", "व्यंग्य", "मध्यवर्गीय जीवन"]},
                    {"number": 20, "name": "जूझ", "marks": 3, "type": "prose", "topics": ["आनंद यादव", "शिक्षा संघर्ष", "आत्मकथा", "ग्रामीण जीवन", "प्रेरणा"]}
                ]
            }
        }
    }
}

# Add more classes (2-5) with basic chapters
NCERT_SYLLABUS_DATA["2"] = {
    "subjects": {
        "Hindi": {
            "book": "रिमझिम - 2",
            "chapters": [
                {"number": 1, "name": "ऊँट चला", "marks": 3, "type": "poem", "topics": ["जानवर", "यात्रा"]},
                {"number": 2, "name": "भालू ने खेली फुटबॉल", "marks": 3, "type": "story", "topics": ["खेल", "जानवर"]},
                {"number": 3, "name": "म्याऊँ, म्याऊँ!!", "marks": 3, "type": "story", "topics": ["बिल्ली", "आवाज"]},
                {"number": 4, "name": "अधिक बलवान कौन", "marks": 3, "type": "story", "topics": ["शक्ति", "नैतिकता"]},
                {"number": 5, "name": "दोस्त की मदद", "marks": 3, "type": "story", "topics": ["मित्रता", "सहायता"]},
                {"number": 6, "name": "बहुत हुआ", "marks": 3, "type": "poem", "topics": ["प्रकृति", "पक्षी"]},
                {"number": 7, "name": "मेरी किताब", "marks": 3, "type": "poem", "topics": ["पढ़ाई", "किताबें"]},
                {"number": 8, "name": "तितली और कली", "marks": 3, "type": "story", "topics": ["तितली", "फूल"]},
                {"number": 9, "name": "बुलबुल", "marks": 3, "type": "poem", "topics": ["पक्षी", "गीत"]},
                {"number": 10, "name": "मीठी सारंगी", "marks": 3, "type": "story", "topics": ["संगीत", "वाद्य"]}
            ]
        },
        "English": {
            "book": "Marigold - 2",
            "chapters": [
                {"number": 1, "name": "First Day at School", "marks": 3, "type": "poem", "topics": ["School", "Feelings"]},
                {"number": 2, "name": "Haldi's Adventure", "marks": 3, "type": "story", "topics": ["Adventure", "Bird"]},
                {"number": 3, "name": "I am Lucky!", "marks": 3, "type": "poem", "topics": ["Gratitude", "Family"]},
                {"number": 4, "name": "I Want", "marks": 3, "type": "poem", "topics": ["Wishes", "Dreams"]},
                {"number": 5, "name": "A Smile", "marks": 3, "type": "poem", "topics": ["Happiness", "Kindness"]},
                {"number": 6, "name": "The Grasshopper and the Ant", "marks": 3, "type": "story", "topics": ["Fable", "Hard work"]},
                {"number": 7, "name": "Zoo Manners", "marks": 3, "type": "poem", "topics": ["Zoo", "Manners"]},
                {"number": 8, "name": "Curlylocks and the Three Bears", "marks": 3, "type": "story", "topics": ["Fairy tale", "Bears"]},
                {"number": 9, "name": "On My Blackboard I Can Draw", "marks": 3, "type": "poem", "topics": ["Drawing", "Creativity"]},
                {"number": 10, "name": "Make It Shorter", "marks": 3, "type": "story", "topics": ["Problem solving", "Humor"]}
            ]
        },
        "Mathematics": {
            "book": "Math-Magic - 2",
            "chapters": [
                {"number": 1, "name": "What is Long, What is Round?", "marks": 5, "type": "lesson", "topics": ["Shapes", "Long", "Round"]},
                {"number": 2, "name": "Counting in Groups", "marks": 5, "type": "lesson", "topics": ["Counting", "Groups", "Tens"]},
                {"number": 3, "name": "How Much Can You Carry?", "marks": 5, "type": "lesson", "topics": ["Weight", "Heavy", "Light"]},
                {"number": 4, "name": "Counting in Tens", "marks": 5, "type": "lesson", "topics": ["Place value", "Tens", "Ones"]},
                {"number": 5, "name": "Patterns", "marks": 5, "type": "lesson", "topics": ["Patterns", "Sequences"]},
                {"number": 6, "name": "Footprints", "marks": 5, "type": "lesson", "topics": ["Measurement", "Length"]},
                {"number": 7, "name": "Jugs and Mugs", "marks": 5, "type": "lesson", "topics": ["Capacity", "Measurement"]},
                {"number": 8, "name": "Tens and Ones", "marks": 5, "type": "lesson", "topics": ["Place value", "Numbers"]},
                {"number": 9, "name": "My Funday", "marks": 5, "type": "lesson", "topics": ["Time", "Days"]},
                {"number": 10, "name": "Add Our Points", "marks": 5, "type": "lesson", "topics": ["Addition", "Counting"]},
                {"number": 11, "name": "Lines and Lines", "marks": 5, "type": "lesson", "topics": ["Lines", "Curves"]},
                {"number": 12, "name": "Give and Take", "marks": 5, "type": "lesson", "topics": ["Addition", "Subtraction"]},
                {"number": 13, "name": "The Longest Step", "marks": 5, "type": "lesson", "topics": ["Measurement", "Comparison"]},
                {"number": 14, "name": "Birds Come, Birds Go", "marks": 5, "type": "lesson", "topics": ["Data handling", "Counting"]},
                {"number": 15, "name": "How Many Ponytails?", "marks": 5, "type": "lesson", "topics": ["Data", "Counting"]}
            ]
        },
        "EVS": {
            "book": "Looking Around - 2 (Not applicable for Class 2)",
            "chapters": []
        }
    }
}

NCERT_SYLLABUS_DATA["3"] = {
    "subjects": {
        "Hindi": {
            "book": "रिमझिम - 3",
            "chapters": [
                {"number": 1, "name": "कक्कू", "marks": 4, "type": "poem", "topics": ["पक्षी", "आवाज"]},
                {"number": 2, "name": "शेखीबाज़ मक्खी", "marks": 4, "type": "story", "topics": ["घमंड", "सीख"]},
                {"number": 3, "name": "चाँद वाली अम्मा", "marks": 4, "type": "poem", "topics": ["दादी", "प्यार"]},
                {"number": 4, "name": "मन करता है", "marks": 4, "type": "poem", "topics": ["इच्छाएं", "सपने"]},
                {"number": 5, "name": "बहादुर बित्तो", "marks": 4, "type": "story", "topics": ["साहस", "बहादुरी"]},
                {"number": 6, "name": "हमसे सब कहते", "marks": 4, "type": "poem", "topics": ["बड़े", "सलाह"]},
                {"number": 7, "name": "टिपटिपवा", "marks": 4, "type": "story", "topics": ["बारिश", "खेल"]},
                {"number": 8, "name": "बंदर-बाँट", "marks": 4, "type": "story", "topics": ["न्याय", "चालाकी"]},
                {"number": 9, "name": "अक्ल बड़ी या भैंस", "marks": 4, "type": "story", "topics": ["बुद्धि", "ताकत"]},
                {"number": 10, "name": "क्योंजीमल और कैसे कैसलिया", "marks": 4, "type": "story", "topics": ["जिज्ञासा", "सवाल"]}
            ]
        },
        "English": {
            "book": "Marigold - 3",
            "chapters": [
                {"number": 1, "name": "Good Morning", "marks": 4, "type": "poem", "topics": ["Greeting", "Morning"]},
                {"number": 2, "name": "The Magic Garden", "marks": 4, "type": "story", "topics": ["Garden", "Magic"]},
                {"number": 3, "name": "Bird Talk", "marks": 4, "type": "poem", "topics": ["Birds", "Communication"]},
                {"number": 4, "name": "Nina and the Baby Sparrows", "marks": 4, "type": "story", "topics": ["Kindness", "Birds"]},
                {"number": 5, "name": "Little by Little", "marks": 4, "type": "poem", "topics": ["Growth", "Nature"]},
                {"number": 6, "name": "The Enormous Turnip", "marks": 4, "type": "story", "topics": ["Teamwork", "Fable"]},
                {"number": 7, "name": "Sea Song", "marks": 4, "type": "poem", "topics": ["Sea", "Shell"]},
                {"number": 8, "name": "A Little Fish Story", "marks": 4, "type": "story", "topics": ["Fish", "Adventure"]},
                {"number": 9, "name": "The Balloon Man", "marks": 4, "type": "poem", "topics": ["Balloons", "Fair"]},
                {"number": 10, "name": "The Yellow Butterfly", "marks": 4, "type": "story", "topics": ["Butterfly", "Nature"]}
            ]
        },
        "Mathematics": {
            "book": "Math-Magic - 3",
            "chapters": [
                {"number": 1, "name": "Where to Look From", "marks": 5, "type": "lesson", "topics": ["Shapes", "Perspective"]},
                {"number": 2, "name": "Fun with Numbers", "marks": 5, "type": "lesson", "topics": ["Numbers", "Operations"]},
                {"number": 3, "name": "Give and Take", "marks": 5, "type": "lesson", "topics": ["Addition", "Subtraction"]},
                {"number": 4, "name": "Long and Short", "marks": 5, "type": "lesson", "topics": ["Length", "Measurement"]},
                {"number": 5, "name": "Shapes and Designs", "marks": 5, "type": "lesson", "topics": ["Shapes", "Patterns"]},
                {"number": 6, "name": "Fun with Give and Take", "marks": 5, "type": "lesson", "topics": ["Word problems", "Operations"]},
                {"number": 7, "name": "Time Goes On", "marks": 5, "type": "lesson", "topics": ["Time", "Calendar"]},
                {"number": 8, "name": "Who is Heavier?", "marks": 5, "type": "lesson", "topics": ["Weight", "Comparison"]},
                {"number": 9, "name": "How Many Times?", "marks": 5, "type": "lesson", "topics": ["Multiplication", "Tables"]},
                {"number": 10, "name": "Play with Patterns", "marks": 5, "type": "lesson", "topics": ["Patterns", "Symmetry"]},
                {"number": 11, "name": "Jugs and Mugs", "marks": 5, "type": "lesson", "topics": ["Capacity", "Volume"]},
                {"number": 12, "name": "Can We Share?", "marks": 5, "type": "lesson", "topics": ["Division", "Sharing"]},
                {"number": 13, "name": "Smart Charts!", "marks": 5, "type": "lesson", "topics": ["Data", "Charts"]},
                {"number": 14, "name": "Rupees and Paise", "marks": 5, "type": "lesson", "topics": ["Money", "Currency"]}
            ]
        },
        "EVS": {
            "book": "Looking Around - 3",
            "chapters": [
                {"number": 1, "name": "Poonam's Day Out", "marks": 4, "type": "lesson", "topics": ["Animals", "Observation"]},
                {"number": 2, "name": "The Plant Fairy", "marks": 4, "type": "lesson", "topics": ["Plants", "Growth"]},
                {"number": 3, "name": "Water O Water!", "marks": 4, "type": "lesson", "topics": ["Water", "Sources"]},
                {"number": 4, "name": "Our First School", "marks": 4, "type": "lesson", "topics": ["Family", "Learning"]},
                {"number": 5, "name": "Chhotu's House", "marks": 4, "type": "lesson", "topics": ["House", "Materials"]},
                {"number": 6, "name": "Foods We Eat", "marks": 4, "type": "lesson", "topics": ["Food", "Nutrition"]},
                {"number": 7, "name": "Saying Without Speaking", "marks": 4, "type": "lesson", "topics": ["Communication", "Signs"]},
                {"number": 8, "name": "Flying High", "marks": 4, "type": "lesson", "topics": ["Birds", "Flying"]},
                {"number": 9, "name": "It's Raining", "marks": 4, "type": "lesson", "topics": ["Rain", "Weather"]},
                {"number": 10, "name": "What is Cooking?", "marks": 4, "type": "lesson", "topics": ["Cooking", "Food"]}
            ]
        }
    }
}

NCERT_SYLLABUS_DATA["4"] = {
    "subjects": {
        "Hindi": {
            "book": "रिमझिम - 4",
            "chapters": [
                {"number": 1, "name": "मन के भोले-भाले बादल", "marks": 4, "type": "poem", "topics": ["बादल", "कल्पना"]},
                {"number": 2, "name": "जैसा सवाल वैसा जवाब", "marks": 4, "type": "story", "topics": ["बुद्धि", "चतुराई"]},
                {"number": 3, "name": "किरमिच की गेंद", "marks": 4, "type": "story", "topics": ["खेल", "मेहनत"]},
                {"number": 4, "name": "पापा जब बच्चे थे", "marks": 4, "type": "story", "topics": ["बचपन", "यादें"]},
                {"number": 5, "name": "दोस्त की पोशाक", "marks": 4, "type": "story", "topics": ["मित्रता", "त्याग"]},
                {"number": 6, "name": "नाव बनाओ नाव बनाओ", "marks": 4, "type": "poem", "topics": ["कागज़", "खेल"]},
                {"number": 7, "name": "दान का हिसाब", "marks": 4, "type": "story", "topics": ["दान", "ईमानदारी"]},
                {"number": 8, "name": "कौन", "marks": 4, "type": "poem", "topics": ["प्रश्न", "जिज्ञासा"]},
                {"number": 9, "name": "स्वतंत्रता की ओर", "marks": 4, "type": "lesson", "topics": ["स्वतंत्रता", "इतिहास"]},
                {"number": 10, "name": "थप्प रोटी थप्प दाल", "marks": 4, "type": "poem", "topics": ["खाना", "रसोई"]}
            ]
        },
        "English": {
            "book": "Marigold - 4",
            "chapters": [
                {"number": 1, "name": "Wake Up!", "marks": 4, "type": "poem", "topics": ["Morning", "Nature"]},
                {"number": 2, "name": "Neha's Alarm Clock", "marks": 4, "type": "story", "topics": ["Time", "Responsibility"]},
                {"number": 3, "name": "Noses", "marks": 4, "type": "poem", "topics": ["Body", "Animals"]},
                {"number": 4, "name": "The Little Fir Tree", "marks": 4, "type": "story", "topics": ["Trees", "Contentment"]},
                {"number": 5, "name": "Run!", "marks": 4, "type": "poem", "topics": ["Exercise", "Health"]},
                {"number": 6, "name": "Nasruddin's Aim", "marks": 4, "type": "story", "topics": ["Humor", "Wisdom"]},
                {"number": 7, "name": "Why?", "marks": 4, "type": "poem", "topics": ["Questions", "Curiosity"]},
                {"number": 8, "name": "Alice in Wonderland", "marks": 4, "type": "story", "topics": ["Fantasy", "Adventure"]},
                {"number": 9, "name": "Don't Be Afraid of the Dark", "marks": 4, "type": "poem", "topics": ["Fear", "Courage"]},
                {"number": 10, "name": "Helen Keller", "marks": 4, "type": "biography", "topics": ["Inspiration", "Disability"]}
            ]
        },
        "Mathematics": {
            "book": "Math-Magic - 4",
            "chapters": [
                {"number": 1, "name": "Building with Bricks", "marks": 5, "type": "lesson", "topics": ["Shapes", "Patterns"]},
                {"number": 2, "name": "Long and Short", "marks": 5, "type": "lesson", "topics": ["Length", "Measurement"]},
                {"number": 3, "name": "A Trip to Bhopal", "marks": 5, "type": "lesson", "topics": ["Distance", "Maps"]},
                {"number": 4, "name": "Tick-Tick-Tick", "marks": 5, "type": "lesson", "topics": ["Time", "Clock"]},
                {"number": 5, "name": "The Way the World Looks", "marks": 5, "type": "lesson", "topics": ["Perspective", "Maps"]},
                {"number": 6, "name": "The Junk Seller", "marks": 5, "type": "lesson", "topics": ["Weight", "Money"]},
                {"number": 7, "name": "Jugs and Mugs", "marks": 5, "type": "lesson", "topics": ["Capacity", "Volume"]},
                {"number": 8, "name": "Carts and Wheels", "marks": 5, "type": "lesson", "topics": ["Circles", "Patterns"]},
                {"number": 9, "name": "Halves and Quarters", "marks": 5, "type": "lesson", "topics": ["Fractions", "Parts"]},
                {"number": 10, "name": "Play with Patterns", "marks": 5, "type": "lesson", "topics": ["Patterns", "Sequences"]},
                {"number": 11, "name": "Tables and Shares", "marks": 5, "type": "lesson", "topics": ["Multiplication", "Division"]},
                {"number": 12, "name": "How Heavy? How Light?", "marks": 5, "type": "lesson", "topics": ["Weight", "Balance"]},
                {"number": 13, "name": "Fields and Fences", "marks": 5, "type": "lesson", "topics": ["Area", "Perimeter"]},
                {"number": 14, "name": "Smart Charts", "marks": 5, "type": "lesson", "topics": ["Data", "Graphs"]}
            ]
        },
        "EVS": {
            "book": "Looking Around - 4",
            "chapters": [
                {"number": 1, "name": "Going to School", "marks": 4, "type": "lesson", "topics": ["School", "Transport"]},
                {"number": 2, "name": "Ear to Ear", "marks": 4, "type": "lesson", "topics": ["Listening", "Sounds"]},
                {"number": 3, "name": "A Day with Nandu", "marks": 4, "type": "lesson", "topics": ["Elephant", "Animals"]},
                {"number": 4, "name": "The Story of Amrita", "marks": 4, "type": "lesson", "topics": ["Trees", "Environment"]},
                {"number": 5, "name": "Anita and the Honeybees", "marks": 4, "type": "lesson", "topics": ["Bees", "Honey"]},
                {"number": 6, "name": "Omana's Journey", "marks": 4, "type": "lesson", "topics": ["Travel", "Geography"]},
                {"number": 7, "name": "From the Window", "marks": 4, "type": "lesson", "topics": ["Observation", "Surroundings"]},
                {"number": 8, "name": "Reaching Grandmother's House", "marks": 4, "type": "lesson", "topics": ["Journey", "Family"]},
                {"number": 9, "name": "Changing Families", "marks": 4, "type": "lesson", "topics": ["Family", "Changes"]},
                {"number": 10, "name": "Hu Tu Tu, Hu Tu Tu", "marks": 4, "type": "lesson", "topics": ["Games", "Sports"]}
            ]
        }
    }
}

NCERT_SYLLABUS_DATA["5"] = {
    "subjects": {
        "Hindi": {
            "book": "रिमझिम - 5",
            "chapters": [
                {"number": 1, "name": "राख की रस्सी", "marks": 4, "type": "story", "topics": ["बुद्धि", "चतुराई"]},
                {"number": 2, "name": "फ़सलों के त्योहार", "marks": 4, "type": "lesson", "topics": ["त्योहार", "खेती"]},
                {"number": 3, "name": "खिलौनेवाला", "marks": 4, "type": "poem", "topics": ["खिलौने", "बचपन"]},
                {"number": 4, "name": "नन्हा फ़नकार", "marks": 4, "type": "story", "topics": ["कला", "प्रतिभा"]},
                {"number": 5, "name": "जहाँ चाह वहाँ राह", "marks": 4, "type": "story", "topics": ["इच्छाशक्ति", "सफलता"]},
                {"number": 6, "name": "चिट्ठी का सफ़र", "marks": 4, "type": "lesson", "topics": ["डाक", "संचार"]},
                {"number": 7, "name": "डाकिए की कहानी, कँवरसिंह की जुबानी", "marks": 4, "type": "story", "topics": ["डाकिया", "सेवा"]},
                {"number": 8, "name": "वे दिन भी क्या दिन थे", "marks": 4, "type": "story", "topics": ["विज्ञान", "भविष्य"]},
                {"number": 9, "name": "एक माँ की बेबसी", "marks": 4, "type": "poem", "topics": ["माँ", "प्रेम"]},
                {"number": 10, "name": "बिशन की दिलेरी", "marks": 4, "type": "story", "topics": ["साहस", "जानवर"]}
            ]
        },
        "English": {
            "book": "Marigold - 5",
            "chapters": [
                {"number": 1, "name": "Ice Cream Man", "marks": 4, "type": "poem", "topics": ["Summer", "Ice cream"]},
                {"number": 2, "name": "Wonderful Waste!", "marks": 4, "type": "lesson", "topics": ["Recycling", "Environment"]},
                {"number": 3, "name": "Teamwork", "marks": 4, "type": "poem", "topics": ["Cooperation", "Unity"]},
                {"number": 4, "name": "Flying Together", "marks": 4, "type": "story", "topics": ["Birds", "Teamwork"]},
                {"number": 5, "name": "My Shadow", "marks": 4, "type": "poem", "topics": ["Shadow", "Wonder"]},
                {"number": 6, "name": "Robinson Crusoe", "marks": 4, "type": "story", "topics": ["Adventure", "Survival"]},
                {"number": 7, "name": "Crying", "marks": 4, "type": "poem", "topics": ["Emotions", "Expression"]},
                {"number": 8, "name": "My Elder Brother", "marks": 4, "type": "story", "topics": ["Family", "Relationships"]},
                {"number": 9, "name": "Sing a Song of People", "marks": 4, "type": "poem", "topics": ["City", "People"]},
                {"number": 10, "name": "Around the World", "marks": 4, "type": "story", "topics": ["Travel", "Geography"]}
            ]
        },
        "Mathematics": {
            "book": "Math-Magic - 5",
            "chapters": [
                {"number": 1, "name": "The Fish Tale", "marks": 5, "type": "lesson", "topics": ["Large numbers", "Estimation"]},
                {"number": 2, "name": "Shapes and Angles", "marks": 5, "type": "lesson", "topics": ["Angles", "Shapes"]},
                {"number": 3, "name": "How Many Squares?", "marks": 5, "type": "lesson", "topics": ["Area", "Squares"]},
                {"number": 4, "name": "Parts and Wholes", "marks": 5, "type": "lesson", "topics": ["Fractions", "Parts"]},
                {"number": 5, "name": "Does it Look the Same?", "marks": 5, "type": "lesson", "topics": ["Symmetry", "Reflection"]},
                {"number": 6, "name": "Be My Multiple, I'll Be Your Factor", "marks": 5, "type": "lesson", "topics": ["Factors", "Multiples"]},
                {"number": 7, "name": "Can You See the Pattern?", "marks": 5, "type": "lesson", "topics": ["Patterns", "Sequences"]},
                {"number": 8, "name": "Mapping Your Way", "marks": 5, "type": "lesson", "topics": ["Maps", "Directions"]},
                {"number": 9, "name": "Boxes and Sketches", "marks": 5, "type": "lesson", "topics": ["3D Shapes", "Nets"]},
                {"number": 10, "name": "Tenths and Hundredths", "marks": 5, "type": "lesson", "topics": ["Decimals", "Place value"]},
                {"number": 11, "name": "Area and Its Boundary", "marks": 5, "type": "lesson", "topics": ["Area", "Perimeter"]},
                {"number": 12, "name": "Smart Charts", "marks": 5, "type": "lesson", "topics": ["Data", "Graphs"]},
                {"number": 13, "name": "Ways to Multiply and Divide", "marks": 5, "type": "lesson", "topics": ["Multiplication", "Division"]},
                {"number": 14, "name": "How Big? How Heavy?", "marks": 5, "type": "lesson", "topics": ["Volume", "Weight"]}
            ]
        },
        "EVS": {
            "book": "Looking Around - 5",
            "chapters": [
                {"number": 1, "name": "Super Senses", "marks": 4, "type": "lesson", "topics": ["Senses", "Animals"]},
                {"number": 2, "name": "A Snake Charmer's Story", "marks": 4, "type": "lesson", "topics": ["Snakes", "Occupation"]},
                {"number": 3, "name": "From Tasting to Digesting", "marks": 4, "type": "lesson", "topics": ["Digestion", "Food"]},
                {"number": 4, "name": "Mangoes Round the Year", "marks": 4, "type": "lesson", "topics": ["Preservation", "Food"]},
                {"number": 5, "name": "Seeds and Seeds", "marks": 4, "type": "lesson", "topics": ["Seeds", "Plants"]},
                {"number": 6, "name": "Every Drop Counts", "marks": 4, "type": "lesson", "topics": ["Water", "Conservation"]},
                {"number": 7, "name": "Experiments with Water", "marks": 4, "type": "lesson", "topics": ["Water", "Properties"]},
                {"number": 8, "name": "A Treat for Mosquitoes", "marks": 4, "type": "lesson", "topics": ["Mosquitoes", "Diseases"]},
                {"number": 9, "name": "Up You Go!", "marks": 4, "type": "lesson", "topics": ["Mountains", "Climbing"]},
                {"number": 10, "name": "Walls Tell Stories", "marks": 4, "type": "lesson", "topics": ["History", "Buildings"]}
            ]
        }
    }
}

# Class 7 - NCERT 2024-25
NCERT_SYLLABUS_DATA["7"] = {
    "subjects": {
        "Hindi": {
            "book": "वसंत भाग-2",
            "chapters": [
                {"number": 1, "name": "हम पंछी उन्मुक्त गगन के", "marks": 4, "type": "poem", "topics": ["स्वतंत्रता", "पक्षी"]},
                {"number": 2, "name": "दादी माँ", "marks": 4, "type": "story", "topics": ["दादी", "परिवार"]},
                {"number": 3, "name": "हिमालय की बेटियाँ", "marks": 4, "type": "lesson", "topics": ["नदियाँ", "हिमालय"]},
                {"number": 4, "name": "कठपुतली", "marks": 4, "type": "poem", "topics": ["स्वतंत्रता", "बंधन"]},
                {"number": 5, "name": "मिठाईवाला", "marks": 4, "type": "story", "topics": ["प्रेम", "त्याग"]},
                {"number": 6, "name": "रक्त और हमारा शरीर", "marks": 4, "type": "lesson", "topics": ["रक्त", "स्वास्थ्य"]},
                {"number": 7, "name": "पापा खो गए", "marks": 4, "type": "play", "topics": ["नाटक", "परिवार"]},
                {"number": 8, "name": "शाम - एक किसान", "marks": 4, "type": "poem", "topics": ["किसान", "गाँव"]},
                {"number": 9, "name": "चिड़िया की बच्ची", "marks": 4, "type": "story", "topics": ["स्वतंत्रता", "प्रेम"]},
                {"number": 10, "name": "अपूर्व अनुभव", "marks": 4, "type": "story", "topics": ["अनुभव", "सीख"]}
            ]
        },
        "English": {
            "book": "Honeycomb",
            "chapters": [
                {"number": 1, "name": "Three Questions", "marks": 5, "type": "story", "topics": ["Wisdom", "Philosophy"]},
                {"number": 2, "name": "A Gift of Chappals", "marks": 5, "type": "story", "topics": ["Kindness", "Family"]},
                {"number": 3, "name": "Gopal and the Hilsa Fish", "marks": 5, "type": "story", "topics": ["Humor", "Wit"]},
                {"number": 4, "name": "The Ashes That Made Trees Bloom", "marks": 5, "type": "story", "topics": ["Japanese folktale", "Kindness"]},
                {"number": 5, "name": "Quality", "marks": 5, "type": "story", "topics": ["Craftsmanship", "Dedication"]},
                {"number": 6, "name": "Expert Detectives", "marks": 5, "type": "story", "topics": ["Mystery", "Adventure"]},
                {"number": 7, "name": "The Invention of Vita-Wonk", "marks": 5, "type": "story", "topics": ["Fantasy", "Invention"]},
                {"number": 8, "name": "Fire: Friend and Foe", "marks": 5, "type": "lesson", "topics": ["Fire", "Safety"]},
                {"number": 9, "name": "A Bicycle in Good Repair", "marks": 5, "type": "story", "topics": ["Humor", "Repair"]},
                {"number": 10, "name": "The Story of Cricket", "marks": 5, "type": "lesson", "topics": ["Cricket", "History"]}
            ]
        },
        "Mathematics": {
            "book": "Mathematics - 7 (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "Integers", "marks": 5, "type": "lesson", "topics": ["Integers", "Operations", "Properties"]},
                {"number": 2, "name": "Fractions and Decimals", "marks": 5, "type": "lesson", "topics": ["Fractions", "Decimals", "Operations"]},
                {"number": 3, "name": "Data Handling", "marks": 5, "type": "lesson", "topics": ["Data collection", "Mean", "Median", "Mode", "Bar graphs"]},
                {"number": 4, "name": "Simple Equations", "marks": 5, "type": "lesson", "topics": ["Variables", "Equations", "Solving equations"]},
                {"number": 5, "name": "Lines and Angles", "marks": 5, "type": "lesson", "topics": ["Related angles", "Parallel lines", "Transversal"]},
                {"number": 6, "name": "The Triangle and its Properties", "marks": 5, "type": "lesson", "topics": ["Medians", "Altitudes", "Angle sum", "Exterior angle"]},
                {"number": 7, "name": "Congruence of Triangles", "marks": 5, "type": "lesson", "topics": ["Congruence", "Criteria", "SSS", "SAS", "ASA", "RHS"]},
                {"number": 8, "name": "Comparing Quantities", "marks": 5, "type": "lesson", "topics": ["Ratio", "Percentage", "Profit and loss", "Simple interest"]},
                {"number": 9, "name": "Rational Numbers", "marks": 5, "type": "lesson", "topics": ["Rational numbers", "Operations", "Representation"]},
                {"number": 10, "name": "Practical Geometry", "marks": 5, "type": "lesson", "topics": ["Constructions", "Triangles"]},
                {"number": 11, "name": "Perimeter and Area", "marks": 5, "type": "lesson", "topics": ["Perimeter", "Area", "Circles"]},
                {"number": 12, "name": "Algebraic Expressions", "marks": 5, "type": "lesson", "topics": ["Terms", "Coefficients", "Addition", "Subtraction"]},
                {"number": 13, "name": "Exponents and Powers", "marks": 5, "type": "lesson", "topics": ["Exponents", "Laws", "Standard form"]},
                {"number": 14, "name": "Symmetry", "marks": 5, "type": "lesson", "topics": ["Lines of symmetry", "Rotational symmetry"]},
                {"number": 15, "name": "Visualising Solid Shapes", "marks": 5, "type": "lesson", "topics": ["Plane figures", "Solid shapes", "Nets"]}
            ]
        },
        "Science": {
            "book": "Science - 7 (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "Nutrition in Plants", "marks": 5, "type": "lesson", "topics": ["Autotrophic nutrition", "Photosynthesis", "Other modes"]},
                {"number": 2, "name": "Nutrition in Animals", "marks": 5, "type": "lesson", "topics": ["Digestion", "Digestive system", "Feeding habits"]},
                {"number": 3, "name": "Fibre to Fabric", "marks": 4, "type": "lesson", "topics": ["Animal fibres", "Wool", "Silk"]},
                {"number": 4, "name": "Heat", "marks": 5, "type": "lesson", "topics": ["Temperature", "Conduction", "Convection", "Radiation"]},
                {"number": 5, "name": "Acids, Bases and Salts", "marks": 5, "type": "lesson", "topics": ["Indicators", "Neutralisation", "Applications"]},
                {"number": 6, "name": "Physical and Chemical Changes", "marks": 5, "type": "lesson", "topics": ["Physical changes", "Chemical changes", "Rusting"]},
                {"number": 7, "name": "Weather, Climate and Adaptations", "marks": 5, "type": "lesson", "topics": ["Weather", "Climate", "Adaptations"]},
                {"number": 8, "name": "Winds, Storms and Cyclones", "marks": 5, "type": "lesson", "topics": ["Air pressure", "Wind", "Cyclones"]},
                {"number": 9, "name": "Soil", "marks": 4, "type": "lesson", "topics": ["Soil profile", "Soil types", "Properties"]},
                {"number": 10, "name": "Respiration in Organisms", "marks": 5, "type": "lesson", "topics": ["Cellular respiration", "Breathing", "Respiration in organisms"]},
                {"number": 11, "name": "Transportation in Animals and Plants", "marks": 5, "type": "lesson", "topics": ["Circulatory system", "Excretion", "Transport in plants"]},
                {"number": 12, "name": "Reproduction in Plants", "marks": 5, "type": "lesson", "topics": ["Modes of reproduction", "Asexual", "Sexual", "Pollination"]},
                {"number": 13, "name": "Motion and Time", "marks": 5, "type": "lesson", "topics": ["Speed", "Measurement of time", "Distance-time graph"]},
                {"number": 14, "name": "Electric Current and its Effects", "marks": 5, "type": "lesson", "topics": ["Symbols", "Heating effect", "Magnetic effect", "Electromagnet"]},
                {"number": 15, "name": "Light", "marks": 5, "type": "lesson", "topics": ["Reflection", "Plane mirror", "Spherical mirrors", "Lenses"]},
                {"number": 16, "name": "Water: A Precious Resource", "marks": 4, "type": "lesson", "topics": ["Water cycle", "Ground water", "Conservation"]},
                {"number": 17, "name": "Forests: Our Lifeline", "marks": 4, "type": "lesson", "topics": ["Forest ecosystem", "Products", "Conservation"]},
                {"number": 18, "name": "Wastewater Story", "marks": 4, "type": "lesson", "topics": ["Sewage", "Treatment", "Sanitation"]}
            ]
        },
        "Social Science": {
            "book": "Social Science - 7 (NCERT 2024-25)",
            "units": [
                {"unit": "History", "name": "Our Pasts - II", "marks": 25},
                {"unit": "Civics", "name": "Social and Political Life - II", "marks": 25},
                {"unit": "Geography", "name": "Our Environment", "marks": 25}
            ],
            "chapters": [
                {"number": 1, "name": "Tracing Changes Through a Thousand Years", "unit": "History", "marks": 4, "type": "lesson", "topics": ["New and old terminologies", "Historians and their sources", "New social and political groups", "Region and empire"]},
                {"number": 2, "name": "New Kings and Kingdoms", "unit": "History", "marks": 4, "type": "lesson", "topics": ["Emergence of new dynasties", "Administration", "Prashastis and land grants", "Cholas"]},
                {"number": 3, "name": "The Delhi Sultans", "unit": "History", "marks": 4, "type": "lesson", "topics": ["Finding out about Delhi Sultans", "From garrison town to empire", "Expansion", "Administration"]},
                {"number": 4, "name": "The Mughal Empire", "unit": "History", "marks": 4, "type": "lesson", "topics": ["Who were the Mughals", "Military campaigns", "Akbar's policies", "Mansabdars and jagirdars"]},
                {"number": 5, "name": "Rulers and Buildings", "unit": "History", "marks": 3, "type": "lesson", "topics": ["Engineering skills and construction", "Building temples and mosques", "Gardens, tombs and forts", "Region and empire"]},
                {"number": 6, "name": "Towns, Traders and Craftspersons", "unit": "History", "marks": 3, "type": "lesson", "topics": ["Administrative centres", "Temple towns and pilgrimage centres", "Crafts and craftspersons", "Small towns"]},
                {"number": 7, "name": "Tribes, Nomads and Settled Communities", "unit": "History", "marks": 3, "type": "lesson", "topics": ["Beyond big cities", "Who were tribal people", "How nomads and mobile people lived", "New castes and hierarchies"]},
                {"number": 8, "name": "On Equality", "unit": "Civics", "marks": 4, "type": "lesson", "topics": ["Equality in Indian democracy", "Inequality and discrimination", "Recognising dignity", "Equality laws"]},
                {"number": 9, "name": "Role of the Government in Health", "unit": "Civics", "marks": 3, "type": "lesson", "topics": ["Healthcare and equality", "Public and private health services", "Kerala's health model", "Costa Rica's approach"]},
                {"number": 10, "name": "How the State Government Works", "unit": "Civics", "marks": 4, "type": "lesson", "topics": ["MLAs and constituencies", "Forming government", "Work of legislature", "State executive"]},
                {"number": 11, "name": "Growing up as Boys and Girls", "unit": "Civics", "marks": 3, "type": "lesson", "topics": ["Being boy or girl", "Valuing housework", "Lives of domestic workers", "Women's work"]},
                {"number": 12, "name": "Women Change the World", "unit": "Civics", "marks": 3, "type": "lesson", "topics": ["Women's movement", "Education for girls", "Changes in laws", "Stereotypes"]},
                {"number": 13, "name": "Understanding Media", "unit": "Civics", "marks": 4, "type": "lesson", "topics": ["What is media", "Media and money", "Media and democracy", "Setting agendas"]},
                {"number": 14, "name": "Markets Around Us", "unit": "Civics", "marks": 3, "type": "lesson", "topics": ["Weekly market", "Shops in neighbourhood", "Shopping complexes and malls", "Chain of markets"]},
                {"number": 15, "name": "A Shirt in the Market", "unit": "Civics", "marks": 3, "type": "lesson", "topics": ["Putting out system", "Role of merchant", "Market and equality", "Foreign buyer"]},
                {"number": 16, "name": "Environment", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Environment", "Natural and human environment", "Ecosystem", "Environmental problems"]},
                {"number": 17, "name": "Inside Our Earth", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Interior of earth", "Rocks and minerals", "Rock cycle", "Types of rocks"]},
                {"number": 18, "name": "Our Changing Earth", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Lithospheric plates", "Earthquakes", "Volcanoes", "Landforms"]},
                {"number": 19, "name": "Air", "unit": "Geography", "marks": 3, "type": "lesson", "topics": ["Atmosphere", "Composition of atmosphere", "Weather and climate", "Temperature"]},
                {"number": 20, "name": "Water", "unit": "Geography", "marks": 3, "type": "lesson", "topics": ["Water cycle", "Ocean circulation", "Tides", "Water conservation"]},
                {"number": 21, "name": "Human Environment Interactions", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Amazon basin", "Ganga-Brahmaputra basin", "Life in tropical regions", "Life in delta regions"]},
                {"number": 22, "name": "Life in the Deserts", "unit": "Geography", "marks": 3, "type": "lesson", "topics": ["Sahara desert", "Ladakh", "Hot desert life", "Cold desert life"]}
            ]
        }
    }
}

# Class 8 - NCERT 2024-25
NCERT_SYLLABUS_DATA["8"] = {
    "subjects": {
        "Hindi": {
            "book": "वसंत भाग-3",
            "chapters": [
                {"number": 1, "name": "ध्वनि", "marks": 4, "type": "poem", "topics": ["प्रकृति", "आवाज"]},
                {"number": 2, "name": "लाख की चूड़ियाँ", "marks": 4, "type": "story", "topics": ["कला", "परंपरा"]},
                {"number": 3, "name": "बस की यात्रा", "marks": 4, "type": "story", "topics": ["व्यंग्य", "यात्रा"]},
                {"number": 4, "name": "दीवानों की हस्ती", "marks": 4, "type": "poem", "topics": ["जीवन", "दर्शन"]},
                {"number": 5, "name": "चिट्ठियों की अनूठी दुनिया", "marks": 4, "type": "lesson", "topics": ["पत्र", "संचार"]},
                {"number": 6, "name": "भगवान के डाकिए", "marks": 4, "type": "poem", "topics": ["प्रकृति", "संदेश"]},
                {"number": 7, "name": "क्या निराश हुआ जाए", "marks": 4, "type": "lesson", "topics": ["आशा", "जीवन"]},
                {"number": 8, "name": "यह सबसे कठिन समय नहीं", "marks": 4, "type": "poem", "topics": ["आशावाद", "साहस"]},
                {"number": 9, "name": "कबीर की साखियाँ", "marks": 4, "type": "poem", "topics": ["कबीर", "दोहे"]},
                {"number": 10, "name": "कामचोर", "marks": 4, "type": "story", "topics": ["व्यंग्य", "आलस्य"]}
            ]
        },
        "English": {
            "book": "Honeydew",
            "chapters": [
                {"number": 1, "name": "The Best Christmas Present in the World", "marks": 5, "type": "story", "topics": ["War", "Peace", "Humanity"]},
                {"number": 2, "name": "The Tsunami", "marks": 5, "type": "lesson", "topics": ["Natural disaster", "Survival"]},
                {"number": 3, "name": "Glimpses of the Past", "marks": 5, "type": "lesson", "topics": ["Indian history", "Freedom struggle"]},
                {"number": 4, "name": "Bepin Choudhury's Lapse of Memory", "marks": 5, "type": "story", "topics": ["Mystery", "Psychology"]},
                {"number": 5, "name": "The Summit Within", "marks": 5, "type": "lesson", "topics": ["Mountaineering", "Achievement"]},
                {"number": 6, "name": "This is Jody's Fawn", "marks": 5, "type": "story", "topics": ["Animal care", "Compassion"]},
                {"number": 7, "name": "A Visit to Cambridge", "marks": 5, "type": "lesson", "topics": ["Stephen Hawking", "Inspiration"]},
                {"number": 8, "name": "A Short Monsoon Diary", "marks": 5, "type": "lesson", "topics": ["Nature", "Monsoon"]},
                {"number": 9, "name": "The Great Stone Face - I", "marks": 5, "type": "story", "topics": ["Character", "Values"]},
                {"number": 10, "name": "The Great Stone Face - II", "marks": 5, "type": "story", "topics": ["Character", "Values"]}
            ]
        },
        "Mathematics": {
            "book": "Mathematics - 8 (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "Rational Numbers", "marks": 5, "type": "lesson", "topics": ["Properties", "Operations", "Representation"]},
                {"number": 2, "name": "Linear Equations in One Variable", "marks": 5, "type": "lesson", "topics": ["Equations", "Applications"]},
                {"number": 3, "name": "Understanding Quadrilaterals", "marks": 5, "type": "lesson", "topics": ["Polygons", "Angle sum", "Types"]},
                {"number": 4, "name": "Practical Geometry", "marks": 5, "type": "lesson", "topics": ["Quadrilateral construction"]},
                {"number": 5, "name": "Data Handling", "marks": 5, "type": "lesson", "topics": ["Organisation", "Pie charts", "Probability"]},
                {"number": 6, "name": "Squares and Square Roots", "marks": 5, "type": "lesson", "topics": ["Perfect squares", "Square roots", "Patterns"]},
                {"number": 7, "name": "Cubes and Cube Roots", "marks": 5, "type": "lesson", "topics": ["Perfect cubes", "Cube roots"]},
                {"number": 8, "name": "Comparing Quantities", "marks": 5, "type": "lesson", "topics": ["Ratios", "Percentages", "Compound interest"]},
                {"number": 9, "name": "Algebraic Expressions and Identities", "marks": 5, "type": "lesson", "topics": ["Expressions", "Identities", "Operations"]},
                {"number": 10, "name": "Visualising Solid Shapes", "marks": 5, "type": "lesson", "topics": ["3D shapes", "Faces", "Edges", "Vertices"]},
                {"number": 11, "name": "Mensuration", "marks": 5, "type": "lesson", "topics": ["Area", "Surface area", "Volume"]},
                {"number": 12, "name": "Exponents and Powers", "marks": 5, "type": "lesson", "topics": ["Laws", "Negative exponents", "Standard form"]},
                {"number": 13, "name": "Direct and Inverse Proportions", "marks": 5, "type": "lesson", "topics": ["Direct proportion", "Inverse proportion"]},
                {"number": 14, "name": "Factorisation", "marks": 5, "type": "lesson", "topics": ["Factors", "Division of expressions"]},
                {"number": 15, "name": "Introduction to Graphs", "marks": 5, "type": "lesson", "topics": ["Bar graph", "Pie chart", "Line graph", "Linear graph"]},
                {"number": 16, "name": "Playing with Numbers", "marks": 5, "type": "lesson", "topics": ["Number patterns", "Divisibility", "Puzzles"]}
            ]
        },
        "Science": {
            "book": "Science - 8 (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "Crop Production and Management", "marks": 5, "type": "lesson", "topics": ["Agricultural practices", "Crop protection"]},
                {"number": 2, "name": "Microorganisms: Friend and Foe", "marks": 5, "type": "lesson", "topics": ["Types", "Useful microorganisms", "Harmful microorganisms"]},
                {"number": 3, "name": "Synthetic Fibres and Plastics", "marks": 5, "type": "lesson", "topics": ["Synthetic fibres", "Plastics", "Environment"]},
                {"number": 4, "name": "Materials: Metals and Non-Metals", "marks": 5, "type": "lesson", "topics": ["Properties", "Reactions", "Uses"]},
                {"number": 5, "name": "Coal and Petroleum", "marks": 5, "type": "lesson", "topics": ["Fossil fuels", "Formation", "Conservation"]},
                {"number": 6, "name": "Combustion and Flame", "marks": 5, "type": "lesson", "topics": ["Combustion", "Types of combustion", "Flame"]},
                {"number": 7, "name": "Conservation of Plants and Animals", "marks": 5, "type": "lesson", "topics": ["Deforestation", "Conservation", "Biodiversity"]},
                {"number": 8, "name": "Cell - Structure and Functions", "marks": 5, "type": "lesson", "topics": ["Cell structure", "Plant and animal cells", "Organelles"]},
                {"number": 9, "name": "Reproduction in Animals", "marks": 5, "type": "lesson", "topics": ["Modes of reproduction", "Sexual reproduction", "Asexual reproduction"]},
                {"number": 10, "name": "Reaching the Age of Adolescence", "marks": 5, "type": "lesson", "topics": ["Adolescence", "Puberty", "Reproductive health"]},
                {"number": 11, "name": "Force and Pressure", "marks": 5, "type": "lesson", "topics": ["Force", "Pressure", "Atmospheric pressure"]},
                {"number": 12, "name": "Friction", "marks": 5, "type": "lesson", "topics": ["Friction", "Types", "Increasing and decreasing friction"]},
                {"number": 13, "name": "Sound", "marks": 5, "type": "lesson", "topics": ["Sound production", "Propagation", "Human ear"]},
                {"number": 14, "name": "Chemical Effects of Electric Current", "marks": 5, "type": "lesson", "topics": ["Conductors", "Insulators", "Electroplating"]},
                {"number": 15, "name": "Some Natural Phenomena", "marks": 5, "type": "lesson", "topics": ["Lightning", "Earthquakes"]},
                {"number": 16, "name": "Light", "marks": 5, "type": "lesson", "topics": ["Reflection", "Multiple images", "Human eye", "Braille"]},
                {"number": 17, "name": "Stars and the Solar System", "marks": 5, "type": "lesson", "topics": ["Celestial objects", "Solar system", "Constellations"]},
                {"number": 18, "name": "Pollution of Air and Water", "marks": 5, "type": "lesson", "topics": ["Air pollution", "Water pollution", "Prevention"]}
            ]
        },
        "Social Science": {
            "book": "Social Science - 8 (NCERT 2024-25 Theme-Based)",
            "units": [
                {"unit": "Theme A", "name": "India and the World - Land and People", "marks": 20},
                {"unit": "Theme B", "name": "Tapestry of the Past", "marks": 30},
                {"unit": "Theme C", "name": "Livelihoods, Economy and Society", "marks": 20},
                {"unit": "Theme D", "name": "Governance and Democracy", "marks": 20}
            ],
            "chapters": [
                {"number": 1, "name": "Natural Resources and Their Use", "unit": "Theme A", "marks": 6, "type": "lesson", "topics": ["Types of resources", "Renewable and non-renewable", "Development of resources", "Resource conservation", "Sustainable development"]},
                {"number": 2, "name": "How, When and Where", "unit": "Theme B", "marks": 5, "type": "lesson", "topics": ["Importance of dates", "How do we periodise", "What is colonial", "Surveys become important"]},
                {"number": 3, "name": "From Trade to Territory", "unit": "Theme B", "marks": 5, "type": "lesson", "topics": ["East India Company", "Trade to territory", "Company rule expands", "Setting up administration"]},
                {"number": 4, "name": "Ruling the Countryside", "unit": "Theme B", "marks": 5, "type": "lesson", "topics": ["Revenue for company", "Permanent settlement", "Mahalwari system", "Ryotwari system"]},
                {"number": 5, "name": "Tribals, Dikus and the Vision of a Golden Age", "unit": "Theme B", "marks": 4, "type": "lesson", "topics": ["How did tribals live", "How did colonial rule affect", "Tribal chiefs", "Birsa Munda"]},
                {"number": 6, "name": "When People Rebel 1857 and After", "unit": "Theme B", "marks": 6, "type": "lesson", "topics": ["Policies and the people", "Response of people", "From Meerut to Delhi", "Aftermath"]},
                {"number": 7, "name": "Weavers, Iron Smelters and Factory Owners", "unit": "Theme C", "marks": 5, "type": "lesson", "topics": ["Indian textiles", "Decline of Indian textiles", "Manchester comes to India", "Factories come up"]},
                {"number": 8, "name": "Civilising the Native, Educating the Nation", "unit": "Theme B", "marks": 4, "type": "lesson", "topics": ["How tradition changed", "Orientalist tradition", "Anglicist tradition", "Education and women"]},
                {"number": 9, "name": "Women, Caste and Reform", "unit": "Theme C", "marks": 5, "type": "lesson", "topics": ["Women and reform", "Caste and reform", "Anti-caste movements", "Law and social change"]},
                {"number": 10, "name": "The Making of the National Movement 1870s-1947", "unit": "Theme B", "marks": 6, "type": "lesson", "topics": ["Emergence of nationalism", "Nationalist movement growth", "Towards freedom", "Last phase of struggle"]},
                {"number": 11, "name": "India After Independence", "unit": "Theme B", "marks": 5, "type": "lesson", "topics": ["New nation challenges", "Constitution making", "Planning for development", "National unity"]},
                {"number": 12, "name": "The Indian Constitution", "unit": "Theme D", "marks": 5, "type": "lesson", "topics": ["Why Constitution", "Key features", "Fundamental Rights", "Directive Principles"]},
                {"number": 13, "name": "Understanding Secularism", "unit": "Theme D", "marks": 4, "type": "lesson", "topics": ["What is secularism", "Indian secularism", "Separation of religion and state", "Constitutional provisions"]},
                {"number": 14, "name": "Parliament and the Making of Laws", "unit": "Theme D", "marks": 5, "type": "lesson", "topics": ["Why Parliament", "People and representatives", "How Parliament works", "Law making"]},
                {"number": 15, "name": "Understanding Our Criminal Justice System", "unit": "Theme D", "marks": 4, "type": "lesson", "topics": ["Role of police", "Role of public prosecutor", "Role of judge", "Fair trial"]},
                {"number": 16, "name": "Understanding Marginalisation", "unit": "Theme C", "marks": 5, "type": "lesson", "topics": ["Who are marginalised", "Social marginalisation", "Economic marginalisation", "Constitutional provisions"]},
                {"number": 17, "name": "Confronting Marginalisation", "unit": "Theme C", "marks": 4, "type": "lesson", "topics": ["Invoking fundamental rights", "Laws for the marginalised", "Conclusion", "Protection and empowerment"]},
                {"number": 18, "name": "Public Facilities", "unit": "Theme C", "marks": 4, "type": "lesson", "topics": ["Water as case study", "Public and private", "Government role", "Access to facilities"]}
            ]
        }
    }
}

# Class 9 - NCERT 2024-25 Syllabus
NCERT_SYLLABUS_DATA["9"] = {
    "subjects": {
        "Hindi": {"book": "क्षितिज भाग-1 & कृतिका भाग-1", "chapters": []},
        "English": {"book": "Beehive & Moments", "chapters": []},
        "Mathematics": {
            "book": "Mathematics (NCERT 2024-25)",
            "units": [
                {"unit": "I", "name": "Number Systems", "marks": 10},
                {"unit": "II", "name": "Algebra", "marks": 20},
                {"unit": "III", "name": "Coordinate Geometry", "marks": 4},
                {"unit": "IV", "name": "Geometry", "marks": 27},
                {"unit": "V", "name": "Mensuration", "marks": 13},
                {"unit": "VI", "name": "Statistics & Probability", "marks": 6}
            ],
            "chapters": [
                {"number": 1, "name": "Number Systems", "unit": "I", "marks": 10, "type": "lesson", "topics": ["Natural numbers", "Whole numbers", "Integers", "Rational numbers", "Irrational numbers", "Real numbers", "Decimal expansion", "Number line", "Laws of exponents", "Rationalizing denominators"]},
                {"number": 2, "name": "Polynomials", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Polynomials in one variable", "Zeroes of polynomial", "Remainder theorem", "Factorisation", "Algebraic identities"]},
                {"number": 3, "name": "Coordinate Geometry", "unit": "III", "marks": 4, "type": "lesson", "topics": ["Cartesian system", "Plotting points", "Coordinates of a point", "Quadrants", "Abscissa and ordinate"]},
                {"number": 4, "name": "Linear Equations in Two Variables", "unit": "II", "marks": 7, "type": "lesson", "topics": ["Linear equations", "Solution of linear equation", "Graph of linear equation", "Equations of lines parallel to axes"]},
                {"number": 5, "name": "Introduction to Euclid's Geometry", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Euclid's definitions", "Axioms", "Postulates", "Equivalent versions of fifth postulate"]},
                {"number": 6, "name": "Lines and Angles", "unit": "IV", "marks": 6, "type": "lesson", "topics": ["Basic terms", "Intersecting and non-intersecting lines", "Pairs of angles", "Parallel lines and transversal", "Angle sum property of triangle"]},
                {"number": 7, "name": "Triangles", "unit": "IV", "marks": 8, "type": "lesson", "topics": ["Congruence of triangles", "Criteria for congruence", "Properties of triangles", "Inequalities in triangles"]},
                {"number": 8, "name": "Quadrilaterals", "unit": "IV", "marks": 5, "type": "lesson", "topics": ["Angle sum property", "Types of quadrilaterals", "Properties of parallelogram", "Mid-point theorem"]},
                {"number": 9, "name": "Areas of Parallelograms and Triangles", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Figures on same base and between same parallels", "Area of parallelogram", "Area of triangle"]},
                {"number": 10, "name": "Circles", "unit": "IV", "marks": 5, "type": "lesson", "topics": ["Circle definitions", "Chords", "Arcs", "Angles subtended by chords", "Cyclic quadrilaterals"]},
                {"number": 11, "name": "Constructions", "unit": "IV", "marks": 5, "type": "lesson", "topics": ["Basic constructions", "Construction of bisectors", "Construction of triangles"]},
                {"number": 12, "name": "Heron's Formula", "unit": "V", "marks": 6, "type": "lesson", "topics": ["Area of triangle using Heron's formula", "Application to quadrilaterals"]},
                {"number": 13, "name": "Surface Areas and Volumes", "unit": "V", "marks": 7, "type": "lesson", "topics": ["Surface area of cuboid, cube, cylinder, cone, sphere", "Volume of cuboid, cube, cylinder, cone, sphere"]},
                {"number": 14, "name": "Statistics", "unit": "VI", "marks": 4, "type": "lesson", "topics": ["Collection of data", "Presentation of data", "Graphical representation", "Bar graphs", "Histograms", "Frequency polygons", "Mean, Median, Mode"]},
                {"number": 15, "name": "Probability", "unit": "VI", "marks": 2, "type": "lesson", "topics": ["Probability - experimental approach", "Events", "Outcomes"]}
            ]
        },
        "Science": {
            "book": "Science (NCERT 2024-25)",
            "units": [
                {"unit": "I", "name": "Matter - Its Nature and Behaviour", "marks": 25},
                {"unit": "II", "name": "Organization in the Living World", "marks": 22},
                {"unit": "III", "name": "Motion, Force and Work", "marks": 27},
                {"unit": "IV", "name": "Food Production", "marks": 6}
            ],
            "chapters": [
                {"number": 1, "name": "Matter in Our Surroundings", "unit": "I", "marks": 6, "type": "lesson", "topics": ["Physical nature of matter", "Characteristics of particles", "States of matter", "Interconversion of states", "Evaporation"]},
                {"number": 2, "name": "Is Matter Around Us Pure", "unit": "I", "marks": 6, "type": "lesson", "topics": ["Mixtures", "Solutions", "Suspensions", "Colloids", "Separation techniques", "Physical and chemical changes", "Types of pure substances", "Compounds and mixtures"]},
                {"number": 3, "name": "Atoms and Molecules", "unit": "I", "marks": 7, "type": "lesson", "topics": ["Laws of chemical combination", "Atoms", "Atomic mass", "Molecules", "Ions", "Chemical formulae", "Molecular mass", "Mole concept"]},
                {"number": 4, "name": "Structure of the Atom", "unit": "I", "marks": 6, "type": "lesson", "topics": ["Charged particles", "Thomson's model", "Rutherford's model", "Bohr's model", "Electrons distributed in shells", "Valency", "Atomic number", "Mass number", "Isotopes"]},
                {"number": 5, "name": "The Fundamental Unit of Life", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Cell theory", "Cell - basic unit", "Structural organization of cell", "Plasma membrane", "Cell wall", "Nucleus", "Cytoplasm", "Cell organelles"]},
                {"number": 6, "name": "Tissues", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Plant tissues", "Meristematic tissue", "Permanent tissue", "Animal tissues", "Epithelial tissue", "Connective tissue", "Muscular tissue", "Nervous tissue"]},
                {"number": 7, "name": "Diversity in Living Organisms", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Basis of classification", "Classification and evolution", "Hierarchy of classification", "Plantae", "Animalia", "Five kingdom classification"]},
                {"number": 8, "name": "Why Do We Fall Ill", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Health and its failure", "Disease and its causes", "Infectious diseases", "Means of spread", "Principles of treatment", "Principles of prevention"]},
                {"number": 9, "name": "Natural Resources", "unit": "IV", "marks": 3, "type": "lesson", "topics": ["Air", "Water", "Soil", "Biogeochemical cycles", "Water cycle", "Nitrogen cycle", "Carbon cycle", "Oxygen cycle", "Ozone layer"]},
                {"number": 10, "name": "Improvement in Food Resources", "unit": "IV", "marks": 3, "type": "lesson", "topics": ["Improvement in crop yields", "Crop variety improvement", "Crop production management", "Crop protection management", "Animal husbandry"]},
                {"number": 11, "name": "Motion", "unit": "III", "marks": 7, "type": "lesson", "topics": ["Describing motion", "Distance and displacement", "Uniform and non-uniform motion", "Speed", "Velocity", "Acceleration", "Graphical representation", "Equations of motion", "Uniform circular motion"]},
                {"number": 12, "name": "Force and Laws of Motion", "unit": "III", "marks": 7, "type": "lesson", "topics": ["Balanced and unbalanced forces", "First law of motion", "Inertia", "Mass", "Second law of motion", "Third law of motion", "Conservation of momentum"]},
                {"number": 13, "name": "Gravitation", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Gravitation", "Universal law of gravitation", "Importance of universal law", "Free fall", "Acceleration due to gravity", "Mass and weight", "Thrust and pressure", "Pressure in fluids", "Buoyancy", "Archimedes principle", "Relative density"]},
                {"number": 14, "name": "Work and Energy", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Work", "Energy", "Forms of energy", "Kinetic energy", "Potential energy", "Law of conservation of energy", "Power", "Commercial unit of energy"]},
                {"number": 15, "name": "Sound", "unit": "III", "marks": 3, "type": "lesson", "topics": ["Production of sound", "Propagation of sound", "Sound waves", "Characteristics of sound wave", "Speed of sound", "Reflection of sound", "Echo", "Reverberation", "Uses of ultrasound", "Structure of human ear"]}
            ]
        },
        "Social Science": {
            "book": "Social Science - 9 (NCERT 2024-25)",
            "units": [
                {"unit": "History", "name": "India and the Contemporary World - I", "marks": 20},
                {"unit": "Geography", "name": "Contemporary India - I", "marks": 20},
                {"unit": "Civics", "name": "Democratic Politics - I", "marks": 20},
                {"unit": "Economics", "name": "Economics", "marks": 20}
            ],
            "chapters": [
                {"number": 1, "name": "The French Revolution", "unit": "History", "marks": 5, "type": "lesson", "topics": ["French society", "Outbreak of revolution", "France becomes republic", "Reign of Terror", "Role of women", "Abolition of slavery", "Revolution and everyday life"]},
                {"number": 2, "name": "Socialism in Europe and the Russian Revolution", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Age of social change", "Liberals", "Radicals", "Conservatives", "Industrial revolution", "Coming of socialism", "Russian Revolution", "Global influence"]},
                {"number": 3, "name": "Nazism and the Rise of Hitler", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Birth of Weimar Republic", "Hitler's rise to power", "Nazi worldview", "Youth in Nazi Germany", "Ordinary people and crimes against humanity"]},
                {"number": 4, "name": "Forest Society and Colonialism", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Deforestation", "Rise of commercial forestry", "Rebellion in forest", "Forest transformations in Java"]},
                {"number": 5, "name": "Pastoralists in the Modern World", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Pastoral nomads", "Colonial rule and pastoral life", "Pastoralism in Africa"]},
                {"number": 6, "name": "India - Size and Location", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Location", "Size", "India and the world", "India's neighbours"]},
                {"number": 7, "name": "Physical Features of India", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Major physiographic divisions", "Himalayan mountains", "Northern plains", "Peninsular plateau", "Indian desert", "Coastal plains", "Islands"]},
                {"number": 8, "name": "Drainage", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Drainage systems", "Himalayan rivers", "Peninsular rivers", "Lakes", "Role of rivers in economy", "River pollution"]},
                {"number": 9, "name": "Climate", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Factors affecting climate", "Indian monsoon", "Seasons in India", "Distribution of rainfall", "Monsoon as a unifying bond"]},
                {"number": 10, "name": "Natural Vegetation and Wildlife", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Types of vegetation", "Tropical forests", "Tropical deciduous forests", "Thorny bushes", "Mountain vegetation", "Mangrove forests", "Wildlife"]},
                {"number": 11, "name": "Population", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Population size and distribution", "Population growth", "Population composition", "Adolescent population", "NPP 2000"]},
                {"number": 12, "name": "What is Democracy? Why Democracy?", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["What is democracy", "Features of democracy", "Why democracy", "Broader meaning of democracy"]},
                {"number": 13, "name": "Constitutional Design", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Democratic constitution in South Africa", "Making of Indian Constitution", "Guiding values of Indian Constitution", "Preamble"]},
                {"number": 14, "name": "Electoral Politics", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Why elections", "What makes an election democratic", "Indian system of elections", "What makes elections in India democratic", "Challenges to free and fair elections"]},
                {"number": 15, "name": "Working of Institutions", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["How is major policy decision taken", "Parliament", "Political executive", "Judiciary"]},
                {"number": 16, "name": "Democratic Rights", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Life without rights", "Rights in democracy", "Fundamental rights", "Expanding scope of rights"]},
                {"number": 17, "name": "The Story of Village Palampur", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Organisation of production", "Farming in Palampur", "Non-farm activities"]},
                {"number": 18, "name": "People as Resource", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Economic activities", "Quality of population", "Education", "Health", "Unemployment"]},
                {"number": 19, "name": "Poverty as a Challenge", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Who is poor", "Poverty estimation", "Vulnerable groups", "Interstate disparities", "Global poverty", "Causes of poverty", "Anti-poverty measures"]},
                {"number": 20, "name": "Food Security in India", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["What is food security", "Who are food insecure", "Food security in India", "Buffer stock", "PDS", "Role of cooperatives"]}
            ]
        }
    }
}

# Class 10 - NCERT 2024-25 Syllabus
NCERT_SYLLABUS_DATA["10"] = {
    "subjects": {
        "Hindi": {"book": "क्षितिज भाग-2 & कृतिका भाग-2", "chapters": []},
        "English": {"book": "First Flight & Footprints Without Feet", "chapters": []},
        "Mathematics": {
            "book": "Mathematics (NCERT 2024-25)",
            "units": [
                {"unit": "I", "name": "Number Systems", "marks": 6},
                {"unit": "II", "name": "Algebra", "marks": 20},
                {"unit": "III", "name": "Coordinate Geometry", "marks": 6},
                {"unit": "IV", "name": "Geometry", "marks": 15},
                {"unit": "V", "name": "Trigonometry", "marks": 12},
                {"unit": "VI", "name": "Mensuration", "marks": 10},
                {"unit": "VII", "name": "Statistics and Probability", "marks": 11}
            ],
            "chapters": [
                {"number": 1, "name": "Real Numbers", "unit": "I", "marks": 6, "type": "lesson", "topics": ["Euclid's division lemma", "Fundamental theorem of arithmetic", "Revisiting irrational numbers", "Revisiting rational numbers", "HCF and LCM"]},
                {"number": 2, "name": "Polynomials", "unit": "II", "marks": 4, "type": "lesson", "topics": ["Geometrical meaning of zeroes", "Relationship between zeroes and coefficients", "Division algorithm for polynomials"]},
                {"number": 3, "name": "Pair of Linear Equations in Two Variables", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Graphical method", "Algebraic methods", "Substitution method", "Elimination method", "Cross-multiplication method", "Equations reducible to pair of linear equations"]},
                {"number": 4, "name": "Quadratic Equations", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Standard form", "Solution by factorisation", "Solution by completing square", "Nature of roots", "Quadratic formula"]},
                {"number": 5, "name": "Arithmetic Progressions", "unit": "II", "marks": 5, "type": "lesson", "topics": ["Introduction to AP", "nth term of AP", "Sum of first n terms of AP"]},
                {"number": 6, "name": "Coordinate Geometry", "unit": "III", "marks": 6, "type": "lesson", "topics": ["Distance formula", "Section formula", "Area of triangle"]},
                {"number": 7, "name": "Triangles", "unit": "IV", "marks": 8, "type": "lesson", "topics": ["Similar figures", "Similarity of triangles", "Criteria for similarity", "Areas of similar triangles", "Pythagoras theorem"]},
                {"number": 8, "name": "Circles", "unit": "IV", "marks": 7, "type": "lesson", "topics": ["Tangent to a circle", "Number of tangents from a point", "Theorems on tangents"]},
                {"number": 9, "name": "Introduction to Trigonometry", "unit": "V", "marks": 6, "type": "lesson", "topics": ["Trigonometric ratios", "Trigonometric ratios of specific angles", "Trigonometric ratios of complementary angles", "Trigonometric identities"]},
                {"number": 10, "name": "Some Applications of Trigonometry", "unit": "V", "marks": 6, "type": "lesson", "topics": ["Heights and distances", "Angle of elevation", "Angle of depression", "Applications"]},
                {"number": 11, "name": "Areas Related to Circles", "unit": "VI", "marks": 5, "type": "lesson", "topics": ["Perimeter and area of circle", "Areas of sector and segment", "Areas of combinations of figures"]},
                {"number": 12, "name": "Surface Areas and Volumes", "unit": "VI", "marks": 5, "type": "lesson", "topics": ["Surface area of combination of solids", "Volume of combination of solids", "Conversion of solid from one shape to another", "Frustum of a cone"]},
                {"number": 13, "name": "Statistics", "unit": "VII", "marks": 6, "type": "lesson", "topics": ["Mean of grouped data", "Mode of grouped data", "Median of grouped data", "Graphical representation of cumulative frequency distribution"]},
                {"number": 14, "name": "Probability", "unit": "VII", "marks": 5, "type": "lesson", "topics": ["Classical definition of probability", "Probability of an event", "Elementary events", "Complementary events"]}
            ]
        },
        "Science": {
            "book": "Science (NCERT 2024-25)",
            "units": [
                {"unit": "I", "name": "Chemical Substances - Nature and Behaviour", "marks": 25},
                {"unit": "II", "name": "World of Living", "marks": 25},
                {"unit": "III", "name": "Natural Phenomena", "marks": 12},
                {"unit": "IV", "name": "Effects of Current", "marks": 13},
                {"unit": "V", "name": "Natural Resources", "marks": 5}
            ],
            "chapters": [
                {"number": 1, "name": "Chemical Reactions and Equations", "unit": "I", "marks": 5, "type": "lesson", "topics": ["Chemical equations", "Balanced chemical equations", "Types of chemical reactions", "Combination reaction", "Decomposition reaction", "Displacement reaction", "Double displacement reaction", "Oxidation and reduction", "Effects of oxidation in daily life", "Corrosion", "Rancidity"]},
                {"number": 2, "name": "Acids, Bases and Salts", "unit": "I", "marks": 5, "type": "lesson", "topics": ["Acids and bases indicators", "Reactions of acids and bases", "Acids and bases in water", "Strength of acid and base", "Importance of pH", "Salts", "pH of salts", "Chemicals from common salt", "Plaster of Paris"]},
                {"number": 3, "name": "Metals and Non-metals", "unit": "I", "marks": 5, "type": "lesson", "topics": ["Physical properties", "Chemical properties", "Reactivity series", "Ionic compounds", "Occurrence of metals", "Extraction of metals", "Refining of metals", "Corrosion"]},
                {"number": 4, "name": "Carbon and its Compounds", "unit": "I", "marks": 5, "type": "lesson", "topics": ["Bonding in carbon", "Covalent bond", "Versatile nature of carbon", "Saturated and unsaturated compounds", "Chains branches and rings", "Homologous series", "Nomenclature", "Chemical properties", "Ethanol", "Ethanoic acid", "Soaps and detergents"]},
                {"number": 5, "name": "Periodic Classification of Elements", "unit": "I", "marks": 5, "type": "lesson", "topics": ["Early attempts", "Mendeleev's periodic table", "Modern periodic table", "Position of elements", "Trends in periodic table", "Metallic and non-metallic character"]},
                {"number": 6, "name": "Life Processes", "unit": "II", "marks": 7, "type": "lesson", "topics": ["Nutrition", "Autotrophic nutrition", "Heterotrophic nutrition", "Nutrition in human beings", "Respiration", "Transportation", "Excretion"]},
                {"number": 7, "name": "Control and Coordination", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Animals - nervous system", "Reflex actions", "Human brain", "Coordination in plants", "Hormones in animals"]},
                {"number": 8, "name": "How do Organisms Reproduce", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Importance of variation", "Modes of reproduction", "Asexual reproduction", "Sexual reproduction", "Sexual reproduction in flowering plants", "Reproduction in human beings", "Reproductive health"]},
                {"number": 9, "name": "Heredity and Evolution", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Accumulation of variation", "Heredity", "Inherited traits", "Rules for inheritance", "Sex determination", "Evolution", "Acquired and inherited traits", "Speciation", "Evolution and classification", "Tracing evolutionary relationships", "Human evolution"]},
                {"number": 10, "name": "Light - Reflection and Refraction", "unit": "III", "marks": 6, "type": "lesson", "topics": ["Reflection of light", "Laws of reflection", "Spherical mirrors", "Image formation", "Mirror formula", "Magnification", "Refraction of light", "Laws of refraction", "Refractive index", "Refraction by spherical lenses", "Lens formula", "Power of lens"]},
                {"number": 11, "name": "Human Eye and Colourful World", "unit": "III", "marks": 6, "type": "lesson", "topics": ["Human eye", "Power of accommodation", "Defects of vision", "Refraction through prism", "Dispersion of light", "Atmospheric refraction", "Scattering of light", "Tyndall effect"]},
                {"number": 12, "name": "Electricity", "unit": "IV", "marks": 7, "type": "lesson", "topics": ["Electric current", "Electric potential", "Ohm's law", "Factors affecting resistance", "Resistivity", "Resistors in series and parallel", "Heating effect of electric current", "Electric power"]},
                {"number": 13, "name": "Magnetic Effects of Electric Current", "unit": "IV", "marks": 6, "type": "lesson", "topics": ["Magnetic field", "Magnetic field due to current", "Force on current carrying conductor", "Electric motor", "Electromagnetic induction", "Electric generator", "Domestic electric circuits"]}
            ]
        },
        "Social Science": {
            "book": "Social Science - 10 (NCERT 2024-25)",
            "units": [
                {"unit": "History", "name": "India and the Contemporary World - II", "marks": 20},
                {"unit": "Geography", "name": "Contemporary India - II", "marks": 20},
                {"unit": "Civics", "name": "Democratic Politics - II", "marks": 20},
                {"unit": "Economics", "name": "Understanding Economic Development", "marks": 20}
            ],
            "chapters": [
                {"number": 1, "name": "The Rise of Nationalism in Europe", "unit": "History", "marks": 5, "type": "lesson", "topics": ["French Revolution and nationalism", "Making of nationalism in Europe", "Age of Revolutions", "Making of Germany and Italy", "Visualising the nation", "Nationalism and imperialism"]},
                {"number": 2, "name": "Nationalism in India", "unit": "History", "marks": 6, "type": "lesson", "topics": ["First World War", "Khilafat and Non-Cooperation", "Salt March", "Civil Disobedience Movement", "Sense of collective belonging", "Towards independence"]},
                {"number": 3, "name": "The Making of a Global World", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Pre-modern world", "Nineteenth century", "Inter-war economy", "Rebuilding world economy"]},
                {"number": 4, "name": "The Age of Industrialisation", "unit": "History", "marks": 5, "type": "lesson", "topics": ["Before the industrial revolution", "Hand labour and steam power", "Industrialisation in colonies", "Factories come up", "Peculiarities of industrial growth"]},
                {"number": 5, "name": "Print Culture and the Modern World", "unit": "History", "marks": 5, "type": "lesson", "topics": ["First printed books", "Print comes to Europe", "Print revolution", "Reading mania", "Print culture and French Revolution", "India and print", "Religious reform and public debates"]},
                {"number": 6, "name": "Resources and Development", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Types of resources", "Development of resources", "Resource planning", "Land resources", "Land use pattern", "Land degradation and conservation", "Soil as a resource", "Soil classification", "Soil erosion and conservation"]},
                {"number": 7, "name": "Forest and Wildlife Resources", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Flora and fauna in India", "Vanishing forests", "Conservation of forest", "Types and distribution", "Community and conservation"]},
                {"number": 8, "name": "Water Resources", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Water scarcity", "Multipurpose river projects", "Rainwater harvesting"]},
                {"number": 9, "name": "Agriculture", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Types of farming", "Cropping pattern", "Major crops", "Food crops", "Non-food crops", "Technological and institutional reforms", "Impact of globalisation"]},
                {"number": 10, "name": "Minerals and Energy Resources", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["What is a mineral", "Mode of occurrence", "Ferrous minerals", "Non-ferrous minerals", "Non-metallic minerals", "Conservation", "Energy resources", "Conventional and non-conventional"]},
                {"number": 11, "name": "Manufacturing Industries", "unit": "Geography", "marks": 5, "type": "lesson", "topics": ["Importance of manufacturing", "Industrial location", "Classification of industries", "Agro-based industries", "Mineral-based industries", "Industrial pollution"]},
                {"number": 12, "name": "Lifelines of National Economy", "unit": "Geography", "marks": 4, "type": "lesson", "topics": ["Transport", "Roadways", "Railways", "Pipelines", "Waterways", "Airways", "Communication", "International trade", "Tourism"]},
                {"number": 13, "name": "Power Sharing", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Belgium and Sri Lanka", "Why power sharing", "Forms of power sharing"]},
                {"number": 14, "name": "Federalism", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["What is federalism", "What makes India federal", "How is federalism practised", "Decentralisation in India"]},
                {"number": 15, "name": "Democracy and Diversity", "unit": "Civics", "marks": 4, "type": "lesson", "topics": ["Civil Rights Movement", "Social differences", "Politics of social divisions"]},
                {"number": 16, "name": "Gender, Religion and Caste", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Gender and politics", "Religion communalism and politics", "Caste and politics"]},
                {"number": 17, "name": "Political Parties", "unit": "Civics", "marks": 5, "type": "lesson", "topics": ["Why do we need political parties", "National parties", "State parties", "Challenges to political parties", "How can parties be reformed"]},
                {"number": 18, "name": "Outcomes of Democracy", "unit": "Civics", "marks": 4, "type": "lesson", "topics": ["How do we assess democracy's outcomes", "Accountable responsive legitimate government", "Economic growth and development", "Reduction of inequality", "Dignity and freedom of citizens"]},
                {"number": 19, "name": "Development", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["What development promises", "Different people different goals", "Income and other goals", "National development", "How to compare countries", "Income and other criteria", "Public facilities", "Sustainability"]},
                {"number": 20, "name": "Sectors of the Indian Economy", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Primary secondary tertiary sectors", "Comparing the three sectors", "Primary to tertiary", "Employment in sectors", "Organised and unorganised sectors", "Public and private sectors"]},
                {"number": 21, "name": "Money and Credit", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Money as medium of exchange", "Modern forms of money", "Loan activities", "Two credit situations", "Terms of credit", "Formal sector credit", "Self Help Groups"]},
                {"number": 22, "name": "Globalisation and the Indian Economy", "unit": "Economics", "marks": 5, "type": "lesson", "topics": ["Production across countries", "Interlinking production", "Foreign trade", "Globalisation", "Factors enabling", "World Trade Organisation", "Impact on India", "Fair globalisation"]},
                {"number": 23, "name": "Consumer Rights", "unit": "Economics", "marks": 4, "type": "lesson", "topics": ["Consumer in market", "Consumer movement", "Consumer rights", "Consumer protection act", "Consumer awareness"]}
            ]
        }
    }
}

# Class 11 - NCERT 2024-25 Syllabus (Complete)
NCERT_SYLLABUS_DATA["11"] = {
    "subjects": {
        "Physics": {
            "book": "Physics Part I & II (NCERT 2024-25)",
            "units": [
                {"unit": "I", "name": "Physical World and Measurement", "marks": 23},
                {"unit": "II", "name": "Kinematics", "marks": 0},
                {"unit": "III", "name": "Laws of Motion", "marks": 0},
                {"unit": "IV", "name": "Work, Energy and Power", "marks": 17},
                {"unit": "V", "name": "Motion of System of Particles", "marks": 0},
                {"unit": "VI", "name": "Gravitation", "marks": 20},
                {"unit": "VII", "name": "Properties of Bulk Matter", "marks": 0},
                {"unit": "VIII", "name": "Thermodynamics", "marks": 0},
                {"unit": "IX", "name": "Kinetic Theory", "marks": 10},
                {"unit": "X", "name": "Oscillations and Waves", "marks": 0}
            ],
            "chapters": [
                {"number": 1, "name": "Units and Measurements", "unit": "I", "marks": 5, "type": "lesson", "topics": ["SI units", "Fundamental and derived units", "Measurement of length", "Measurement of mass", "Measurement of time", "Accuracy and precision", "Errors in measurement", "Significant figures", "Dimensions", "Dimensional formulae", "Dimensional analysis"]},
                {"number": 2, "name": "Motion in a Straight Line", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Position", "Path length", "Displacement", "Average velocity", "Instantaneous velocity", "Acceleration", "Kinematic equations", "Relative velocity"]},
                {"number": 3, "name": "Motion in a Plane", "unit": "II", "marks": 6, "type": "lesson", "topics": ["Scalars and vectors", "Vector addition", "Resolution of vectors", "Motion in a plane", "Projectile motion", "Uniform circular motion"]},
                {"number": 4, "name": "Laws of Motion", "unit": "III", "marks": 6, "type": "lesson", "topics": ["Newton's first law", "Momentum", "Newton's second law", "Newton's third law", "Conservation of momentum", "Equilibrium", "Friction", "Circular motion"]},
                {"number": 5, "name": "Work, Energy and Power", "unit": "IV", "marks": 6, "type": "lesson", "topics": ["Work done by constant force", "Work done by variable force", "Kinetic energy", "Work-energy theorem", "Potential energy", "Conservation of energy", "Power", "Collisions"]},
                {"number": 6, "name": "System of Particles and Rotational Motion", "unit": "V", "marks": 6, "type": "lesson", "topics": ["Centre of mass", "Motion of centre of mass", "Linear momentum", "Angular velocity", "Torque", "Angular momentum", "Equilibrium of rigid body", "Moment of inertia", "Rolling motion"]},
                {"number": 7, "name": "Gravitation", "unit": "VI", "marks": 5, "type": "lesson", "topics": ["Kepler's laws", "Universal law of gravitation", "Gravitational constant", "Acceleration due to gravity", "Gravitational potential energy", "Escape velocity", "Orbital velocity", "Satellites"]},
                {"number": 8, "name": "Mechanical Properties of Solids", "unit": "VII", "marks": 5, "type": "lesson", "topics": ["Elastic behaviour", "Stress and strain", "Hooke's law", "Stress-strain curve", "Elastic moduli", "Poisson's ratio", "Applications"]},
                {"number": 9, "name": "Mechanical Properties of Fluids", "unit": "VII", "marks": 5, "type": "lesson", "topics": ["Pressure", "Pascal's law", "Atmospheric pressure", "Hydraulic machines", "Streamline flow", "Bernoulli's principle", "Viscosity", "Surface tension"]},
                {"number": 10, "name": "Thermal Properties of Matter", "unit": "VII", "marks": 5, "type": "lesson", "topics": ["Temperature", "Thermal expansion", "Specific heat capacity", "Calorimetry", "Change of state", "Heat transfer", "Newton's law of cooling"]},
                {"number": 11, "name": "Thermodynamics", "unit": "VIII", "marks": 5, "type": "lesson", "topics": ["Thermal equilibrium", "Zeroth law", "Heat and work", "First law of thermodynamics", "Specific heat capacity", "Thermodynamic processes", "Heat engines", "Refrigerators", "Second law of thermodynamics"]},
                {"number": 12, "name": "Kinetic Theory", "unit": "IX", "marks": 5, "type": "lesson", "topics": ["Molecular theory", "Behaviour of gases", "Kinetic theory of ideal gas", "Law of equipartition", "Specific heat capacity", "Mean free path"]},
                {"number": 13, "name": "Oscillations", "unit": "X", "marks": 5, "type": "lesson", "topics": ["Periodic motion", "Simple harmonic motion", "SHM and uniform circular motion", "Velocity and acceleration in SHM", "Force law", "Energy in SHM", "Simple pendulum", "Damped oscillations", "Forced oscillations"]},
                {"number": 14, "name": "Waves", "unit": "X", "marks": 5, "type": "lesson", "topics": ["Transverse and longitudinal waves", "Displacement relation", "Speed of travelling wave", "Principle of superposition", "Standing waves", "Beats", "Doppler effect"]}
            ]
        },
        "Chemistry": {
            "book": "Chemistry Part I & II (NCERT 2024-25)",
            "units": [
                {"unit": "1", "name": "Some Basic Concepts of Chemistry", "marks": 7},
                {"unit": "2", "name": "Structure of Atom", "marks": 9},
                {"unit": "3", "name": "Classification of Elements", "marks": 6},
                {"unit": "4", "name": "Chemical Bonding", "marks": 7},
                {"unit": "5", "name": "Chemical Thermodynamics", "marks": 9},
                {"unit": "6", "name": "Equilibrium", "marks": 7},
                {"unit": "7", "name": "Redox Reactions", "marks": 4},
                {"unit": "8", "name": "Organic Chemistry Basics", "marks": 11},
                {"unit": "9", "name": "Hydrocarbons", "marks": 10}
            ],
            "chapters": [
                {"number": 1, "name": "Some Basic Concepts of Chemistry", "unit": "1", "marks": 7, "type": "lesson", "topics": ["Importance of chemistry", "Nature of matter", "Properties of matter", "SI units", "Uncertainty in measurement", "Laws of chemical combination", "Dalton's atomic theory", "Atomic and molecular masses", "Mole concept", "Percentage composition", "Stoichiometry"]},
                {"number": 2, "name": "Structure of Atom", "unit": "2", "marks": 9, "type": "lesson", "topics": ["Discovery of subatomic particles", "Atomic models", "Thomson model", "Rutherford model", "Bohr model", "Dual nature of matter", "Heisenberg uncertainty", "Quantum mechanical model", "Orbitals", "Electronic configuration"]},
                {"number": 3, "name": "Classification of Elements and Periodicity", "unit": "3", "marks": 6, "type": "lesson", "topics": ["Early classification", "Mendeleev periodic table", "Modern periodic law", "Periodic table structure", "Nomenclature", "Electronic configuration and periodic table", "Periodic trends"]},
                {"number": 4, "name": "Chemical Bonding and Molecular Structure", "unit": "4", "marks": 7, "type": "lesson", "topics": ["Chemical bond formation", "Ionic bonding", "Bond parameters", "Valence shell electron pair theory", "Hybridisation", "Molecular orbital theory", "Hydrogen bonding"]},
                {"number": 5, "name": "Chemical Thermodynamics", "unit": "5", "marks": 9, "type": "lesson", "topics": ["Thermodynamic terms", "Applications", "Measurement of energy changes", "Enthalpy change", "Enthalpies of reactions", "Hess's law", "Enthalpies of different reactions", "Spontaneity", "Gibbs energy"]},
                {"number": 6, "name": "Equilibrium", "unit": "6", "marks": 7, "type": "lesson", "topics": ["Equilibrium in physical processes", "Equilibrium in chemical processes", "Law of mass action", "Equilibrium constant", "Le Chatelier's principle", "Ionic equilibrium", "Acids and bases", "pH scale", "Buffer solutions", "Solubility equilibria"]},
                {"number": 7, "name": "Redox Reactions", "unit": "7", "marks": 4, "type": "lesson", "topics": ["Classical idea of redox", "Redox reactions in terms of electron transfer", "Oxidation number", "Redox reactions and electrode processes"]},
                {"number": 8, "name": "Organic Chemistry - Some Basic Principles", "unit": "8", "marks": 11, "type": "lesson", "topics": ["General introduction", "IUPAC nomenclature", "Electronic displacements", "Homolytic and heterolytic fission", "Free radicals", "Carbocations", "Carbanions", "Electrophiles and nucleophiles", "Types of organic reactions", "Purification methods", "Qualitative analysis", "Quantitative analysis"]},
                {"number": 9, "name": "Hydrocarbons", "unit": "9", "marks": 10, "type": "lesson", "topics": ["Classification", "Alkanes", "Alkenes", "Alkynes", "Aromatic hydrocarbons", "Mechanism of electrophilic substitution", "Carcinogenicity and toxicity"]}
            ]
        },
        "Mathematics": {
            "book": "Mathematics (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "Sets", "marks": 5, "type": "lesson", "topics": ["Sets and their representations", "Empty set", "Finite and infinite sets", "Equal sets", "Subsets", "Power set", "Universal set", "Venn diagrams", "Operations on sets", "Complement of set"]},
                {"number": 2, "name": "Relations and Functions", "marks": 5, "type": "lesson", "topics": ["Ordered pairs", "Cartesian product", "Relations", "Functions", "Domain and range", "Real valued functions", "Algebra of functions"]},
                {"number": 3, "name": "Trigonometric Functions", "marks": 6, "type": "lesson", "topics": ["Angles", "Trigonometric functions", "Trigonometric ratios", "Trigonometric identities", "Trigonometric equations"]},
                {"number": 4, "name": "Complex Numbers and Quadratic Equations", "marks": 4, "type": "lesson", "topics": ["Complex numbers", "Algebra of complex numbers", "Modulus and conjugate", "Argand plane", "Quadratic equations"]},
                {"number": 5, "name": "Linear Inequalities", "marks": 3, "type": "lesson", "topics": ["Linear inequalities", "Algebraic solutions", "Graphical representation", "Solution of system of inequalities"]},
                {"number": 6, "name": "Permutations and Combinations", "marks": 4, "type": "lesson", "topics": ["Fundamental principle of counting", "Permutations", "Combinations"]},
                {"number": 7, "name": "Binomial Theorem", "marks": 3, "type": "lesson", "topics": ["Binomial theorem for positive integers", "General and middle terms"]},
                {"number": 8, "name": "Sequences and Series", "marks": 5, "type": "lesson", "topics": ["Sequences", "Series", "Arithmetic progression", "Geometric progression", "Sum to n terms", "Arithmetic mean", "Geometric mean"]},
                {"number": 9, "name": "Straight Lines", "marks": 5, "type": "lesson", "topics": ["Slope of line", "Various forms of equation of line", "General equation", "Distance of point from line"]},
                {"number": 10, "name": "Conic Sections", "marks": 5, "type": "lesson", "topics": ["Sections of cone", "Circle", "Parabola", "Ellipse", "Hyperbola"]},
                {"number": 11, "name": "Introduction to Three Dimensional Geometry", "marks": 4, "type": "lesson", "topics": ["Coordinate axes", "Coordinate planes", "Coordinates of point", "Distance between two points", "Section formula"]},
                {"number": 12, "name": "Limits and Derivatives", "marks": 6, "type": "lesson", "topics": ["Intuitive idea of derivatives", "Limits", "Algebra of limits", "Limits of polynomials", "Limits of rational functions", "Derivatives", "Algebra of derivatives", "Derivative of polynomials"]},
                {"number": 13, "name": "Statistics", "marks": 4, "type": "lesson", "topics": ["Measures of dispersion", "Range", "Mean deviation", "Variance", "Standard deviation", "Analysis of frequency distributions"]},
                {"number": 14, "name": "Probability", "marks": 4, "type": "lesson", "topics": ["Random experiments", "Events", "Types of events", "Algebra of events", "Axiomatic approach to probability"]}
            ]
        },
        "Biology": {
            "book": "Biology (NCERT 2024-25 Rationalized)",
            "units": [
                {"unit": "I", "name": "Diversity of Living Organisms", "marks": 15},
                {"unit": "II", "name": "Structural Organization in Plants and Animals", "marks": 10},
                {"unit": "III", "name": "Cell: Structure and Function", "marks": 15},
                {"unit": "IV", "name": "Plant Physiology", "marks": 12},
                {"unit": "V", "name": "Human Physiology", "marks": 18}
            ],
            "chapters": [
                {"number": 1, "name": "The Living World", "unit": "I", "marks": 4, "type": "lesson", "topics": ["Biodiversity", "Need for classification", "Taxonomy", "Taxonomic categories", "Taxonomical aids", "Herbarium", "Botanical gardens", "Museums", "Zoological parks", "Keys"]},
                {"number": 2, "name": "Biological Classification", "unit": "I", "marks": 4, "type": "lesson", "topics": ["Five kingdom classification", "Monera", "Protista", "Fungi", "Kingdom Plantae", "Kingdom Animalia", "Viruses", "Viroids", "Lichens"]},
                {"number": 3, "name": "Plant Kingdom", "unit": "I", "marks": 4, "type": "lesson", "topics": ["Algae", "Bryophytes", "Pteridophytes", "Gymnosperms", "Angiosperms", "Plant life cycles", "Alternation of generations"]},
                {"number": 4, "name": "Animal Kingdom", "unit": "I", "marks": 3, "type": "lesson", "topics": ["Basis of classification", "Levels of organisation", "Symmetry", "Diploblastic and triploblastic", "Coelom", "Segmentation", "Phylum characteristics", "Classification of animals"]},
                {"number": 5, "name": "Morphology of Flowering Plants", "unit": "II", "marks": 4, "type": "lesson", "topics": ["Root", "Stem", "Leaf", "Inflorescence", "Flower", "Fruit", "Seed", "Fabaceae", "Solanaceae", "Liliaceae"]},
                {"number": 6, "name": "Anatomy of Flowering Plants", "unit": "II", "marks": 3, "type": "lesson", "topics": ["Tissues", "Meristematic tissues", "Permanent tissues", "Tissue system", "Anatomy of dicot and monocot root", "Anatomy of dicot and monocot stem", "Anatomy of leaf", "Secondary growth"]},
                {"number": 7, "name": "Structural Organisation in Animals", "unit": "II", "marks": 3, "type": "lesson", "topics": ["Animal tissues", "Epithelial tissue", "Connective tissue", "Muscle tissue", "Neural tissue", "Morphology of Earthworm", "Morphology of Cockroach", "Morphology of Frog"]},
                {"number": 8, "name": "Cell - The Unit of Life", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Cell theory", "Cell overview", "Prokaryotic cells", "Eukaryotic cells", "Cell membrane", "Cell wall", "Endomembrane system", "Mitochondria", "Plastids", "Ribosomes", "Cytoskeleton", "Cilia and flagella", "Centrosome", "Nucleus"]},
                {"number": 9, "name": "Biomolecules", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Carbohydrates", "Lipids", "Proteins", "Nucleic acids", "Enzymes", "Metabolic basis of living", "Living state"]},
                {"number": 10, "name": "Cell Cycle and Cell Division", "unit": "III", "marks": 5, "type": "lesson", "topics": ["Cell cycle", "M Phase", "Mitosis", "Meiosis", "Significance of mitosis and meiosis"]},
                {"number": 11, "name": "Photosynthesis in Higher Plants", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Photosynthesis", "Early experiments", "Site of photosynthesis", "Pigments involved", "Light reaction", "Electron transport", "Chemiosmosis", "Biosynthetic phase", "C3 pathway", "C4 pathway", "Photorespiration", "Factors affecting photosynthesis"]},
                {"number": 12, "name": "Respiration in Plants", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Cellular respiration", "Glycolysis", "Fermentation", "Aerobic respiration", "TCA cycle", "Electron transport system", "Oxidative phosphorylation", "Respiratory quotient"]},
                {"number": 13, "name": "Plant Growth and Development", "unit": "IV", "marks": 4, "type": "lesson", "topics": ["Growth", "Differentiation", "Development", "Plant growth regulators", "Auxins", "Gibberellins", "Cytokinins", "Ethylene", "Abscisic acid", "Photoperiodism", "Vernalisation"]},
                {"number": 14, "name": "Breathing and Exchange of Gases", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Respiratory organs", "Human respiratory system", "Mechanism of breathing", "Exchange of gases", "Transport of gases", "Regulation of respiration", "Respiratory disorders"]},
                {"number": 15, "name": "Body Fluids and Circulation", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Blood", "Lymph", "Circulatory pathways", "Human circulatory system", "Cardiac cycle", "ECG", "Double circulation", "Regulation of cardiac activity", "Disorders of circulatory system"]},
                {"number": 16, "name": "Excretory Products and their Elimination", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Human excretory system", "Urine formation", "Function of tubules", "Mechanism of concentration", "Regulation of kidney function", "Micturition", "Role of other organs", "Disorders of excretory system"]},
                {"number": 17, "name": "Locomotion and Movement", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Types of movement", "Muscle", "Skeletal system", "Axial skeleton", "Appendicular skeleton", "Joints", "Disorders of muscular and skeletal system"]},
                {"number": 18, "name": "Neural Control and Coordination", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Neural system", "Human neural system", "Neuron structure", "Nerve impulse", "Synapse", "Central neural system", "Reflex action", "Sensory reception", "Eye", "Ear"]},
                {"number": 19, "name": "Chemical Coordination and Integration", "unit": "V", "marks": 3, "type": "lesson", "topics": ["Endocrine glands and hormones", "Human endocrine system", "Hypothalamus", "Pituitary gland", "Pineal gland", "Thyroid gland", "Parathyroid gland", "Thymus", "Adrenal gland", "Pancreas", "Gonads", "Mechanism of hormone action"]}
            ]
        },
        "English": {
            "book": "Hornbill & Snapshots (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "The Portrait of a Lady", "marks": 5, "type": "prose", "topics": ["Grandmother character", "Relationship changes", "Sparrows incident", "Village to city life", "Death and mourning"]},
                {"number": 2, "name": "We're Not Afraid to Die... if We Can All Be Together", "marks": 5, "type": "prose", "topics": ["Round the world voyage", "Storm at sea", "Family courage", "Survival story", "Leadership"]},
                {"number": 3, "name": "Discovering Tut: The Saga Continues", "marks": 5, "type": "prose", "topics": ["King Tutankhamun", "CT scan of mummy", "Archaeological discoveries", "Egyptian history", "Modern technology"]},
                {"number": 4, "name": "The Ailing Planet: The Green Movement's Role", "marks": 5, "type": "prose", "topics": ["Environmental degradation", "Sustainable development", "Green movement", "Holistic view", "Conservation"]},
                {"number": 5, "name": "The Adventure", "marks": 4, "type": "prose", "topics": ["Parallel universe", "Historical fiction", "Maratha history", "Scientific imagination", "Catastrophe theory"]},
                {"number": 6, "name": "Silk Road", "marks": 4, "type": "prose", "topics": ["Tibet journey", "Mount Kailash pilgrimage", "Tibetan culture", "Travel writing", "Landscape description"]},
                {"number": 7, "name": "A Photograph", "marks": 3, "type": "poem", "topics": ["Memory and loss", "Mother's photograph", "Time and change", "Nostalgia", "Silence"]},
                {"number": 8, "name": "The Laburnum Top", "marks": 3, "type": "poem", "topics": ["Nature poetry", "Goldfinch bird", "Tree imagery", "Life and movement", "Silence and sound"]},
                {"number": 9, "name": "The Voice of the Rain", "marks": 3, "type": "poem", "topics": ["Water cycle", "Rain's journey", "Nature personification", "Poetry translation", "Walt Whitman"]},
                {"number": 10, "name": "Childhood", "marks": 3, "type": "poem", "topics": ["Growing up", "Loss of innocence", "Individual identity", "Questioning beliefs", "Self-discovery"]},
                {"number": 11, "name": "Father to Son", "marks": 3, "type": "poem", "topics": ["Generation gap", "Parent-child relationship", "Communication failure", "Love and distance", "Family bonds"]}
            ]
        },
        "Hindi": {
            "book": "आरोह & वितान (NCERT 2024-25)",
            "chapters": [
                {"number": 1, "name": "नमक का दारोगा", "marks": 4, "type": "prose", "topics": ["प्रेमचंद कहानी", "ईमानदारी", "सरकारी नौकरी", "नैतिकता", "समाज"]},
                {"number": 2, "name": "मियाँ नसीरुद्दीन", "marks": 4, "type": "prose", "topics": ["व्यक्तित्व चित्रण", "रोटी बनाना", "परंपरा", "कला", "दिल्ली"]},
                {"number": 3, "name": "अपू के साथ ढाई साल", "marks": 4, "type": "prose", "topics": ["सत्यजित रे", "फिल्म निर्माण", "अपू त्रयी", "सिनेमा", "कला"]},
                {"number": 4, "name": "विदाई-सम्भाषण", "marks": 3, "type": "prose", "topics": ["बालमुकुंद गुप्त", "लॉर्ड कर्जन", "व्यंग्य", "राजनीति", "औपनिवेशिक शासन"]},
                {"number": 5, "name": "गलता लोहा", "marks": 4, "type": "prose", "topics": ["शेखर जोशी", "जातिवाद", "समाज सुधार", "लोहार", "मानवता"]},
                {"number": 6, "name": "स्पीति में बारिश", "marks": 3, "type": "prose", "topics": ["यात्रा वृत्तांत", "स्पीति घाटी", "प्रकृति", "पहाड़", "बारिश"]},
                {"number": 7, "name": "रजनी", "marks": 3, "type": "prose", "topics": ["मन्नू भंडारी", "शिक्षा व्यवस्था", "नारी शक्ति", "सामाजिक चेतना", "संघर्ष"]},
                {"number": 8, "name": "जामुन का पेड़", "marks": 3, "type": "prose", "topics": ["कृष्ण चंदर", "व्यंग्य", "नौकरशाही", "हास्य", "सरकारी तंत्र"]},
                {"number": 9, "name": "भारत माता", "marks": 3, "type": "prose", "topics": ["जवाहरलाल नेहरू", "राष्ट्रीयता", "भारत की अवधारणा", "स्वतंत्रता", "देशभक्ति"]},
                {"number": 10, "name": "आत्मा का ताप", "marks": 3, "type": "prose", "topics": ["सैयद हैदर रज़ा", "चित्रकला", "कला साधना", "जीवन संघर्ष", "रचनात्मकता"]},
                {"number": 11, "name": "वे आँखें", "marks": 3, "type": "poem", "topics": ["सुमित्रानंदन पंत", "किसान", "गरीबी", "शोषण", "करुणा"]},
                {"number": 12, "name": "घर की याद", "marks": 3, "type": "poem", "topics": ["भवानीप्रसाद मिश्र", "परिवार", "माँ", "घर", "विरह"]},
                {"number": 13, "name": "आओ, मिलकर बचाएँ", "marks": 3, "type": "poem", "topics": ["निर्मला पुतुल", "आदिवासी संस्कृति", "पर्यावरण", "संरक्षण", "प्रकृति"]},
                {"number": 14, "name": "कबीर", "marks": 4, "type": "poem", "topics": ["कबीर के पद", "साखी", "आध्यात्म", "समाज सुधार", "भक्ति"]},
                {"number": 15, "name": "मीरा", "marks": 3, "type": "poem", "topics": ["मीरा के पद", "कृष्ण भक्ति", "प्रेम", "समर्पण", "आध्यात्म"]},
                {"number": 16, "name": "पथिक", "marks": 3, "type": "poem", "topics": ["रामनरेश त्रिपाठी", "प्रकृति", "यात्रा", "सौंदर्य", "छायावाद"]},
                {"number": 17, "name": "वे देखते हैं", "marks": 3, "type": "poem", "topics": ["अज्ञेय", "आधुनिक कविता", "प्रतीक", "दर्शन", "अस्तित्ववाद"]},
                {"number": 18, "name": "सबसे खतरनाक", "marks": 3, "type": "poem", "topics": ["पाश", "क्रांतिकारी कविता", "सामाजिक चेतना", "खतरा", "निष्क्रियता"]},
                {"number": 19, "name": "गजल", "marks": 3, "type": "poem", "topics": ["दुष्यंत कुमार", "गजल", "व्यंग्य", "समाज", "विद्रोह"]},
                {"number": 20, "name": "हे भूख! मत मचल", "marks": 3, "type": "poem", "topics": ["अरुण कमल", "भूख", "गरीबी", "सामाजिक यथार्थ", "संवेदना"]}
            ]
        }
    }
}


class NCERTSyllabusService:
    """Service class for NCERT Syllabus operations"""
    
    @staticmethod
    def get_all_classes() -> List[str]:
        """Get list of all available classes"""
        return sorted(NCERT_SYLLABUS_DATA.keys(), key=lambda x: int(x))
    
    @staticmethod
    def get_subjects_for_class(class_num: str) -> List[str]:
        """Get subjects available for a class"""
        if class_num not in NCERT_SYLLABUS_DATA:
            return []
        return list(NCERT_SYLLABUS_DATA[class_num]["subjects"].keys())
    
    @staticmethod
    def get_syllabus(class_num: str, subject: str = None) -> Dict:
        """Get syllabus for a class and optionally a specific subject"""
        if class_num not in NCERT_SYLLABUS_DATA:
            return {"error": f"Class {class_num} not found"}
        
        class_data = NCERT_SYLLABUS_DATA[class_num]
        
        if subject:
            if subject not in class_data["subjects"]:
                return {"error": f"Subject {subject} not found for class {class_num}"}
            return {
                "class": class_num,
                "subject": subject,
                "data": class_data["subjects"][subject]
            }
        
        return {
            "class": class_num,
            "subjects": class_data["subjects"]
        }
    
    @staticmethod
    def get_chapter_details(class_num: str, subject: str, chapter_num: int) -> Optional[Dict]:
        """Get specific chapter details"""
        if class_num not in NCERT_SYLLABUS_DATA:
            return None
        
        subject_data = NCERT_SYLLABUS_DATA[class_num]["subjects"].get(subject)
        if not subject_data:
            return None
        
        for chapter in subject_data.get("chapters", []):
            if chapter["number"] == chapter_num:
                return {
                    "class": class_num,
                    "subject": subject,
                    "book": subject_data["book"],
                    "chapter": chapter
                }
        
        return None
    
    @staticmethod
    def search_topics(query: str, class_num: str = None) -> List[Dict]:
        """Search for topics across syllabus"""
        results = []
        query_lower = query.lower()
        
        classes_to_search = [class_num] if class_num else NCERT_SYLLABUS_DATA.keys()
        
        for cls in classes_to_search:
            if cls not in NCERT_SYLLABUS_DATA:
                continue
            
            for subject, subject_data in NCERT_SYLLABUS_DATA[cls]["subjects"].items():
                for chapter in subject_data.get("chapters", []):
                    # Search in chapter name
                    if query_lower in chapter["name"].lower():
                        results.append({
                            "class": cls,
                            "subject": subject,
                            "chapter": chapter["name"],
                            "chapter_number": chapter["number"],
                            "match_type": "chapter_name"
                        })
                    
                    # Search in topics
                    for topic in chapter.get("topics", []):
                        if query_lower in topic.lower():
                            results.append({
                                "class": cls,
                                "subject": subject,
                                "chapter": chapter["name"],
                                "chapter_number": chapter["number"],
                                "topic": topic,
                                "match_type": "topic"
                            })
        
        return results
    
    @staticmethod
    def get_syllabus_progress_template(class_num: str, subject: str) -> List[Dict]:
        """Get template for tracking syllabus progress"""
        syllabus = NCERTSyllabusService.get_syllabus(class_num, subject)
        if "error" in syllabus:
            return []
        
        chapters = syllabus["data"].get("chapters", [])
        return [
            {
                "chapter_number": ch["number"],
                "chapter_name": ch["name"],
                "topics": ch.get("topics", []),
                "status": "not_started",  # not_started, in_progress, completed
                "completion_percentage": 0,
                "topics_completed": []
            }
            for ch in chapters
        ]
