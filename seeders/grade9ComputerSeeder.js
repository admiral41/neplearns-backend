/**
 * Grade 9 Computer Science Seeder (Nepal Syllabus)
 *
 * Run: node seeders/grade9ComputerSeeder.js
 *
 * Creates:
 * - 1 Category (Grade 9 Computer Science)
 * - 1 PAID Computer Science Course
 * - 8 Weeks with comprehensive lessons
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
// CATEGORY
// ============================================
const computerCategoryData = {
  categoryName: "Grade 9 Computer Science",
  categoryDesc:
    "Complete Computer Science course for Grade 9 students in Nepal. Covers Computer Fundamentals, Number Systems, Operating Systems, MS Office Suite, Web Technology, Multimedia, and Cyber Security as per the Nepal government curriculum.",
  categoryShortDesc: "Computer Science course for Grade 9 Nepal syllabus",
  color: "#0EA5E9",
  icon: "monitor",
  isActive: true,
  order: 4,
};

// ============================================
// PAID COURSE - Grade 9 Computer Science
// ============================================
const computerCourseData = {
  courseTitle: "Complete Grade 9 Computer Science Course",
  courseDesc: `Master Grade 9 Computer Science with this comprehensive course designed according to the Nepal government curriculum.

What's Included:
- Computer Fundamentals: Hardware, software, generations of computers
- Number System: Binary, octal, decimal, hexadecimal conversions
- Operating System: Windows features and operations
- Word Processing: MS Word complete guide
- Spreadsheet: MS Excel formulas, functions, and charts
- Presentation: MS PowerPoint design and animations
- Web Technology: HTML basics and web page creation
- Multimedia: Graphics, audio, video concepts
- Cyber Security: Information security and cyber laws of Nepal

Course Features:
- 45+ detailed video lessons
- Practical demonstrations
- Step-by-step tutorials for MS Office
- HTML coding exercises
- Practice questions for exams
- 1 Year validity

Who is this for?
Grade 9 students following the Nepal curriculum who want to build strong computer skills.`,
  courseShortDesc:
    "Complete Grade 9 Computer Science with 45+ lessons covering fundamentals, MS Office, HTML, and cyber security.",
  duration: 90,
  weekly_study: 7,
  learn_type: "PAID",
  price: 1499,
  discount: 10,
  tags: [
    "Grade 9",
    "Computer Science",
    "Nepal",
    "MS Office",
    "HTML",
    "Windows",
    "Cyber Security",
    "Premium",
  ],
  requirements:
    "Basic computer access. Interest in learning technology. Dedicated study time of 7 hours per week.",
  status: "approved",
  published: true,
};

const computerCourseWeeks = [
  // ============================================
  // WEEK 1: COMPUTER FUNDAMENTALS
  // ============================================
  {
    title: "Week 1: Computer Fundamentals",
    weekNumber: 1,
    description:
      "Learn about computer basics, components, generations, and types of computers.",
    order: 1,
    lessons: [
      {
        lessonTitle: "Introduction to Computer",
        lessonContent: `<h2>What is a Computer?</h2>

<p>A computer is an electronic device that accepts data as input, processes it according to a set of instructions (program), and produces results as output.</p>

<h3>Full Form of COMPUTER:</h3>
<p><strong>C</strong>ommon <strong>O</strong>perating <strong>M</strong>achine <strong>P</strong>urposely <strong>U</strong>sed for <strong>T</strong>echnological and <strong>E</strong>ducational <strong>R</strong>esearch</p>

<h3>Characteristics of Computer:</h3>
<ul>
  <li><strong>Speed:</strong> Performs billions of calculations per second (measured in MIPS - Million Instructions Per Second)</li>
  <li><strong>Accuracy:</strong> Provides accurate results if correct data and instructions are given</li>
  <li><strong>Storage:</strong> Can store large amounts of data permanently</li>
  <li><strong>Diligence:</strong> Can work continuously without getting tired</li>
  <li><strong>Versatility:</strong> Can perform different types of tasks</li>
  <li><strong>Automation:</strong> Works automatically once programmed</li>
  <li><strong>No Intelligence:</strong> Cannot think on its own; follows instructions only</li>
</ul>

<h3>Basic Operations of Computer (IPO Cycle):</h3>
<ol>
  <li><strong>Input:</strong> Receiving data from input devices (keyboard, mouse)</li>
  <li><strong>Processing:</strong> Manipulating data according to instructions (CPU)</li>
  <li><strong>Output:</strong> Displaying results through output devices (monitor, printer)</li>
  <li><strong>Storage:</strong> Saving data for future use (hard disk, SSD)</li>
</ol>

<h3>Applications of Computer:</h3>
<ul>
  <li><strong>Education:</strong> E-learning, online classes, digital libraries</li>
  <li><strong>Banking:</strong> ATM, online banking, account management</li>
  <li><strong>Healthcare:</strong> Patient records, CT scan, MRI, diagnosis</li>
  <li><strong>Entertainment:</strong> Games, movies, music, social media</li>
  <li><strong>Business:</strong> Accounting, inventory, communication</li>
  <li><strong>Government:</strong> E-governance, record keeping, online services</li>
</ul>`,
        shortDescription: "Learn basic concepts and characteristics of computers.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Computer Hardware Components",
        lessonContent: `<h2>Computer Hardware</h2>

<p>Hardware refers to the physical components of a computer that can be seen and touched.</p>

<h3>Main Components:</h3>

<h4>1. Input Devices</h4>
<p>Devices used to enter data into the computer.</p>
<ul>
  <li><strong>Keyboard:</strong> Primary input device for typing (104 keys standard)</li>
  <li><strong>Mouse:</strong> Pointing device for selecting and clicking</li>
  <li><strong>Scanner:</strong> Converts physical documents to digital images</li>
  <li><strong>Microphone:</strong> Input device for sound/voice</li>
  <li><strong>Webcam:</strong> Captures video input</li>
  <li><strong>Joystick:</strong> Used for gaming</li>
  <li><strong>Barcode Reader:</strong> Reads barcodes on products</li>
  <li><strong>Biometric Scanner:</strong> Fingerprint, iris recognition</li>
</ul>

<h4>2. Output Devices</h4>
<p>Devices that display or produce results from the computer.</p>
<ul>
  <li><strong>Monitor:</strong> Displays visual output (LCD, LED, OLED)</li>
  <li><strong>Printer:</strong> Produces hard copy output
    <ul>
      <li>Impact: Dot Matrix</li>
      <li>Non-Impact: Inkjet, Laser</li>
    </ul>
  </li>
  <li><strong>Speaker:</strong> Produces audio output</li>
  <li><strong>Projector:</strong> Projects display on large screens</li>
  <li><strong>Plotter:</strong> Prints large drawings and designs</li>
</ul>

<h4>3. Processing Unit (CPU)</h4>
<p>The brain of the computer that processes data.</p>
<ul>
  <li><strong>ALU (Arithmetic Logic Unit):</strong> Performs calculations and logical operations</li>
  <li><strong>CU (Control Unit):</strong> Controls all computer operations</li>
  <li><strong>Registers:</strong> Temporary storage within CPU</li>
</ul>

<h4>4. Memory/Storage Devices</h4>
<ul>
  <li><strong>Primary Memory:</strong> RAM (volatile), ROM (non-volatile)</li>
  <li><strong>Secondary Memory:</strong> Hard Disk, SSD, USB Drive, CD/DVD</li>
</ul>`,
        shortDescription: "Understand computer hardware components.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Generations of Computer",
        lessonContent: `<h2>Generations of Computer</h2>

<p>Computers have evolved through five generations, each marked by a major technological advancement.</p>

<h3>First Generation (1940-1956)</h3>
<table border="1" cellpadding="8">
  <tr><th>Technology</th><td>Vacuum Tubes</td></tr>
  <tr><th>Size</th><td>Very large (room-sized)</td></tr>
  <tr><th>Speed</th><td>Very slow (milliseconds)</td></tr>
  <tr><th>Memory</th><td>Magnetic drums</td></tr>
  <tr><th>Language</th><td>Machine language</td></tr>
  <tr><th>Examples</th><td>ENIAC, UNIVAC, EDVAC</td></tr>
  <tr><th>Problems</th><td>High heat, unreliable, expensive</td></tr>
</table>

<h3>Second Generation (1956-1963)</h3>
<table border="1" cellpadding="8">
  <tr><th>Technology</th><td>Transistors</td></tr>
  <tr><th>Size</th><td>Smaller than 1st generation</td></tr>
  <tr><th>Speed</th><td>Faster (microseconds)</td></tr>
  <tr><th>Memory</th><td>Magnetic core</td></tr>
  <tr><th>Language</th><td>Assembly language</td></tr>
  <tr><th>Examples</th><td>IBM 1401, IBM 7094, CDC 1604</td></tr>
</table>

<h3>Third Generation (1964-1971)</h3>
<table border="1" cellpadding="8">
  <tr><th>Technology</th><td>Integrated Circuits (IC)</td></tr>
  <tr><th>Size</th><td>Mini computers</td></tr>
  <tr><th>Speed</th><td>Nanoseconds</td></tr>
  <tr><th>Language</th><td>High-level languages (COBOL, FORTRAN)</td></tr>
  <tr><th>Examples</th><td>IBM 360, PDP-8, ICL 2900</td></tr>
  <tr><th>Features</th><td>Keyboard and monitor introduced</td></tr>
</table>

<h3>Fourth Generation (1971-Present)</h3>
<table border="1" cellpadding="8">
  <tr><th>Technology</th><td>Microprocessors (VLSI/ULSI)</td></tr>
  <tr><th>Size</th><td>Personal computers, laptops</td></tr>
  <tr><th>Speed</th><td>Picoseconds</td></tr>
  <tr><th>Features</th><td>GUI, mouse, internet, multimedia</td></tr>
  <tr><th>Examples</th><td>Intel processors, Apple, IBM PC</td></tr>
</table>

<h3>Fifth Generation (Present and Beyond)</h3>
<table border="1" cellpadding="8">
  <tr><th>Technology</th><td>Artificial Intelligence (AI)</td></tr>
  <tr><th>Features</th><td>Voice recognition, parallel processing, quantum computing</td></tr>
  <tr><th>Goal</th><td>Machines that can think and learn</td></tr>
  <tr><th>Examples</th><td>Robots, expert systems, Siri, Alexa</td></tr>
</table>`,
        shortDescription: "Learn about the five generations of computers.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Types of Computers",
        lessonContent: `<h2>Types of Computers</h2>

<h3>A. Based on Size and Capacity:</h3>

<h4>1. Supercomputer</h4>
<ul>
  <li>Fastest and most powerful computers</li>
  <li>Used for weather forecasting, nuclear research, space exploration</li>
  <li>Examples: Summit, Fugaku, Param (India)</li>
  <li>Speed measured in FLOPS (Floating Point Operations Per Second)</li>
</ul>

<h4>2. Mainframe Computer</h4>
<ul>
  <li>Large, powerful computers for big organizations</li>
  <li>Can handle thousands of users simultaneously</li>
  <li>Used in banks, airlines, government</li>
  <li>Examples: IBM zSeries, System z</li>
</ul>

<h4>3. Minicomputer</h4>
<ul>
  <li>Medium-sized, multi-user computers</li>
  <li>Used in universities, research labs</li>
  <li>Examples: PDP-11, VAX</li>
</ul>

<h4>4. Microcomputer (Personal Computer)</h4>
<ul>
  <li>Single-user computers</li>
  <li>Types: Desktop, Laptop, Tablet, Smartphone</li>
  <li>Most commonly used today</li>
</ul>

<h3>B. Based on Data Handling:</h3>

<h4>1. Analog Computer</h4>
<ul>
  <li>Process continuous data (physical quantities)</li>
  <li>Examples: Speedometer, thermometer, voltmeter</li>
  <li>Less accurate but fast for specific tasks</li>
</ul>

<h4>2. Digital Computer</h4>
<ul>
  <li>Process discrete data (0s and 1s)</li>
  <li>Most common type today</li>
  <li>High accuracy and versatility</li>
  <li>Examples: Desktop, laptop, smartphone</li>
</ul>

<h4>3. Hybrid Computer</h4>
<ul>
  <li>Combination of analog and digital</li>
  <li>Used in hospitals (ICU monitoring), petrol pumps</li>
  <li>Takes analog input, processes digitally</li>
</ul>

<h3>C. Based on Purpose:</h3>

<h4>1. General Purpose Computer</h4>
<ul>
  <li>Can perform various tasks</li>
  <li>Examples: Personal computers</li>
</ul>

<h4>2. Special Purpose Computer</h4>
<ul>
  <li>Designed for specific tasks</li>
  <li>Examples: ATM, traffic light controller, washing machine</li>
</ul>`,
        shortDescription: "Understand different types of computers.",
        order: 4,
        duration: 45,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 2: NUMBER SYSTEM
  // ============================================
  {
    title: "Week 2: Number System",
    weekNumber: 2,
    description:
      "Master binary, octal, decimal, and hexadecimal number systems with conversions.",
    order: 2,
    lessons: [
      {
        lessonTitle: "Introduction to Number Systems",
        lessonContent: `<h2>Number Systems</h2>

<p>A number system is a way of representing numbers using a set of symbols and rules.</p>

<h3>Types of Number Systems:</h3>

<table border="1" cellpadding="10">
  <tr>
    <th>Number System</th>
    <th>Base/Radix</th>
    <th>Digits Used</th>
    <th>Example</th>
  </tr>
  <tr>
    <td><strong>Binary</strong></td>
    <td>2</td>
    <td>0, 1</td>
    <td>1010₂</td>
  </tr>
  <tr>
    <td><strong>Octal</strong></td>
    <td>8</td>
    <td>0, 1, 2, 3, 4, 5, 6, 7</td>
    <td>127₈</td>
  </tr>
  <tr>
    <td><strong>Decimal</strong></td>
    <td>10</td>
    <td>0, 1, 2, 3, 4, 5, 6, 7, 8, 9</td>
    <td>255₁₀</td>
  </tr>
  <tr>
    <td><strong>Hexadecimal</strong></td>
    <td>16</td>
    <td>0-9, A, B, C, D, E, F</td>
    <td>1A3F₁₆</td>
  </tr>
</table>

<h3>Hexadecimal Values:</h3>
<p>A=10, B=11, C=12, D=13, E=14, F=15</p>

<h3>Why Different Number Systems?</h3>
<ul>
  <li><strong>Binary:</strong> Computers use binary internally (electronic on/off states)</li>
  <li><strong>Octal:</strong> Shorter representation of binary (3 binary digits = 1 octal)</li>
  <li><strong>Decimal:</strong> Human-friendly, used in daily life</li>
  <li><strong>Hexadecimal:</strong> Compact representation (4 binary digits = 1 hex), used in programming</li>
</ul>

<h3>Place Value Concept:</h3>
<p>Each digit's value depends on its position.</p>

<p><strong>Example: 253₁₀</strong></p>
<p>= 2×10² + 5×10¹ + 3×10⁰</p>
<p>= 200 + 50 + 3 = 253</p>

<p><strong>Example: 1011₂</strong></p>
<p>= 1×2³ + 0×2² + 1×2¹ + 1×2⁰</p>
<p>= 8 + 0 + 2 + 1 = 11₁₀</p>

<h3>Powers to Remember:</h3>
<table border="1" cellpadding="8">
  <tr><td>2⁰=1</td><td>2¹=2</td><td>2²=4</td><td>2³=8</td></tr>
  <tr><td>2⁴=16</td><td>2⁵=32</td><td>2⁶=64</td><td>2⁷=128</td></tr>
  <tr><td>2⁸=256</td><td>2⁹=512</td><td>2¹⁰=1024</td><td></td></tr>
</table>`,
        shortDescription: "Learn about different number systems used in computing.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Decimal to Other Systems Conversion",
        lessonContent: `<h2>Converting Decimal to Other Number Systems</h2>

<h3>Method: Repeated Division</h3>
<p>Divide the decimal number by the base repeatedly and note the remainders from bottom to top.</p>

<h3>1. Decimal to Binary:</h3>
<p><strong>Example: Convert 25₁₀ to binary</strong></p>
<pre>
25 ÷ 2 = 12  remainder 1  ↑
12 ÷ 2 = 6   remainder 0  |
6 ÷ 2 = 3    remainder 0  |
3 ÷ 2 = 1    remainder 1  |
1 ÷ 2 = 0    remainder 1  |
</pre>
<p>Reading remainders from bottom to top: <strong>25₁₀ = 11001₂</strong></p>

<h3>2. Decimal to Octal:</h3>
<p><strong>Example: Convert 156₁₀ to octal</strong></p>
<pre>
156 ÷ 8 = 19  remainder 4  ↑
19 ÷ 8 = 2    remainder 3  |
2 ÷ 8 = 0     remainder 2  |
</pre>
<p>Reading from bottom to top: <strong>156₁₀ = 234₈</strong></p>

<h3>3. Decimal to Hexadecimal:</h3>
<p><strong>Example: Convert 500₁₀ to hexadecimal</strong></p>
<pre>
500 ÷ 16 = 31  remainder 4   ↑
31 ÷ 16 = 1    remainder 15 (F)  |
1 ÷ 16 = 0     remainder 1   |
</pre>
<p>Reading from bottom to top: <strong>500₁₀ = 1F4₁₆</strong></p>

<h3>Verification:</h3>
<p>1F4₁₆ = 1×16² + 15×16¹ + 4×16⁰</p>
<p>= 256 + 240 + 4 = 500 ✓</p>

<h3>Converting Decimal Fractions:</h3>
<p><strong>Example: Convert 0.625₁₀ to binary</strong></p>
<p>Multiply by 2 and note integer parts:</p>
<pre>
0.625 × 2 = 1.25  → 1
0.25 × 2 = 0.5    → 0
0.5 × 2 = 1.0     → 1
</pre>
<p>Reading from top to bottom: <strong>0.625₁₀ = 0.101₂</strong></p>`,
        shortDescription: "Learn decimal to binary, octal, and hexadecimal conversions.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Binary, Octal, Hexadecimal to Decimal",
        lessonContent: `<h2>Converting to Decimal</h2>

<h3>Method: Multiply by Place Value</h3>
<p>Multiply each digit by its place value (base raised to position power) and add.</p>

<h3>1. Binary to Decimal:</h3>
<p><strong>Example: Convert 110101₂ to decimal</strong></p>
<p>Position:     5  4  3  2  1  0</p>
<p>Binary:       1  1  0  1  0  1</p>
<p>= 1×2⁵ + 1×2⁴ + 0×2³ + 1×2² + 0×2¹ + 1×2⁰</p>
<p>= 32 + 16 + 0 + 4 + 0 + 1</p>
<p>= <strong>53₁₀</strong></p>

<h3>2. Octal to Decimal:</h3>
<p><strong>Example: Convert 357₈ to decimal</strong></p>
<p>= 3×8² + 5×8¹ + 7×8⁰</p>
<p>= 3×64 + 5×8 + 7×1</p>
<p>= 192 + 40 + 7</p>
<p>= <strong>239₁₀</strong></p>

<h3>3. Hexadecimal to Decimal:</h3>
<p><strong>Example: Convert 2AF₁₆ to decimal</strong></p>
<p>= 2×16² + A×16¹ + F×16⁰</p>
<p>= 2×256 + 10×16 + 15×1</p>
<p>= 512 + 160 + 15</p>
<p>= <strong>687₁₀</strong></p>

<h3>Converting with Fractions:</h3>
<p><strong>Example: Convert 11.01₂ to decimal</strong></p>
<p>Integer part: 11₂ = 1×2¹ + 1×2⁰ = 2 + 1 = 3</p>
<p>Fractional part: .01₂ = 0×2⁻¹ + 1×2⁻² = 0 + 0.25 = 0.25</p>
<p>Result: <strong>3.25₁₀</strong></p>

<h3>Quick Reference Table:</h3>
<table border="1" cellpadding="8">
  <tr><th>Decimal</th><th>Binary</th><th>Octal</th><th>Hex</th></tr>
  <tr><td>0</td><td>0000</td><td>0</td><td>0</td></tr>
  <tr><td>5</td><td>0101</td><td>5</td><td>5</td></tr>
  <tr><td>10</td><td>1010</td><td>12</td><td>A</td></tr>
  <tr><td>15</td><td>1111</td><td>17</td><td>F</td></tr>
  <tr><td>16</td><td>10000</td><td>20</td><td>10</td></tr>
</table>`,
        shortDescription: "Convert binary, octal, and hexadecimal to decimal.",
        order: 3,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Binary-Octal-Hexadecimal Conversions",
        lessonContent: `<h2>Direct Conversions Between Binary, Octal, and Hexadecimal</h2>

<h3>Binary to Octal:</h3>
<p><strong>Rule:</strong> Group binary digits in sets of 3 (from right), then convert each group.</p>

<p><strong>Example: Convert 110101011₂ to octal</strong></p>
<p>Group: 110 | 101 | 011</p>
<p>Convert: 6 | 5 | 3</p>
<p>Result: <strong>653₈</strong></p>

<h3>Octal to Binary:</h3>
<p><strong>Rule:</strong> Convert each octal digit to 3-bit binary.</p>

<p><strong>Example: Convert 472₈ to binary</strong></p>
<p>4 = 100, 7 = 111, 2 = 010</p>
<p>Result: <strong>100111010₂</strong></p>

<h3>Binary to Hexadecimal:</h3>
<p><strong>Rule:</strong> Group binary digits in sets of 4 (from right), then convert each group.</p>

<p><strong>Example: Convert 11010111₂ to hexadecimal</strong></p>
<p>Group: 1101 | 0111</p>
<p>Convert: D | 7</p>
<p>Result: <strong>D7₁₆</strong></p>

<h3>Hexadecimal to Binary:</h3>
<p><strong>Rule:</strong> Convert each hex digit to 4-bit binary.</p>

<p><strong>Example: Convert 3E8₁₆ to binary</strong></p>
<p>3 = 0011, E = 1110, 8 = 1000</p>
<p>Result: <strong>001111101000₂</strong> or <strong>1111101000₂</strong></p>

<h3>Octal to Hexadecimal (via Binary):</h3>
<p><strong>Example: Convert 75₈ to hexadecimal</strong></p>
<p>Step 1: Octal to Binary</p>
<p>7 = 111, 5 = 101 → 111101₂</p>
<p>Step 2: Binary to Hex</p>
<p>Group: 0011 | 1101 → 3D₁₆</p>
<p>Result: <strong>75₈ = 3D₁₆</strong></p>

<h3>Conversion Chart (4-bit):</h3>
<table border="1" cellpadding="6">
  <tr><th>Binary</th><th>Decimal</th><th>Hex</th></tr>
  <tr><td>0000</td><td>0</td><td>0</td></tr>
  <tr><td>0001</td><td>1</td><td>1</td></tr>
  <tr><td>0010</td><td>2</td><td>2</td></tr>
  <tr><td>0011</td><td>3</td><td>3</td></tr>
  <tr><td>0100</td><td>4</td><td>4</td></tr>
  <tr><td>0101</td><td>5</td><td>5</td></tr>
  <tr><td>0110</td><td>6</td><td>6</td></tr>
  <tr><td>0111</td><td>7</td><td>7</td></tr>
  <tr><td>1000</td><td>8</td><td>8</td></tr>
  <tr><td>1001</td><td>9</td><td>9</td></tr>
  <tr><td>1010</td><td>10</td><td>A</td></tr>
  <tr><td>1011</td><td>11</td><td>B</td></tr>
  <tr><td>1100</td><td>12</td><td>C</td></tr>
  <tr><td>1101</td><td>13</td><td>D</td></tr>
  <tr><td>1110</td><td>14</td><td>E</td></tr>
  <tr><td>1111</td><td>15</td><td>F</td></tr>
</table>`,
        shortDescription: "Master direct conversions between binary, octal, and hexadecimal.",
        order: 4,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 3: COMPUTER SOFTWARE
  // ============================================
  {
    title: "Week 3: Computer Software",
    weekNumber: 3,
    description:
      "Learn about system software, application software, and programming languages.",
    order: 3,
    lessons: [
      {
        lessonTitle: "Introduction to Software",
        lessonContent: `<h2>Computer Software</h2>

<p>Software is a set of instructions (programs) that tells the computer what to do. Unlike hardware, software cannot be physically touched.</p>

<h3>Types of Software:</h3>

<h4>1. System Software</h4>
<p>Software that manages and controls computer hardware and provides a platform for running application software.</p>
<ul>
  <li><strong>Operating System:</strong> Windows, Linux, macOS, Android</li>
  <li><strong>Device Drivers:</strong> Printer driver, graphics driver</li>
  <li><strong>Utility Programs:</strong> Antivirus, disk cleaner, backup tools</li>
  <li><strong>Language Translators:</strong> Compiler, interpreter, assembler</li>
</ul>

<h4>2. Application Software</h4>
<p>Software designed for end-users to perform specific tasks.</p>
<ul>
  <li><strong>Word Processors:</strong> MS Word, Google Docs</li>
  <li><strong>Spreadsheets:</strong> MS Excel, Google Sheets</li>
  <li><strong>Presentations:</strong> MS PowerPoint, Google Slides</li>
  <li><strong>Browsers:</strong> Chrome, Firefox, Edge</li>
  <li><strong>Media Players:</strong> VLC, Windows Media Player</li>
  <li><strong>Games:</strong> Entertainment software</li>
</ul>

<h3>Difference Between System and Application Software:</h3>
<table border="1" cellpadding="8">
  <tr><th>System Software</th><th>Application Software</th></tr>
  <tr><td>Manages hardware</td><td>Performs user tasks</td></tr>
  <tr><td>Runs in background</td><td>Runs in foreground</td></tr>
  <tr><td>Essential for computer operation</td><td>Not essential</td></tr>
  <tr><td>General purpose</td><td>Specific purpose</td></tr>
  <tr><td>Example: Windows OS</td><td>Example: MS Word</td></tr>
</table>

<h3>Software Licensing:</h3>
<ul>
  <li><strong>Proprietary Software:</strong> Paid, copyrighted (MS Office)</li>
  <li><strong>Freeware:</strong> Free to use (VLC Player)</li>
  <li><strong>Shareware:</strong> Free trial, then pay (WinRAR)</li>
  <li><strong>Open Source:</strong> Free, source code available (Linux, LibreOffice)</li>
</ul>`,
        shortDescription: "Understand the types and categories of software.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Operating System Concepts",
        lessonContent: `<h2>Operating System (OS)</h2>

<p>An operating system is system software that manages computer hardware, software resources, and provides common services for computer programs.</p>

<h3>Functions of Operating System:</h3>
<ol>
  <li><strong>Process Management:</strong> Controls running programs, multitasking</li>
  <li><strong>Memory Management:</strong> Allocates RAM to programs</li>
  <li><strong>File Management:</strong> Creates, organizes, stores files and folders</li>
  <li><strong>Device Management:</strong> Controls input/output devices through drivers</li>
  <li><strong>Security:</strong> User authentication, access control</li>
  <li><strong>User Interface:</strong> GUI or CLI for user interaction</li>
</ol>

<h3>Types of Operating Systems:</h3>

<h4>1. Based on User Interface:</h4>
<ul>
  <li><strong>CLI (Command Line Interface):</strong> Text commands (MS-DOS, Linux Terminal)</li>
  <li><strong>GUI (Graphical User Interface):</strong> Icons, windows, mouse (Windows, macOS)</li>
</ul>

<h4>2. Based on Users:</h4>
<ul>
  <li><strong>Single-user:</strong> One user at a time (Windows, macOS)</li>
  <li><strong>Multi-user:</strong> Multiple users simultaneously (Linux server, UNIX)</li>
</ul>

<h4>3. Based on Tasks:</h4>
<ul>
  <li><strong>Single-tasking:</strong> One task at a time (MS-DOS)</li>
  <li><strong>Multi-tasking:</strong> Multiple tasks simultaneously (Windows, Linux)</li>
</ul>

<h3>Popular Operating Systems:</h3>
<table border="1" cellpadding="8">
  <tr><th>OS</th><th>Developer</th><th>Used In</th></tr>
  <tr><td>Windows</td><td>Microsoft</td><td>PCs, Laptops</td></tr>
  <tr><td>macOS</td><td>Apple</td><td>Mac computers</td></tr>
  <tr><td>Linux</td><td>Open Source</td><td>Servers, PCs</td></tr>
  <tr><td>Android</td><td>Google</td><td>Smartphones, Tablets</td></tr>
  <tr><td>iOS</td><td>Apple</td><td>iPhone, iPad</td></tr>
</table>

<h3>Booting Process:</h3>
<p>The process of starting a computer and loading the operating system.</p>
<ol>
  <li>Power On → BIOS/UEFI starts</li>
  <li>POST (Power On Self Test)</li>
  <li>Boot loader loads OS</li>
  <li>OS initializes and desktop appears</li>
</ol>`,
        shortDescription: "Learn about operating system functions and types.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Programming Languages",
        lessonContent: `<h2>Programming Languages</h2>

<p>A programming language is a formal language used to write instructions that a computer can execute.</p>

<h3>Levels of Programming Languages:</h3>

<h4>1. Low-Level Languages</h4>
<p>Close to machine code, hardware-dependent.</p>

<p><strong>a) Machine Language (1GL)</strong></p>
<ul>
  <li>Written in binary (0s and 1s)</li>
  <li>Directly understood by computer</li>
  <li>Very difficult to write and debug</li>
  <li>Machine-dependent</li>
</ul>

<p><strong>b) Assembly Language (2GL)</strong></p>
<ul>
  <li>Uses mnemonics (ADD, SUB, MOV)</li>
  <li>Requires assembler to convert to machine code</li>
  <li>Faster than high-level languages</li>
  <li>Still machine-dependent</li>
</ul>

<h4>2. High-Level Languages (3GL)</h4>
<p>Close to human language, machine-independent.</p>
<ul>
  <li>Easy to learn and write</li>
  <li>Requires compiler or interpreter</li>
  <li>Portable across different computers</li>
  <li>Examples: C, C++, Java, Python, JavaScript</li>
</ul>

<h4>3. Fourth Generation Languages (4GL)</h4>
<ul>
  <li>Even closer to natural language</li>
  <li>Used for database queries</li>
  <li>Examples: SQL, MATLAB</li>
</ul>

<h3>Language Translators:</h3>
<table border="1" cellpadding="8">
  <tr><th>Translator</th><th>Function</th><th>Example</th></tr>
  <tr><td><strong>Assembler</strong></td><td>Assembly → Machine code</td><td>MASM, TASM</td></tr>
  <tr><td><strong>Compiler</strong></td><td>Entire HLL → Machine code at once</td><td>GCC (C), javac</td></tr>
  <tr><td><strong>Interpreter</strong></td><td>HLL → Machine code line by line</td><td>Python, JavaScript</td></tr>
</table>

<h3>Compiler vs Interpreter:</h3>
<table border="1" cellpadding="8">
  <tr><th>Compiler</th><th>Interpreter</th></tr>
  <tr><td>Translates entire program at once</td><td>Translates line by line</td></tr>
  <tr><td>Faster execution</td><td>Slower execution</td></tr>
  <tr><td>Shows all errors after compilation</td><td>Shows errors one at a time</td></tr>
  <tr><td>Creates executable file</td><td>No executable file created</td></tr>
  <tr><td>C, C++, Java</td><td>Python, JavaScript, PHP</td></tr>
</table>`,
        shortDescription: "Understand programming languages and translators.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 4: MS WORD
  // ============================================
  {
    title: "Week 4: Word Processing - MS Word",
    weekNumber: 4,
    description:
      "Master Microsoft Word for creating, formatting, and editing documents.",
    order: 4,
    lessons: [
      {
        lessonTitle: "Introduction to MS Word",
        lessonContent: `<h2>Microsoft Word</h2>

<p>Microsoft Word is a word processing application used to create, edit, format, and print documents.</p>

<h3>Starting MS Word:</h3>
<ul>
  <li>Click Start → Microsoft Office → Microsoft Word</li>
  <li>Or search "Word" in Windows search</li>
  <li>Or double-click a .docx file</li>
</ul>

<h3>MS Word Interface:</h3>
<ul>
  <li><strong>Title Bar:</strong> Shows document name and application name</li>
  <li><strong>Ribbon:</strong> Contains tabs with commands (Home, Insert, Layout, etc.)</li>
  <li><strong>Quick Access Toolbar:</strong> Common commands (Save, Undo, Redo)</li>
  <li><strong>Ruler:</strong> Shows margins and indents</li>
  <li><strong>Document Area:</strong> Where you type content</li>
  <li><strong>Status Bar:</strong> Shows page number, word count, zoom</li>
  <li><strong>Scroll Bars:</strong> Navigate through document</li>
</ul>

<h3>File Operations:</h3>
<table border="1" cellpadding="8">
  <tr><th>Operation</th><th>Shortcut</th><th>Menu</th></tr>
  <tr><td>New Document</td><td>Ctrl + N</td><td>File → New</td></tr>
  <tr><td>Open</td><td>Ctrl + O</td><td>File → Open</td></tr>
  <tr><td>Save</td><td>Ctrl + S</td><td>File → Save</td></tr>
  <tr><td>Save As</td><td>F12</td><td>File → Save As</td></tr>
  <tr><td>Print</td><td>Ctrl + P</td><td>File → Print</td></tr>
  <tr><td>Close</td><td>Ctrl + W</td><td>File → Close</td></tr>
</table>

<h3>File Extensions:</h3>
<ul>
  <li><strong>.docx</strong> - Word 2007 and later (default)</li>
  <li><strong>.doc</strong> - Word 97-2003</li>
  <li><strong>.pdf</strong> - Portable Document Format</li>
  <li><strong>.rtf</strong> - Rich Text Format</li>
  <li><strong>.txt</strong> - Plain text</li>
</ul>

<h3>Views in MS Word:</h3>
<ul>
  <li><strong>Print Layout:</strong> Shows how document will print (default)</li>
  <li><strong>Read Mode:</strong> For reading documents</li>
  <li><strong>Web Layout:</strong> For web pages</li>
  <li><strong>Outline:</strong> Shows document structure</li>
  <li><strong>Draft:</strong> Basic text editing view</li>
</ul>`,
        shortDescription: "Get started with MS Word interface and basic operations.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Text Formatting in MS Word",
        lessonContent: `<h2>Text Formatting</h2>

<h3>Basic Formatting (Home Tab):</h3>

<h4>Font Formatting:</h4>
<table border="1" cellpadding="8">
  <tr><th>Format</th><th>Shortcut</th><th>Description</th></tr>
  <tr><td><strong>Bold</strong></td><td>Ctrl + B</td><td>Makes text thicker</td></tr>
  <tr><td><em>Italic</em></td><td>Ctrl + I</td><td>Slants text</td></tr>
  <tr><td><u>Underline</u></td><td>Ctrl + U</td><td>Line under text</td></tr>
  <tr><td>Strikethrough</td><td>-</td><td>Line through text</td></tr>
  <tr><td>Subscript</td><td>Ctrl + =</td><td>H₂O</td></tr>
  <tr><td>Superscript</td><td>Ctrl + Shift + =</td><td>x²</td></tr>
</table>

<h4>Font Options:</h4>
<ul>
  <li><strong>Font Face:</strong> Arial, Times New Roman, Calibri</li>
  <li><strong>Font Size:</strong> 8, 10, 11, 12, 14, 16, etc. (points)</li>
  <li><strong>Font Color:</strong> Change text color</li>
  <li><strong>Highlight:</strong> Background color for text</li>
</ul>

<h3>Paragraph Formatting:</h3>

<h4>Alignment:</h4>
<ul>
  <li><strong>Left Align:</strong> Ctrl + L (default)</li>
  <li><strong>Center:</strong> Ctrl + E</li>
  <li><strong>Right Align:</strong> Ctrl + R</li>
  <li><strong>Justify:</strong> Ctrl + J (even margins)</li>
</ul>

<h4>Line Spacing:</h4>
<ul>
  <li>Single (1.0)</li>
  <li>1.5 lines</li>
  <li>Double (2.0)</li>
  <li>Custom spacing</li>
</ul>

<h4>Indentation:</h4>
<ul>
  <li><strong>First Line Indent:</strong> First line starts inside</li>
  <li><strong>Hanging Indent:</strong> All lines except first start inside</li>
  <li><strong>Left/Right Indent:</strong> Entire paragraph moves</li>
</ul>

<h3>Lists:</h3>
<ul>
  <li><strong>Bullets:</strong> Unordered list (•, ○, ■)</li>
  <li><strong>Numbering:</strong> Ordered list (1, 2, 3 or a, b, c)</li>
  <li><strong>Multilevel List:</strong> Nested lists with different levels</li>
</ul>

<h3>Format Painter:</h3>
<p>Copy formatting from one text to another.</p>
<ol>
  <li>Select formatted text</li>
  <li>Click Format Painter (brush icon)</li>
  <li>Select text to apply formatting</li>
</ol>`,
        shortDescription: "Master text and paragraph formatting in MS Word.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Tables and Objects in MS Word",
        lessonContent: `<h2>Working with Tables</h2>

<h3>Inserting a Table:</h3>
<ol>
  <li>Go to Insert tab → Table</li>
  <li>Select rows and columns from grid</li>
  <li>Or choose "Insert Table" for custom size</li>
</ol>

<h3>Table Operations:</h3>
<ul>
  <li><strong>Add Row:</strong> Right-click → Insert → Insert Rows Above/Below</li>
  <li><strong>Add Column:</strong> Right-click → Insert → Insert Columns Left/Right</li>
  <li><strong>Delete Row/Column:</strong> Right-click → Delete → Delete Rows/Columns</li>
  <li><strong>Merge Cells:</strong> Select cells → Right-click → Merge Cells</li>
  <li><strong>Split Cells:</strong> Right-click → Split Cells</li>
</ul>

<h3>Table Formatting:</h3>
<ul>
  <li><strong>Table Styles:</strong> Pre-designed formats</li>
  <li><strong>Borders and Shading:</strong> Customize cell borders</li>
  <li><strong>Cell Alignment:</strong> Align text within cells</li>
  <li><strong>AutoFit:</strong> Adjust column width automatically</li>
</ul>

<h2>Inserting Objects</h2>

<h3>Pictures:</h3>
<ol>
  <li>Insert → Pictures → Choose from computer</li>
  <li>Or Insert → Online Pictures</li>
  <li>Resize using corner handles</li>
  <li>Use Picture Format tab for effects</li>
</ol>

<h3>Shapes:</h3>
<p>Insert → Shapes → Choose shape (rectangles, arrows, flowchart symbols)</p>

<h3>Text Box:</h3>
<p>Insert → Text Box → Draw or choose style</p>

<h3>WordArt:</h3>
<p>Insert → WordArt → Choose style for decorative text</p>

<h3>Charts:</h3>
<p>Insert → Chart → Select chart type (Column, Pie, Line, Bar)</p>

<h3>Page Break:</h3>
<p>Ctrl + Enter - Starts a new page</p>

<h3>Header and Footer:</h3>
<ul>
  <li>Insert → Header/Footer</li>
  <li>Add page numbers, date, document title</li>
  <li>Different first page option available</li>
</ul>`,
        shortDescription: "Learn to work with tables, images, and other objects.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Advanced Features in MS Word",
        lessonContent: `<h2>Advanced MS Word Features</h2>

<h3>Find and Replace:</h3>
<ul>
  <li><strong>Find:</strong> Ctrl + F - Search for text</li>
  <li><strong>Replace:</strong> Ctrl + H - Find and replace text</li>
  <li><strong>Go To:</strong> Ctrl + G - Navigate to specific page</li>
</ul>

<h3>Spelling and Grammar Check:</h3>
<ul>
  <li>F7 or Review → Spelling & Grammar</li>
  <li>Red underline = Spelling error</li>
  <li>Blue underline = Grammar error</li>
  <li>Right-click for suggestions</li>
</ul>

<h3>Page Setup (Layout Tab):</h3>
<ul>
  <li><strong>Margins:</strong> Normal, Narrow, Wide, Custom</li>
  <li><strong>Orientation:</strong> Portrait (vertical) or Landscape (horizontal)</li>
  <li><strong>Size:</strong> A4, Letter, Legal, etc.</li>
  <li><strong>Columns:</strong> Single, two, three columns</li>
</ul>

<h3>Mail Merge:</h3>
<p>Create personalized documents for multiple recipients.</p>
<ol>
  <li>Mailings → Start Mail Merge</li>
  <li>Select Recipients (from Excel or create new)</li>
  <li>Insert Merge Fields (Name, Address)</li>
  <li>Preview Results</li>
  <li>Finish & Merge</li>
</ol>

<h3>Table of Contents:</h3>
<ol>
  <li>Apply Heading styles to section titles</li>
  <li>References → Table of Contents</li>
  <li>Choose style</li>
  <li>Update table after making changes</li>
</ol>

<h3>Track Changes:</h3>
<p>Review → Track Changes - Shows all edits made to document</p>
<ul>
  <li>Accept or Reject changes</li>
  <li>Add comments for reviewers</li>
</ul>

<h3>Important Keyboard Shortcuts:</h3>
<table border="1" cellpadding="8">
  <tr><th>Shortcut</th><th>Action</th></tr>
  <tr><td>Ctrl + A</td><td>Select All</td></tr>
  <tr><td>Ctrl + C</td><td>Copy</td></tr>
  <tr><td>Ctrl + X</td><td>Cut</td></tr>
  <tr><td>Ctrl + V</td><td>Paste</td></tr>
  <tr><td>Ctrl + Z</td><td>Undo</td></tr>
  <tr><td>Ctrl + Y</td><td>Redo</td></tr>
  <tr><td>Ctrl + Home</td><td>Go to beginning</td></tr>
  <tr><td>Ctrl + End</td><td>Go to end</td></tr>
</table>`,
        shortDescription: "Master advanced features like mail merge and track changes.",
        order: 4,
        duration: 45,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 5: MS EXCEL
  // ============================================
  {
    title: "Week 5: Spreadsheet - MS Excel",
    weekNumber: 5,
    description:
      "Learn Microsoft Excel for data entry, formulas, functions, and charts.",
    order: 5,
    lessons: [
      {
        lessonTitle: "Introduction to MS Excel",
        lessonContent: `<h2>Microsoft Excel</h2>

<p>Microsoft Excel is a spreadsheet application used for organizing, calculating, and analyzing data.</p>

<h3>Excel Interface:</h3>
<ul>
  <li><strong>Workbook:</strong> An Excel file (.xlsx)</li>
  <li><strong>Worksheet/Sheet:</strong> Individual pages in a workbook (Sheet1, Sheet2...)</li>
  <li><strong>Cell:</strong> Intersection of row and column (basic unit)</li>
  <li><strong>Row:</strong> Horizontal line (numbered 1, 2, 3...)</li>
  <li><strong>Column:</strong> Vertical line (lettered A, B, C...)</li>
  <li><strong>Cell Address:</strong> Column letter + Row number (e.g., A1, B5, C10)</li>
</ul>

<h3>Excel Specifications:</h3>
<ul>
  <li>Columns: A to XFD (16,384 columns)</li>
  <li>Rows: 1 to 1,048,576 rows</li>
  <li>Sheets: Multiple worksheets per workbook</li>
</ul>

<h3>Navigating in Excel:</h3>
<table border="1" cellpadding="8">
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td>Arrow Keys</td><td>Move one cell</td></tr>
  <tr><td>Tab</td><td>Move to next cell (right)</td></tr>
  <tr><td>Enter</td><td>Move to next cell (down)</td></tr>
  <tr><td>Ctrl + Home</td><td>Go to cell A1</td></tr>
  <tr><td>Ctrl + End</td><td>Go to last used cell</td></tr>
  <tr><td>Ctrl + G</td><td>Go To dialog</td></tr>
</table>

<h3>Data Types in Excel:</h3>
<ul>
  <li><strong>Text/Labels:</strong> Names, descriptions (left-aligned by default)</li>
  <li><strong>Numbers:</strong> Numeric values (right-aligned by default)</li>
  <li><strong>Formulas:</strong> Start with = sign</li>
  <li><strong>Dates:</strong> Stored as numbers internally</li>
</ul>

<h3>Selecting Cells:</h3>
<ul>
  <li><strong>Single Cell:</strong> Click on cell</li>
  <li><strong>Range:</strong> Click and drag, or Shift + Click</li>
  <li><strong>Entire Row:</strong> Click row number</li>
  <li><strong>Entire Column:</strong> Click column letter</li>
  <li><strong>All Cells:</strong> Ctrl + A</li>
  <li><strong>Non-adjacent:</strong> Hold Ctrl while clicking</li>
</ul>

<h3>Cell Range Notation:</h3>
<p>A1:C5 means all cells from A1 to C5 (rectangular block)</p>`,
        shortDescription: "Get started with Excel interface and basic concepts.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Formulas and Basic Functions",
        lessonContent: `<h2>Excel Formulas</h2>

<p>A formula is an expression that calculates values. All formulas start with = sign.</p>

<h3>Arithmetic Operators:</h3>
<table border="1" cellpadding="8">
  <tr><th>Operator</th><th>Operation</th><th>Example</th></tr>
  <tr><td>+</td><td>Addition</td><td>=A1+B1</td></tr>
  <tr><td>-</td><td>Subtraction</td><td>=A1-B1</td></tr>
  <tr><td>*</td><td>Multiplication</td><td>=A1*B1</td></tr>
  <tr><td>/</td><td>Division</td><td>=A1/B1</td></tr>
  <tr><td>^</td><td>Exponent (Power)</td><td>=A1^2</td></tr>
  <tr><td>%</td><td>Percentage</td><td>=A1*10%</td></tr>
</table>

<h3>Order of Operations (BODMAS/PEMDAS):</h3>
<p>Parentheses → Exponents → Multiplication/Division → Addition/Subtraction</p>
<p>Example: =5+3*2 results in 11 (not 16)</p>
<p>Example: =(5+3)*2 results in 16</p>

<h3>Cell References:</h3>
<ul>
  <li><strong>Relative Reference (A1):</strong> Changes when formula is copied</li>
  <li><strong>Absolute Reference ($A$1):</strong> Does not change when copied</li>
  <li><strong>Mixed Reference ($A1 or A$1):</strong> Partially fixed</li>
</ul>

<h3>Basic Functions:</h3>

<h4>SUM - Adds values</h4>
<p><code>=SUM(A1:A10)</code> - Adds all values from A1 to A10</p>
<p><code>=SUM(A1,B1,C1)</code> - Adds specific cells</p>

<h4>AVERAGE - Calculates mean</h4>
<p><code>=AVERAGE(A1:A10)</code></p>

<h4>MAX - Finds largest value</h4>
<p><code>=MAX(A1:A10)</code></p>

<h4>MIN - Finds smallest value</h4>
<p><code>=MIN(A1:A10)</code></p>

<h4>COUNT - Counts cells with numbers</h4>
<p><code>=COUNT(A1:A10)</code></p>

<h4>COUNTA - Counts non-empty cells</h4>
<p><code>=COUNTA(A1:A10)</code></p>

<h3>Example:</h3>
<p>If A1=10, A2=20, A3=30</p>
<ul>
  <li>=SUM(A1:A3) → 60</li>
  <li>=AVERAGE(A1:A3) → 20</li>
  <li>=MAX(A1:A3) → 30</li>
  <li>=MIN(A1:A3) → 10</li>
  <li>=COUNT(A1:A3) → 3</li>
</ul>`,
        shortDescription: "Learn Excel formulas and basic functions.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Advanced Functions in Excel",
        lessonContent: `<h2>Advanced Excel Functions</h2>

<h3>IF Function (Logical Test):</h3>
<p><code>=IF(condition, value_if_true, value_if_false)</code></p>

<p><strong>Example 1:</strong></p>
<p><code>=IF(A1>=40, "Pass", "Fail")</code></p>
<p>If A1 is 50, result is "Pass"</p>

<p><strong>Example 2:</strong></p>
<p><code>=IF(A1>=80, "A", IF(A1>=60, "B", IF(A1>=40, "C", "F")))</code></p>
<p>Nested IF for multiple conditions (grading)</p>

<h3>Comparison Operators:</h3>
<table border="1" cellpadding="8">
  <tr><th>Operator</th><th>Meaning</th></tr>
  <tr><td>=</td><td>Equal to</td></tr>
  <tr><td><></td><td>Not equal to</td></tr>
  <tr><td>></td><td>Greater than</td></tr>
  <tr><td><</td><td>Less than</td></tr>
  <tr><td>>=</td><td>Greater than or equal</td></tr>
  <tr><td><=</td><td>Less than or equal</td></tr>
</table>

<h3>SUMIF - Conditional Sum:</h3>
<p><code>=SUMIF(range, criteria, sum_range)</code></p>
<p>Example: <code>=SUMIF(A1:A10, ">50", B1:B10)</code></p>
<p>Sums B values where corresponding A values are greater than 50</p>

<h3>COUNTIF - Conditional Count:</h3>
<p><code>=COUNTIF(range, criteria)</code></p>
<p>Example: <code>=COUNTIF(A1:A10, "Pass")</code></p>
<p>Counts cells containing "Pass"</p>

<h3>ROUND Function:</h3>
<p><code>=ROUND(number, decimal_places)</code></p>
<p>=ROUND(3.14159, 2) → 3.14</p>

<h3>Text Functions:</h3>
<ul>
  <li><code>=LEN(A1)</code> - Length of text</li>
  <li><code>=UPPER(A1)</code> - Converts to uppercase</li>
  <li><code>=LOWER(A1)</code> - Converts to lowercase</li>
  <li><code>=PROPER(A1)</code> - Capitalizes first letter</li>
  <li><code>=CONCATENATE(A1,B1)</code> or <code>=A1&B1</code> - Joins text</li>
  <li><code>=LEFT(A1,3)</code> - First 3 characters</li>
  <li><code>=RIGHT(A1,3)</code> - Last 3 characters</li>
</ul>

<h3>Date Functions:</h3>
<ul>
  <li><code>=TODAY()</code> - Current date</li>
  <li><code>=NOW()</code> - Current date and time</li>
  <li><code>=YEAR(A1)</code> - Extracts year</li>
  <li><code>=MONTH(A1)</code> - Extracts month</li>
  <li><code>=DAY(A1)</code> - Extracts day</li>
</ul>`,
        shortDescription: "Master IF functions and other advanced Excel functions.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Charts and Formatting in Excel",
        lessonContent: `<h2>Creating Charts</h2>

<h3>Steps to Create a Chart:</h3>
<ol>
  <li>Select the data (including headers)</li>
  <li>Go to Insert tab → Charts</li>
  <li>Choose chart type</li>
  <li>Customize using Chart Design and Format tabs</li>
</ol>

<h3>Types of Charts:</h3>
<ul>
  <li><strong>Column Chart:</strong> Vertical bars, compare values across categories</li>
  <li><strong>Bar Chart:</strong> Horizontal bars, similar to column</li>
  <li><strong>Line Chart:</strong> Shows trends over time</li>
  <li><strong>Pie Chart:</strong> Shows parts of a whole (percentages)</li>
  <li><strong>Area Chart:</strong> Like line chart with filled area</li>
  <li><strong>Scatter (XY) Chart:</strong> Shows relationship between two variables</li>
</ul>

<h3>Chart Elements:</h3>
<ul>
  <li><strong>Chart Title:</strong> Name of the chart</li>
  <li><strong>Axis Titles:</strong> Labels for X and Y axes</li>
  <li><strong>Legend:</strong> Identifies data series</li>
  <li><strong>Data Labels:</strong> Values shown on chart</li>
  <li><strong>Gridlines:</strong> Help read values</li>
</ul>

<h2>Cell Formatting</h2>

<h3>Number Formats:</h3>
<ul>
  <li><strong>General:</strong> Default format</li>
  <li><strong>Number:</strong> With decimal places</li>
  <li><strong>Currency:</strong> With Rs. or $ symbol</li>
  <li><strong>Percentage:</strong> Multiplies by 100 and adds %</li>
  <li><strong>Date:</strong> Various date formats</li>
  <li><strong>Text:</strong> Treats as text even if numbers</li>
</ul>

<h3>Cell Formatting Options:</h3>
<ul>
  <li><strong>Merge & Center:</strong> Combines cells</li>
  <li><strong>Wrap Text:</strong> Text goes to next line within cell</li>
  <li><strong>Borders:</strong> Add lines around cells</li>
  <li><strong>Fill Color:</strong> Background color</li>
  <li><strong>Column Width/Row Height:</strong> Resize cells</li>
</ul>

<h3>Conditional Formatting:</h3>
<p>Format cells based on their values.</p>
<ul>
  <li>Home → Conditional Formatting</li>
  <li>Highlight cells greater than/less than value</li>
  <li>Color scales (gradient)</li>
  <li>Data bars (mini bar charts in cells)</li>
  <li>Icon sets (arrows, flags)</li>
</ul>

<h3>Sorting and Filtering:</h3>
<ul>
  <li><strong>Sort:</strong> Arrange data (A-Z, Z-A, smallest to largest)</li>
  <li><strong>Filter:</strong> Show only specific data (Data → Filter)</li>
</ul>`,
        shortDescription: "Learn to create charts and format data in Excel.",
        order: 4,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 6: MS POWERPOINT
  // ============================================
  {
    title: "Week 6: Presentation - MS PowerPoint",
    weekNumber: 6,
    description:
      "Create engaging presentations with Microsoft PowerPoint.",
    order: 6,
    lessons: [
      {
        lessonTitle: "Introduction to MS PowerPoint",
        lessonContent: `<h2>Microsoft PowerPoint</h2>

<p>Microsoft PowerPoint is a presentation software used to create slideshows with text, images, animations, and multimedia.</p>

<h3>PowerPoint Terms:</h3>
<ul>
  <li><strong>Presentation:</strong> A PowerPoint file (.pptx)</li>
  <li><strong>Slide:</strong> A single page in a presentation</li>
  <li><strong>Slide Show:</strong> Running the presentation full screen</li>
  <li><strong>Template:</strong> Pre-designed presentation format</li>
  <li><strong>Theme:</strong> Coordinated colors, fonts, and effects</li>
</ul>

<h3>PowerPoint Interface:</h3>
<ul>
  <li><strong>Slide Panel:</strong> Shows current slide (center)</li>
  <li><strong>Thumbnail Pane:</strong> Shows all slides (left)</li>
  <li><strong>Notes Pane:</strong> Speaker notes (bottom)</li>
  <li><strong>Ribbon:</strong> Commands organized in tabs</li>
  <li><strong>Status Bar:</strong> Slide number, view buttons</li>
</ul>

<h3>Creating a New Presentation:</h3>
<ol>
  <li>File → New</li>
  <li>Choose Blank Presentation or Template</li>
  <li>Add content to slides</li>
</ol>

<h3>Slide Layouts:</h3>
<ul>
  <li><strong>Title Slide:</strong> For first slide</li>
  <li><strong>Title and Content:</strong> Heading with bullet points</li>
  <li><strong>Two Content:</strong> Side-by-side content</li>
  <li><strong>Comparison:</strong> Compare two items</li>
  <li><strong>Blank:</strong> Empty slide</li>
  <li><strong>Section Header:</strong> Divides presentation sections</li>
</ul>

<h3>Working with Slides:</h3>
<table border="1" cellpadding="8">
  <tr><th>Action</th><th>Method</th></tr>
  <tr><td>New Slide</td><td>Ctrl + M or Home → New Slide</td></tr>
  <tr><td>Duplicate Slide</td><td>Ctrl + D</td></tr>
  <tr><td>Delete Slide</td><td>Select and press Delete</td></tr>
  <tr><td>Move Slide</td><td>Drag in thumbnail pane</td></tr>
  <tr><td>Change Layout</td><td>Home → Layout</td></tr>
</table>

<h3>Presentation Views:</h3>
<ul>
  <li><strong>Normal:</strong> Edit slides (default)</li>
  <li><strong>Outline:</strong> Text-only view</li>
  <li><strong>Slide Sorter:</strong> Rearrange slides</li>
  <li><strong>Notes Page:</strong> Slide with notes</li>
  <li><strong>Reading View:</strong> Preview presentation</li>
</ul>`,
        shortDescription: "Get started with PowerPoint interface and slides.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Designing Slides",
        lessonContent: `<h2>Slide Design</h2>

<h3>Adding Text:</h3>
<ul>
  <li>Click on placeholder and type</li>
  <li>Or Insert → Text Box → Draw and type</li>
  <li>Format using Home tab (font, size, color)</li>
</ul>

<h3>Adding Images:</h3>
<ol>
  <li>Insert → Pictures → Choose source</li>
  <li>From device, stock images, or online</li>
  <li>Resize using corner handles</li>
  <li>Use Picture Format tab for effects</li>
</ol>

<h3>Adding Shapes:</h3>
<ol>
  <li>Insert → Shapes</li>
  <li>Choose shape and draw</li>
  <li>Add text by clicking inside shape</li>
  <li>Format fill, outline, effects</li>
</ol>

<h3>SmartArt:</h3>
<p>Insert → SmartArt - Create diagrams easily</p>
<ul>
  <li><strong>List:</strong> Show non-sequential information</li>
  <li><strong>Process:</strong> Show steps in a process</li>
  <li><strong>Cycle:</strong> Show continuous cycle</li>
  <li><strong>Hierarchy:</strong> Show organizational chart</li>
  <li><strong>Relationship:</strong> Show connections</li>
  <li><strong>Pyramid:</strong> Show proportional relationships</li>
</ul>

<h3>Design Tab:</h3>
<ul>
  <li><strong>Themes:</strong> Pre-designed look for entire presentation</li>
  <li><strong>Variants:</strong> Color variations of themes</li>
  <li><strong>Format Background:</strong> Custom slide backgrounds
    <ul>
      <li>Solid fill</li>
      <li>Gradient fill</li>
      <li>Picture or texture</li>
      <li>Pattern fill</li>
    </ul>
  </li>
  <li><strong>Slide Size:</strong> Standard (4:3) or Widescreen (16:9)</li>
</ul>

<h3>Adding Tables and Charts:</h3>
<ul>
  <li>Insert → Table → Select rows and columns</li>
  <li>Insert → Chart → Choose chart type</li>
  <li>Data can be edited in mini Excel window</li>
</ul>

<h3>Slide Master:</h3>
<p>View → Slide Master</p>
<p>Edit master to change all slides at once (logo, footer, fonts)</p>`,
        shortDescription: "Learn to design professional slides with various elements.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Animations and Transitions",
        lessonContent: `<h2>Slide Transitions</h2>

<p>Transitions are effects when moving from one slide to another.</p>

<h3>Adding Transitions:</h3>
<ol>
  <li>Select slide in thumbnail pane</li>
  <li>Go to Transitions tab</li>
  <li>Choose transition effect</li>
  <li>Set duration and sound (optional)</li>
</ol>

<h3>Transition Categories:</h3>
<ul>
  <li><strong>Subtle:</strong> Fade, Push, Wipe</li>
  <li><strong>Exciting:</strong> Flip, Cube, Zoom</li>
  <li><strong>Dynamic Content:</strong> Pan, Ferris Wheel</li>
</ul>

<h3>Transition Options:</h3>
<ul>
  <li><strong>Effect Options:</strong> Direction of transition</li>
  <li><strong>Duration:</strong> How long the transition takes</li>
  <li><strong>Sound:</strong> Add sound effect</li>
  <li><strong>Advance Slide:</strong> On mouse click or after time</li>
  <li><strong>Apply to All:</strong> Same transition for all slides</li>
</ul>

<h2>Animations</h2>

<p>Animations control how objects appear, move, or disappear on a slide.</p>

<h3>Animation Types:</h3>
<ul>
  <li><strong>Entrance:</strong> How object appears (Fade, Fly In, Zoom)</li>
  <li><strong>Emphasis:</strong> Draw attention (Pulse, Spin, Grow)</li>
  <li><strong>Exit:</strong> How object disappears (Fade Out, Fly Out)</li>
  <li><strong>Motion Paths:</strong> Object moves along a path</li>
</ul>

<h3>Adding Animation:</h3>
<ol>
  <li>Select object</li>
  <li>Go to Animations tab</li>
  <li>Choose animation effect</li>
  <li>Adjust options (direction, duration)</li>
</ol>

<h3>Animation Pane:</h3>
<p>Animations → Animation Pane</p>
<ul>
  <li>See all animations on slide</li>
  <li>Reorder animations</li>
  <li>Set timing (Start: On Click, With Previous, After Previous)</li>
  <li>Adjust duration and delay</li>
</ul>

<h3>Animation Tips:</h3>
<ul>
  <li>Don't overuse animations</li>
  <li>Keep animations consistent</li>
  <li>Use meaningful animations that support content</li>
  <li>Test timing before presenting</li>
</ul>`,
        shortDescription: "Add transitions between slides and animations to objects.",
        order: 3,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Running and Sharing Presentations",
        lessonContent: `<h2>Slide Show</h2>

<h3>Starting Slide Show:</h3>
<ul>
  <li><strong>From Beginning:</strong> F5 or Slide Show → From Beginning</li>
  <li><strong>From Current Slide:</strong> Shift + F5 or From Current Slide</li>
</ul>

<h3>Navigating During Slide Show:</h3>
<table border="1" cellpadding="8">
  <tr><th>Key</th><th>Action</th></tr>
  <tr><td>Left Click / Enter / Space</td><td>Next slide</td></tr>
  <tr><td>Right Click / Backspace</td><td>Previous slide</td></tr>
  <tr><td>Number + Enter</td><td>Go to specific slide</td></tr>
  <tr><td>B</td><td>Black screen</td></tr>
  <tr><td>W</td><td>White screen</td></tr>
  <tr><td>Esc</td><td>End slide show</td></tr>
</table>

<h3>Presenter View:</h3>
<p>Shows notes and next slide to presenter while audience sees only current slide.</p>
<ul>
  <li>Requires two monitors or projector</li>
  <li>Slide Show → Use Presenter View</li>
</ul>

<h3>Recording Narration:</h3>
<ol>
  <li>Slide Show → Record Slide Show</li>
  <li>Record voice narration and timings</li>
  <li>Useful for self-running presentations</li>
</ol>

<h2>Saving and Sharing</h2>

<h3>File Formats:</h3>
<ul>
  <li><strong>.pptx:</strong> Standard PowerPoint format</li>
  <li><strong>.ppt:</strong> PowerPoint 97-2003</li>
  <li><strong>.ppsx:</strong> Opens directly in slide show</li>
  <li><strong>.pdf:</strong> For sharing (not editable)</li>
  <li><strong>.mp4:</strong> Export as video</li>
</ul>

<h3>Exporting:</h3>
<ul>
  <li>File → Export → Create PDF</li>
  <li>File → Export → Create Video</li>
  <li>File → Export → Create Handouts (to Word)</li>
</ul>

<h3>Printing:</h3>
<ul>
  <li>File → Print</li>
  <li><strong>Full Page Slides:</strong> One slide per page</li>
  <li><strong>Notes Pages:</strong> Slide with notes</li>
  <li><strong>Outline:</strong> Text only</li>
  <li><strong>Handouts:</strong> Multiple slides per page (1, 2, 3, 4, 6, or 9)</li>
</ul>

<h3>Sharing Online:</h3>
<ul>
  <li>Save to OneDrive for online access</li>
  <li>Share link for viewing or editing</li>
  <li>Collaborate in real-time with others</li>
</ul>`,
        shortDescription: "Learn to present, export, and share your presentations.",
        order: 4,
        duration: 40,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 7: WEB TECHNOLOGY - HTML
  // ============================================
  {
    title: "Week 7: Web Technology - HTML Basics",
    weekNumber: 7,
    description:
      "Learn HTML fundamentals to create web pages.",
    order: 7,
    lessons: [
      {
        lessonTitle: "Introduction to Web and HTML",
        lessonContent: `<h2>Introduction to Web Technology</h2>

<h3>Basic Terms:</h3>
<ul>
  <li><strong>Internet:</strong> Global network of computers</li>
  <li><strong>World Wide Web (WWW):</strong> Collection of web pages accessible via internet</li>
  <li><strong>Web Page:</strong> A document on the web (HTML file)</li>
  <li><strong>Website:</strong> Collection of related web pages</li>
  <li><strong>Web Browser:</strong> Software to view web pages (Chrome, Firefox, Edge)</li>
  <li><strong>URL:</strong> Web address (https://www.example.com)</li>
  <li><strong>HTTP/HTTPS:</strong> Protocol for transferring web pages</li>
</ul>

<h3>What is HTML?</h3>
<p><strong>HTML</strong> = HyperText Markup Language</p>
<ul>
  <li>Standard language for creating web pages</li>
  <li>Uses tags to structure content</li>
  <li>Not a programming language (markup language)</li>
  <li>Files have .html or .htm extension</li>
</ul>

<h3>HTML Document Structure:</h3>
<pre>
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;Page Title&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    Content goes here
&lt;/body&gt;
&lt;/html&gt;
</pre>

<h3>Explanation:</h3>
<ul>
  <li><code>&lt;!DOCTYPE html&gt;</code> - Declares HTML5 document</li>
  <li><code>&lt;html&gt;</code> - Root element</li>
  <li><code>&lt;head&gt;</code> - Contains meta information, title</li>
  <li><code>&lt;title&gt;</code> - Shows in browser tab</li>
  <li><code>&lt;body&gt;</code> - Contains visible content</li>
</ul>

<h3>HTML Tags:</h3>
<ul>
  <li>Tags are enclosed in angle brackets: <code>&lt;tagname&gt;</code></li>
  <li>Most tags have opening and closing tags: <code>&lt;p&gt;...&lt;/p&gt;</code></li>
  <li>Some tags are self-closing: <code>&lt;br&gt;</code>, <code>&lt;hr&gt;</code>, <code>&lt;img&gt;</code></li>
  <li>Tags can have attributes: <code>&lt;img src="photo.jpg"&gt;</code></li>
</ul>

<h3>Creating Your First HTML Page:</h3>
<ol>
  <li>Open Notepad or any text editor</li>
  <li>Type HTML code</li>
  <li>Save as filename.html</li>
  <li>Open in web browser to view</li>
</ol>`,
        shortDescription: "Learn web basics and HTML document structure.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "HTML Text Formatting Tags",
        lessonContent: `<h2>HTML Text Tags</h2>

<h3>Heading Tags:</h3>
<p>HTML has 6 heading levels (h1 is largest, h6 is smallest).</p>
<pre>
&lt;h1&gt;Heading 1&lt;/h1&gt;
&lt;h2&gt;Heading 2&lt;/h2&gt;
&lt;h3&gt;Heading 3&lt;/h3&gt;
&lt;h4&gt;Heading 4&lt;/h4&gt;
&lt;h5&gt;Heading 5&lt;/h5&gt;
&lt;h6&gt;Heading 6&lt;/h6&gt;
</pre>

<h3>Paragraph Tag:</h3>
<p><code>&lt;p&gt;This is a paragraph.&lt;/p&gt;</code></p>
<p>Browsers add space before and after paragraphs.</p>

<h3>Line Break and Horizontal Rule:</h3>
<ul>
  <li><code>&lt;br&gt;</code> - Line break (new line)</li>
  <li><code>&lt;hr&gt;</code> - Horizontal rule (line)</li>
</ul>

<h3>Text Formatting Tags:</h3>
<table border="1" cellpadding="8">
  <tr><th>Tag</th><th>Purpose</th><th>Example</th></tr>
  <tr><td>&lt;b&gt;</td><td>Bold text</td><td><b>Bold</b></td></tr>
  <tr><td>&lt;strong&gt;</td><td>Important text (bold)</td><td><strong>Strong</strong></td></tr>
  <tr><td>&lt;i&gt;</td><td>Italic text</td><td><i>Italic</i></td></tr>
  <tr><td>&lt;em&gt;</td><td>Emphasized (italic)</td><td><em>Emphasis</em></td></tr>
  <tr><td>&lt;u&gt;</td><td>Underlined text</td><td><u>Underline</u></td></tr>
  <tr><td>&lt;s&gt;</td><td>Strikethrough</td><td><s>Strike</s></td></tr>
  <tr><td>&lt;sup&gt;</td><td>Superscript</td><td>x<sup>2</sup></td></tr>
  <tr><td>&lt;sub&gt;</td><td>Subscript</td><td>H<sub>2</sub>O</td></tr>
  <tr><td>&lt;mark&gt;</td><td>Highlighted</td><td><mark>Marked</mark></td></tr>
  <tr><td>&lt;small&gt;</td><td>Smaller text</td><td><small>Small</small></td></tr>
</table>

<h3>Pre-formatted Text:</h3>
<p><code>&lt;pre&gt;</code> - Preserves spaces and line breaks</p>
<pre>
&lt;pre&gt;
This    text
   preserves
      formatting.
&lt;/pre&gt;
</pre>

<h3>Comments:</h3>
<p>Comments are not displayed in browser.</p>
<code>&lt;!-- This is a comment --&gt;</code>

<h3>Example Page:</h3>
<pre>
&lt;!DOCTYPE html&gt;
&lt;html&gt;
&lt;head&gt;
    &lt;title&gt;My Page&lt;/title&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;h1&gt;Welcome&lt;/h1&gt;
    &lt;p&gt;This is &lt;b&gt;bold&lt;/b&gt; and &lt;i&gt;italic&lt;/i&gt;.&lt;/p&gt;
    &lt;hr&gt;
    &lt;p&gt;New paragraph&lt;br&gt;with line break.&lt;/p&gt;
&lt;/body&gt;
&lt;/html&gt;
</pre>`,
        shortDescription: "Learn HTML tags for headings and text formatting.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "HTML Lists and Links",
        lessonContent: `<h2>HTML Lists</h2>

<h3>1. Ordered List (Numbered):</h3>
<pre>
&lt;ol&gt;
    &lt;li&gt;First item&lt;/li&gt;
    &lt;li&gt;Second item&lt;/li&gt;
    &lt;li&gt;Third item&lt;/li&gt;
&lt;/ol&gt;
</pre>
<p>Output: 1. First item, 2. Second item, 3. Third item</p>

<p><strong>List Types (type attribute):</strong></p>
<ul>
  <li><code>type="1"</code> - Numbers (default)</li>
  <li><code>type="A"</code> - Uppercase letters</li>
  <li><code>type="a"</code> - Lowercase letters</li>
  <li><code>type="I"</code> - Roman numerals</li>
  <li><code>type="i"</code> - Lowercase roman</li>
</ul>

<h3>2. Unordered List (Bullets):</h3>
<pre>
&lt;ul&gt;
    &lt;li&gt;Item one&lt;/li&gt;
    &lt;li&gt;Item two&lt;/li&gt;
    &lt;li&gt;Item three&lt;/li&gt;
&lt;/ul&gt;
</pre>
<p><strong>Bullet Types:</strong> disc, circle, square</p>

<h3>3. Definition List:</h3>
<pre>
&lt;dl&gt;
    &lt;dt&gt;HTML&lt;/dt&gt;
    &lt;dd&gt;HyperText Markup Language&lt;/dd&gt;
    &lt;dt&gt;CSS&lt;/dt&gt;
    &lt;dd&gt;Cascading Style Sheets&lt;/dd&gt;
&lt;/dl&gt;
</pre>

<h3>Nested Lists:</h3>
<pre>
&lt;ul&gt;
    &lt;li&gt;Fruits
        &lt;ul&gt;
            &lt;li&gt;Apple&lt;/li&gt;
            &lt;li&gt;Orange&lt;/li&gt;
        &lt;/ul&gt;
    &lt;/li&gt;
    &lt;li&gt;Vegetables&lt;/li&gt;
&lt;/ul&gt;
</pre>

<h2>HTML Links</h2>

<h3>Anchor Tag:</h3>
<p><code>&lt;a href="URL"&gt;Link Text&lt;/a&gt;</code></p>

<h3>Link Types:</h3>
<pre>
&lt;!-- External link --&gt;
&lt;a href="https://www.google.com"&gt;Visit Google&lt;/a&gt;

&lt;!-- Internal link (same folder) --&gt;
&lt;a href="about.html"&gt;About Us&lt;/a&gt;

&lt;!-- Link to section on same page --&gt;
&lt;a href="#section1"&gt;Go to Section 1&lt;/a&gt;
...
&lt;h2 id="section1"&gt;Section 1&lt;/h2&gt;

&lt;!-- Email link --&gt;
&lt;a href="mailto:info@example.com"&gt;Email Us&lt;/a&gt;

&lt;!-- Open in new tab --&gt;
&lt;a href="https://www.google.com" target="_blank"&gt;Google&lt;/a&gt;
</pre>

<h3>Target Attribute Values:</h3>
<ul>
  <li><code>_self</code> - Same window (default)</li>
  <li><code>_blank</code> - New window/tab</li>
  <li><code>_parent</code> - Parent frame</li>
  <li><code>_top</code> - Full window</li>
</ul>`,
        shortDescription: "Create lists and hyperlinks in HTML.",
        order: 3,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "HTML Images and Tables",
        lessonContent: `<h2>HTML Images</h2>

<h3>Image Tag:</h3>
<p><code>&lt;img src="image.jpg" alt="Description"&gt;</code></p>

<h3>Image Attributes:</h3>
<ul>
  <li><code>src</code> - Source/path of image (required)</li>
  <li><code>alt</code> - Alternative text if image doesn't load (required)</li>
  <li><code>width</code> - Width in pixels or percentage</li>
  <li><code>height</code> - Height in pixels</li>
  <li><code>title</code> - Tooltip text on hover</li>
</ul>

<h3>Examples:</h3>
<pre>
&lt;!-- Local image --&gt;
&lt;img src="photo.jpg" alt="My Photo" width="300"&gt;

&lt;!-- Image from internet --&gt;
&lt;img src="https://example.com/image.png" alt="Logo"&gt;

&lt;!-- Image as link --&gt;
&lt;a href="https://google.com"&gt;
    &lt;img src="logo.png" alt="Click here"&gt;
&lt;/a&gt;
</pre>

<h2>HTML Tables</h2>

<h3>Table Structure:</h3>
<pre>
&lt;table border="1"&gt;
    &lt;tr&gt;
        &lt;th&gt;Name&lt;/th&gt;
        &lt;th&gt;Age&lt;/th&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
        &lt;td&gt;Ram&lt;/td&gt;
        &lt;td&gt;15&lt;/td&gt;
    &lt;/tr&gt;
    &lt;tr&gt;
        &lt;td&gt;Sita&lt;/td&gt;
        &lt;td&gt;14&lt;/td&gt;
    &lt;/tr&gt;
&lt;/table&gt;
</pre>

<h3>Table Tags:</h3>
<ul>
  <li><code>&lt;table&gt;</code> - Creates table</li>
  <li><code>&lt;tr&gt;</code> - Table row</li>
  <li><code>&lt;th&gt;</code> - Table header (bold, centered)</li>
  <li><code>&lt;td&gt;</code> - Table data (cell)</li>
  <li><code>&lt;caption&gt;</code> - Table title</li>
</ul>

<h3>Table Attributes:</h3>
<ul>
  <li><code>border</code> - Border thickness</li>
  <li><code>width</code> - Table width</li>
  <li><code>cellpadding</code> - Space inside cells</li>
  <li><code>cellspacing</code> - Space between cells</li>
  <li><code>bgcolor</code> - Background color</li>
</ul>

<h3>Spanning Cells:</h3>
<pre>
&lt;!-- Merge columns --&gt;
&lt;td colspan="2"&gt;Spans 2 columns&lt;/td&gt;

&lt;!-- Merge rows --&gt;
&lt;td rowspan="2"&gt;Spans 2 rows&lt;/td&gt;
</pre>

<h3>Table Sections:</h3>
<ul>
  <li><code>&lt;thead&gt;</code> - Table header section</li>
  <li><code>&lt;tbody&gt;</code> - Table body section</li>
  <li><code>&lt;tfoot&gt;</code> - Table footer section</li>
</ul>`,
        shortDescription: "Add images and create tables in HTML.",
        order: 4,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 8: MULTIMEDIA AND CYBER SECURITY
  // ============================================
  {
    title: "Week 8: Multimedia and Cyber Security",
    weekNumber: 8,
    description:
      "Learn about multimedia concepts and cyber security awareness.",
    order: 8,
    lessons: [
      {
        lessonTitle: "Introduction to Multimedia",
        lessonContent: `<h2>Multimedia</h2>

<p>Multimedia is the integration of multiple forms of media including text, graphics, audio, video, and animation.</p>

<h3>Components of Multimedia:</h3>

<h4>1. Text</h4>
<ul>
  <li>Written content</li>
  <li>Formats: .txt, .doc, .pdf</li>
  <li>Used for information and navigation</li>
</ul>

<h4>2. Graphics/Images</h4>
<ul>
  <li>Visual representations</li>
  <li>Types: Photographs, illustrations, icons</li>
  <li>Formats: .jpg, .png, .gif, .bmp, .svg</li>
  <li><strong>Raster images:</strong> Made of pixels (JPG, PNG)</li>
  <li><strong>Vector images:</strong> Made of mathematical paths (SVG)</li>
</ul>

<h4>3. Audio</h4>
<ul>
  <li>Sound elements</li>
  <li>Formats: .mp3, .wav, .aac, .flac</li>
  <li>Used for music, narration, sound effects</li>
</ul>

<h4>4. Video</h4>
<ul>
  <li>Moving pictures with or without sound</li>
  <li>Formats: .mp4, .avi, .mkv, .mov</li>
  <li>Used for movies, tutorials, presentations</li>
</ul>

<h4>5. Animation</h4>
<ul>
  <li>Illusion of movement using images</li>
  <li>Formats: .gif (simple), Flash, HTML5</li>
  <li>Used for explainer videos, games, effects</li>
</ul>

<h3>Applications of Multimedia:</h3>
<ul>
  <li><strong>Education:</strong> E-learning, interactive tutorials</li>
  <li><strong>Entertainment:</strong> Games, movies, music</li>
  <li><strong>Business:</strong> Presentations, advertisements</li>
  <li><strong>Medicine:</strong> Surgery simulation, training</li>
  <li><strong>Communication:</strong> Video conferencing, social media</li>
</ul>

<h3>Multimedia Software:</h3>
<table border="1" cellpadding="8">
  <tr><th>Type</th><th>Software Examples</th></tr>
  <tr><td>Image Editing</td><td>Photoshop, GIMP, Paint</td></tr>
  <tr><td>Audio Editing</td><td>Audacity, Adobe Audition</td></tr>
  <tr><td>Video Editing</td><td>Premiere Pro, Filmora, iMovie</td></tr>
  <tr><td>Animation</td><td>Flash, Blender, After Effects</td></tr>
  <tr><td>3D Modeling</td><td>Blender, 3ds Max, Maya</td></tr>
</table>`,
        shortDescription: "Understand multimedia components and applications.",
        order: 1,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Computer Viruses and Security Threats",
        lessonContent: `<h2>Computer Security Threats</h2>

<h3>Computer Virus:</h3>
<p>A virus is a malicious program that attaches itself to other programs and spreads when the infected program runs.</p>

<h3>Types of Malware:</h3>

<h4>1. Virus</h4>
<ul>
  <li>Attaches to files/programs</li>
  <li>Needs human action to spread</li>
  <li>Example: File infector virus</li>
</ul>

<h4>2. Worm</h4>
<ul>
  <li>Self-replicating program</li>
  <li>Spreads automatically through networks</li>
  <li>Doesn't need host program</li>
</ul>

<h4>3. Trojan Horse</h4>
<ul>
  <li>Disguised as legitimate software</li>
  <li>Doesn't replicate itself</li>
  <li>Creates backdoor for hackers</li>
</ul>

<h4>4. Spyware</h4>
<ul>
  <li>Secretly monitors user activities</li>
  <li>Collects personal information</li>
  <li>Often bundled with free software</li>
</ul>

<h4>5. Ransomware</h4>
<ul>
  <li>Encrypts user's files</li>
  <li>Demands payment to restore access</li>
  <li>Example: WannaCry</li>
</ul>

<h4>6. Adware</h4>
<ul>
  <li>Displays unwanted advertisements</li>
  <li>Often installed with free software</li>
</ul>

<h3>How Viruses Spread:</h3>
<ul>
  <li>Email attachments</li>
  <li>Downloaded files from untrusted sources</li>
  <li>Infected USB drives</li>
  <li>Malicious websites</li>
  <li>Pirated software</li>
</ul>

<h3>Signs of Infection:</h3>
<ul>
  <li>Slow computer performance</li>
  <li>Unexpected pop-up ads</li>
  <li>Programs crashing</li>
  <li>Files missing or corrupted</li>
  <li>Strange messages or sounds</li>
  <li>Increased network activity</li>
</ul>

<h3>Protection Measures:</h3>
<ul>
  <li>Install antivirus software</li>
  <li>Keep software updated</li>
  <li>Don't open suspicious emails/attachments</li>
  <li>Download from trusted sources only</li>
  <li>Use firewall</li>
  <li>Regular backups</li>
</ul>`,
        shortDescription: "Learn about computer viruses and malware threats.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Cyber Security and Safe Practices",
        lessonContent: `<h2>Cyber Security</h2>

<p>Cyber security is the practice of protecting computers, networks, and data from digital attacks and unauthorized access.</p>

<h3>Common Cyber Threats:</h3>

<h4>1. Phishing</h4>
<ul>
  <li>Fake emails/websites that look legitimate</li>
  <li>Trick users into revealing passwords, credit card info</li>
  <li>Example: Fake bank email asking to verify account</li>
</ul>

<h4>2. Hacking</h4>
<ul>
  <li>Unauthorized access to computer systems</li>
  <li>Types: Ethical hackers (white hat) vs malicious hackers (black hat)</li>
</ul>

<h4>3. Identity Theft</h4>
<ul>
  <li>Stealing personal information</li>
  <li>Used for fraud, financial crimes</li>
</ul>

<h4>4. Cyber Bullying</h4>
<ul>
  <li>Harassment using digital devices</li>
  <li>Spreading rumors, threats online</li>
</ul>

<h3>Strong Password Guidelines:</h3>
<ul>
  <li>Minimum 8 characters (12+ recommended)</li>
  <li>Mix uppercase and lowercase letters</li>
  <li>Include numbers and special characters</li>
  <li>Don't use personal information</li>
  <li>Don't reuse passwords</li>
  <li>Change passwords regularly</li>
  <li>Use password manager</li>
</ul>

<h3>Safe Internet Practices:</h3>
<ol>
  <li><strong>Think before you click:</strong> Verify links before clicking</li>
  <li><strong>Protect personal information:</strong> Don't share unnecessarily</li>
  <li><strong>Use secure connections:</strong> Look for HTTPS and padlock icon</li>
  <li><strong>Keep software updated:</strong> Install security patches</li>
  <li><strong>Be careful on public Wi-Fi:</strong> Avoid banking/shopping</li>
  <li><strong>Enable two-factor authentication (2FA):</strong> Extra security layer</li>
  <li><strong>Backup important data:</strong> Protect against ransomware</li>
  <li><strong>Log out of accounts:</strong> Especially on shared computers</li>
</ol>

<h3>Social Media Safety:</h3>
<ul>
  <li>Use privacy settings</li>
  <li>Don't accept requests from strangers</li>
  <li>Think before posting</li>
  <li>Don't share location in real-time</li>
  <li>Report and block suspicious accounts</li>
</ul>`,
        shortDescription: "Learn cyber security practices for safe internet use.",
        order: 3,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Cyber Law in Nepal",
        lessonContent: `<h2>Cyber Law in Nepal</h2>

<h3>Electronic Transaction Act (ETA) 2063 (2008):</h3>
<p>Nepal's primary law governing electronic transactions and cyber crimes.</p>

<h3>Key Provisions:</h3>

<h4>Legal Recognition:</h4>
<ul>
  <li>Electronic records are legally valid</li>
  <li>Digital signatures are accepted</li>
  <li>Electronic contracts are enforceable</li>
</ul>

<h4>Cyber Crimes Defined:</h4>
<ul>
  <li><strong>Unauthorized Access:</strong> Hacking into computer systems</li>
  <li><strong>Computer Fraud:</strong> Using computers for fraudulent activities</li>
  <li><strong>Piracy:</strong> Illegal copying of software, content</li>
  <li><strong>Cyber Terrorism:</strong> Using technology for terrorism</li>
  <li><strong>Obscene Content:</strong> Publishing inappropriate material</li>
  <li><strong>Identity Theft:</strong> Using someone else's digital identity</li>
</ul>

<h3>Punishments under ETA:</h3>
<table border="1" cellpadding="8">
  <tr><th>Offense</th><th>Punishment</th></tr>
  <tr><td>Unauthorized access</td><td>Up to 2 years jail and/or Rs. 1 lakh fine</td></tr>
  <tr><td>Computer fraud</td><td>Up to 3 years jail and/or Rs. 2 lakh fine</td></tr>
  <tr><td>Publishing obscene content</td><td>Up to 5 years jail and/or Rs. 1 lakh fine</td></tr>
  <tr><td>Piracy</td><td>Fine and compensation to owner</td></tr>
</table>

<h3>Digital Rights:</h3>
<ul>
  <li>Right to privacy</li>
  <li>Freedom of expression online</li>
  <li>Protection of personal data</li>
  <li>Right to access information</li>
</ul>

<h3>Reporting Cyber Crimes:</h3>
<ul>
  <li>Nepal Police Cyber Bureau</li>
  <li>Contact: cybercrime@nepalpolice.gov.np</li>
  <li>Save evidence (screenshots, emails)</li>
  <li>Don't delete suspicious messages</li>
</ul>

<h3>Important Cyber Ethics:</h3>
<ul>
  <li>Respect others' privacy</li>
  <li>Don't spread fake news/misinformation</li>
  <li>Use licensed software</li>
  <li>Give credit for others' work</li>
  <li>Report illegal activities</li>
  <li>Don't harass or bully online</li>
</ul>

<h3>Intellectual Property Rights (IPR):</h3>
<ul>
  <li><strong>Copyright:</strong> Protects creative works (books, music, software)</li>
  <li><strong>Trademark:</strong> Protects brand names, logos</li>
  <li><strong>Patent:</strong> Protects inventions</li>
  <li>Respect IPR - don't pirate content</li>
</ul>`,
        shortDescription: "Learn about cyber laws and digital ethics in Nepal.",
        order: 4,
        duration: 50,
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
  console.log("Clearing existing Grade 9 Computer Science data...");

  const categoryName = "Grade 9 Computer Science";
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

async function getOrCreateAdminUser() {
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

    console.log("\n--- Creating Grade 9 Computer Science Course ---");
    const computerCategory = await createCategory(computerCategoryData, adminUser);
    const computerCourse = await createCourse(
      computerCourseData,
      computerCourseWeeks,
      computerCategory,
      adminUser,
      lecturer,
    );
    computerCategory.meta.courseCount = 1;
    await computerCategory.save();

    console.log("\n========================================");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`\nCategory: ${computerCategory.categoryName}`);
    console.log(
      `  - ${computerCourse.courseTitle} (PAID - NPR ${computerCourse.price}, ${computerCourse.discount}% off)`,
    );
    console.log(
      `    Weeks: ${computerCourse.totalWeeks}, Lessons: ${computerCourse.totalLessons}`,
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
  computerCategoryData,
  computerCourseData,
  computerCourseWeeks,
};
