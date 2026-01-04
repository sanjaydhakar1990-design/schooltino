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
    
    # Class 12 (Senior Secondary)
    "12": {
        "subjects": {
            "Physics": {
                "book": "Physics Part I & II",
                "chapters": [
                    {"number": 1, "name": "Electric Charges and Fields", "type": "lesson", "topics": ["Coulomb's law", "Electric field", "Gauss's law", "Dipole"]},
                    {"number": 2, "name": "Electrostatic Potential and Capacitance", "type": "lesson", "topics": ["Potential", "Equipotential surfaces", "Capacitors", "Energy stored"]},
                    {"number": 3, "name": "Current Electricity", "type": "lesson", "topics": ["Ohm's law", "Drift velocity", "Kirchhoff's laws", "Wheatstone bridge"]},
                    {"number": 4, "name": "Moving Charges and Magnetism", "type": "lesson", "topics": ["Magnetic force", "Biot-Savart law", "Ampere's law", "Solenoid"]},
                    {"number": 5, "name": "Magnetism and Matter", "type": "lesson", "topics": ["Bar magnet", "Earth's magnetism", "Magnetic properties of materials"]},
                    {"number": 6, "name": "Electromagnetic Induction", "type": "lesson", "topics": ["Faraday's laws", "Lenz's law", "Eddy currents", "Self and mutual inductance"]},
                    {"number": 7, "name": "Alternating Current", "type": "lesson", "topics": ["AC generator", "Transformer", "LC oscillations", "Power in AC circuits"]},
                    {"number": 8, "name": "Electromagnetic Waves", "type": "lesson", "topics": ["Displacement current", "EM spectrum", "Properties"]},
                    {"number": 9, "name": "Ray Optics and Optical Instruments", "type": "lesson", "topics": ["Reflection", "Refraction", "TIR", "Lenses", "Microscope", "Telescope"]},
                    {"number": 10, "name": "Wave Optics", "type": "lesson", "topics": ["Huygens principle", "Interference", "Diffraction", "Polarization"]},
                    {"number": 11, "name": "Dual Nature of Radiation and Matter", "type": "lesson", "topics": ["Photoelectric effect", "de Broglie waves", "Davisson-Germer experiment"]},
                    {"number": 12, "name": "Atoms", "type": "lesson", "topics": ["Rutherford model", "Bohr model", "Hydrogen spectrum"]},
                    {"number": 13, "name": "Nuclei", "type": "lesson", "topics": ["Nuclear size", "Binding energy", "Radioactivity", "Nuclear reactions"]},
                    {"number": 14, "name": "Semiconductor Electronics", "type": "lesson", "topics": ["p-n junction", "Diode", "Transistor", "Logic gates"]}
                ]
            },
            "Chemistry": {
                "book": "Chemistry Part I & II",
                "chapters": [
                    {"number": 1, "name": "The Solid State", "type": "lesson", "topics": ["Crystal lattices", "Unit cells", "Defects", "Electrical properties"]},
                    {"number": 2, "name": "Solutions", "type": "lesson", "topics": ["Concentration", "Colligative properties", "Abnormal molar mass"]},
                    {"number": 3, "name": "Electrochemistry", "type": "lesson", "topics": ["Electrolytic cells", "Galvanic cells", "Nernst equation", "Batteries"]},
                    {"number": 4, "name": "Chemical Kinetics", "type": "lesson", "topics": ["Rate of reaction", "Order", "Arrhenius equation", "Collision theory"]},
                    {"number": 5, "name": "Surface Chemistry", "type": "lesson", "topics": ["Adsorption", "Catalysis", "Colloids", "Emulsions"]},
                    {"number": 6, "name": "General Principles and Processes of Isolation of Elements", "type": "lesson", "topics": ["Ores", "Concentration", "Reduction", "Refining"]},
                    {"number": 7, "name": "The p-Block Elements", "type": "lesson", "topics": ["Group 15-18 elements", "Properties", "Compounds"]},
                    {"number": 8, "name": "The d and f Block Elements", "type": "lesson", "topics": ["Transition elements", "Lanthanoids", "Actinoids"]},
                    {"number": 9, "name": "Coordination Compounds", "type": "lesson", "topics": ["Werner's theory", "Nomenclature", "Isomerism", "Bonding"]},
                    {"number": 10, "name": "Haloalkanes and Haloarenes", "type": "lesson", "topics": ["Nomenclature", "Reactions", "Environmental effects"]},
                    {"number": 11, "name": "Alcohols, Phenols and Ethers", "type": "lesson", "topics": ["Preparation", "Properties", "Reactions"]},
                    {"number": 12, "name": "Aldehydes, Ketones and Carboxylic Acids", "type": "lesson", "topics": ["Nomenclature", "Reactions", "Uses"]},
                    {"number": 13, "name": "Amines", "type": "lesson", "topics": ["Classification", "Preparation", "Properties", "Diazonium salts"]},
                    {"number": 14, "name": "Biomolecules", "type": "lesson", "topics": ["Carbohydrates", "Proteins", "Enzymes", "Vitamins", "Nucleic acids"]},
                    {"number": 15, "name": "Polymers", "type": "lesson", "topics": ["Classification", "Polymerization", "Natural and synthetic polymers"]},
                    {"number": 16, "name": "Chemistry in Everyday Life", "type": "lesson", "topics": ["Drugs", "Food additives", "Cleansing agents"]}
                ]
            },
            "Mathematics": {
                "book": "Mathematics Part I & II",
                "chapters": [
                    {"number": 1, "name": "Relations and Functions", "type": "lesson", "topics": ["Types of relations", "Types of functions", "Composition", "Inverse"]},
                    {"number": 2, "name": "Inverse Trigonometric Functions", "type": "lesson", "topics": ["Principal values", "Properties", "Graphs"]},
                    {"number": 3, "name": "Matrices", "type": "lesson", "topics": ["Types", "Operations", "Transpose", "Symmetric matrices"]},
                    {"number": 4, "name": "Determinants", "type": "lesson", "topics": ["Properties", "Cofactors", "Adjoint", "Inverse", "Applications"]},
                    {"number": 5, "name": "Continuity and Differentiability", "type": "lesson", "topics": ["Continuity", "Differentiability", "Chain rule", "Implicit differentiation"]},
                    {"number": 6, "name": "Application of Derivatives", "type": "lesson", "topics": ["Rate of change", "Tangents", "Maxima and minima", "Approximations"]},
                    {"number": 7, "name": "Integrals", "type": "lesson", "topics": ["Indefinite integrals", "Methods of integration", "Definite integrals"]},
                    {"number": 8, "name": "Application of Integrals", "type": "lesson", "topics": ["Area under curves", "Area between curves"]},
                    {"number": 9, "name": "Differential Equations", "type": "lesson", "topics": ["Order and degree", "Formation", "Solution methods"]},
                    {"number": 10, "name": "Vector Algebra", "type": "lesson", "topics": ["Types", "Operations", "Scalar and vector products"]},
                    {"number": 11, "name": "Three Dimensional Geometry", "type": "lesson", "topics": ["Direction cosines", "Equations of line and plane", "Angle between lines"]},
                    {"number": 12, "name": "Linear Programming", "type": "lesson", "topics": ["Mathematical formulation", "Graphical method", "Different types of problems"]},
                    {"number": 13, "name": "Probability", "type": "lesson", "topics": ["Conditional probability", "Bayes' theorem", "Random variables", "Binomial distribution"]}
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
            }
        }
    }
}

# Add more classes (2-5, 7-9, 11)
for class_num in ["2", "3", "4", "5"]:
    NCERT_SYLLABUS_DATA[class_num] = {
        "subjects": {
            "Hindi": {"book": f"रिमझिम - {class_num}", "chapters": []},
            "English": {"book": f"Marigold - {class_num}", "chapters": []},
            "Mathematics": {"book": f"Math-Magic - {class_num}", "chapters": []},
            "EVS": {"book": f"Looking Around - {class_num}", "chapters": []}
        }
    }

for class_num in ["7", "8", "9"]:
    NCERT_SYLLABUS_DATA[class_num] = {
        "subjects": {
            "Hindi": {"book": f"वसंत भाग-{int(class_num)-5}", "chapters": []},
            "English": {"book": "Honeycomb" if class_num == "7" else "Honeydew" if class_num == "8" else "Beehive", "chapters": []},
            "Mathematics": {"book": f"Mathematics - {class_num}", "chapters": []},
            "Science": {"book": f"Science - {class_num}", "chapters": []},
            "Social Science": {"book": f"Social Science - {class_num}", "chapters": []}
        }
    }

NCERT_SYLLABUS_DATA["11"] = {
    "subjects": {
        "Physics": {"book": "Physics Part I & II", "chapters": []},
        "Chemistry": {"book": "Chemistry Part I & II", "chapters": []},
        "Mathematics": {"book": "Mathematics", "chapters": []},
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
        "English": {"book": "Hornbill & Snapshots", "chapters": []},
        "Hindi": {"book": "आरोह & वितान", "chapters": []}
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
