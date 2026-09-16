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

const slug = 'dr-b-s-tomar-institute-of-medical-sciences-and-research';
const image = `/wp-content/uploads/colleges/${slug}.png`;
const canonicalUrl = `https://argroupofeducation.com/${slug}`;
const h1 = 'Dr. B. S. Tomar Institute of Medical Sciences and Research';

const content = `
<p>If you want to pursue MBBS in Rajasthan and have already qualified NEET UG, Dr. B. S. Tomar Institute of Medical Sciences and Research, Jagatpura, Rajasthan can be a promising option. The college is a newly established private medical college focused on quality medical education and practical clinical training.</p>
<p>Located at Science Tech City, Achrol near the Jaipur–Delhi Highway, students get strong connectivity and a focused learning environment. If you are exploring MBBS admission in India among Rajasthan’s emerging private medical colleges, this institute deserves a place on your preference list.</p>
<p>The college functions as per National Medical Commission (NMC) norms and is affiliated with Rajasthan University of Health Sciences (RUHS). It offers 150 MBBS seats. Modern classrooms, advanced laboratories, digital learning facilities, experienced faculty and hospital-based clinical exposure are key highlights.</p>
<p>This guide covers admission process, eligibility, MBBS fees, seat matrix, cutoff trends, hostel facilities, infrastructure and Rajasthan UG counselling for Dr. B. S. Tomar Institute of Medical Sciences and Research.</p>

<h2>College Highlights</h2>
<table>
  <tbody>
    <tr><th>Particular</th><th>Details</th></tr>
    <tr><td>College Name</td><td>Dr. B. S. Tomar Institute of Medical Sciences and Research</td></tr>
    <tr><td>Location</td><td>Jagatpura / Jaipur Region, Rajasthan</td></tr>
    <tr><td>Established</td><td>2025</td></tr>
    <tr><td>College Type</td><td>Private Medical College</td></tr>
    <tr><td>Approved By</td><td>National Medical Commission (NMC)</td></tr>
    <tr><td>Affiliated University</td><td>Rajasthan University of Health Sciences (RUHS)</td></tr>
    <tr><td>Course Offered</td><td>MBBS</td></tr>
    <tr><td>Annual Intake</td><td>150 MBBS seats</td></tr>
    <tr><td>Admission Basis</td><td>NEET UG score</td></tr>
    <tr><td>Counselling</td><td>Rajasthan State UG Counselling</td></tr>
    <tr><td>Official Website</td><td>https://bstmedicalcollege.com/</td></tr>
  </tbody>
</table>

<h2>Why Choose Dr. B. S. Tomar Institute of Medical Sciences and Research?</h2>
<p>For students planning MBBS in Rajasthan, Dr. B. S. Tomar Institute of Medical Sciences and Research is one of the newer private medical colleges in the state. The institute is developed on an approximately 100-acre campus and focuses on quality medical education, research and patient care.</p>
<ul>
  <li><strong>Modern infrastructure:</strong> Smart classrooms, advanced laboratories, skill labs, digital library and modern teaching facilities support practical learning along with classroom teaching.</li>
  <li><strong>Clinical exposure:</strong> The attached teaching hospital provides OPD, IPD and emergency exposure so students can build clinical skills early.</li>
  <li><strong>Experienced faculty:</strong> Teaching is guided by experienced professors and medical specialists with a focus on conceptual learning, practical training and research.</li>
  <li><strong>Growing opportunities:</strong> Expanding MBBS seats in Rajasthan make this college a relevant option for the 2026 counselling process.</li>
</ul>

<h2>MBBS Admission Process</h2>
<p>Admission requires a valid NEET UG score. All 150 MBBS seats — State Quota or Management Quota — are allotted through Rajasthan’s centralized RAJUGNEET counselling conducted by SMS Medical College, Jaipur. There is no direct or offline admission.</p>
<ol>
  <li><strong>NEET eligibility:</strong> Pass Class 12 with Physics, Chemistry, Biology and English. General category candidates need at least 50% marks; SC/ST/OBC need at least 40%. Candidates must be at least 17 years old at admission.</li>
  <li><strong>Qualify NEET UG:</strong> A valid NEET UG score is mandatory.</li>
  <li><strong>Register for Rajasthan UG Counselling:</strong> Complete registration, choice filling, seat allotment and document verification on the official RAJUGNEET portal as per the counselling schedule.</li>
</ol>

<h2>Courses Offered</h2>
<table>
  <tbody>
    <tr><th>Course</th><th>Duration</th></tr>
    <tr><td>MBBS</td><td>5.5 years (4.5 years academic + 1-year internship)</td></tr>
  </tbody>
</table>
<p>The programme follows the NMC curriculum and combines classroom learning, laboratory sessions and clinical training in the attached teaching hospital.</p>

<h2>Fee Structure</h2>
<p>Annual MBBS tuition fees vary by quota and should be verified from the latest official counselling notification. Approximate ranges shared for guidance:</p>
<ul>
  <li><strong>MBBS course fees:</strong> about ₹18.9 lakh per year</li>
  <li><strong>State Quota / AIQ:</strong> about ₹19.25 lakh per year</li>
  <li><strong>Management Quota:</strong> about ₹32.85 lakh per year</li>
  <li><strong>Hostel fee (mandatory):</strong> about ₹3.5 lakh per year</li>
</ul>
<p>Deposit, examination fee and miscellaneous charges are paid separately at admission. As per NMC practice, tuition is typically charged for the 4.5-year academic programme and not during the compulsory internship year — confirm from the latest official circular.</p>

<h2>Infrastructure</h2>
<p>The campus is designed for modern medical education standards and includes:</p>
<ul>
  <li>Modern lecture theatres and smart classrooms</li>
  <li>Anatomy, Physiology, Biochemistry, Histology and Clinical Pathology laboratories</li>
  <li>Spacious library with digital resources and medical journals</li>
  <li>Skill and simulation labs for procedure practice before patient exposure</li>
</ul>

<h2>Teaching Hospital</h2>
<p>Hospital training is central to MBBS education. Clinical departments include General Medicine, General Surgery, Orthopaedics, Obstetrics &amp; Gynaecology, Paediatrics, ENT, Ophthalmology, Psychiatry, Dermatology and Radiology.</p>
<p>Hospital services typically include regular OPD, IPD, emergency care, clinical case discussions and internship training. Recent published hospital statistics cited for the institute include around 86% average bed occupancy, 56,000+ monthly OPD registrations and 5,000+ admitted patients, supporting strong clinical exposure.</p>

<h2>Hostel Facilities</h2>
<p>Campus hostel stay is required. Separate secure housing is available for boys and girls, with double-sharing rooms, mess and common recreation areas. Facilities generally include furnished rooms, Wi-Fi, mess, security, common room and study area. Confirm official hostel charges at the time of admission.</p>

<h2>Why Choose AR Group of Education?</h2>
<p>AR Group of Education provides complete MBBS admission support, including:</p>
<ul>
  <li>MBBS admission guidance</li>
  <li>NEET UG counselling support</li>
  <li>Rajasthan UG counselling assistance</li>
  <li>College selection and choice filling</li>
  <li>Documentation and verification support</li>
  <li>Seat allotment guidance</li>
</ul>

<h2>Conclusion</h2>
<p>Dr. B. S. Tomar Institute of Medical Sciences and Research can be a strong option for students seeking a modern private medical college in Rajasthan. With modern infrastructure, experienced faculty, a teaching hospital and practical clinical exposure, the college aims to build a solid academic and career foundation.</p>
<p>Before choice filling, verify the official counselling schedule, fee structure, seat matrix, NMC approval and eligibility criteria. AR Group of Education can guide you through college selection, counselling and the full admission process.</p>

<h2>Frequently Asked Questions</h2>
<h3>Is Dr. B. S. Tomar Institute of Medical Sciences and Research NMC approved?</h3>
<p>Yes, the college functions as per applicable NMC regulations. Students should verify the latest approval status on the official website.</p>
<h3>How many MBBS seats are available?</h3>
<p>The college offers 150 MBBS seats for eligible NEET UG qualified students.</p>
<h3>Is NEET compulsory for MBBS admission?</h3>
<p>Yes, a valid NEET UG score is mandatory for MBBS admission.</p>
<h3>Does the college provide hostel facilities?</h3>
<p>Yes, separate hostel facilities are available for boys and girls with essential amenities.</p>
<h3>What is the expected NEET cutoff?</h3>
<p>The cutoff changes every year based on NEET scores, seat availability, category and counselling trends.</p>
<h3>How can AR Group of Education help with MBBS admission?</h3>
<p>AR Group of Education provides expert MBBS admission guidance, NEET counselling, college selection, choice filling, documentation support and complete admission assistance.</p>
`.trim();

const faq = [
  {
    question: 'Is Dr. B. S. Tomar Institute of Medical Sciences and Research NMC approved?',
    answer:
      'Yes, the college functions as per applicable NMC regulations. Students should verify the latest approval status on the official website.',
  },
  {
    question: 'How many MBBS seats are available?',
    answer: 'The college offers 150 MBBS seats for eligible NEET UG qualified students.',
  },
  {
    question: 'Is NEET compulsory for MBBS admission?',
    answer: 'Yes, a valid NEET UG score is mandatory for MBBS admission.',
  },
  {
    question: 'Does the college provide hostel facilities?',
    answer: 'Yes, separate hostel facilities are available for boys and girls with essential amenities.',
  },
  {
    question: 'How can AR Group of Education help with MBBS admission?',
    answer:
      'AR Group of Education provides expert MBBS admission guidance, NEET counselling, college selection, choice filling, documentation support and complete admission assistance.',
  },
];

const page = {
  wpId: 990003,
  type: 'page',
  slug,
  title: h1,
  content,
  excerpt:
    'Dr. B. S. Tomar Institute of Medical Sciences and Research, Jagatpura, Rajasthan MBBS admission 2026 guide covering fees, seats, eligibility and counselling.',
  featuredImage: image,
  metaTitle: 'Dr. B. S. Tomar Institute MBBS Admission 2026 Rajasthan',
  metaDescription:
    'Explore Dr. B. S. Tomar Institute of Medical Sciences and Research, Jagatpura, Rajasthan admission 2026, fees, seats, eligibility, cutoff & counselling.',
  canonicalUrl,
  focusKeyword: 'Dr. B. S. Tomar Institute of Medical Sciences and Research',
  keywords: [
    'Dr. B. S. Tomar Institute of Medical Sciences and Research',
    'BST Medical College Jaipur',
    'Dr BS Tomar Medical College fees',
    'Dr BS Tomar Medical College admission 2026',
    'MBBS in Rajasthan',
    'Rajasthan NEET UG counselling',
  ],
  ogTitle: 'Dr. B. S. Tomar Institute MBBS Admission 2026 Rajasthan',
  ogDescription:
    'Fees, seats, eligibility, admission process and Rajasthan UG counselling details for Dr. B. S. Tomar Institute of Medical Sciences and Research.',
  ogImage: image,
  twitterTitle: 'Dr. B. S. Tomar Institute MBBS Admission 2026 Rajasthan',
  twitterDescription:
    'Fees, seats, eligibility, cutoff and Rajasthan NEET UG counselling details.',
  schemaJson: [
    {
      '@context': 'https://schema.org',
      '@type': 'CollegeOrUniversity',
      name: h1,
      alternateName: 'BST Institute of Medical Sciences',
      url: canonicalUrl,
      image: `https://argroupofeducation.com${image}`,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Jagatpura, Jaipur',
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
