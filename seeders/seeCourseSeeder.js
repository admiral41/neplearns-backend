/**
 * SEE Course Seeder (Nepal Context)
 *
 * Run: node seeders/seeCourseSeeder.js
 *
 * Creates:
 * - 2 Categories (SEE Science, SEE English)
 * - 1 PAID Science Course
 * - 1 FREE English Course
 * - Weeks and Lessons for each course
 */

require("dotenv").config();
const mongoose = require("mongoose");
const Category = require("../models/category");
const Course = require("../models/course.model");
const Week = require("../models/weeks");
const Lesson = require("../models/lessons");
const User = require("../models/user.model");
const Lecturer = require("../models/lecturer.model");

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/padhaihub";

// ============================================
// CATEGORIES
// ============================================
const scienceCategoryData = {
  categoryName: "SEE Science",
  categoryDesc:
    "Complete Science courses for Secondary Education Examination (SEE) students in Nepal. Covers Physics, Chemistry, Biology, and Astronomy as per the Nepal government curriculum.",
  categoryShortDesc: "Science courses for SEE preparation",
  color: "#10B981",
  icon: "flask",
  isActive: true,
  order: 1,
};

const englishCategoryData = {
  categoryName: "SEE English",
  categoryDesc:
    "English language courses for Secondary Education Examination (SEE) students in Nepal. Covers grammar, reading comprehension, writing skills, and literature.",
  categoryShortDesc: "English courses for SEE preparation",
  color: "#3B82F6",
  icon: "book-open",
  isActive: true,
  order: 2,
};

// ============================================
// PAID COURSE - Complete SEE Science
// ============================================
const scienceCourseData = {
  courseTitle: "Complete SEE Science Mastery Course",
  courseDesc: `This premium course is designed for students who want to score high marks in the SEE Science examination.

What's Included:
- Physics: All chapters with detailed explanations and numerical problems
- Chemistry: Chemical equations, bonding, reactions, and lab concepts
- Biology: Human body systems, genetics, ecology, and environment
- Astronomy: Universe, planets, stars, and space science

Premium Features:
- 100+ HD Video Lessons
- Chapter-wise detailed notes and summaries
- 1000+ Practice Questions (MCQ & Short Answer)
- 10 Full-length Mock Tests (SEE Pattern)
- Tips and tricks for scoring 90%+
- Live doubt clearing sessions
- 1 Year validity

Who is this for?
Class 10 students preparing for SEE examination who want comprehensive preparation with expert guidance.`,
  courseShortDesc:
    "Complete SEE Science preparation with 100+ video lessons, mock tests, live sessions, and 1-year access.",
  duration: 120,
  weekly_study: 10,
  learn_type: "PAID",
  price: 2999,
  discount: 20,
  tags: [
    "SEE",
    "Science",
    "Premium",
    "Nepal",
    "Physics",
    "Chemistry",
    "Biology",
    "Astronomy",
    "Class 10",
    "Mock Test",
  ],
  requirements:
    "Class 9 Science completed. A dedicated study schedule of 10 hours per week. Stable internet connection for video streaming.",
  status: "approved",
  published: true,
};

const scienceCourseWeeks = [
  {
    title: "Week 1: Physics - Force, Motion & Newton's Laws",
    weekNumber: 1,
    description:
      "Master all concepts of force, motion, velocity, acceleration, and Newton's three laws with numerical problems.",
    order: 1,
    lessons: [
      {
        lessonTitle: "Introduction to Force and Motion",
        lessonContent: `<h2>Force and Motion - Fundamental Concepts</h2>

<h3>What is Force?</h3>
<p>Force is a push or pull that can change the state of motion of an object. It can start motion, stop motion, or change the direction of motion.</p>

<h3>Types of Motion:</h3>
<ul>
  <li><strong>Linear Motion:</strong> Motion in a straight line (e.g., a car moving on a straight road)</li>
  <li><strong>Circular Motion:</strong> Motion in a circular path (e.g., a stone tied to a string)</li>
  <li><strong>Oscillatory Motion:</strong> To and fro motion (e.g., pendulum of a clock)</li>
  <li><strong>Random Motion:</strong> Motion without a fixed path (e.g., movement of flies)</li>
</ul>

<h3>Physical Quantities Related to Motion:</h3>
<ul>
  <li><strong>Displacement:</strong> Shortest distance between initial and final position (vector quantity)</li>
  <li><strong>Velocity:</strong> Displacement per unit time (v = s/t)</li>
  <li><strong>Acceleration:</strong> Change in velocity per unit time (a = (v-u)/t)</li>
</ul>

<h3>SI Units:</h3>
<p>Force = Newton (N), Distance = Meter (m), Time = Second (s), Velocity = m/s, Acceleration = m/s²</p>`,
        shortDescription:
          "Learn about force and different types of motion with examples.",
        order: 1,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Equations of Motion",
        lessonContent: `<h2>Equations of Motion</h2>
<p>These equations relate displacement, velocity, acceleration, and time for uniformly accelerated motion.</p>

<h3>The Three Equations:</h3>
<ol>
  <li><strong>First Equation:</strong> v = u + at</li>
  <li><strong>Second Equation:</strong> s = ut + ½at²</li>
  <li><strong>Third Equation:</strong> v² = u² + 2as</li>
</ol>

<h3>Where:</h3>
<ul>
  <li>u = initial velocity</li>
  <li>v = final velocity</li>
  <li>a = acceleration</li>
  <li>t = time</li>
  <li>s = displacement</li>
</ul>

<h3>Example Problem:</h3>
<p><strong>Q:</strong> A car starts from rest and accelerates at 5 m/s² for 10 seconds. Find the final velocity and distance covered.</p>
<p><strong>Solution:</strong></p>
<p>Given: u = 0, a = 5 m/s², t = 10s</p>
<p>Final velocity: v = u + at = 0 + 5 × 10 = <strong>50 m/s</strong></p>
<p>Distance: s = ut + ½at² = 0 + ½ × 5 × 100 = <strong>250 m</strong></p>`,
        shortDescription:
          "Master the three equations of motion with numerical problems.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Newton's Laws of Motion",
        lessonContent: `<h2>Newton's Three Laws of Motion</h2>

<h3>First Law (Law of Inertia):</h3>
<p><em>"An object at rest stays at rest, and an object in motion stays in motion with the same speed and direction, unless acted upon by an external force."</em></p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Passengers jerk forward when a bus stops suddenly</li>
  <li>Dust particles fall off when a carpet is beaten</li>
  <li>A ball keeps rolling until friction stops it</li>
</ul>

<h3>Second Law (F = ma):</h3>
<p><em>"The rate of change of momentum is directly proportional to the applied force and takes place in the direction of the force."</em></p>
<p><strong>Force = Mass × Acceleration</strong></p>
<p>1 Newton = Force required to give 1 kg mass an acceleration of 1 m/s²</p>

<h3>Third Law (Action-Reaction):</h3>
<p><em>"For every action, there is an equal and opposite reaction."</em></p>
<p><strong>Examples:</strong></p>
<ul>
  <li>Rocket propulsion - gases push down, rocket moves up</li>
  <li>Walking - foot pushes ground backward, ground pushes foot forward</li>
  <li>Swimming - hands push water backward, water pushes swimmer forward</li>
</ul>`,
        shortDescription:
          "Understand Newton's three laws with real-life examples.",
        order: 3,
        duration: 55,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 2: Physics - Work, Energy & Power",
    weekNumber: 2,
    description:
      "Understanding work, different forms of energy, power, and energy conservation.",
    order: 2,
    lessons: [
      {
        lessonTitle: "Work and Energy",
        lessonContent: `<h2>Work</h2>
<p>Work is done when a force causes displacement in an object.</p>
<p><strong>Formula:</strong> W = F × s × cos θ</p>
<p>When force and displacement are in the same direction: <strong>W = F × s</strong></p>
<p><strong>Unit:</strong> Joule (J) = 1 Newton × 1 meter</p>

<h3>When is Work Done?</h3>
<ul>
  <li>Work is done when force causes displacement</li>
  <li>No work is done if there is no displacement (holding a heavy bag)</li>
  <li>No work is done if force is perpendicular to displacement (carrying a bag while walking)</li>
</ul>

<h2>Energy</h2>
<p>Energy is the capacity to do work. <strong>Unit: Joule (J)</strong></p>

<h3>Types of Mechanical Energy:</h3>
<ul>
  <li><strong>Kinetic Energy (KE):</strong> Energy due to motion. <code>KE = ½mv²</code></li>
  <li><strong>Potential Energy (PE):</strong> Energy due to position. <code>PE = mgh</code></li>
</ul>

<h3>Law of Conservation of Energy:</h3>
<p>Energy can neither be created nor destroyed; it can only be transformed from one form to another. Total energy remains constant.</p>`,
        shortDescription:
          "Learn about work, energy, and conservation of energy.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Power and Efficiency",
        lessonContent: `<h2>Power</h2>
<p>Power is the rate of doing work or the rate of energy transfer.</p>
<p><strong>Formula:</strong> P = W/t = F × v</p>
<p><strong>Unit:</strong> Watt (W) = 1 Joule/second</p>
<p>1 Horsepower (HP) = 746 Watts</p>

<h3>Example:</h3>
<p><strong>Q:</strong> A motor lifts 100 kg of water to a height of 10 m in 20 seconds. Calculate the power.</p>
<p><strong>Solution:</strong></p>
<p>Work done = mgh = 100 × 10 × 10 = 10,000 J</p>
<p>Power = W/t = 10,000/20 = <strong>500 W</strong></p>

<h2>Efficiency</h2>
<p>Efficiency measures how effectively a machine converts input energy to useful output.</p>
<p><strong>Formula:</strong> η = (Output Energy / Input Energy) × 100%</p>

<h3>Example:</h3>
<p>If a motor uses 500 J of electrical energy to produce 400 J of mechanical energy:</p>
<p>Efficiency = (400/500) × 100% = <strong>80%</strong></p>`,
        shortDescription:
          "Understanding power, efficiency, and their calculations.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 3: Chemistry - Atomic Structure & Chemical Bonding",
    weekNumber: 3,
    description:
      "Learn about atoms, subatomic particles, electronic configuration, and types of chemical bonds.",
    order: 3,
    lessons: [
      {
        lessonTitle: "Atomic Structure",
        lessonContent: `<h2>Structure of an Atom</h2>
<p>An atom is the smallest unit of matter that retains the chemical properties of an element.</p>

<h3>Subatomic Particles:</h3>
<table border="1" cellpadding="8">
  <tr><th>Particle</th><th>Charge</th><th>Mass</th><th>Location</th></tr>
  <tr><td>Proton</td><td>+1</td><td>1 amu</td><td>Nucleus</td></tr>
  <tr><td>Neutron</td><td>0</td><td>1 amu</td><td>Nucleus</td></tr>
  <tr><td>Electron</td><td>-1</td><td>~0</td><td>Orbits/Shells</td></tr>
</table>

<h3>Important Terms:</h3>
<ul>
  <li><strong>Atomic Number (Z):</strong> Number of protons in the nucleus</li>
  <li><strong>Mass Number (A):</strong> Number of protons + neutrons</li>
  <li><strong>Isotopes:</strong> Atoms with same atomic number but different mass numbers</li>
</ul>

<h3>Electronic Configuration:</h3>
<p>Electrons are arranged in shells around the nucleus.</p>
<ul>
  <li>K shell (n=1): Maximum 2 electrons</li>
  <li>L shell (n=2): Maximum 8 electrons</li>
  <li>M shell (n=3): Maximum 18 electrons</li>
  <li>N shell (n=4): Maximum 32 electrons</li>
</ul>
<p><strong>Formula:</strong> Maximum electrons in a shell = 2n²</p>`,
        shortDescription:
          "Learn about atomic structure and electronic configuration.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Chemical Bonding",
        lessonContent: `<h2>Chemical Bonding</h2>
<p>A chemical bond is the attractive force that holds atoms together in a compound.</p>

<h3>Octet Rule:</h3>
<p>Atoms tend to gain, lose, or share electrons to achieve 8 electrons in their outermost shell (like noble gases).</p>

<h3>Types of Chemical Bonds:</h3>

<h4>1. Ionic Bond</h4>
<p>Formed by transfer of electrons from metal to non-metal.</p>
<p><strong>Example - NaCl:</strong></p>
<ul>
  <li>Na (2,8,1) loses 1 electron → Na⁺ (2,8)</li>
  <li>Cl (2,8,7) gains 1 electron → Cl⁻ (2,8,8)</li>
  <li>Na⁺ and Cl⁻ attract each other to form NaCl</li>
</ul>

<h4>2. Covalent Bond</h4>
<p>Formed by sharing of electrons between non-metals.</p>
<p><strong>Example - H₂O:</strong> One oxygen atom shares electrons with two hydrogen atoms.</p>

<h4>3. Metallic Bond</h4>
<p>Formed between metal atoms where electrons are shared in a "sea of electrons".</p>

<h3>Properties Comparison:</h3>
<ul>
  <li><strong>Ionic compounds:</strong> High melting point, conduct electricity when dissolved</li>
  <li><strong>Covalent compounds:</strong> Low melting point, poor conductors</li>
</ul>`,
        shortDescription: "Understanding ionic, covalent, and metallic bonds.",
        order: 2,
        duration: 55,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 4: Chemistry - Acids, Bases & Chemical Reactions",
    weekNumber: 4,
    description:
      "Study of acids, bases, pH scale, neutralization, and types of chemical reactions.",
    order: 4,
    lessons: [
      {
        lessonTitle: "Acids and Bases",
        lessonContent: `<h2>Acids</h2>
<p>Acids are substances that release H⁺ ions in water.</p>

<h3>Properties of Acids:</h3>
<ul>
  <li>Sour taste</li>
  <li>Turn blue litmus red</li>
  <li>pH less than 7</li>
  <li>React with metals to produce hydrogen gas</li>
  <li>React with bases to form salt and water</li>
</ul>

<p><strong>Common Acids:</strong> HCl (Hydrochloric), H₂SO₄ (Sulfuric), HNO₃ (Nitric), CH₃COOH (Acetic)</p>

<h2>Bases</h2>
<p>Bases are substances that release OH⁻ ions in water.</p>

<h3>Properties of Bases:</h3>
<ul>
  <li>Bitter taste</li>
  <li>Turn red litmus blue</li>
  <li>pH greater than 7</li>
  <li>Slippery or soapy feel</li>
  <li>React with acids to form salt and water</li>
</ul>

<p><strong>Common Bases:</strong> NaOH (Sodium hydroxide), KOH (Potassium hydroxide), Ca(OH)₂ (Calcium hydroxide)</p>

<h2>pH Scale</h2>
<p>pH scale ranges from 0 to 14:</p>
<ul>
  <li><strong>pH &lt; 7:</strong> Acidic</li>
  <li><strong>pH = 7:</strong> Neutral</li>
  <li><strong>pH &gt; 7:</strong> Basic/Alkaline</li>
</ul>`,
        shortDescription: "Learn about acids, bases, and the pH scale.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Types of Chemical Reactions",
        lessonContent: `<h2>Types of Chemical Reactions</h2>

<h3>1. Combination Reaction</h3>
<p>Two or more substances combine to form a single product.</p>
<p><code>A + B → AB</code></p>
<p><strong>Example:</strong> 2H₂ + O₂ → 2H₂O</p>

<h3>2. Decomposition Reaction</h3>
<p>A single compound breaks down into two or more simpler substances.</p>
<p><code>AB → A + B</code></p>
<p><strong>Example:</strong> 2H₂O → 2H₂ + O₂ (electrolysis)</p>

<h3>3. Displacement Reaction</h3>
<p>A more reactive element displaces a less reactive element from its compound.</p>
<p><code>A + BC → AC + B</code></p>
<p><strong>Example:</strong> Zn + CuSO₄ → ZnSO₄ + Cu</p>

<h3>4. Double Displacement Reaction</h3>
<p>Exchange of ions between two compounds.</p>
<p><code>AB + CD → AD + CB</code></p>
<p><strong>Example:</strong> NaCl + AgNO₃ → NaNO₃ + AgCl</p>

<h3>5. Neutralization Reaction</h3>
<p><strong>Acid + Base → Salt + Water</strong></p>
<p><strong>Example:</strong> HCl + NaOH → NaCl + H₂O</p>`,
        shortDescription:
          "Study different types of chemical reactions with examples.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 5: Biology - Cell Structure & Human Body Systems",
    weekNumber: 5,
    description:
      "Understanding cells, their organelles, and major human body systems.",
    order: 5,
    lessons: [
      {
        lessonTitle: "Cell Structure and Function",
        lessonContent: `<h2>The Cell - Basic Unit of Life</h2>
<p>A cell is the structural and functional unit of all living organisms.</p>

<h3>Types of Cells:</h3>
<ul>
  <li><strong>Prokaryotic:</strong> No true nucleus (e.g., bacteria)</li>
  <li><strong>Eukaryotic:</strong> Has a true nucleus (e.g., plant and animal cells)</li>
</ul>

<h3>Cell Organelles and Their Functions:</h3>
<ul>
  <li><strong>Cell Membrane:</strong> Controls what enters and exits the cell</li>
  <li><strong>Nucleus:</strong> Control center, contains DNA</li>
  <li><strong>Mitochondria:</strong> Powerhouse of the cell, produces ATP</li>
  <li><strong>Ribosome:</strong> Protein synthesis</li>
  <li><strong>Endoplasmic Reticulum:</strong> Transport system within cell</li>
  <li><strong>Golgi Body:</strong> Packaging and secretion</li>
  <li><strong>Lysosome:</strong> Digestion of waste materials</li>
  <li><strong>Chloroplast:</strong> Photosynthesis (plant cells only)</li>
  <li><strong>Cell Wall:</strong> Provides rigidity (plant cells only)</li>
  <li><strong>Vacuole:</strong> Storage (large in plant cells)</li>
</ul>

<h3>Differences: Plant vs Animal Cells</h3>
<p><strong>Plant cells have:</strong> Cell wall, chloroplast, large central vacuole</p>
<p><strong>Animal cells have:</strong> Centrioles, smaller vacuoles</p>`,
        shortDescription: "Learn about cell structure and organelle functions.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Human Digestive and Circulatory Systems",
        lessonContent: `<h2>Digestive System</h2>
<p>The digestive system breaks down food into nutrients that can be absorbed by the body.</p>

<h3>Organs of Digestive System:</h3>
<ol>
  <li><strong>Mouth:</strong> Mechanical digestion (chewing), saliva digests carbohydrates</li>
  <li><strong>Esophagus:</strong> Transports food to stomach via peristalsis</li>
  <li><strong>Stomach:</strong> Protein digestion, HCl kills bacteria</li>
  <li><strong>Small Intestine:</strong> Main site of digestion and absorption</li>
  <li><strong>Large Intestine:</strong> Water absorption, forms feces</li>
</ol>

<h3>Accessory Organs:</h3>
<ul>
  <li><strong>Liver:</strong> Produces bile for fat digestion</li>
  <li><strong>Pancreas:</strong> Produces digestive enzymes and insulin</li>
</ul>

<h2>Circulatory System</h2>

<h3>Heart:</h3>
<p><strong>Four chambers:</strong> Right atrium, Right ventricle, Left atrium, Left ventricle</p>
<p><strong>Double circulation:</strong> Pulmonary (heart-lungs) and Systemic (heart-body)</p>

<h3>Blood Vessels:</h3>
<ul>
  <li><strong>Arteries:</strong> Carry oxygenated blood away from heart</li>
  <li><strong>Veins:</strong> Carry deoxygenated blood to heart</li>
  <li><strong>Capillaries:</strong> Site of gas exchange</li>
</ul>

<h3>Components of Blood:</h3>
<p>RBC (oxygen transport), WBC (immunity), Platelets (clotting), Plasma (liquid medium)</p>`,
        shortDescription: "Study the digestive and circulatory systems.",
        order: 2,
        duration: 55,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 6: Astronomy - Solar System & Universe",
    weekNumber: 6,
    description: "Explore our solar system, stars, galaxies, and the universe.",
    order: 6,
    lessons: [
      {
        lessonTitle: "The Solar System",
        lessonContent: `<h2>Our Solar System</h2>
<p>The solar system consists of the Sun and all celestial bodies that orbit around it.</p>

<h3>The Planets (in order from Sun):</h3>
<ol>
  <li><strong>Mercury:</strong> Smallest planet, closest to Sun, no atmosphere</li>
  <li><strong>Venus:</strong> Hottest planet, Earth's twin in size, rotates backward</li>
  <li><strong>Earth:</strong> Only planet with known life, has one moon</li>
  <li><strong>Mars:</strong> Red planet, has the largest volcano (Olympus Mons)</li>
  <li><strong>Jupiter:</strong> Largest planet, Great Red Spot storm, 79+ moons</li>
  <li><strong>Saturn:</strong> Famous for its rings, least dense planet</li>
  <li><strong>Uranus:</strong> Rotates on its side, blue-green color</li>
  <li><strong>Neptune:</strong> Farthest planet, strongest winds</li>
</ol>

<h3>Mnemonic to Remember:</h3>
<p><em>"My Very Educated Mother Just Served Us Nachos"</em></p>

<h3>Other Solar System Objects:</h3>
<ul>
  <li><strong>Dwarf Planets:</strong> Pluto, Ceres, Eris</li>
  <li><strong>Asteroids:</strong> Rocky objects mostly between Mars and Jupiter</li>
  <li><strong>Comets:</strong> Icy bodies that develop tails near the Sun</li>
  <li><strong>Meteoroids:</strong> Small rocky particles in space</li>
</ul>`,
        shortDescription: "Learn about our solar system and planets.",
        order: 1,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Stars, Galaxies, and the Universe",
        lessonContent: `<h2>Stars</h2>
<p>Stars are massive balls of hot gas that produce energy through nuclear fusion.</p>

<h3>Life Cycle of a Star:</h3>
<ol>
  <li><strong>Nebula:</strong> Cloud of gas and dust where stars are born</li>
  <li><strong>Protostar:</strong> Early stage of star formation</li>
  <li><strong>Main Sequence:</strong> Stable adult star (like our Sun)</li>
  <li><strong>Red Giant:</strong> Expanded dying star</li>
  <li><strong>Final Stage:</strong> Depends on mass:
    <ul>
      <li>Small stars → White Dwarf</li>
      <li>Medium stars → Neutron Star</li>
      <li>Massive stars → Black Hole (after Supernova)</li>
    </ul>
  </li>
</ol>

<h2>Galaxies</h2>
<p>A galaxy is a massive collection of stars, gas, dust, and dark matter held together by gravity.</p>

<h3>Types of Galaxies:</h3>
<ul>
  <li><strong>Spiral:</strong> Like our Milky Way, has arms</li>
  <li><strong>Elliptical:</strong> Oval-shaped, older stars</li>
  <li><strong>Irregular:</strong> No definite shape</li>
</ul>

<h3>The Universe:</h3>
<ul>
  <li>The universe contains billions of galaxies</li>
  <li>It began with the Big Bang about 13.8 billion years ago</li>
  <li>The universe is still expanding</li>
  <li><strong>Light year</strong> = distance light travels in one year (9.46 trillion km)</li>
</ul>`,
        shortDescription: "Study stars, their life cycle, and galaxies.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
    ],
  },
];

// ============================================
// FREE COURSE - SEE English
// ============================================
const englishCourseData = {
  courseTitle: "SEE English Foundation Course - Free",
  courseDesc: `This free course covers the essential English grammar, reading, and writing skills required for the SEE examination.

What's Included:
- Grammar fundamentals: Tenses, Voice, Narration, Prepositions
- Reading comprehension techniques
- Essay and letter writing basics
- Common vocabulary for SEE

Course Features:
- Video lessons with clear explanations
- Practice exercises after each topic
- SEE pattern questions and answers
- Suitable for Class 9-10 students

Note: This free course covers the fundamentals. Practice regularly to improve your English skills!`,
  courseShortDesc:
    "Free English course for SEE preparation covering grammar, reading comprehension, and writing skills.",
  duration: 40,
  weekly_study: 6,
  learn_type: "FREE",
  price: 0,
  discount: 0,
  tags: ["SEE", "English", "Free", "Nepal", "Grammar", "Writing", "Class 10"],
  requirements: "Basic English knowledge. A notebook for practice exercises.",
  status: "approved",
  published: true,
};

const englishCourseWeeks = [
  {
    title: "Week 1: English Grammar - Tenses",
    weekNumber: 1,
    description: "Master all 12 tenses with rules, structures, and examples.",
    order: 1,
    lessons: [
      {
        lessonTitle: "Present Tenses",
        lessonContent: `<h2>Present Tenses</h2>

<h3>1. Simple Present Tense</h3>
<p><strong>Structure:</strong> Subject + V1 (s/es for third person singular)</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Habitual actions: <em>"He drinks tea every morning."</em></li>
  <li>Universal truths: <em>"The sun rises in the east."</em></li>
  <li>Fixed schedules: <em>"The train leaves at 6 PM."</em></li>
</ul>

<h3>2. Present Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + is/am/are + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Actions happening now: <em>"She is reading a book."</em></li>
  <li>Temporary actions: <em>"I am staying with my uncle this week."</em></li>
  <li>Future plans: <em>"We are meeting tomorrow."</em></li>
</ul>

<h3>3. Present Perfect Tense</h3>
<p><strong>Structure:</strong> Subject + has/have + V3</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Past action with present result: <em>"I have finished my homework."</em></li>
  <li>Experience: <em>"She has visited Paris twice."</em></li>
  <li>With just, already, yet: <em>"He has just arrived."</em></li>
</ul>

<h3>4. Present Perfect Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + has/have + been + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Actions that started in past and continue: <em>"I have been waiting for an hour."</em></li>
</ul>`,
        shortDescription: "Learn all four present tenses with examples.",
        order: 1,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Past Tenses",
        lessonContent: `<h2>Past Tenses</h2>

<h3>1. Simple Past Tense</h3>
<p><strong>Structure:</strong> Subject + V2</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Completed actions in past: <em>"I visited Pokhara last year."</em></li>
  <li>Past habits: <em>"She always walked to school."</em></li>
</ul>

<h3>2. Past Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + was/were + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Ongoing action in past: <em>"I was sleeping at 10 PM."</em></li>
  <li>Two parallel actions: <em>"While I was cooking, he was cleaning."</em></li>
  <li>Interrupted action: <em>"I was reading when the phone rang."</em></li>
</ul>

<h3>3. Past Perfect Tense</h3>
<p><strong>Structure:</strong> Subject + had + V3</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Action completed before another past action: <em>"The train had left before I reached the station."</em></li>
</ul>

<h3>4. Past Perfect Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + had + been + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Duration of past action before another past action: <em>"I had been waiting for two hours before the bus arrived."</em></li>
</ul>`,
        shortDescription: "Master all four past tenses with examples.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Future Tenses",
        lessonContent: `<h2>Future Tenses</h2>

<h3>1. Simple Future Tense</h3>
<p><strong>Structure:</strong> Subject + will/shall + V1</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Future actions: <em>"I will call you tomorrow."</em></li>
  <li>Predictions: <em>"It will rain today."</em></li>
  <li>Promises: <em>"I will help you."</em></li>
</ul>

<h3>2. Future Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + will be + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Ongoing future action: <em>"I will be studying at 8 PM tonight."</em></li>
</ul>

<h3>3. Future Perfect Tense</h3>
<p><strong>Structure:</strong> Subject + will have + V3</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Action completed before a future time: <em>"I will have finished the project by Friday."</em></li>
</ul>

<h3>4. Future Perfect Continuous Tense</h3>
<p><strong>Structure:</strong> Subject + will have been + V-ing</p>
<p><strong>Uses:</strong></p>
<ul>
  <li>Duration of action up to a future point: <em>"By next year, I will have been learning English for 10 years."</em></li>
</ul>

<h3>SEE Tip:</h3>
<p>Questions often ask you to fill in correct tense forms. Look for time expressions like "yesterday", "tomorrow", "since", "for", "already", etc. to identify the correct tense.</p>`,
        shortDescription: "Learn all four future tenses with examples.",
        order: 3,
        duration: 45,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 2: Voice and Narration",
    weekNumber: 2,
    description:
      "Learn to transform sentences between active-passive voice and direct-indirect speech.",
    order: 2,
    lessons: [
      {
        lessonTitle: "Active and Passive Voice",
        lessonContent: `<h2>Active and Passive Voice</h2>

<h3>Active Voice:</h3>
<p>Subject performs the action.</p>
<p><strong>Structure:</strong> Subject + Verb + Object</p>
<p><strong>Example:</strong> <em>"The cat caught the mouse."</em></p>

<h3>Passive Voice:</h3>
<p>Subject receives the action.</p>
<p><strong>Structure:</strong> Object + be + V3 + by + Subject</p>
<p><strong>Example:</strong> <em>"The mouse was caught by the cat."</em></p>

<h3>Rules for Conversion:</h3>
<ol>
  <li>Object of active sentence becomes subject of passive sentence</li>
  <li>Subject of active sentence becomes object (with "by")</li>
  <li>Main verb changes to past participle (V3)</li>
  <li>Appropriate form of "be" is added based on tense</li>
</ol>

<h3>Voice Change by Tense:</h3>
<table border="1" cellpadding="8">
  <tr><th>Tense</th><th>Active</th><th>Passive</th></tr>
  <tr><td>Simple Present</td><td>writes</td><td>is written</td></tr>
  <tr><td>Simple Past</td><td>wrote</td><td>was written</td></tr>
  <tr><td>Simple Future</td><td>will write</td><td>will be written</td></tr>
  <tr><td>Present Continuous</td><td>is writing</td><td>is being written</td></tr>
  <tr><td>Past Continuous</td><td>was writing</td><td>was being written</td></tr>
  <tr><td>Present Perfect</td><td>has written</td><td>has been written</td></tr>
  <tr><td>Past Perfect</td><td>had written</td><td>had been written</td></tr>
</table>

<h3>Examples:</h3>
<ul>
  <li>Active: <em>"She sings a song."</em> → Passive: <em>"A song is sung by her."</em></li>
  <li>Active: <em>"They are building a house."</em> → Passive: <em>"A house is being built by them."</em></li>
  <li>Active: <em>"He had completed the work."</em> → Passive: <em>"The work had been completed by him."</em></li>
</ul>`,
        shortDescription:
          "Learn to convert sentences between active and passive voice.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Direct and Indirect Speech",
        lessonContent: `<h2>Direct and Indirect Speech (Narration)</h2>

<h3>Direct Speech:</h3>
<p>Exact words of the speaker in quotation marks.</p>
<p><strong>Example:</strong> Ram said, <em>"I am happy."</em></p>

<h3>Indirect Speech:</h3>
<p>Reporting what someone said without using their exact words.</p>
<p><strong>Example:</strong> Ram said that he was happy.</p>

<h3>Rules for Conversion:</h3>

<h4>1. Change in Pronouns:</h4>
<ul>
  <li>First person → According to subject</li>
  <li>Second person → According to object</li>
  <li>Third person → No change</li>
</ul>

<h4>2. Change in Tense (if reporting verb is in past):</h4>
<ul>
  <li>Simple Present → Simple Past</li>
  <li>Present Continuous → Past Continuous</li>
  <li>Present Perfect → Past Perfect</li>
  <li>Simple Past → Past Perfect</li>
  <li>Will → Would</li>
  <li>Can → Could</li>
  <li>May → Might</li>
</ul>

<h4>3. Change in Time/Place Words:</h4>
<ul>
  <li>now → then</li>
  <li>today → that day</li>
  <li>tomorrow → the next day</li>
  <li>yesterday → the previous day</li>
  <li>here → there</li>
  <li>this → that</li>
  <li>these → those</li>
</ul>

<h3>Examples:</h3>
<ul>
  <li><strong>Direct:</strong> He said, <em>"I am going to school."</em></li>
  <li><strong>Indirect:</strong> He said that he was going to school.</li>
</ul>
<ul>
  <li><strong>Direct:</strong> She said to me, <em>"Where do you live?"</em></li>
  <li><strong>Indirect:</strong> She asked me where I lived.</li>
</ul>`,
        shortDescription: "Master direct and indirect speech conversion.",
        order: 2,
        duration: 55,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 3: Reading Comprehension & Vocabulary",
    weekNumber: 3,
    description:
      "Develop reading comprehension skills and expand vocabulary for SEE.",
    order: 3,
    lessons: [
      {
        lessonTitle: "Reading Comprehension Techniques",
        lessonContent: `<h2>Reading Comprehension Strategies</h2>

<h3>Before Reading:</h3>
<ul>
  <li>Read the title and predict what the passage is about</li>
  <li>Look at any pictures or diagrams</li>
  <li>Skim through questions to know what to look for</li>
</ul>

<h3>While Reading:</h3>
<ul>
  <li>Read the passage carefully at least twice</li>
  <li>Underline key words and main ideas</li>
  <li>Circle unfamiliar words and try to understand from context</li>
  <li>Identify the main theme and supporting details</li>
</ul>

<h3>Types of Questions:</h3>
<ol>
  <li><strong>Factual Questions:</strong> Answers are directly in the text
    <p>Look for: who, what, when, where, how many</p>
  </li>
  <li><strong>Inference Questions:</strong> Answers must be concluded from the text
    <p>Look for: <em>"What can we conclude..."</em>, <em>"The author suggests..."</em></p>
  </li>
  <li><strong>Vocabulary Questions:</strong> Find meaning of words from context
    <p>Look for clues in surrounding sentences</p>
  </li>
  <li><strong>Main Idea Questions:</strong> Identify the central theme
    <p>Think: <em>"What is this passage mainly about?"</em></p>
  </li>
</ol>

<h3>Tips for SEE:</h3>
<ul>
  <li>Answer in complete sentences unless asked otherwise</li>
  <li>Use your own words when paraphrasing</li>
  <li>Stick to the information given in the passage</li>
  <li>Manage your time - don't spend too long on one question</li>
</ul>`,
        shortDescription:
          "Learn effective strategies for reading comprehension.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Essential Vocabulary for SEE",
        lessonContent: `<h2>Important Vocabulary for SEE</h2>

<h3>Commonly Confused Words:</h3>
<ul>
  <li><strong>Accept/Except:</strong> Accept = receive; Except = excluding</li>
  <li><strong>Affect/Effect:</strong> Affect = verb (influence); Effect = noun (result)</li>
  <li><strong>Their/There/They're:</strong> Their = possession; There = place; They're = they are</li>
  <li><strong>Its/It's:</strong> Its = possession; It's = it is</li>
  <li><strong>Lose/Loose:</strong> Lose = misplace; Loose = not tight</li>
  <li><strong>Principal/Principle:</strong> Principal = head of school; Principle = rule/belief</li>
</ul>

<h3>Synonyms (Similar Meanings):</h3>
<ul>
  <li><strong>Beautiful:</strong> lovely, attractive, gorgeous, stunning</li>
  <li><strong>Happy:</strong> joyful, delighted, pleased, glad</li>
  <li><strong>Big:</strong> large, huge, enormous, massive</li>
  <li><strong>Important:</strong> significant, crucial, essential, vital</li>
  <li><strong>Difficult:</strong> hard, challenging, tough, demanding</li>
</ul>

<h3>Antonyms (Opposite Meanings):</h3>
<ul>
  <li>Ancient × Modern</li>
  <li>Brave × Cowardly</li>
  <li>Create × Destroy</li>
  <li>Generous × Selfish</li>
  <li>Humble × Proud</li>
</ul>

<h3>Word Formation:</h3>
<ul>
  <li>happy → happiness, happily, unhappy</li>
  <li>care → careful, careless, carefully</li>
  <li>educate → education, educational, educator</li>
  <li>success → successful, successfully, unsuccessful</li>
</ul>`,
        shortDescription: "Build essential vocabulary for SEE examination.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
    ],
  },
  {
    title: "Week 4: Writing Skills - Essays & Letters",
    weekNumber: 4,
    description:
      "Learn to write essays, formal and informal letters for SEE examination.",
    order: 4,
    lessons: [
      {
        lessonTitle: "Essay Writing",
        lessonContent: `<h2>Essay Writing for SEE</h2>

<h3>Essay Structure:</h3>
<ol>
  <li><strong>Introduction:</strong> Hook + Background + Thesis statement</li>
  <li><strong>Body Paragraphs:</strong> Main points with supporting details</li>
  <li><strong>Conclusion:</strong> Summary + Final thoughts</li>
</ol>

<h3>Tips for Good Essays:</h3>
<ul>
  <li>Plan before you write - make an outline</li>
  <li>Use paragraphs - one main idea per paragraph</li>
  <li>Use linking words (however, therefore, moreover, in addition)</li>
  <li>Vary your sentence structure</li>
  <li>Check grammar and spelling</li>
  <li>Stay on topic - don't go off track</li>
</ul>

<h3>Common SEE Essay Topics:</h3>
<ul>
  <li>My Country Nepal</li>
  <li>Importance of Education</li>
  <li>Environmental Pollution</li>
  <li>My Aim in Life</li>
  <li>Science and Technology</li>
  <li>Discipline</li>
</ul>

<h3>Sample Essay Outline - "Importance of Education":</h3>
<p><strong>Introduction:</strong> Education is the key to success. It helps people develop skills and knowledge needed for a better life.</p>
<p><strong>Body 1:</strong> Education provides knowledge and skills for employment.</p>
<p><strong>Body 2:</strong> Education develops critical thinking and problem-solving abilities.</p>
<p><strong>Body 3:</strong> Education helps in personal and social development.</p>
<p><strong>Conclusion:</strong> Education is essential for individual growth and national development.</p>`,
        shortDescription:
          "Learn the structure and techniques of essay writing.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Letter Writing",
        lessonContent: `<h2>Letter Writing for SEE</h2>

<h3>Types of Letters:</h3>
<ol>
  <li>Formal Letters (official, business)</li>
  <li>Informal Letters (personal, friendly)</li>
</ol>

<h2>Formal Letter Format:</h2>
<pre>
Your Address
Date

Recipient's Name/Designation
Address

Subject: [Brief subject line]

Salutation (Dear Sir/Madam,)

Body:
- First paragraph: State the purpose
- Second paragraph: Details and explanation
- Third paragraph: Conclusion and action required

Closing (Yours faithfully/sincerely,)
Your Name
</pre>

<h3>Common Formal Letter Topics for SEE:</h3>
<ul>
  <li>Application for leave</li>
  <li>Complaint letter</li>
  <li>Letter to the editor</li>
  <li>Letter to the principal</li>
</ul>

<h2>Informal Letter Format:</h2>
<pre>
Your Address
Date

Dear [Friend's Name],

Body:
- Opening: Greetings and well-wishes
- Middle: Main content of the letter
- Closing: Ending remarks and regards to family

Your loving friend,
Your Name
</pre>

<h3>Tips:</h3>
<ul>
  <li>Use appropriate tone (formal or friendly)</li>
  <li>Be clear and concise</li>
  <li>Follow the correct format</li>
  <li>Use proper salutation and closing</li>
</ul>`,
        shortDescription: "Master formal and informal letter writing formats.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
    ],
  },
];

// ============================================
// SEEDER FUNCTIONS
// ============================================
async function connectDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

async function clearExistingData() {
  console.log("Clearing existing seed data...");

  const categoryNames = ["SEE Science", "SEE English"];

  for (const categoryName of categoryNames) {
    const category = await Category.findOne({ categoryName });
    if (category) {
      const courses = await Course.find({ category: category._id });
      for (const course of courses) {
        const weeks = await Week.find({ course: course._id });
        for (const week of weeks) {
          await Lesson.deleteMany({ week: week._id });
        }
        await Week.deleteMany({ course: course._id });
      }
      await Course.deleteMany({ category: category._id });
      await Category.deleteOne({ _id: category._id });
      console.log(`Cleared existing ${categoryName} data`);
    }
  }
}

async function getOrCreateAdminUser() {
  const allUsers = await User.find({}, { email: 1, roles: 1 });
  console.log("All users in database:");
  allUsers.forEach((u) =>
    console.log(`  - ${u.email}: [${u.roles.join(", ")}]`),
  );

  let adminUser = await User.findOne({
    roles: { $in: ["ADMIN", "SUPERADMIN"] },
  });

  if (!adminUser) {
    adminUser = await User.findOne({});

    if (!adminUser) {
      console.log("No users found in database. Please create a user first.");
      process.exit(1);
    }

    console.log(
      `Warning: No admin user found. Using first available user: ${adminUser.email}`,
    );
  } else {
    console.log(`Using admin user: ${adminUser.email}`);
  }

  return adminUser;
}

async function getOrCreateLecturer(adminUser) {
  let lecturer = await Lecturer.findOne({
    requestStatus: "approved",
    isActive: true,
  });

  if (!lecturer) {
    lecturer = await Lecturer.findOne({ user: adminUser._id });

    if (!lecturer) {
      lecturer = new Lecturer({
        user: adminUser._id,
        cv: "uploads/admin-cv.pdf",
        certificates: [],
        requestStatus: "approved",
        isActive: true,
      });
      await lecturer.save();
      console.log("Created lecturer profile for admin");
    }
  }

  console.log(`Using lecturer: ${lecturer._id}`);
  return lecturer;
}

async function createCategory(categoryData, adminUser) {
  console.log(`Creating category: ${categoryData.categoryName}`);

  const category = new Category({
    ...categoryData,
    createdBy: adminUser._id,
  });

  await category.save();
  console.log(`Created category: ${category.categoryName}`);
  return category;
}

async function createCourse(
  courseData,
  weeksData,
  category,
  adminUser,
  lecturer,
) {
  console.log(`Creating course: ${courseData.courseTitle}`);

  const course = new Course({
    ...courseData,
    category: category._id,
    createdBy: adminUser._id,
    creatorType: "admin",
    lecturers: [lecturer._id],
    publishedAt: new Date(),
  });

  await course.save();
  console.log(`Created course: ${course.courseTitle}`);

  let totalLessons = 0;
  for (const weekData of weeksData) {
    const { lessons, ...weekInfo } = weekData;

    const week = new Week({
      ...weekInfo,
      course: course._id,
    });

    await week.save();
    console.log(`  Created week: ${week.title}`);

    for (const lessonData of lessons) {
      const lesson = new Lesson({
        ...lessonData,
        week: week._id,
        createdBy: adminUser._id,
      });

      await lesson.save();
      totalLessons++;
      console.log(`    Created lesson: ${lesson.lessonTitle}`);
    }
  }

  course.totalWeeks = weeksData.length;
  course.totalLessons = totalLessons;
  await course.save();

  return course;
}

async function seed() {
  try {
    await connectDB();
    await clearExistingData();

    const adminUser = await getOrCreateAdminUser();
    const lecturer = await getOrCreateLecturer(adminUser);

    // Create Science category and PAID course
    console.log("\n--- Creating PAID Science Course ---");
    const scienceCategory = await createCategory(
      scienceCategoryData,
      adminUser,
    );
    const scienceCourse = await createCourse(
      scienceCourseData,
      scienceCourseWeeks,
      scienceCategory,
      adminUser,
      lecturer,
    );
    scienceCategory.meta.courseCount = 1;
    await scienceCategory.save();

    // Create English category and FREE course
    console.log("\n--- Creating FREE English Course ---");
    const englishCategory = await createCategory(
      englishCategoryData,
      adminUser,
    );
    const englishCourse = await createCourse(
      englishCourseData,
      englishCourseWeeks,
      englishCategory,
      adminUser,
      lecturer,
    );
    englishCategory.meta.courseCount = 1;
    await englishCategory.save();

    console.log("\n========================================");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`\nScience Category: ${scienceCategory.categoryName}`);
    console.log(
      `  - ${scienceCourse.courseTitle} (PAID - NPR ${scienceCourse.price}, ${scienceCourse.discount}% off)`,
    );
    console.log(
      `    Weeks: ${scienceCourse.totalWeeks}, Lessons: ${scienceCourse.totalLessons}`,
    );
    console.log(`\nEnglish Category: ${englishCategory.categoryName}`);
    console.log(`  - ${englishCourse.courseTitle} (FREE)`);
    console.log(
      `    Weeks: ${englishCourse.totalWeeks}, Lessons: ${englishCourse.totalLessons}`,
    );
    console.log("\n");
  } catch (error) {
    console.error("Seeding error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run only if executed directly
if (require.main === module) {
  seed();
}

// Export data for use in other seeders
module.exports = {
  seeScienceCategoryData: scienceCategoryData,
  seeScienceCourseData: scienceCourseData,
  seeScienceWeeks: scienceCourseWeeks,
  seeEnglishCategoryData: englishCategoryData,
  seeEnglishCourseData: englishCourseData,
  seeEnglishWeeks: englishCourseWeeks,
};
