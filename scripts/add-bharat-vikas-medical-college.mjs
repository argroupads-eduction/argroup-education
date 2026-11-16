import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pagesPath = path.join(
  repoRoot,
  'apps',
  'frontend',
  'data',
  'wp-export-bundle',
  'pages.json'
);

const slug = 'bharat-vikas-medical-college';
const image = '/wp-content/uploads/colleges/bharat-vikas-medical-college-kota.png';
const canonicalUrl = `https://argroupofeducation.com/${slug}`;

const content = `
<p>If you want to pursue MBBS in Rajasthan and are looking for a new private medical college, BHARAT VIKAS Institute of Medical Sciences, Kota can be a good option. Students can study MBBS with modern infrastructure, experienced faculty and practical clinical training.</p>
<p>In this detailed guide, we discuss BHARAT VIKAS Institute of Medical Sciences, Kota admission process, eligibility, fees, seats, cutoff, hostel, infrastructure and Rajasthan NEET UG counselling.</p>

<h2>BHARAT VIKAS Institute of Medical Sciences, Kota – Overview</h2>
<table>
  <tbody>
    <tr><th>Particular</th><th>Details</th></tr>
    <tr><td>College Name</td><td>BHARAT VIKAS Institute of Medical Sciences, Kota</td></tr>
    <tr><td>College Type</td><td>Private Medical College</td></tr>
    <tr><td>Location</td><td>Kota, Rajasthan</td></tr>
    <tr><td>Course</td><td>MBBS</td></tr>
    <tr><td>MBBS Seats</td><td>150</td></tr>
    <tr><td>Admission</td><td>NEET UG + Rajasthan UG Counselling</td></tr>
    <tr><td>Recognition</td><td>As per applicable NMC approval</td></tr>
    <tr><td>Hostel</td><td>Available</td></tr>
    <tr><td>Teaching Hospital</td><td>Available</td></tr>
  </tbody>
</table>

<h2>About BHARAT VIKAS Institute of Medical Sciences, Kota</h2>
<p>BHARAT VIKAS Institute of Medical Sciences, Kota, Rajasthan is a newly established private medical college. The college aims to provide quality medical education where students receive practical hospital exposure along with classroom learning.</p>
<p>The college follows the latest Competency-Based Medical Education (CBME) curriculum, helping students develop both theoretical knowledge and practical skills. For students who want to pursue MBBS in Rajasthan or MBBS in India, the college can be a promising choice.</p>

<h2>Recognition and Affiliation</h2>
<p>It is important to check a college's current approval before taking admission. BHARAT VIKAS Institute of Medical Sciences, Kota operates according to the rules and guidelines of the National Medical Commission (NMC). Its affiliation is governed by notifications from the Rajasthan Government and concerned authorities.</p>
<p>Students should verify the latest official NMC notification, university affiliation and Rajasthan counselling brochure before admission.</p>

<h2>MBBS Course Details</h2>
<ul>
  <li><strong>Course Duration:</strong> 5.5 years</li>
  <li><strong>Academic Study:</strong> 4.5 years</li>
  <li><strong>Internship:</strong> 1-year compulsory rotating internship</li>
  <li><strong>Admission Through:</strong> NEET UG</li>
</ul>
<p>Students receive training in Anatomy, Physiology, Biochemistry, Pharmacology, Medicine, Surgery, Pediatrics, Orthopedics, ENT, Ophthalmology, Community Medicine and other major subjects.</p>

<h2>Eligibility Criteria</h2>
<p>To apply for MBBS admission at Bharat Vikas Institute of Medical Sciences, Kota, a candidate must:</p>
<ul>
  <li>Qualify NEET UG.</li>
  <li>Pass Class 12 with Physics, Chemistry, Biology and English.</li>
  <li>Meet the minimum eligibility criteria prescribed by NMC.</li>
  <li>Meet the applicable minimum age requirement.</li>
</ul>
<p>Final admission depends on NEET rank, category, counselling eligibility and seat availability.</p>

<h2>MBBS Admission Process 2026</h2>
<ol>
  <li>Qualify the NEET UG examination.</li>
  <li>Register on the official Rajasthan UG Counselling portal.</li>
  <li>Select Bharat Vikas Institute of Medical Sciences, Kota during choice filling.</li>
  <li>Wait for seat allotment based on NEET rank, category and seat availability.</li>
  <li>Complete document verification at the allotted reporting centre or college.</li>
  <li>Deposit the prescribed college fee.</li>
  <li>Complete reporting formalities to confirm admission.</li>
</ol>

<h2>BHARAT VIKAS Medical College Kota MBBS Fees</h2>
<p>The latest fee structure is released by the counselling authority and college management. Students should verify the official fee notice before choice filling.</p>
<table>
  <tbody>
    <tr><th>Fee</th><th>Details</th></tr>
    <tr><td>Tuition Fee</td><td>₹18.90 lakh (verify from the latest official counselling notification)</td></tr>
  </tbody>
</table>

<h2>Infrastructure</h2>
<p>The college campus is expected to provide the following academic and student facilities:</p>
<ul>
  <li>Smart classrooms</li>
  <li>Modern laboratories</li>
  <li>Anatomy dissection hall</li>
  <li>Digital library</li>
  <li>Skill and simulation labs</li>
  <li>Computer lab</li>
  <li>Seminar hall and auditorium</li>
  <li>Sports complex and cafeteria</li>
  <li>Wi-Fi campus and CCTV security</li>
  <li>Transportation facility</li>
</ul>

<h2>Teaching Hospital and Clinical Exposure</h2>
<p>Hospital exposure is an essential part of MBBS education. Students receive practical clinical training in the attached teaching hospital under the guidance of experienced doctors.</p>
<p>Clinical departments and services may include:</p>
<ul>
  <li>General Medicine and Surgery</li>
  <li>Pediatrics and Orthopedics</li>
  <li>ENT and Ophthalmology</li>
  <li>Obstetrics and Gynecology</li>
  <li>ICU and Emergency</li>
  <li>Blood Bank and Diagnostic Lab</li>
  <li>Radiology and Pharmacy</li>
</ul>

<h2>Hostel Facilities</h2>
<p>Hostel accommodation is available for students. Facilities may include:</p>
<ul>
  <li>Separate boys' and girls' hostels</li>
  <li>Furnished rooms and mess facility</li>
  <li>Wi-Fi and reading room</li>
  <li>Recreation area and CCTV security</li>
  <li>24×7 water and electricity</li>
  <li>Medical support</li>
</ul>

<h2>Faculty</h2>
<p>Experienced professors and doctors provide classroom teaching and clinical training. Faculty members support students through theory classes, practical sessions, clinical demonstrations, case discussions, research activities and skill development.</p>

<h2>Documents Required</h2>
<ul>
  <li>NEET admit card and scorecard</li>
  <li>Class 10 and Class 12 marksheets</li>
  <li>Transfer and migration certificates</li>
  <li>Character certificate</li>
  <li>Domicile certificate, if applicable</li>
  <li>Category certificate, if applicable</li>
  <li>Aadhaar card and passport-size photographs</li>
  <li>Seat allotment letter</li>
</ul>

<h2>Rajasthan UG Counselling Process</h2>
<p>Candidates must participate in Rajasthan UG Counselling for state counselling seats. The process generally includes:</p>
<ol>
  <li>Online registration and fee payment</li>
  <li>Document upload and merit-list publication</li>
  <li>Choice filling and locking</li>
  <li>Seat allotment</li>
  <li>Reporting, verification and admission confirmation</li>
</ol>

<h2>Why Choose BHARAT VIKAS Institute of Medical Sciences, Kota?</h2>
<ul>
  <li>New private medical college in Rajasthan</li>
  <li>150 MBBS seats</li>
  <li>Modern campus and advanced laboratories</li>
  <li>Teaching hospital and clinical exposure</li>
  <li>Hostel facility</li>
  <li>Qualified faculty</li>
  <li>Competency-Based Medical Education curriculum</li>
</ul>

<h2>Why Choose AR Group of Education?</h2>
<p>The medical admission process can be confusing, especially when counselling rounds begin. AR Group of Education provides complete MBBS admission guidance, including:</p>
<ul>
  <li>Rajasthan UG Counselling support</li>
  <li>College selection and choice-filling assistance</li>
  <li>Document verification guidance</li>
  <li>Seat-allotment and counselling strategy</li>
  <li>Private medical college admission guidance</li>
</ul>

<h2>Conclusion</h2>
<p>BHARAT VIKAS Institute of Medical Sciences, Kota can be a promising option for students planning to pursue MBBS in Rajasthan. With 150 MBBS seats, modern infrastructure, experienced faculty and a teaching hospital, the college aims to provide quality medical education.</p>
<p>Before admission, verify the official counselling schedule, fee structure, seat matrix, NMC approval and eligibility criteria. The expert team at AR Group of Education can guide you through college selection, counselling and the complete admission process.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is Bharat Vikas Institute of Medical Sciences, Kota a private medical college?</h3>
<p>Yes, it is a private medical college in Rajasthan.</p>
<h3>How many MBBS seats are available?</h3>
<p>The college information lists 150 MBBS seats. Candidates should confirm the latest seat matrix during counselling.</p>
<h3>What is the basis of MBBS admission?</h3>
<p>Admission is based on NEET UG rank, eligibility, category, Rajasthan UG Counselling and seat availability.</p>
<h3>Is hostel accommodation available?</h3>
<p>Yes, hostel facilities are available for boys and girls.</p>
<h3>Is the MBBS internship compulsory?</h3>
<p>Yes, a one-year rotating internship is compulsory after the academic MBBS programme.</p>
<h3>Does AR Group of Education help with Rajasthan UG Counselling?</h3>
<p>Yes. AR Group of Education provides support from registration and choice filling through seat allotment and reporting.</p>
`.trim();

const faq = [
  {
    question: 'Is Bharat Vikas Institute of Medical Sciences, Kota a private medical college?',
    answer: 'Yes, it is a private medical college in Rajasthan.',
  },
  {
    question: 'How many MBBS seats are available?',
    answer:
      'The college information lists 150 MBBS seats. Candidates should confirm the latest seat matrix during counselling.',
  },
  {
    question: 'What is the basis of MBBS admission?',
    answer:
      'Admission is based on NEET UG rank, eligibility, category, Rajasthan UG Counselling and seat availability.',
  },
  {
    question: 'Is hostel accommodation available?',
    answer: 'Yes, hostel facilities are available for boys and girls.',
  },
  {
    question: 'Does AR Group of Education help with Rajasthan UG Counselling?',
    answer:
      'Yes. AR Group of Education provides support from registration and choice filling through seat allotment and reporting.',
  },
];

const page = {
  wpId: 990002,
  type: 'page',
  slug,
  title: 'BHARAT VIKAS Medical College',
  content,
  excerpt:
    'BHARAT VIKAS Medical College Kota MBBS admission 2026 guide covering fees, seats, eligibility, infrastructure and Rajasthan counselling.',
  featuredImage: image,
  metaTitle: 'BHARAT VIKAS Medical College Kota MBBS Admission 2026 Guide',
  metaDescription:
    'Know BHARAT VIKAS Institute of Medical Sciences, Kota MBBS Admission 2026, fees, seats, cutoff, eligibility, counselling process, and more.',
  canonicalUrl,
  focusKeyword: 'BHARAT VIKAS Medical College Kota',
  keywords: [
    'BHARAT VIKAS Medical College Kota',
    'Bharat Vikas Institute of Medical Sciences',
    'Bharat Vikas Medical College fees',
    'Bharat Vikas Medical College admission 2026',
    'MBBS in Rajasthan',
    'Rajasthan NEET UG counselling',
  ],
  ogTitle: 'BHARAT VIKAS Medical College Kota MBBS Admission 2026',
  ogDescription:
    'Explore BHARAT VIKAS Medical College Kota fees, seats, admission, eligibility, facilities and Rajasthan UG counselling.',
  ogImage: image,
  twitterTitle: 'BHARAT VIKAS Medical College Kota MBBS Admission 2026',
  twitterDescription:
    'Fees, seats, eligibility, admission process and Rajasthan NEET UG counselling details.',
  schemaJson: [
    {
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: 'BHARAT VIKAS Institute of Medical Sciences, Kota',
      alternateName: 'BHARAT VIKAS Medical College',
      url: canonicalUrl,
      image: `https://argroupofeducation.com${image}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Kota',
        addressRegion: 'Rajasthan',
        addressCountry: 'IN',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map(({ question, answer }) => ({
        '@type': 'Question',
        name: question,
        acceptedAnswer: { '@type': 'Answer', text: answer },
      })),
    },
  ],
  date: '2026-07-17T00:00:00.000Z',
  modified: '2026-07-17T00:00:00.000Z',
};

const pages = JSON.parse(await readFile(pagesPath, 'utf8'));
const existingIndex = pages.findIndex((entry) => entry.slug === slug);
if (existingIndex >= 0) pages[existingIndex] = page;
else pages.push(page);
await writeFile(pagesPath, JSON.stringify(pages), 'utf8');

console.log(`${existingIndex >= 0 ? 'Updated' : 'Added'} ${slug}`);
