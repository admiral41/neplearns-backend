/**
 * Grade 9 Mathematics Seeder (Nepal Syllabus)
 *
 * Run: node seeders/grade9MathSeeder.js
 *
 * Creates:
 * - 1 Category (Grade 9 Mathematics)
 * - 1 PAID Mathematics Course
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
const mathCategoryData = {
  categoryName: "Grade 9 Mathematics",
  categoryDesc:
    "Complete Mathematics course for Grade 9 students in Nepal. Covers Sets, Arithmetic, Algebra, Geometry, Mensuration, Statistics, and Probability as per the Nepal government curriculum.",
  categoryShortDesc: "Mathematics course for Grade 9 Nepal syllabus",
  color: "#8B5CF6",
  icon: "calculator",
  isActive: true,
  order: 3,
};

// ============================================
// PAID COURSE - Grade 9 Mathematics
// ============================================
const mathCourseData = {
  courseTitle: "Complete Grade 9 Mathematics Course",
  courseDesc: `Master Grade 9 Mathematics with this comprehensive course designed according to the Nepal government curriculum.

What's Included:
- Sets: Types, operations, Venn diagrams
- Arithmetic: Taxation, commission, discount, profit & loss, compound interest
- Algebra: Indices, simplification, factorization, equations
- Geometry: Triangles, parallelograms, circles, construction
- Mensuration: Surface area and volume of prisms and pyramids
- Statistics: Mean, median, mode, quartiles
- Probability: Basic concepts and calculations

Course Features:
- 50+ detailed video lessons
- Step-by-step problem solving
- Chapter-wise practice questions
- SEE pattern numerical problems
- Tips and shortcuts for calculations
- Live doubt clearing sessions
- 1 Year validity

Who is this for?
Grade 9 students following the Nepal curriculum who want to build a strong foundation in mathematics.`,
  courseShortDesc:
    "Complete Grade 9 Mathematics with 50+ lessons covering Sets, Algebra, Geometry, Mensuration, Statistics & Probability.",
  duration: 100,
  weekly_study: 8,
  learn_type: "PAID",
  price: 1999,
  discount: 15,
  tags: [
    "Grade 9",
    "Mathematics",
    "Nepal",
    "Algebra",
    "Geometry",
    "Sets",
    "Statistics",
    "Premium",
  ],
  requirements:
    "Grade 8 Mathematics completed. Basic calculator. Geometry box for constructions. Dedicated study time of 8 hours per week.",
  status: "approved",
  published: true,
};

const mathCourseWeeks = [
  // ============================================
  // WEEK 1: SETS
  // ============================================
  {
    title: "Week 1: Sets - Concepts and Operations",
    weekNumber: 1,
    description:
      "Learn about sets, types of sets, set notation, and operations on sets including union, intersection, and complement.",
    order: 1,
    lessons: [
      {
        lessonTitle: "Introduction to Sets",
        lessonContent: `<h2>Sets - Basic Concepts</h2>

<h3>What is a Set?</h3>
<p>A set is a well-defined collection of distinct objects. The objects in a set are called <strong>elements</strong> or <strong>members</strong>.</p>

<h3>Notation:</h3>
<ul>
  <li>Sets are denoted by capital letters: A, B, C, ...</li>
  <li>Elements are denoted by small letters: a, b, c, ...</li>
  <li>∈ means "belongs to" (element of)</li>
  <li>∉ means "does not belong to"</li>
</ul>

<h3>Methods of Describing Sets:</h3>
<ol>
  <li><strong>Roster Method (Listing):</strong> List all elements in curly braces
    <p>Example: A = {1, 2, 3, 4, 5}</p>
  </li>
  <li><strong>Set-Builder Method:</strong> Describe the property of elements
    <p>Example: A = {x : x is a natural number less than 6}</p>
  </li>
</ol>

<h3>Types of Sets:</h3>
<ul>
  <li><strong>Empty Set (Null Set):</strong> A set with no elements, denoted by ∅ or { }
    <p>Example: Set of months with 32 days = ∅</p>
  </li>
  <li><strong>Singleton Set:</strong> A set with exactly one element
    <p>Example: {5}</p>
  </li>
  <li><strong>Finite Set:</strong> A set with countable number of elements
    <p>Example: A = {2, 4, 6, 8, 10}</p>
  </li>
  <li><strong>Infinite Set:</strong> A set with uncountable elements
    <p>Example: N = {1, 2, 3, 4, ...}</p>
  </li>
  <li><strong>Universal Set (U):</strong> The set containing all elements under consideration</li>
</ul>

<h3>Cardinality:</h3>
<p>The number of elements in a set A is called its cardinality, denoted by n(A).</p>
<p>Example: If A = {a, b, c, d}, then n(A) = 4</p>`,
        shortDescription: "Learn the basic concepts and types of sets.",
        order: 1,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Subsets and Power Sets",
        lessonContent: `<h2>Subsets and Power Sets</h2>

<h3>Subset:</h3>
<p>Set A is a subset of set B if every element of A is also an element of B.</p>
<p><strong>Notation:</strong> A ⊆ B</p>
<p><strong>Example:</strong> If A = {1, 2, 3} and B = {1, 2, 3, 4, 5}, then A ⊆ B</p>

<h3>Proper Subset:</h3>
<p>A is a proper subset of B if A ⊆ B and A ≠ B</p>
<p><strong>Notation:</strong> A ⊂ B</p>

<h3>Important Properties:</h3>
<ul>
  <li>Every set is a subset of itself: A ⊆ A</li>
  <li>Empty set is a subset of every set: ∅ ⊆ A</li>
  <li>If A ⊆ B and B ⊆ A, then A = B</li>
</ul>

<h3>Power Set:</h3>
<p>The power set of A is the set of all subsets of A.</p>
<p><strong>Notation:</strong> P(A)</p>
<p><strong>Formula:</strong> If n(A) = n, then n(P(A)) = 2ⁿ</p>

<h3>Example:</h3>
<p>If A = {1, 2}, find P(A)</p>
<p><strong>Solution:</strong></p>
<p>Subsets of A: ∅, {1}, {2}, {1, 2}</p>
<p>P(A) = {∅, {1}, {2}, {1, 2}}</p>
<p>n(P(A)) = 2² = 4 ✓</p>

<h3>Equal Sets vs Equivalent Sets:</h3>
<ul>
  <li><strong>Equal Sets:</strong> Two sets with exactly the same elements
    <p>A = {1, 2, 3} and B = {3, 1, 2} → A = B</p>
  </li>
  <li><strong>Equivalent Sets:</strong> Two sets with the same number of elements
    <p>A = {1, 2, 3} and B = {a, b, c} → n(A) = n(B) = 3</p>
  </li>
</ul>`,
        shortDescription: "Understand subsets, proper subsets, and power sets.",
        order: 2,
        duration: 40,
        videoUrl: "",
      },
      {
        lessonTitle: "Set Operations",
        lessonContent: `<h2>Operations on Sets</h2>

<h3>1. Union of Sets (A ∪ B)</h3>
<p>The union of sets A and B is the set of all elements that belong to A or B or both.</p>
<p><strong>A ∪ B = {x : x ∈ A or x ∈ B}</strong></p>
<p><strong>Example:</strong> A = {1, 2, 3}, B = {3, 4, 5}</p>
<p>A ∪ B = {1, 2, 3, 4, 5}</p>

<h3>2. Intersection of Sets (A ∩ B)</h3>
<p>The intersection of sets A and B is the set of all elements common to both A and B.</p>
<p><strong>A ∩ B = {x : x ∈ A and x ∈ B}</strong></p>
<p><strong>Example:</strong> A = {1, 2, 3}, B = {3, 4, 5}</p>
<p>A ∩ B = {3}</p>

<h3>3. Difference of Sets (A - B)</h3>
<p>The difference A - B is the set of elements in A but not in B.</p>
<p><strong>A - B = {x : x ∈ A and x ∉ B}</strong></p>
<p><strong>Example:</strong> A = {1, 2, 3, 4}, B = {3, 4, 5}</p>
<p>A - B = {1, 2}</p>
<p>B - A = {5}</p>

<h3>4. Complement of a Set (Ā or A')</h3>
<p>The complement of set A is the set of all elements in U that are not in A.</p>
<p><strong>A' = {x : x ∈ U and x ∉ A} = U - A</strong></p>
<p><strong>Example:</strong> U = {1, 2, 3, 4, 5}, A = {1, 2}</p>
<p>A' = {3, 4, 5}</p>

<h3>5. Symmetric Difference (A △ B)</h3>
<p>Elements in A or B but not in both.</p>
<p><strong>A △ B = (A - B) ∪ (B - A) = (A ∪ B) - (A ∩ B)</strong></p>

<h3>Disjoint Sets:</h3>
<p>Two sets A and B are disjoint if A ∩ B = ∅</p>`,
        shortDescription: "Master union, intersection, difference, and complement operations.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Venn Diagrams and Cardinality",
        lessonContent: `<h2>Venn Diagrams</h2>

<p>Venn diagrams are pictorial representations of sets using circles inside a rectangle (universal set).</p>

<h3>Cardinality Formulas:</h3>

<h4>For Two Sets:</h4>
<p><strong>n(A ∪ B) = n(A) + n(B) - n(A ∩ B)</strong></p>

<h4>For Three Sets:</h4>
<p><strong>n(A ∪ B ∪ C) = n(A) + n(B) + n(C) - n(A ∩ B) - n(B ∩ C) - n(A ∩ C) + n(A ∩ B ∩ C)</strong></p>

<h3>Only Formulas:</h3>
<ul>
  <li>n<sub>o</sub>(A) = n(A) - n(A ∩ B) [Elements only in A]</li>
  <li>n<sub>o</sub>(B) = n(B) - n(A ∩ B) [Elements only in B]</li>
</ul>

<h3>Example Problem:</h3>
<p><strong>Q:</strong> In a class of 50 students, 30 play football, 25 play cricket, and 10 play both. Find:</p>
<p>a) How many play at least one game?</p>
<p>b) How many play neither game?</p>

<p><strong>Solution:</strong></p>
<p>Let F = football players, C = cricket players</p>
<p>n(U) = 50, n(F) = 30, n(C) = 25, n(F ∩ C) = 10</p>

<p>a) n(F ∪ C) = n(F) + n(C) - n(F ∩ C)</p>
<p>= 30 + 25 - 10 = <strong>45 students</strong></p>

<p>b) Neither = n(U) - n(F ∪ C) = 50 - 45 = <strong>5 students</strong></p>

<h3>Properties of Set Operations:</h3>
<ul>
  <li><strong>Commutative:</strong> A ∪ B = B ∪ A, A ∩ B = B ∩ A</li>
  <li><strong>Associative:</strong> (A ∪ B) ∪ C = A ∪ (B ∪ C)</li>
  <li><strong>Distributive:</strong> A ∩ (B ∪ C) = (A ∩ B) ∪ (A ∩ C)</li>
  <li><strong>De Morgan's Laws:</strong>
    <ul>
      <li>(A ∪ B)' = A' ∩ B'</li>
      <li>(A ∩ B)' = A' ∪ B'</li>
    </ul>
  </li>
</ul>`,
        shortDescription: "Learn Venn diagrams and cardinality formulas for solving problems.",
        order: 4,
        duration: 55,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 2: ARITHMETIC - TAXATION & PROFIT/LOSS
  // ============================================
  {
    title: "Week 2: Arithmetic - Taxation, Profit and Loss",
    weekNumber: 2,
    description:
      "Master taxation concepts, VAT calculations, profit and loss, discount, and commission problems.",
    order: 2,
    lessons: [
      {
        lessonTitle: "Profit, Loss and Discount",
        lessonContent: `<h2>Profit and Loss</h2>

<h3>Basic Terms:</h3>
<ul>
  <li><strong>Cost Price (CP):</strong> The price at which an article is bought</li>
  <li><strong>Selling Price (SP):</strong> The price at which an article is sold</li>
  <li><strong>Profit:</strong> When SP > CP, Profit = SP - CP</li>
  <li><strong>Loss:</strong> When CP > SP, Loss = CP - SP</li>
</ul>

<h3>Formulas:</h3>
<table border="1" cellpadding="8">
  <tr><th>Quantity</th><th>Formula</th></tr>
  <tr><td>Profit%</td><td>(Profit / CP) × 100</td></tr>
  <tr><td>Loss%</td><td>(Loss / CP) × 100</td></tr>
  <tr><td>SP (when profit)</td><td>CP × (100 + P%) / 100</td></tr>
  <tr><td>SP (when loss)</td><td>CP × (100 - L%) / 100</td></tr>
  <tr><td>CP (when profit)</td><td>SP × 100 / (100 + P%)</td></tr>
  <tr><td>CP (when loss)</td><td>SP × 100 / (100 - L%)</td></tr>
</table>

<h3>Example:</h3>
<p><strong>Q:</strong> A shopkeeper buys a TV for Rs. 15,000 and sells it for Rs. 18,000. Find the profit percentage.</p>
<p><strong>Solution:</strong></p>
<p>CP = Rs. 15,000, SP = Rs. 18,000</p>
<p>Profit = SP - CP = 18,000 - 15,000 = Rs. 3,000</p>
<p>Profit% = (3000/15000) × 100 = <strong>20%</strong></p>

<h2>Discount</h2>
<h3>Terms:</h3>
<ul>
  <li><strong>Marked Price (MP):</strong> The price written on the article</li>
  <li><strong>Discount:</strong> Reduction given on marked price</li>
  <li><strong>SP = MP - Discount</strong></li>
</ul>

<h3>Formulas:</h3>
<p><strong>Discount = MP × D% / 100</strong></p>
<p><strong>SP = MP × (100 - D%) / 100</strong></p>

<h3>Example:</h3>
<p><strong>Q:</strong> A shirt marked Rs. 1,200 is sold at 15% discount. Find the selling price.</p>
<p><strong>Solution:</strong></p>
<p>SP = 1200 × (100 - 15)/100 = 1200 × 85/100 = <strong>Rs. 1,020</strong></p>`,
        shortDescription: "Learn profit, loss, and discount calculations.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Value Added Tax (VAT)",
        lessonContent: `<h2>Value Added Tax (VAT)</h2>

<h3>What is VAT?</h3>
<p>VAT is an indirect tax added to the selling price of goods and services. In Nepal, the standard VAT rate is <strong>13%</strong>.</p>

<h3>Key Terms:</h3>
<ul>
  <li><strong>SP before VAT:</strong> Initial selling price without tax</li>
  <li><strong>VAT Amount:</strong> Tax calculated on SP</li>
  <li><strong>SP with VAT:</strong> Final price paid by customer</li>
</ul>

<h3>Formulas:</h3>
<p><strong>VAT Amount = SP × VAT% / 100</strong></p>
<p><strong>SP with VAT = SP + VAT Amount = SP × (100 + VAT%) / 100</strong></p>
<p><strong>SP without VAT = SP with VAT × 100 / (100 + VAT%)</strong></p>

<h3>Example 1:</h3>
<p><strong>Q:</strong> A mobile phone costs Rs. 25,000 before VAT. Find the price with 13% VAT.</p>
<p><strong>Solution:</strong></p>
<p>VAT = 25,000 × 13/100 = Rs. 3,250</p>
<p>SP with VAT = 25,000 + 3,250 = <strong>Rs. 28,250</strong></p>
<p>OR: SP with VAT = 25,000 × 113/100 = <strong>Rs. 28,250</strong></p>

<h3>Example 2:</h3>
<p><strong>Q:</strong> The price of a laptop including 13% VAT is Rs. 67,800. Find the price before VAT.</p>
<p><strong>Solution:</strong></p>
<p>SP without VAT = 67,800 × 100/113</p>
<p>= <strong>Rs. 60,000</strong></p>

<h3>Discount and VAT Together:</h3>
<p><strong>Q:</strong> A TV marked Rs. 40,000 is sold at 10% discount. 13% VAT is added. Find the final price.</p>
<p><strong>Solution:</strong></p>
<p>Step 1: SP after discount = 40,000 × 90/100 = Rs. 36,000</p>
<p>Step 2: SP with VAT = 36,000 × 113/100 = <strong>Rs. 40,680</strong></p>`,
        shortDescription: "Understand VAT calculations with discount scenarios.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Commission and Taxation",
        lessonContent: `<h2>Commission</h2>

<h3>What is Commission?</h3>
<p>Commission is the amount paid to an agent or salesperson for selling goods or services, usually calculated as a percentage of the sales.</p>

<h3>Formulas:</h3>
<p><strong>Commission = Sales Amount × Commission Rate / 100</strong></p>
<p><strong>Net Amount Received by Seller = Sales Amount - Commission</strong></p>

<h3>Example:</h3>
<p><strong>Q:</strong> A real estate agent sells a house for Rs. 50,00,000 and receives 2% commission. Find:</p>
<p>a) The commission amount</p>
<p>b) The amount received by the house owner</p>

<p><strong>Solution:</strong></p>
<p>a) Commission = 50,00,000 × 2/100 = <strong>Rs. 1,00,000</strong></p>
<p>b) Amount to owner = 50,00,000 - 1,00,000 = <strong>Rs. 49,00,000</strong></p>

<h2>Income Tax in Nepal</h2>

<h3>For Individual (Unmarried):</h3>
<table border="1" cellpadding="8">
  <tr><th>Annual Income (Rs.)</th><th>Tax Rate</th></tr>
  <tr><td>Up to 5,00,000</td><td>1%</td></tr>
  <tr><td>5,00,001 - 7,00,000</td><td>10%</td></tr>
  <tr><td>7,00,001 - 10,00,000</td><td>20%</td></tr>
  <tr><td>10,00,001 - 20,00,000</td><td>30%</td></tr>
  <tr><td>Above 20,00,000</td><td>36%</td></tr>
</table>

<h3>For Married Individual:</h3>
<p>Tax-free limit is Rs. 5,50,000 (Rs. 50,000 more than unmarried)</p>

<h3>Example:</h3>
<p><strong>Q:</strong> An unmarried person earns Rs. 8,00,000 annually. Calculate the income tax.</p>
<p><strong>Solution:</strong></p>
<p>First Rs. 5,00,000: 5,00,000 × 1% = Rs. 5,000</p>
<p>Next Rs. 2,00,000 (5,00,001 - 7,00,000): 2,00,000 × 10% = Rs. 20,000</p>
<p>Remaining Rs. 1,00,000 (7,00,001 - 8,00,000): 1,00,000 × 20% = Rs. 20,000</p>
<p>Total Tax = 5,000 + 20,000 + 20,000 = <strong>Rs. 45,000</strong></p>`,
        shortDescription: "Learn commission and income tax calculations.",
        order: 3,
        duration: 55,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 3: ARITHMETIC - COMPOUND INTEREST
  // ============================================
  {
    title: "Week 3: Compound Interest and Growth/Depreciation",
    weekNumber: 3,
    description:
      "Learn compound interest, compound growth, depreciation, and population problems.",
    order: 3,
    lessons: [
      {
        lessonTitle: "Simple and Compound Interest",
        lessonContent: `<h2>Simple Interest (SI)</h2>

<h3>Formula:</h3>
<p><strong>SI = PTR / 100</strong></p>
<p>Where: P = Principal, T = Time (years), R = Rate (% per annum)</p>

<h3>Amount = Principal + Interest = P + SI</h3>

<h2>Compound Interest (CI)</h2>

<h3>What is Compound Interest?</h3>
<p>Interest calculated on the principal plus accumulated interest from previous periods.</p>

<h3>Compound Amount Formula:</h3>
<p><strong>CA = P(1 + R/100)ⁿ</strong></p>
<p>Where: CA = Compound Amount, n = number of years</p>

<h3>Compound Interest:</h3>
<p><strong>CI = CA - P = P(1 + R/100)ⁿ - P = P[(1 + R/100)ⁿ - 1]</strong></p>

<h3>Example:</h3>
<p><strong>Q:</strong> Find the compound amount and CI on Rs. 50,000 for 2 years at 10% p.a.</p>
<p><strong>Solution:</strong></p>
<p>P = Rs. 50,000, R = 10%, n = 2 years</p>
<p>CA = 50,000(1 + 10/100)²</p>
<p>= 50,000 × (1.1)²</p>
<p>= 50,000 × 1.21</p>
<p>= <strong>Rs. 60,500</strong></p>
<p>CI = 60,500 - 50,000 = <strong>Rs. 10,500</strong></p>

<h3>Difference Between SI and CI:</h3>
<p>For the same problem:</p>
<p>SI = 50,000 × 2 × 10/100 = Rs. 10,000</p>
<p>CI = Rs. 10,500</p>
<p>Difference = Rs. 500 (CI is always more for n > 1)</p>

<h3>Half-Yearly Compounding:</h3>
<p>When interest is compounded half-yearly:</p>
<p><strong>CA = P(1 + R/200)^(2n)</strong></p>
<p>Rate becomes R/2, time becomes 2n</p>`,
        shortDescription: "Master simple and compound interest calculations.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Compound Growth and Depreciation",
        lessonContent: `<h2>Compound Growth</h2>

<h3>Population Growth:</h3>
<p>When population grows at a constant rate:</p>
<p><strong>P<sub>n</sub> = P<sub>0</sub>(1 + R/100)ⁿ</strong></p>
<p>Where: P<sub>n</sub> = Population after n years, P<sub>0</sub> = Initial population</p>

<h3>Example:</h3>
<p><strong>Q:</strong> A town has a population of 50,000. If it grows at 2% per year, find the population after 3 years.</p>
<p><strong>Solution:</strong></p>
<p>P<sub>n</sub> = 50,000 × (1 + 2/100)³</p>
<p>= 50,000 × (1.02)³</p>
<p>= 50,000 × 1.061208</p>
<p>= <strong>53,060 (approximately)</strong></p>

<h2>Depreciation</h2>

<h3>What is Depreciation?</h3>
<p>The decrease in value of an asset over time due to wear and tear.</p>

<h3>Formula:</h3>
<p><strong>V<sub>n</sub> = V<sub>0</sub>(1 - R/100)ⁿ</strong></p>
<p>Where: V<sub>n</sub> = Value after n years, V<sub>0</sub> = Initial value</p>

<h3>Example:</h3>
<p><strong>Q:</strong> A machine costs Rs. 2,00,000. Its value depreciates at 15% per year. Find its value after 2 years.</p>
<p><strong>Solution:</strong></p>
<p>V<sub>n</sub> = 2,00,000 × (1 - 15/100)²</p>
<p>= 2,00,000 × (0.85)²</p>
<p>= 2,00,000 × 0.7225</p>
<p>= <strong>Rs. 1,44,500</strong></p>

<h3>Depreciation Amount:</h3>
<p>Depreciation = Initial Value - Final Value</p>
<p>= 2,00,000 - 1,44,500 = Rs. 55,500</p>

<h2>Combined Growth and Depreciation:</h2>
<p>When rate changes:</p>
<p><strong>Final Value = Initial Value × (1 ± R₁/100) × (1 ± R₂/100) × ...</strong></p>
<p>Use + for growth, - for depreciation</p>`,
        shortDescription: "Learn compound growth and depreciation formulas.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 4: ALGEBRA - INDICES AND SIMPLIFICATION
  // ============================================
  {
    title: "Week 4: Algebra - Indices and Simplification",
    weekNumber: 4,
    description:
      "Master the laws of indices, surds, and algebraic simplification.",
    order: 4,
    lessons: [
      {
        lessonTitle: "Laws of Indices",
        lessonContent: `<h2>Laws of Indices (Exponents)</h2>

<h3>Basic Concept:</h3>
<p>aⁿ means 'a' multiplied by itself 'n' times</p>
<p>Example: 2⁵ = 2 × 2 × 2 × 2 × 2 = 32</p>

<h3>Laws of Indices:</h3>
<table border="1" cellpadding="8">
  <tr><th>Law</th><th>Rule</th><th>Example</th></tr>
  <tr><td>Product Rule</td><td>aᵐ × aⁿ = aᵐ⁺ⁿ</td><td>2³ × 2⁴ = 2⁷ = 128</td></tr>
  <tr><td>Quotient Rule</td><td>aᵐ ÷ aⁿ = aᵐ⁻ⁿ</td><td>3⁵ ÷ 3² = 3³ = 27</td></tr>
  <tr><td>Power Rule</td><td>(aᵐ)ⁿ = aᵐⁿ</td><td>(2²)³ = 2⁶ = 64</td></tr>
  <tr><td>Zero Index</td><td>a⁰ = 1 (a ≠ 0)</td><td>5⁰ = 1</td></tr>
  <tr><td>Negative Index</td><td>a⁻ⁿ = 1/aⁿ</td><td>2⁻³ = 1/2³ = 1/8</td></tr>
  <tr><td>Fractional Index</td><td>a^(1/n) = ⁿ√a</td><td>8^(1/3) = ³√8 = 2</td></tr>
  <tr><td>Product Power</td><td>(ab)ⁿ = aⁿbⁿ</td><td>(2×3)² = 2²×3² = 36</td></tr>
  <tr><td>Quotient Power</td><td>(a/b)ⁿ = aⁿ/bⁿ</td><td>(2/3)² = 4/9</td></tr>
</table>

<h3>Fractional Indices:</h3>
<p><strong>a^(m/n) = ⁿ√(aᵐ) = (ⁿ√a)ᵐ</strong></p>
<p>Example: 8^(2/3) = (8^(1/3))² = 2² = 4</p>
<p>Or: 8^(2/3) = ³√(8²) = ³√64 = 4</p>

<h3>Example Problems:</h3>
<p><strong>Q1:</strong> Simplify: (2³ × 2⁵) ÷ 2⁴</p>
<p><strong>Solution:</strong> = 2^(3+5-4) = 2⁴ = 16</p>

<p><strong>Q2:</strong> Simplify: (x³y²)⁴</p>
<p><strong>Solution:</strong> = x^(3×4) × y^(2×4) = x¹²y⁸</p>

<p><strong>Q3:</strong> Find the value of 27^(-2/3)</p>
<p><strong>Solution:</strong> = 1/27^(2/3) = 1/(³√27)² = 1/3² = 1/9</p>`,
        shortDescription: "Master all laws of indices with examples.",
        order: 1,
        duration: 55,
        videoUrl: "",
      },
      {
        lessonTitle: "Surds and Rationalization",
        lessonContent: `<h2>Surds</h2>

<h3>What is a Surd?</h3>
<p>A surd is an irrational root that cannot be simplified to a rational number.</p>
<p>Examples: √2, √3, ³√5, √7</p>

<h3>Types of Surds:</h3>
<ul>
  <li><strong>Pure Surd:</strong> √2, √5 (no rational part)</li>
  <li><strong>Mixed Surd:</strong> 3√2, 5√3 (has rational coefficient)</li>
  <li><strong>Like Surds:</strong> √3 and 5√3 (same radicand)</li>
  <li><strong>Unlike Surds:</strong> √2 and √5 (different radicands)</li>
</ul>

<h3>Operations on Surds:</h3>
<p><strong>Addition/Subtraction:</strong> Only like surds can be added/subtracted</p>
<p>3√2 + 5√2 = 8√2</p>
<p>7√3 - 2√3 = 5√3</p>

<p><strong>Multiplication:</strong></p>
<p>√a × √b = √(ab)</p>
<p>√2 × √8 = √16 = 4</p>

<p><strong>Division:</strong></p>
<p>√a ÷ √b = √(a/b)</p>
<p>√18 ÷ √2 = √9 = 3</p>

<h3>Rationalization:</h3>
<p>Making the denominator rational by multiplying with the conjugate.</p>

<p><strong>Conjugate of (a + √b) is (a - √b)</strong></p>
<p><strong>Conjugate of (√a + √b) is (√a - √b)</strong></p>

<h3>Example:</h3>
<p><strong>Q:</strong> Rationalize: 5/(√3 + √2)</p>
<p><strong>Solution:</strong></p>
<p>= 5(√3 - √2) / [(√3 + √2)(√3 - √2)]</p>
<p>= 5(√3 - √2) / (3 - 2)</p>
<p>= 5(√3 - √2) / 1</p>
<p>= <strong>5√3 - 5√2</strong></p>

<h3>Important Identity:</h3>
<p>(a + b)(a - b) = a² - b²</p>
<p>(√a + √b)(√a - √b) = a - b</p>`,
        shortDescription: "Learn operations on surds and rationalization.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Algebraic Simplification",
        lessonContent: `<h2>Algebraic Simplification</h2>

<h3>Important Identities:</h3>
<ol>
  <li>(a + b)² = a² + 2ab + b²</li>
  <li>(a - b)² = a² - 2ab + b²</li>
  <li>(a + b)(a - b) = a² - b²</li>
  <li>(a + b)³ = a³ + 3a²b + 3ab² + b³ = a³ + b³ + 3ab(a + b)</li>
  <li>(a - b)³ = a³ - 3a²b + 3ab² - b³ = a³ - b³ - 3ab(a - b)</li>
  <li>a³ + b³ = (a + b)(a² - ab + b²)</li>
  <li>a³ - b³ = (a - b)(a² + ab + b²)</li>
</ol>

<h3>More Identities:</h3>
<ul>
  <li>(a + b + c)² = a² + b² + c² + 2ab + 2bc + 2ca</li>
  <li>a² + b² = (a + b)² - 2ab</li>
  <li>a² + b² = (a - b)² + 2ab</li>
  <li>a³ + b³ + c³ - 3abc = (a + b + c)(a² + b² + c² - ab - bc - ca)</li>
</ul>

<h3>Example 1:</h3>
<p><strong>Q:</strong> If x + 1/x = 5, find x² + 1/x²</p>
<p><strong>Solution:</strong></p>
<p>Squaring both sides: (x + 1/x)² = 25</p>
<p>x² + 2(x)(1/x) + 1/x² = 25</p>
<p>x² + 2 + 1/x² = 25</p>
<p>x² + 1/x² = <strong>23</strong></p>

<h3>Example 2:</h3>
<p><strong>Q:</strong> Simplify: (x³ + 8) ÷ (x + 2)</p>
<p><strong>Solution:</strong></p>
<p>x³ + 8 = x³ + 2³ = (x + 2)(x² - 2x + 4)</p>
<p>= (x + 2)(x² - 2x + 4) ÷ (x + 2)</p>
<p>= <strong>x² - 2x + 4</strong></p>

<h3>Example 3:</h3>
<p><strong>Q:</strong> If a + b = 7 and ab = 12, find a³ + b³</p>
<p><strong>Solution:</strong></p>
<p>a³ + b³ = (a + b)(a² - ab + b²)</p>
<p>= (a + b)[(a + b)² - 3ab]</p>
<p>= 7 × [49 - 36]</p>
<p>= 7 × 13 = <strong>91</strong></p>`,
        shortDescription: "Master algebraic identities and simplification techniques.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 5: ALGEBRA - FACTORIZATION AND EQUATIONS
  // ============================================
  {
    title: "Week 5: Factorization and Linear Equations",
    weekNumber: 5,
    description:
      "Learn factorization methods and solving linear equations in one and two variables.",
    order: 5,
    lessons: [
      {
        lessonTitle: "Factorization Methods",
        lessonContent: `<h2>Factorization</h2>

<h3>What is Factorization?</h3>
<p>Factorization is expressing an algebraic expression as a product of its factors.</p>

<h3>Method 1: Common Factor Method</h3>
<p>Take out the highest common factor (HCF).</p>
<p><strong>Example:</strong> 6x²y + 9xy² = 3xy(2x + 3y)</p>

<h3>Method 2: Grouping Method</h3>
<p>Group terms and find common factors.</p>
<p><strong>Example:</strong> ax + ay + bx + by</p>
<p>= a(x + y) + b(x + y)</p>
<p>= (x + y)(a + b)</p>

<h3>Method 3: Using Identities</h3>

<h4>a² - b² = (a + b)(a - b)</h4>
<p><strong>Example:</strong> 9x² - 16 = (3x)² - 4² = (3x + 4)(3x - 4)</p>

<h4>a² + 2ab + b² = (a + b)²</h4>
<p><strong>Example:</strong> x² + 6x + 9 = x² + 2(x)(3) + 3² = (x + 3)²</p>

<h4>a² - 2ab + b² = (a - b)²</h4>
<p><strong>Example:</strong> 4x² - 12x + 9 = (2x)² - 2(2x)(3) + 3² = (2x - 3)²</p>

<h3>Method 4: Factorization of Quadratic Trinomials</h3>
<p>For ax² + bx + c, find two numbers whose product = ac and sum = b</p>

<p><strong>Example:</strong> x² + 5x + 6</p>
<p>Product = 6, Sum = 5</p>
<p>Numbers are 2 and 3</p>
<p>= x² + 2x + 3x + 6</p>
<p>= x(x + 2) + 3(x + 2)</p>
<p>= <strong>(x + 2)(x + 3)</strong></p>

<h3>Method 5: Factoring a³ ± b³</h3>
<p>a³ + b³ = (a + b)(a² - ab + b²)</p>
<p>a³ - b³ = (a - b)(a² + ab + b²)</p>

<p><strong>Example:</strong> 8x³ - 27</p>
<p>= (2x)³ - 3³</p>
<p>= (2x - 3)(4x² + 6x + 9)</p>`,
        shortDescription: "Master different factorization techniques.",
        order: 1,
        duration: 55,
        videoUrl: "",
      },
      {
        lessonTitle: "Linear Equations in One Variable",
        lessonContent: `<h2>Linear Equations in One Variable</h2>

<h3>What is a Linear Equation?</h3>
<p>An equation where the highest power of the variable is 1.</p>
<p>Standard form: ax + b = 0, where a ≠ 0</p>

<h3>Steps to Solve:</h3>
<ol>
  <li>Simplify both sides (remove brackets, combine like terms)</li>
  <li>Bring all variable terms to one side</li>
  <li>Bring all constant terms to the other side</li>
  <li>Solve for the variable</li>
</ol>

<h3>Example 1:</h3>
<p><strong>Q:</strong> Solve: 3x + 7 = 22</p>
<p><strong>Solution:</strong></p>
<p>3x = 22 - 7</p>
<p>3x = 15</p>
<p>x = 15/3 = <strong>5</strong></p>

<h3>Example 2:</h3>
<p><strong>Q:</strong> Solve: 5(x - 2) = 3(x + 4)</p>
<p><strong>Solution:</strong></p>
<p>5x - 10 = 3x + 12</p>
<p>5x - 3x = 12 + 10</p>
<p>2x = 22</p>
<p>x = <strong>11</strong></p>

<h3>Example 3 (Fraction):</h3>
<p><strong>Q:</strong> Solve: (2x + 3)/5 = (x - 1)/3</p>
<p><strong>Solution:</strong></p>
<p>Cross multiply: 3(2x + 3) = 5(x - 1)</p>
<p>6x + 9 = 5x - 5</p>
<p>6x - 5x = -5 - 9</p>
<p>x = <strong>-14</strong></p>

<h3>Word Problem:</h3>
<p><strong>Q:</strong> The sum of three consecutive numbers is 72. Find the numbers.</p>
<p><strong>Solution:</strong></p>
<p>Let the numbers be x, x+1, x+2</p>
<p>x + (x+1) + (x+2) = 72</p>
<p>3x + 3 = 72</p>
<p>3x = 69</p>
<p>x = 23</p>
<p>Numbers are <strong>23, 24, 25</strong></p>`,
        shortDescription: "Learn to solve linear equations with examples.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Simultaneous Linear Equations",
        lessonContent: `<h2>Simultaneous Linear Equations</h2>

<h3>What are Simultaneous Equations?</h3>
<p>Two or more linear equations with two or more variables that must be solved together.</p>

<h3>Methods of Solving:</h3>

<h4>1. Substitution Method</h4>
<p>Express one variable in terms of another, then substitute.</p>

<p><strong>Example:</strong> Solve: x + y = 10 ... (i), 2x - y = 5 ... (ii)</p>
<p>From (i): y = 10 - x</p>
<p>Substitute in (ii): 2x - (10 - x) = 5</p>
<p>2x - 10 + x = 5</p>
<p>3x = 15</p>
<p>x = 5</p>
<p>y = 10 - 5 = 5</p>
<p><strong>Solution: x = 5, y = 5</strong></p>

<h4>2. Elimination Method</h4>
<p>Make coefficients of one variable equal, then add or subtract.</p>

<p><strong>Example:</strong> Solve: 3x + 2y = 12 ... (i), 2x + 2y = 10 ... (ii)</p>
<p>Subtract (ii) from (i):</p>
<p>(3x - 2x) + (2y - 2y) = 12 - 10</p>
<p>x = 2</p>
<p>Substitute in (i): 3(2) + 2y = 12</p>
<p>6 + 2y = 12</p>
<p>2y = 6</p>
<p>y = 3</p>
<p><strong>Solution: x = 2, y = 3</strong></p>

<h4>3. Cross-Multiplication Method</h4>
<p>For a₁x + b₁y + c₁ = 0 and a₂x + b₂y + c₂ = 0:</p>
<p><strong>x/(b₁c₂ - b₂c₁) = y/(c₁a₂ - c₂a₁) = 1/(a₁b₂ - a₂b₁)</strong></p>

<h3>Word Problem:</h3>
<p><strong>Q:</strong> The sum of two numbers is 50 and their difference is 16. Find the numbers.</p>
<p><strong>Solution:</strong></p>
<p>Let numbers be x and y (x > y)</p>
<p>x + y = 50 ... (i)</p>
<p>x - y = 16 ... (ii)</p>
<p>Adding: 2x = 66, so x = 33</p>
<p>From (i): y = 50 - 33 = 17</p>
<p><strong>Numbers: 33 and 17</strong></p>`,
        shortDescription: "Master solving simultaneous equations using different methods.",
        order: 3,
        duration: 55,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 6: GEOMETRY - TRIANGLES AND QUADRILATERALS
  // ============================================
  {
    title: "Week 6: Geometry - Triangles and Quadrilaterals",
    weekNumber: 6,
    description:
      "Learn properties of triangles, congruence, similarity, and quadrilaterals.",
    order: 6,
    lessons: [
      {
        lessonTitle: "Properties of Triangles",
        lessonContent: `<h2>Triangle Properties</h2>

<h3>Basic Properties:</h3>
<ul>
  <li>Sum of interior angles = 180°</li>
  <li>Exterior angle = Sum of two non-adjacent interior angles</li>
  <li>Sum of any two sides > Third side</li>
</ul>

<h3>Types of Triangles:</h3>
<table border="1" cellpadding="8">
  <tr><th>By Sides</th><th>By Angles</th></tr>
  <tr><td>Equilateral (all equal)</td><td>Acute (all < 90°)</td></tr>
  <tr><td>Isosceles (two equal)</td><td>Right (one = 90°)</td></tr>
  <tr><td>Scalene (all different)</td><td>Obtuse (one > 90°)</td></tr>
</table>

<h3>Important Lines in a Triangle:</h3>
<ul>
  <li><strong>Median:</strong> Line from vertex to midpoint of opposite side (centroid)</li>
  <li><strong>Altitude:</strong> Perpendicular from vertex to opposite side (orthocenter)</li>
  <li><strong>Angle Bisector:</strong> Line bisecting an angle (incenter)</li>
  <li><strong>Perpendicular Bisector:</strong> Perpendicular line through midpoint of side (circumcenter)</li>
</ul>

<h3>Congruence of Triangles:</h3>
<p>Two triangles are congruent if they have same shape and size.</p>
<p><strong>Criteria:</strong></p>
<ul>
  <li><strong>SSS:</strong> Three sides are equal</li>
  <li><strong>SAS:</strong> Two sides and included angle are equal</li>
  <li><strong>ASA:</strong> Two angles and included side are equal</li>
  <li><strong>AAS:</strong> Two angles and non-included side are equal</li>
  <li><strong>RHS:</strong> Right angle, hypotenuse, and one side are equal</li>
</ul>

<h3>Properties of Isosceles Triangle:</h3>
<ul>
  <li>Base angles are equal</li>
  <li>Altitude from vertex angle bisects the base</li>
  <li>Median to base is also altitude and angle bisector</li>
</ul>

<h3>Properties of Equilateral Triangle:</h3>
<ul>
  <li>All angles = 60°</li>
  <li>All medians, altitudes, angle bisectors are equal</li>
</ul>`,
        shortDescription: "Learn triangle properties and congruence criteria.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Similar Triangles",
        lessonContent: `<h2>Similar Triangles</h2>

<h3>What is Similarity?</h3>
<p>Two triangles are similar if they have same shape but different sizes.</p>
<p>Corresponding angles are equal, corresponding sides are proportional.</p>

<h3>Criteria for Similarity:</h3>
<ul>
  <li><strong>AAA (AA):</strong> All three angles (or two angles) are equal</li>
  <li><strong>SSS:</strong> All three pairs of corresponding sides are proportional</li>
  <li><strong>SAS:</strong> Two pairs of sides are proportional with included angle equal</li>
</ul>

<h3>Properties:</h3>
<p>If △ABC ~ △PQR with ratio k, then:</p>
<ul>
  <li>AB/PQ = BC/QR = AC/PR = k (ratio of sides)</li>
  <li>Ratio of perimeters = k</li>
  <li>Ratio of areas = k²</li>
  <li>Ratio of corresponding altitudes = k</li>
</ul>

<h3>Basic Proportionality Theorem (Thales' Theorem):</h3>
<p>If a line is drawn parallel to one side of a triangle, it divides the other two sides proportionally.</p>
<p>If DE || BC in △ABC, then AD/DB = AE/EC</p>

<h3>Example:</h3>
<p><strong>Q:</strong> In △ABC, DE || BC where D is on AB and E is on AC. If AD = 4cm, DB = 6cm, and AE = 5cm, find EC.</p>
<p><strong>Solution:</strong></p>
<p>By BPT: AD/DB = AE/EC</p>
<p>4/6 = 5/EC</p>
<p>EC = 5 × 6/4 = <strong>7.5 cm</strong></p>

<h3>Pythagoras Theorem:</h3>
<p>In a right triangle, the square of the hypotenuse equals the sum of squares of the other two sides.</p>
<p><strong>c² = a² + b²</strong></p>

<h3>Pythagorean Triplets:</h3>
<p>3, 4, 5 | 5, 12, 13 | 8, 15, 17 | 7, 24, 25</p>`,
        shortDescription: "Understand similarity and proportionality in triangles.",
        order: 2,
        duration: 55,
        videoUrl: "",
      },
      {
        lessonTitle: "Quadrilaterals and Their Properties",
        lessonContent: `<h2>Quadrilaterals</h2>

<h3>Types of Quadrilaterals:</h3>

<h4>1. Parallelogram</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>Opposite sides are equal and parallel</li>
  <li>Opposite angles are equal</li>
  <li>Diagonals bisect each other</li>
  <li>Consecutive angles are supplementary (sum = 180°)</li>
</ul>

<h4>2. Rectangle</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>All angles are 90°</li>
  <li>Opposite sides are equal</li>
  <li>Diagonals are equal and bisect each other</li>
</ul>

<h4>3. Rhombus</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>All sides are equal</li>
  <li>Opposite angles are equal</li>
  <li>Diagonals bisect each other at right angles</li>
  <li>Diagonals bisect the vertex angles</li>
</ul>

<h4>4. Square</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>All sides are equal</li>
  <li>All angles are 90°</li>
  <li>Diagonals are equal and bisect at right angles</li>
</ul>

<h4>5. Trapezium (Trapezoid)</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>One pair of opposite sides is parallel (parallel sides are called bases)</li>
  <li>Sum of angles on same side = 180°</li>
</ul>

<h4>6. Kite</h4>
<p><strong>Properties:</strong></p>
<ul>
  <li>Two pairs of adjacent sides are equal</li>
  <li>Diagonals are perpendicular</li>
  <li>One diagonal bisects the other</li>
</ul>

<h3>Mid-Point Theorem:</h3>
<p>The line joining the midpoints of two sides of a triangle is parallel to the third side and half its length.</p>`,
        shortDescription: "Learn properties of different quadrilaterals.",
        order: 3,
        duration: 50,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 7: MENSURATION
  // ============================================
  {
    title: "Week 7: Mensuration - Area and Volume",
    weekNumber: 7,
    description:
      "Calculate surface area and volume of prisms, cylinders, pyramids, and cones.",
    order: 7,
    lessons: [
      {
        lessonTitle: "Surface Area and Volume of Prisms",
        lessonContent: `<h2>Prisms</h2>

<h3>What is a Prism?</h3>
<p>A prism is a 3D solid with two identical parallel polygon bases and rectangular lateral faces.</p>

<h3>Types of Prisms:</h3>
<ul>
  <li>Triangular Prism (triangle base)</li>
  <li>Rectangular Prism/Cuboid (rectangle base)</li>
  <li>Pentagonal Prism, Hexagonal Prism, etc.</li>
</ul>

<h3>Formulas for Prism:</h3>
<p><strong>Lateral Surface Area (LSA) = Perimeter of base × Height</strong></p>
<p><strong>Total Surface Area (TSA) = LSA + 2 × Area of base</strong></p>
<p><strong>Volume = Area of base × Height</strong></p>

<h3>Cuboid (Rectangular Prism):</h3>
<p>Dimensions: length (l), breadth (b), height (h)</p>
<ul>
  <li>LSA = 2h(l + b)</li>
  <li>TSA = 2(lb + bh + hl)</li>
  <li>Volume = l × b × h</li>
  <li>Diagonal = √(l² + b² + h²)</li>
</ul>

<h3>Cube:</h3>
<p>All sides equal to 'a'</p>
<ul>
  <li>LSA = 4a²</li>
  <li>TSA = 6a²</li>
  <li>Volume = a³</li>
  <li>Diagonal = a√3</li>
</ul>

<h3>Example:</h3>
<p><strong>Q:</strong> A room is 8m long, 6m wide, and 4m high. Find the cost of plastering the four walls at Rs. 25 per sq. meter.</p>
<p><strong>Solution:</strong></p>
<p>LSA = 2h(l + b) = 2 × 4 × (8 + 6) = 8 × 14 = 112 m²</p>
<p>Cost = 112 × 25 = <strong>Rs. 2,800</strong></p>

<h3>Triangular Prism:</h3>
<p>If base is a right triangle with legs a, b and hypotenuse c:</p>
<ul>
  <li>Base Area = (1/2) × a × b</li>
  <li>LSA = (a + b + c) × height of prism</li>
  <li>Volume = (1/2) × a × b × h</li>
</ul>`,
        shortDescription: "Learn surface area and volume of prisms.",
        order: 1,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Cylinder - Surface Area and Volume",
        lessonContent: `<h2>Cylinder</h2>

<h3>Parts of a Cylinder:</h3>
<ul>
  <li>Two circular bases of radius r</li>
  <li>Height (h) - perpendicular distance between bases</li>
  <li>Curved surface (lateral surface)</li>
</ul>

<h3>Formulas:</h3>
<table border="1" cellpadding="8">
  <tr><th>Quantity</th><th>Formula</th></tr>
  <tr><td>Curved Surface Area (CSA)</td><td>2πrh</td></tr>
  <tr><td>Area of one base</td><td>πr²</td></tr>
  <tr><td>Total Surface Area (TSA)</td><td>2πr(r + h)</td></tr>
  <tr><td>Volume</td><td>πr²h</td></tr>
</table>

<h3>Note: Use π = 22/7 or 3.14 as given in the question</h3>

<h3>Example 1:</h3>
<p><strong>Q:</strong> Find the CSA, TSA, and volume of a cylinder with radius 7 cm and height 10 cm.</p>
<p><strong>Solution:</strong></p>
<p>CSA = 2πrh = 2 × (22/7) × 7 × 10 = <strong>440 cm²</strong></p>
<p>TSA = 2πr(r + h) = 2 × (22/7) × 7 × (7 + 10) = 2 × 22 × 17 = <strong>748 cm²</strong></p>
<p>Volume = πr²h = (22/7) × 49 × 10 = <strong>1,540 cm³</strong></p>

<h3>Example 2:</h3>
<p><strong>Q:</strong> A cylindrical tank has diameter 1.4 m and height 2 m. Find the capacity in liters.</p>
<p><strong>Solution:</strong></p>
<p>r = 0.7 m = 70 cm</p>
<p>h = 2 m = 200 cm</p>
<p>Volume = πr²h = (22/7) × 70 × 70 × 200</p>
<p>= 22 × 10 × 70 × 200 = 3,080,000 cm³</p>
<p>= 3,080,000 ml = <strong>3,080 liters</strong></p>
<p>(1 liter = 1000 cm³)</p>

<h3>Hollow Cylinder:</h3>
<p>For a hollow cylinder with outer radius R and inner radius r:</p>
<ul>
  <li>Volume = π(R² - r²)h</li>
  <li>TSA = 2π(R + r)h + 2π(R² - r²)</li>
</ul>`,
        shortDescription: "Calculate surface area and volume of cylinders.",
        order: 2,
        duration: 50,
        videoUrl: "",
      },
      {
        lessonTitle: "Pyramids and Cones",
        lessonContent: `<h2>Pyramid</h2>

<h3>Parts of a Pyramid:</h3>
<ul>
  <li>Base (polygon)</li>
  <li>Apex (top vertex)</li>
  <li>Height (h) - perpendicular from apex to base</li>
  <li>Slant height (l) - distance from apex to midpoint of base edge</li>
  <li>Triangular lateral faces</li>
</ul>

<h3>Formulas for Pyramid:</h3>
<p><strong>LSA = (1/2) × Perimeter of base × Slant height</strong></p>
<p><strong>TSA = LSA + Area of base</strong></p>
<p><strong>Volume = (1/3) × Area of base × Height</strong></p>

<h3>Square-Based Pyramid:</h3>
<p>If base side = a, height = h, slant height = l</p>
<ul>
  <li>Base Area = a²</li>
  <li>LSA = (1/2) × 4a × l = 2al</li>
  <li>TSA = a² + 2al</li>
  <li>Volume = (1/3) × a² × h</li>
  <li>l² = h² + (a/2)² (Pythagoras)</li>
</ul>

<h2>Cone</h2>

<h3>Parts of a Cone:</h3>
<ul>
  <li>Circular base of radius r</li>
  <li>Height (h)</li>
  <li>Slant height (l) where l² = r² + h²</li>
</ul>

<h3>Formulas for Cone:</h3>
<table border="1" cellpadding="8">
  <tr><th>Quantity</th><th>Formula</th></tr>
  <tr><td>Curved Surface Area</td><td>πrl</td></tr>
  <tr><td>Total Surface Area</td><td>πr(r + l)</td></tr>
  <tr><td>Volume</td><td>(1/3)πr²h</td></tr>
</table>

<h3>Example:</h3>
<p><strong>Q:</strong> A cone has radius 6 cm and height 8 cm. Find CSA, TSA, and volume.</p>
<p><strong>Solution:</strong></p>
<p>l = √(r² + h²) = √(36 + 64) = √100 = 10 cm</p>
<p>CSA = πrl = (22/7) × 6 × 10 = <strong>188.57 cm²</strong></p>
<p>TSA = πr(r + l) = (22/7) × 6 × 16 = <strong>301.71 cm²</strong></p>
<p>Volume = (1/3)πr²h = (1/3) × (22/7) × 36 × 8 = <strong>301.71 cm³</strong></p>`,
        shortDescription: "Learn formulas for pyramids and cones.",
        order: 3,
        duration: 55,
        videoUrl: "",
      },
    ],
  },

  // ============================================
  // WEEK 8: STATISTICS AND PROBABILITY
  // ============================================
  {
    title: "Week 8: Statistics and Probability",
    weekNumber: 8,
    description:
      "Learn measures of central tendency, quartiles, and basic probability.",
    order: 8,
    lessons: [
      {
        lessonTitle: "Mean, Median, and Mode",
        lessonContent: `<h2>Measures of Central Tendency</h2>

<h3>1. Mean (Average)</h3>
<p><strong>For Individual Data:</strong></p>
<p>Mean (x̄) = Sum of observations / Number of observations = Σx / n</p>

<p><strong>For Discrete Frequency Distribution:</strong></p>
<p>Mean = Σfx / Σf</p>

<p><strong>For Grouped Data (Continuous):</strong></p>
<p>Mean = Σfm / Σf, where m = mid-value of class</p>

<h3>Example:</h3>
<p><strong>Q:</strong> Find mean of: 5, 8, 12, 15, 20</p>
<p><strong>Solution:</strong></p>
<p>Mean = (5 + 8 + 12 + 15 + 20) / 5 = 60/5 = <strong>12</strong></p>

<h3>2. Median (Middle Value)</h3>
<p>The middle value when data is arranged in order.</p>

<p><strong>For Odd n:</strong> Median = ((n+1)/2)th observation</p>
<p><strong>For Even n:</strong> Median = Average of (n/2)th and (n/2 + 1)th observations</p>

<p><strong>For Grouped Data:</strong></p>
<p>Median = L + [(N/2 - cf) / f] × h</p>
<p>Where: L = lower limit of median class, cf = cumulative frequency before median class, f = frequency of median class, h = class interval</p>

<h3>3. Mode (Most Frequent)</h3>
<p>The value that occurs most frequently.</p>

<p><strong>For Grouped Data:</strong></p>
<p>Mode = L + [(f₁ - f₀) / (2f₁ - f₀ - f₂)] × h</p>
<p>Where: L = lower limit of modal class, f₁ = frequency of modal class, f₀ = frequency of class before modal class, f₂ = frequency of class after modal class</p>

<h3>Relationship:</h3>
<p><strong>Mode = 3 × Median - 2 × Mean</strong> (approximately for moderately skewed data)</p>`,
        shortDescription: "Master mean, median, and mode calculations.",
        order: 1,
        duration: 55,
        videoUrl: "",
      },
      {
        lessonTitle: "Quartiles and Percentiles",
        lessonContent: `<h2>Quartiles</h2>

<h3>What are Quartiles?</h3>
<p>Quartiles divide the data into four equal parts.</p>
<ul>
  <li><strong>Q₁ (First Quartile/Lower Quartile):</strong> 25% of data below this</li>
  <li><strong>Q₂ (Second Quartile):</strong> 50% of data below = Median</li>
  <li><strong>Q₃ (Third Quartile/Upper Quartile):</strong> 75% of data below this</li>
</ul>

<h3>Formulas for Individual Data:</h3>
<p>Q₁ = Value at position (n+1)/4</p>
<p>Q₂ = Value at position (n+1)/2</p>
<p>Q₃ = Value at position 3(n+1)/4</p>

<h3>For Grouped Data:</h3>
<p><strong>Q₁ = L + [(N/4 - cf) / f] × h</strong></p>
<p><strong>Q₃ = L + [(3N/4 - cf) / f] × h</strong></p>

<h3>Example:</h3>
<p><strong>Q:</strong> Find Q₁, Q₂, Q₃ for: 2, 5, 7, 9, 11, 14, 18</p>
<p><strong>Solution:</strong> n = 7</p>
<p>Q₁ position = (7+1)/4 = 2nd value = <strong>5</strong></p>
<p>Q₂ position = (7+1)/2 = 4th value = <strong>9</strong></p>
<p>Q₃ position = 3(7+1)/4 = 6th value = <strong>14</strong></p>

<h3>Interquartile Range (IQR):</h3>
<p><strong>IQR = Q₃ - Q₁</strong></p>
<p>Measures the spread of the middle 50% of data.</p>

<h2>Percentiles</h2>
<p>Percentiles divide data into 100 equal parts.</p>
<p>P₂₅ = Q₁, P₅₀ = Q₂ = Median, P₇₅ = Q₃</p>

<h3>Formula:</h3>
<p><strong>Pₖ = L + [(kN/100 - cf) / f] × h</strong></p>`,
        shortDescription: "Learn to calculate quartiles and percentiles.",
        order: 2,
        duration: 45,
        videoUrl: "",
      },
      {
        lessonTitle: "Introduction to Probability",
        lessonContent: `<h2>Probability</h2>

<h3>Basic Terms:</h3>
<ul>
  <li><strong>Experiment:</strong> An activity with uncertain outcome</li>
  <li><strong>Random Experiment:</strong> An experiment that can be repeated and has multiple possible outcomes</li>
  <li><strong>Sample Space (S):</strong> Set of all possible outcomes</li>
  <li><strong>Event:</strong> A subset of sample space (desired outcomes)</li>
</ul>

<h3>Probability Formula:</h3>
<p><strong>P(E) = Number of favorable outcomes / Total number of outcomes = n(E) / n(S)</strong></p>

<h3>Properties:</h3>
<ul>
  <li>0 ≤ P(E) ≤ 1</li>
  <li>P(impossible event) = 0</li>
  <li>P(certain event) = 1</li>
  <li>P(not E) = 1 - P(E)</li>
</ul>

<h3>Example 1 - Coin:</h3>
<p><strong>Q:</strong> A coin is tossed. Find the probability of getting a head.</p>
<p><strong>Solution:</strong></p>
<p>S = {H, T}, n(S) = 2</p>
<p>E = {H}, n(E) = 1</p>
<p>P(Head) = 1/2 = <strong>0.5 or 50%</strong></p>

<h3>Example 2 - Dice:</h3>
<p><strong>Q:</strong> A die is rolled. Find P(getting a prime number).</p>
<p><strong>Solution:</strong></p>
<p>S = {1, 2, 3, 4, 5, 6}, n(S) = 6</p>
<p>Prime numbers: E = {2, 3, 5}, n(E) = 3</p>
<p>P(Prime) = 3/6 = <strong>1/2</strong></p>

<h3>Example 3 - Cards:</h3>
<p><strong>Q:</strong> From a deck of 52 cards, find P(drawing a king).</p>
<p><strong>Solution:</strong></p>
<p>n(S) = 52, Number of kings = 4</p>
<p>P(King) = 4/52 = <strong>1/13</strong></p>

<h3>Addition Law:</h3>
<p><strong>P(A or B) = P(A) + P(B) - P(A and B)</strong></p>
<p>For mutually exclusive events (can't happen together):</p>
<p><strong>P(A or B) = P(A) + P(B)</strong></p>`,
        shortDescription: "Understand probability concepts and calculations.",
        order: 3,
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
  console.log("Clearing existing Grade 9 Mathematics data...");

  const categoryName = "Grade 9 Mathematics";
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

    console.log("\n--- Creating Grade 9 Mathematics Course ---");
    const mathCategory = await createCategory(mathCategoryData, adminUser);
    const mathCourse = await createCourse(
      mathCourseData,
      mathCourseWeeks,
      mathCategory,
      adminUser,
      lecturer,
    );
    mathCategory.meta.courseCount = 1;
    await mathCategory.save();

    console.log("\n========================================");
    console.log("SEEDING COMPLETED SUCCESSFULLY!");
    console.log("========================================");
    console.log(`\nCategory: ${mathCategory.categoryName}`);
    console.log(
      `  - ${mathCourse.courseTitle} (PAID - NPR ${mathCourse.price}, ${mathCourse.discount}% off)`,
    );
    console.log(
      `    Weeks: ${mathCourse.totalWeeks}, Lessons: ${mathCourse.totalLessons}`,
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
  mathCategoryData,
  mathCourseData,
  mathCourseWeeks,
};
