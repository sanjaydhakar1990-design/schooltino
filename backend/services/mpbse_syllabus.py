# ./services/mpbse_syllabus.py
"""
MP Board (MPBSE) Syllabus Service
Based on official MPBSE curriculum from https://mpbse.nic.in/syllabus.htm
Madhya Pradesh Board of Secondary Education
"""

from typing import List, Dict, Optional

# MP Board Syllabus Data Structure
# Source: MPBSE official syllabus documents

MPBSE_SYLLABUS_DATA = {
    # Class 9 (Ninth)
    "9": {
        "board": "MPBSE",
        "subjects": {
            "Hindi": {
                "book": "हिंदी विशिष्ट/सामान्य",
                "chapters": [
                    {"number": 1, "name": "दो बैलों की कथा", "type": "lesson", "topics": ["प्रेमचंद", "कथा साहित्य", "पशु प्रेम"]},
                    {"number": 2, "name": "ल्हासा की ओर", "type": "lesson", "topics": ["यात्रा वृत्तांत", "तिब्बत"]},
                    {"number": 3, "name": "उपभोक्तावाद की संस्कृति", "type": "lesson", "topics": ["उपभोक्तावाद", "आधुनिक समाज"]},
                    {"number": 4, "name": "साँवले सपनों की याद", "type": "lesson", "topics": ["जीवनी", "पक्षी प्रेम"]},
                    {"number": 5, "name": "नाना साहब की पुत्री", "type": "lesson", "topics": ["स्वतंत्रता संग्राम", "देशभक्ति"]},
                    {"number": 6, "name": "प्रेमचंद के फटे जूते", "type": "lesson", "topics": ["व्यंग्य", "साहित्यकार"]},
                    {"number": 7, "name": "मेरे बचपन के दिन", "type": "autobiography", "topics": ["महादेवी वर्मा", "आत्मकथा"]},
                    {"number": 8, "name": "एक कुत्ता और एक मैना", "type": "lesson", "topics": ["पशु प्रेम", "हजारी प्रसाद द्विवेदी"]}
                ]
            },
            "English": {
                "book": "Beehive & Moments",
                "chapters": [
                    {"number": 1, "name": "The Fun They Had", "type": "story", "topics": ["Future schools", "Technology", "Isaac Asimov"]},
                    {"number": 2, "name": "The Sound of Music", "type": "biography", "topics": ["Evelyn Glennie", "Bismillah Khan", "Music"]},
                    {"number": 3, "name": "The Little Girl", "type": "story", "topics": ["Father-daughter relationship", "Katherine Mansfield"]},
                    {"number": 4, "name": "A Truly Beautiful Mind", "type": "biography", "topics": ["Albert Einstein", "Science", "Genius"]},
                    {"number": 5, "name": "The Snake and the Mirror", "type": "story", "topics": ["Humor", "Snake encounter"]},
                    {"number": 6, "name": "My Childhood", "type": "autobiography", "topics": ["APJ Abdul Kalam", "Childhood memories"]},
                    {"number": 7, "name": "Packing", "type": "story", "topics": ["Humor", "Jerome K. Jerome"]},
                    {"number": 8, "name": "Reach for the Top", "type": "biography", "topics": ["Santosh Yadav", "Maria Sharapova", "Achievement"]},
                    {"number": 9, "name": "The Bond of Love", "type": "story", "topics": ["Bear", "Animal love"]},
                    {"number": 10, "name": "Kathmandu", "type": "travelogue", "topics": ["Nepal", "Travel writing"]},
                    {"number": 11, "name": "If I Were You", "type": "drama", "topics": ["Play", "Suspense"]}
                ]
            },
            "Mathematics": {
                "book": "गणित - 9",
                "chapters": [
                    {"number": 1, "name": "Number Systems", "type": "lesson", "topics": ["Real numbers", "Irrational numbers", "Decimal expansion"]},
                    {"number": 2, "name": "Polynomials", "type": "lesson", "topics": ["Polynomial types", "Zeroes", "Factorization"]},
                    {"number": 3, "name": "Coordinate Geometry", "type": "lesson", "topics": ["Cartesian plane", "Plotting points"]},
                    {"number": 4, "name": "Linear Equations in Two Variables", "type": "lesson", "topics": ["Solutions", "Graph of linear equation"]},
                    {"number": 5, "name": "Introduction to Euclid's Geometry", "type": "lesson", "topics": ["Axioms", "Postulates", "Euclid's definitions"]},
                    {"number": 6, "name": "Lines and Angles", "type": "lesson", "topics": ["Types of angles", "Parallel lines", "Transversal"]},
                    {"number": 7, "name": "Triangles", "type": "lesson", "topics": ["Congruence", "Criteria for congruence", "Properties"]},
                    {"number": 8, "name": "Quadrilaterals", "type": "lesson", "topics": ["Properties", "Parallelogram", "Midpoint theorem"]},
                    {"number": 9, "name": "Areas of Parallelograms and Triangles", "type": "lesson", "topics": ["Area formulas", "Theorems"]},
                    {"number": 10, "name": "Circles", "type": "lesson", "topics": ["Chord properties", "Arc", "Cyclic quadrilateral"]},
                    {"number": 11, "name": "Constructions", "type": "lesson", "topics": ["Bisector construction", "Triangle construction"]},
                    {"number": 12, "name": "Heron's Formula", "type": "lesson", "topics": ["Area of triangle", "Applications"]},
                    {"number": 13, "name": "Surface Areas and Volumes", "type": "lesson", "topics": ["Cube", "Cuboid", "Cylinder", "Cone", "Sphere"]},
                    {"number": 14, "name": "Statistics", "type": "lesson", "topics": ["Mean", "Median", "Mode", "Frequency distribution"]},
                    {"number": 15, "name": "Probability", "type": "lesson", "topics": ["Experimental probability", "Events"]}
                ]
            },
            "Science": {
                "book": "विज्ञान - 9",
                "chapters": [
                    {"number": 1, "name": "Matter in Our Surroundings", "type": "lesson", "topics": ["States of matter", "Particles", "Evaporation"]},
                    {"number": 2, "name": "Is Matter Around Us Pure", "type": "lesson", "topics": ["Mixtures", "Solutions", "Separation techniques"]},
                    {"number": 3, "name": "Atoms and Molecules", "type": "lesson", "topics": ["Dalton's theory", "Mole concept", "Molecular mass"]},
                    {"number": 4, "name": "Structure of the Atom", "type": "lesson", "topics": ["Electron", "Proton", "Neutron", "Atomic models"]},
                    {"number": 5, "name": "The Fundamental Unit of Life", "type": "lesson", "topics": ["Cell structure", "Cell organelles"]},
                    {"number": 6, "name": "Tissues", "type": "lesson", "topics": ["Plant tissues", "Animal tissues"]},
                    {"number": 7, "name": "Diversity in Living Organisms", "type": "lesson", "topics": ["Classification", "Hierarchy", "Nomenclature"]},
                    {"number": 8, "name": "Motion", "type": "lesson", "topics": ["Distance", "Displacement", "Velocity", "Acceleration", "Equations of motion"]},
                    {"number": 9, "name": "Force and Laws of Motion", "type": "lesson", "topics": ["Newton's laws", "Inertia", "Momentum"]},
                    {"number": 10, "name": "Gravitation", "type": "lesson", "topics": ["Universal law of gravitation", "Free fall", "Mass and weight"]},
                    {"number": 11, "name": "Work and Energy", "type": "lesson", "topics": ["Work", "Energy", "Power", "Conservation"]},
                    {"number": 12, "name": "Sound", "type": "lesson", "topics": ["Wave motion", "Characteristics of sound", "Echo", "Ultrasound"]},
                    {"number": 13, "name": "Why Do We Fall Ill", "type": "lesson", "topics": ["Health", "Disease", "Immunity"]},
                    {"number": 14, "name": "Natural Resources", "type": "lesson", "topics": ["Air", "Water", "Soil", "Biogeochemical cycles"]},
                    {"number": 15, "name": "Improvement in Food Resources", "type": "lesson", "topics": ["Crop production", "Animal husbandry"]}
                ]
            },
            "Social Science": {
                "book": "सामाजिक विज्ञान - 9",
                "chapters": [
                    {"number": 1, "name": "The French Revolution", "type": "history", "topics": ["Causes", "Events", "Impact"]},
                    {"number": 2, "name": "Socialism in Europe and the Russian Revolution", "type": "history", "topics": ["Socialism", "Russian Revolution"]},
                    {"number": 3, "name": "Nazism and the Rise of Hitler", "type": "history", "topics": ["World War II", "Nazi Germany", "Holocaust"]},
                    {"number": 4, "name": "Forest Society and Colonialism", "type": "history", "topics": ["Colonial rule", "Forest management"]},
                    {"number": 5, "name": "Pastoralists in the Modern World", "type": "history", "topics": ["Nomadic communities", "Colonial impact"]},
                    {"number": 6, "name": "India - Size and Location", "type": "geography", "topics": ["Location", "Neighbors", "Size"]},
                    {"number": 7, "name": "Physical Features of India", "type": "geography", "topics": ["Himalayas", "Plains", "Plateaus", "Islands"]},
                    {"number": 8, "name": "Drainage", "type": "geography", "topics": ["Rivers", "Lakes", "River pollution"]},
                    {"number": 9, "name": "Climate", "type": "geography", "topics": ["Monsoon", "Seasons", "Distribution of rainfall"]},
                    {"number": 10, "name": "Natural Vegetation and Wildlife", "type": "geography", "topics": ["Types of forests", "Wildlife", "Conservation"]},
                    {"number": 11, "name": "Population", "type": "geography", "topics": ["Distribution", "Density", "Growth"]},
                    {"number": 12, "name": "What is Democracy? Why Democracy?", "type": "civics", "topics": ["Democracy definition", "Arguments for democracy"]},
                    {"number": 13, "name": "Constitutional Design", "type": "civics", "topics": ["Indian Constitution", "Making of Constitution"]},
                    {"number": 14, "name": "Electoral Politics", "type": "civics", "topics": ["Elections", "Political parties"]},
                    {"number": 15, "name": "Working of Institutions", "type": "civics", "topics": ["Parliament", "Executive", "Judiciary"]},
                    {"number": 16, "name": "Democratic Rights", "type": "civics", "topics": ["Fundamental rights", "Human rights"]},
                    {"number": 17, "name": "The Story of Village Palampur", "type": "economics", "topics": ["Farming", "Production", "Employment"]},
                    {"number": 18, "name": "People as Resource", "type": "economics", "topics": ["Human capital", "Education", "Health"]},
                    {"number": 19, "name": "Poverty as a Challenge", "type": "economics", "topics": ["Poverty line", "Anti-poverty measures"]},
                    {"number": 20, "name": "Food Security in India", "type": "economics", "topics": ["PDS", "Buffer stock", "Food insecurity"]}
                ]
            }
        }
    },
    
    # Class 10 (Tenth)
    "10": {
        "board": "MPBSE",
        "subjects": {
            "Hindi": {
                "book": "हिंदी विशिष्ट/सामान्य",
                "chapters": [
                    {"number": 1, "name": "पद - सूरदास", "type": "poem", "topics": ["भक्ति काव्य", "कृष्ण भक्ति"]},
                    {"number": 2, "name": "राम-लक्ष्मण-परशुराम संवाद", "type": "lesson", "topics": ["तुलसीदास", "रामचरितमानस"]},
                    {"number": 3, "name": "सवैया और कवित्त - देव", "type": "poem", "topics": ["रीतिकाल", "श्रृंगार रस"]},
                    {"number": 4, "name": "आत्मकथ्य - जयशंकर प्रसाद", "type": "poem", "topics": ["छायावाद", "आत्मचिंतन"]},
                    {"number": 5, "name": "उत्साह, अट नहीं रही है - निराला", "type": "poem", "topics": ["प्रकृति", "छायावाद"]},
                    {"number": 6, "name": "यह दंतुरित मुसकान, फसल - नागार्जुन", "type": "poem", "topics": ["प्रगतिवाद", "ग्रामीण जीवन"]},
                    {"number": 7, "name": "छाया मत छूना - गिरिजाकुमार माथुर", "type": "poem", "topics": ["नई कविता"]},
                    {"number": 8, "name": "कन्यादान - ऋतुराज", "type": "poem", "topics": ["नारी", "विवाह"]},
                    {"number": 9, "name": "संगतकार - मंगलेश डबराल", "type": "poem", "topics": ["संगीत", "सहायक कलाकार"]},
                    {"number": 10, "name": "नेताजी का चश्मा", "type": "story", "topics": ["देशभक्ति", "स्वयंप्रकाश"]},
                    {"number": 11, "name": "बालगोबिन भगत", "type": "lesson", "topics": ["संत स्वभाव", "रामवृक्ष बेनीपुरी"]},
                    {"number": 12, "name": "लखनवी अंदाज़", "type": "story", "topics": ["व्यंग्य", "यशपाल"]},
                    {"number": 13, "name": "मानवीय करुणा की दिव्य चमक", "type": "lesson", "topics": ["मदर टेरेसा"]},
                    {"number": 14, "name": "एक कहानी यह भी", "type": "autobiography", "topics": ["मन्नू भंडारी"]},
                    {"number": 15, "name": "स्त्री शिक्षा के विरोधी कुतर्कों का खंडन", "type": "essay", "topics": ["नारी शिक्षा"]},
                    {"number": 16, "name": "नौबतखाने में इबादत", "type": "lesson", "topics": ["बिस्मिल्ला खां"]},
                    {"number": 17, "name": "संस्कृति", "type": "essay", "topics": ["संस्कृति की परिभाषा"]}
                ]
            },
            "English": {
                "book": "First Flight & Footprints without Feet",
                "chapters": [
                    {"number": 1, "name": "A Letter to God", "type": "story", "topics": ["Faith", "G.L. Fuentes"]},
                    {"number": 2, "name": "Nelson Mandela: Long Walk to Freedom", "type": "biography", "topics": ["Apartheid", "Freedom"]},
                    {"number": 3, "name": "Two Stories about Flying", "type": "story", "topics": ["Fear", "Courage"]},
                    {"number": 4, "name": "From the Diary of Anne Frank", "type": "diary", "topics": ["World War II", "Holocaust"]},
                    {"number": 5, "name": "The Hundred Dresses", "type": "story", "topics": ["Bullying", "Compassion"]},
                    {"number": 6, "name": "The Making of a Scientist", "type": "biography", "topics": ["Richard Ebright"]},
                    {"number": 7, "name": "Glimpses of India", "type": "lesson", "topics": ["Goa", "Coorg", "Assam"]},
                    {"number": 8, "name": "Mijbil the Otter", "type": "story", "topics": ["Pet", "Gavin Maxwell"]},
                    {"number": 9, "name": "Madam Rides the Bus", "type": "story", "topics": ["Journey", "Growing up"]},
                    {"number": 10, "name": "The Sermon at Benares", "type": "lesson", "topics": ["Buddha", "Life and death"]},
                    {"number": 11, "name": "The Proposal", "type": "drama", "topics": ["Anton Chekhov", "Comedy"]}
                ]
            },
            "Mathematics": {
                "book": "गणित - 10",
                "chapters": [
                    {"number": 1, "name": "Real Numbers", "type": "lesson", "topics": ["Euclid's Division Lemma", "HCF", "Fundamental Theorem of Arithmetic"]},
                    {"number": 2, "name": "Polynomials", "type": "lesson", "topics": ["Zeroes of polynomial", "Division algorithm"]},
                    {"number": 3, "name": "Pair of Linear Equations in Two Variables", "type": "lesson", "topics": ["Graphical method", "Algebraic methods"]},
                    {"number": 4, "name": "Quadratic Equations", "type": "lesson", "topics": ["Factorization", "Quadratic formula", "Nature of roots"]},
                    {"number": 5, "name": "Arithmetic Progressions", "type": "lesson", "topics": ["nth term", "Sum of n terms"]},
                    {"number": 6, "name": "Triangles", "type": "lesson", "topics": ["Similar triangles", "Pythagoras theorem"]},
                    {"number": 7, "name": "Coordinate Geometry", "type": "lesson", "topics": ["Distance formula", "Section formula"]},
                    {"number": 8, "name": "Introduction to Trigonometry", "type": "lesson", "topics": ["Trigonometric ratios", "Identities"]},
                    {"number": 9, "name": "Some Applications of Trigonometry", "type": "lesson", "topics": ["Heights and distances"]},
                    {"number": 10, "name": "Circles", "type": "lesson", "topics": ["Tangent to a circle", "Theorems"]},
                    {"number": 11, "name": "Constructions", "type": "lesson", "topics": ["Division of line segment", "Tangent construction"]},
                    {"number": 12, "name": "Areas Related to Circles", "type": "lesson", "topics": ["Area of sector", "Segment"]},
                    {"number": 13, "name": "Surface Areas and Volumes", "type": "lesson", "topics": ["Combination of solids", "Frustum"]},
                    {"number": 14, "name": "Statistics", "type": "lesson", "topics": ["Mean", "Median", "Mode", "Ogive"]},
                    {"number": 15, "name": "Probability", "type": "lesson", "topics": ["Classical probability"]}
                ]
            },
            "Science": {
                "book": "विज्ञान - 10",
                "chapters": [
                    {"number": 1, "name": "Chemical Reactions and Equations", "type": "lesson", "topics": ["Types of reactions", "Balancing equations"]},
                    {"number": 2, "name": "Acids, Bases and Salts", "type": "lesson", "topics": ["pH scale", "Neutralization"]},
                    {"number": 3, "name": "Metals and Non-metals", "type": "lesson", "topics": ["Properties", "Reactivity series"]},
                    {"number": 4, "name": "Carbon and its Compounds", "type": "lesson", "topics": ["Covalent bonding", "Hydrocarbons"]},
                    {"number": 5, "name": "Periodic Classification of Elements", "type": "lesson", "topics": ["Modern periodic table"]},
                    {"number": 6, "name": "Life Processes", "type": "lesson", "topics": ["Nutrition", "Respiration", "Transportation"]},
                    {"number": 7, "name": "Control and Coordination", "type": "lesson", "topics": ["Nervous system", "Hormones"]},
                    {"number": 8, "name": "How do Organisms Reproduce?", "type": "lesson", "topics": ["Reproduction types"]},
                    {"number": 9, "name": "Heredity and Evolution", "type": "lesson", "topics": ["Mendel's laws", "Evolution"]},
                    {"number": 10, "name": "Light - Reflection and Refraction", "type": "lesson", "topics": ["Mirrors", "Lenses"]},
                    {"number": 11, "name": "Human Eye and Colourful World", "type": "lesson", "topics": ["Eye defects", "Scattering"]},
                    {"number": 12, "name": "Electricity", "type": "lesson", "topics": ["Ohm's law", "Power"]},
                    {"number": 13, "name": "Magnetic Effects of Electric Current", "type": "lesson", "topics": ["Electromagnet", "Motor"]},
                    {"number": 14, "name": "Sources of Energy", "type": "lesson", "topics": ["Conventional", "Non-conventional"]},
                    {"number": 15, "name": "Our Environment", "type": "lesson", "topics": ["Ecosystem", "Ozone depletion"]},
                    {"number": 16, "name": "Management of Natural Resources", "type": "lesson", "topics": ["Conservation"]}
                ]
            },
            "Social Science": {
                "book": "सामाजिक विज्ञान - 10",
                "chapters": [
                    {"number": 1, "name": "The Rise of Nationalism in Europe", "type": "history", "topics": ["French Revolution impact", "Unification"]},
                    {"number": 2, "name": "Nationalism in India", "type": "history", "topics": ["Non-Cooperation", "Civil Disobedience"]},
                    {"number": 3, "name": "The Making of a Global World", "type": "history", "topics": ["Trade", "Great Depression"]},
                    {"number": 4, "name": "The Age of Industrialisation", "type": "history", "topics": ["Industrial Revolution"]},
                    {"number": 5, "name": "Print Culture and the Modern World", "type": "history", "topics": ["Printing press"]},
                    {"number": 6, "name": "Resources and Development", "type": "geography", "topics": ["Types of resources"]},
                    {"number": 7, "name": "Forest and Wildlife Resources", "type": "geography", "topics": ["Conservation"]},
                    {"number": 8, "name": "Water Resources", "type": "geography", "topics": ["Dams", "Rainwater harvesting"]},
                    {"number": 9, "name": "Agriculture", "type": "geography", "topics": ["Types of farming", "Crops"]},
                    {"number": 10, "name": "Minerals and Energy Resources", "type": "geography", "topics": ["Types of minerals"]},
                    {"number": 11, "name": "Manufacturing Industries", "type": "geography", "topics": ["Industrial pollution"]},
                    {"number": 12, "name": "Lifelines of National Economy", "type": "geography", "topics": ["Transport", "Communication"]},
                    {"number": 13, "name": "Power Sharing", "type": "civics", "topics": ["Belgium", "Sri Lanka"]},
                    {"number": 14, "name": "Federalism", "type": "civics", "topics": ["Federal system", "Panchayati Raj"]},
                    {"number": 15, "name": "Democracy and Diversity", "type": "civics", "topics": ["Social differences"]},
                    {"number": 16, "name": "Gender, Religion and Caste", "type": "civics", "topics": ["Gender inequality"]},
                    {"number": 17, "name": "Political Parties", "type": "civics", "topics": ["Party system"]},
                    {"number": 18, "name": "Outcomes of Democracy", "type": "civics", "topics": ["Accountable government"]},
                    {"number": 19, "name": "Development", "type": "economics", "topics": ["Income", "HDI"]},
                    {"number": 20, "name": "Sectors of the Indian Economy", "type": "economics", "topics": ["Primary", "Secondary", "Tertiary"]},
                    {"number": 21, "name": "Money and Credit", "type": "economics", "topics": ["Banking", "Credit"]},
                    {"number": 22, "name": "Globalisation and the Indian Economy", "type": "economics", "topics": ["MNCs", "WTO"]},
                    {"number": 23, "name": "Consumer Rights", "type": "economics", "topics": ["Consumer protection"]}
                ]
            }
        }
    },
    
    # Class 11 (Eleventh) - Science Group
    "11": {
        "board": "MPBSE",
        "subjects": {
            "Hindi": {"book": "हिंदी साहित्य", "chapters": []},
            "English": {"book": "English Literature", "chapters": []},
            "Physics": {
                "book": "भौतिकी भाग-1",
                "chapters": [
                    {"number": 1, "name": "Physical World", "type": "lesson", "topics": ["Scope of physics", "Nature of physical laws"]},
                    {"number": 2, "name": "Units and Measurements", "type": "lesson", "topics": ["SI units", "Errors", "Dimensions"]},
                    {"number": 3, "name": "Motion in a Straight Line", "type": "lesson", "topics": ["Kinematics", "Equations of motion"]},
                    {"number": 4, "name": "Motion in a Plane", "type": "lesson", "topics": ["Vectors", "Projectile motion"]},
                    {"number": 5, "name": "Laws of Motion", "type": "lesson", "topics": ["Newton's laws", "Friction"]},
                    {"number": 6, "name": "Work, Energy and Power", "type": "lesson", "topics": ["Work-energy theorem", "Conservation"]},
                    {"number": 7, "name": "System of Particles and Rotational Motion", "type": "lesson", "topics": ["Centre of mass", "Moment of inertia"]},
                    {"number": 8, "name": "Gravitation", "type": "lesson", "topics": ["Kepler's laws", "Gravitational potential"]}
                ]
            },
            "Chemistry": {
                "book": "रसायन विज्ञान भाग-1",
                "chapters": [
                    {"number": 1, "name": "Some Basic Concepts of Chemistry", "type": "lesson", "topics": ["Mole concept", "Stoichiometry"]},
                    {"number": 2, "name": "Structure of Atom", "type": "lesson", "topics": ["Atomic models", "Quantum numbers"]},
                    {"number": 3, "name": "Classification of Elements", "type": "lesson", "topics": ["Periodic table", "Periodic properties"]},
                    {"number": 4, "name": "Chemical Bonding", "type": "lesson", "topics": ["Ionic bond", "Covalent bond", "VSEPR"]},
                    {"number": 5, "name": "States of Matter", "type": "lesson", "topics": ["Gas laws", "Kinetic theory"]},
                    {"number": 6, "name": "Thermodynamics", "type": "lesson", "topics": ["First law", "Enthalpy", "Entropy"]},
                    {"number": 7, "name": "Equilibrium", "type": "lesson", "topics": ["Chemical equilibrium", "Ionic equilibrium"]}
                ]
            },
            "Mathematics": {
                "book": "गणित",
                "chapters": [
                    {"number": 1, "name": "Sets", "type": "lesson", "topics": ["Types of sets", "Operations"]},
                    {"number": 2, "name": "Relations and Functions", "type": "lesson", "topics": ["Types of relations", "Functions"]},
                    {"number": 3, "name": "Trigonometric Functions", "type": "lesson", "topics": ["Identities", "Graphs"]},
                    {"number": 4, "name": "Principle of Mathematical Induction", "type": "lesson", "topics": ["Proof by induction"]},
                    {"number": 5, "name": "Complex Numbers", "type": "lesson", "topics": ["Algebra of complex numbers"]},
                    {"number": 6, "name": "Linear Inequalities", "type": "lesson", "topics": ["Graphical solution"]},
                    {"number": 7, "name": "Permutations and Combinations", "type": "lesson", "topics": ["Factorial", "Arrangements"]},
                    {"number": 8, "name": "Binomial Theorem", "type": "lesson", "topics": ["Expansion", "General term"]}
                ]
            },
            "Biology": {
                "book": "जीव विज्ञान",
                "chapters": [
                    {"number": 1, "name": "The Living World", "type": "lesson", "topics": ["Diversity", "Taxonomy"]},
                    {"number": 2, "name": "Biological Classification", "type": "lesson", "topics": ["Five kingdom classification"]},
                    {"number": 3, "name": "Plant Kingdom", "type": "lesson", "topics": ["Algae", "Bryophytes", "Pteridophytes"]},
                    {"number": 4, "name": "Animal Kingdom", "type": "lesson", "topics": ["Classification of animals"]},
                    {"number": 5, "name": "Morphology of Flowering Plants", "type": "lesson", "topics": ["Root", "Stem", "Leaf"]},
                    {"number": 6, "name": "Anatomy of Flowering Plants", "type": "lesson", "topics": ["Tissues"]}
                ]
            }
        }
    },
    
    # Class 12 (Twelfth) - Science Group
    "12": {
        "board": "MPBSE",
        "subjects": {
            "Hindi": {"book": "हिंदी साहित्य", "chapters": []},
            "English": {"book": "English Literature", "chapters": []},
            "Physics": {
                "book": "भौतिकी भाग-2",
                "chapters": [
                    {"number": 1, "name": "Electric Charges and Fields", "type": "lesson", "topics": ["Coulomb's law", "Electric field"]},
                    {"number": 2, "name": "Electrostatic Potential", "type": "lesson", "topics": ["Potential", "Capacitance"]},
                    {"number": 3, "name": "Current Electricity", "type": "lesson", "topics": ["Ohm's law", "Kirchhoff's laws"]},
                    {"number": 4, "name": "Moving Charges and Magnetism", "type": "lesson", "topics": ["Biot-Savart law"]},
                    {"number": 5, "name": "Magnetism and Matter", "type": "lesson", "topics": ["Magnetic properties"]},
                    {"number": 6, "name": "Electromagnetic Induction", "type": "lesson", "topics": ["Faraday's laws"]},
                    {"number": 7, "name": "Alternating Current", "type": "lesson", "topics": ["AC circuits", "Transformer"]},
                    {"number": 8, "name": "Electromagnetic Waves", "type": "lesson", "topics": ["EM spectrum"]},
                    {"number": 9, "name": "Ray Optics", "type": "lesson", "topics": ["Reflection", "Refraction"]},
                    {"number": 10, "name": "Wave Optics", "type": "lesson", "topics": ["Interference", "Diffraction"]},
                    {"number": 11, "name": "Dual Nature of Radiation", "type": "lesson", "topics": ["Photoelectric effect"]},
                    {"number": 12, "name": "Atoms", "type": "lesson", "topics": ["Bohr model"]},
                    {"number": 13, "name": "Nuclei", "type": "lesson", "topics": ["Radioactivity", "Nuclear reactions"]},
                    {"number": 14, "name": "Semiconductor Electronics", "type": "lesson", "topics": ["Diode", "Transistor"]}
                ]
            },
            "Chemistry": {
                "book": "रसायन विज्ञान भाग-2",
                "chapters": [
                    {"number": 1, "name": "The Solid State", "type": "lesson", "topics": ["Crystal structures"]},
                    {"number": 2, "name": "Solutions", "type": "lesson", "topics": ["Colligative properties"]},
                    {"number": 3, "name": "Electrochemistry", "type": "lesson", "topics": ["Cells", "Nernst equation"]},
                    {"number": 4, "name": "Chemical Kinetics", "type": "lesson", "topics": ["Rate of reaction"]},
                    {"number": 5, "name": "Surface Chemistry", "type": "lesson", "topics": ["Adsorption", "Colloids"]},
                    {"number": 6, "name": "p-Block Elements", "type": "lesson", "topics": ["Group 15-18"]},
                    {"number": 7, "name": "d and f Block Elements", "type": "lesson", "topics": ["Transition elements"]},
                    {"number": 8, "name": "Coordination Compounds", "type": "lesson", "topics": ["Werner's theory"]},
                    {"number": 9, "name": "Haloalkanes and Haloarenes", "type": "lesson", "topics": ["Reactions"]},
                    {"number": 10, "name": "Alcohols, Phenols and Ethers", "type": "lesson", "topics": ["Properties"]},
                    {"number": 11, "name": "Aldehydes, Ketones", "type": "lesson", "topics": ["Reactions"]},
                    {"number": 12, "name": "Amines", "type": "lesson", "topics": ["Classification"]},
                    {"number": 13, "name": "Biomolecules", "type": "lesson", "topics": ["Carbohydrates", "Proteins"]},
                    {"number": 14, "name": "Polymers", "type": "lesson", "topics": ["Types of polymers"]},
                    {"number": 15, "name": "Chemistry in Everyday Life", "type": "lesson", "topics": ["Drugs", "Cleansing agents"]}
                ]
            },
            "Mathematics": {
                "book": "गणित",
                "chapters": [
                    {"number": 1, "name": "Relations and Functions", "type": "lesson", "topics": ["Types", "Composition"]},
                    {"number": 2, "name": "Inverse Trigonometric Functions", "type": "lesson", "topics": ["Principal values"]},
                    {"number": 3, "name": "Matrices", "type": "lesson", "topics": ["Types", "Operations"]},
                    {"number": 4, "name": "Determinants", "type": "lesson", "topics": ["Properties", "Applications"]},
                    {"number": 5, "name": "Continuity and Differentiability", "type": "lesson", "topics": ["Derivatives"]},
                    {"number": 6, "name": "Application of Derivatives", "type": "lesson", "topics": ["Maxima", "Minima"]},
                    {"number": 7, "name": "Integrals", "type": "lesson", "topics": ["Methods of integration"]},
                    {"number": 8, "name": "Application of Integrals", "type": "lesson", "topics": ["Area under curves"]},
                    {"number": 9, "name": "Differential Equations", "type": "lesson", "topics": ["Order", "Degree"]},
                    {"number": 10, "name": "Vector Algebra", "type": "lesson", "topics": ["Operations"]},
                    {"number": 11, "name": "Three Dimensional Geometry", "type": "lesson", "topics": ["Lines", "Planes"]},
                    {"number": 12, "name": "Linear Programming", "type": "lesson", "topics": ["Graphical method"]},
                    {"number": 13, "name": "Probability", "type": "lesson", "topics": ["Bayes' theorem"]}
                ]
            },
            "Biology": {
                "book": "जीव विज्ञान",
                "chapters": [
                    {"number": 1, "name": "Reproduction in Organisms", "type": "lesson", "topics": ["Asexual", "Sexual"]},
                    {"number": 2, "name": "Sexual Reproduction in Flowering Plants", "type": "lesson", "topics": ["Pollination"]},
                    {"number": 3, "name": "Human Reproduction", "type": "lesson", "topics": ["Reproductive system"]},
                    {"number": 4, "name": "Reproductive Health", "type": "lesson", "topics": ["Population control"]},
                    {"number": 5, "name": "Principles of Inheritance", "type": "lesson", "topics": ["Mendel's laws"]},
                    {"number": 6, "name": "Molecular Basis of Inheritance", "type": "lesson", "topics": ["DNA", "RNA"]},
                    {"number": 7, "name": "Evolution", "type": "lesson", "topics": ["Origin of life"]},
                    {"number": 8, "name": "Human Health and Disease", "type": "lesson", "topics": ["Immunity"]},
                    {"number": 9, "name": "Food Production", "type": "lesson", "topics": ["Animal husbandry"]},
                    {"number": 10, "name": "Microbes in Human Welfare", "type": "lesson", "topics": ["Industrial products"]},
                    {"number": 11, "name": "Biotechnology Principles", "type": "lesson", "topics": ["rDNA technology"]},
                    {"number": 12, "name": "Biotechnology Applications", "type": "lesson", "topics": ["GM crops"]},
                    {"number": 13, "name": "Organisms and Populations", "type": "lesson", "topics": ["Ecology"]},
                    {"number": 14, "name": "Ecosystem", "type": "lesson", "topics": ["Energy flow"]},
                    {"number": 15, "name": "Biodiversity and Conservation", "type": "lesson", "topics": ["Conservation"]},
                    {"number": 16, "name": "Environmental Issues", "type": "lesson", "topics": ["Pollution"]}
                ]
            }
        }
    }
}

# Add Class 1-8 placeholders
for class_num in ["1", "2", "3", "4", "5", "6", "7", "8"]:
    MPBSE_SYLLABUS_DATA[class_num] = {
        "board": "MPBSE",
        "subjects": {
            "Hindi": {"book": f"हिंदी - {class_num}", "chapters": []},
            "English": {"book": f"English - {class_num}", "chapters": []},
            "Mathematics": {"book": f"गणित - {class_num}", "chapters": []},
            "EVS" if int(class_num) <= 5 else "Science": {"book": f"विज्ञान - {class_num}" if int(class_num) > 5 else f"पर्यावरण - {class_num}", "chapters": []},
        }
    }
    if int(class_num) >= 6:
        MPBSE_SYLLABUS_DATA[class_num]["subjects"]["Social Science"] = {"book": f"सामाजिक विज्ञान - {class_num}", "chapters": []}


class MPBSESyllabusService:
    """Service class for MP Board Syllabus operations"""
    
    @staticmethod
    def get_all_classes():
        return sorted(MPBSE_SYLLABUS_DATA.keys(), key=lambda x: int(x))
    
    @staticmethod
    def get_subjects_for_class(class_num: str):
        if class_num not in MPBSE_SYLLABUS_DATA:
            return []
        return list(MPBSE_SYLLABUS_DATA[class_num]["subjects"].keys())
    
    @staticmethod
    def get_syllabus(class_num: str, subject: str = None):
        if class_num not in MPBSE_SYLLABUS_DATA:
            return {"error": f"Class {class_num} not found"}
        
        class_data = MPBSE_SYLLABUS_DATA[class_num]
        
        if subject:
            if subject not in class_data["subjects"]:
                return {"error": f"Subject {subject} not found for class {class_num}"}
            return {
                "class": class_num,
                "board": "MPBSE",
                "subject": subject,
                "data": class_data["subjects"][subject]
            }
        
        return {
            "class": class_num,
            "board": "MPBSE",
            "subjects": class_data["subjects"]
        }
    
    @staticmethod
    def search_topics(query: str, class_num: str = None):
        results = []
        query_lower = query.lower()
        
        classes_to_search = [class_num] if class_num else MPBSE_SYLLABUS_DATA.keys()
        
        for cls in classes_to_search:
            if cls not in MPBSE_SYLLABUS_DATA:
                continue
            
            for subject, subject_data in MPBSE_SYLLABUS_DATA[cls]["subjects"].items():
                for chapter in subject_data.get("chapters", []):
                    if query_lower in chapter["name"].lower():
                        results.append({
                            "class": cls,
                            "subject": subject,
                            "board": "MPBSE",
                            "chapter": chapter["name"],
                            "chapter_number": chapter["number"],
                            "match_type": "chapter_name"
                        })
                    
                    for topic in chapter.get("topics", []):
                        if query_lower in topic.lower():
                            results.append({
                                "class": cls,
                                "subject": subject,
                                "board": "MPBSE",
                                "chapter": chapter["name"],
                                "chapter_number": chapter["number"],
                                "topic": topic,
                                "match_type": "topic"
                            })
        
        return results
