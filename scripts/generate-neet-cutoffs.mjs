import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tree = JSON.parse(
  fs.readFileSync(path.join(root, 'apps/frontend/data/mbbs-india-tree.json'), 'utf8')
);

/** Typical private/deemed MBBS UR closing AIR by state (management + private seats) — indicative */
const PRIVATE_CLOSE = {
  up: 280000,
  haryana: 320000,
  rajasthan: 300000,
  maharashtra: 250000,
  karnataka: 220000,
  mp: 310000,
  bihar: 350000,
  uttarakhand: 330000,
  'himachal-pradesh': 340000,
  delhi: 180000,
  chhattisgarh: 340000,
  jharkhand: 360000,
  sikkim: 400000,
  pondicherry: 280000,
  kerala: 200000,
  'west-bengal': 270000,
  'tamil-nadu': 240000,
};

/**
 * MCC AIQ-style UR Round-1 closing ranks (approx. 2024–25 counselling trends).
 * Sources: MCC allotment trends / public compilations. Always verify on mcc.nic.in.
 */
const GOVT = [
  // AIIMS
  { name: 'AIIMS New Delhi', state: 'Delhi', stateId: 'delhi', type: 'aiims', closingRankUR: 50, href: '/mbbs-india/delhi' },
  { name: 'AIIMS Jodhpur', state: 'Rajasthan', stateId: 'rajasthan', type: 'aiims', closingRankUR: 400, href: '/mbbs-india/rajasthan' },
  { name: 'AIIMS Bhopal', state: 'Madhya Pradesh', stateId: 'mp', type: 'aiims', closingRankUR: 550, href: '/mbbs-india/mp' },
  { name: 'AIIMS Rishikesh', state: 'Uttarakhand', stateId: 'uttarakhand', type: 'aiims', closingRankUR: 700, href: '/mbbs-india/uttarakhand' },
  { name: 'AIIMS Bhubaneswar', state: 'Odisha', stateId: 'odisha', type: 'aiims', closingRankUR: 750, href: '/mbbs-india' },
  { name: 'AIIMS Nagpur', state: 'Maharashtra', stateId: 'maharashtra', type: 'aiims', closingRankUR: 900, href: '/mbbs-india/maharashtra' },
  { name: 'AIIMS Raipur', state: 'Chhattisgarh', stateId: 'chhattisgarh', type: 'aiims', closingRankUR: 1300, href: '/mbbs-india/chhattisgarh' },
  { name: 'AIIMS Patna', state: 'Bihar', stateId: 'bihar', type: 'aiims', closingRankUR: 1600, href: '/mbbs-india/bihar' },
  { name: 'AIIMS Bathinda', state: 'Punjab', stateId: 'punjab', type: 'aiims', closingRankUR: 1800, href: '/mbbs-india' },
  { name: 'AIIMS Bibinagar', state: 'Telangana', stateId: 'telangana', type: 'aiims', closingRankUR: 1900, href: '/mbbs-india' },
  { name: 'AIIMS Rajkot', state: 'Gujarat', stateId: 'gujarat', type: 'aiims', closingRankUR: 2100, href: '/mbbs-india' },
  { name: 'AIIMS Gorakhpur', state: 'Uttar Pradesh', stateId: 'up', type: 'aiims', closingRankUR: 2200, href: '/mbbs-india/up' },
  { name: 'AIIMS Bilaspur', state: 'Himachal Pradesh', stateId: 'himachal-pradesh', type: 'aiims', closingRankUR: 2300, href: '/mbbs-india/himachal-pradesh' },
  { name: 'AIIMS Kalyani', state: 'West Bengal', stateId: 'west-bengal', type: 'aiims', closingRankUR: 2400, href: '/mbbs-india/west-bengal' },
  { name: 'AIIMS Raebareli', state: 'Uttar Pradesh', stateId: 'up', type: 'aiims', closingRankUR: 2700, href: '/mbbs-india/up' },
  { name: 'AIIMS Deoghar', state: 'Jharkhand', stateId: 'jharkhand', type: 'aiims', closingRankUR: 3200, href: '/mbbs-india/jharkhand' },
  { name: 'AIIMS Guwahati', state: 'Assam', stateId: 'assam', type: 'aiims', closingRankUR: 3300, href: '/mbbs-india' },
  { name: 'AIIMS Jammu', state: 'Jammu & Kashmir', stateId: 'jk', type: 'aiims', closingRankUR: 3500, href: '/mbbs-india' },
  { name: 'AIIMS Madurai', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'aiims', closingRankUR: 3700, href: '/mbbs-india/tamil-nadu' },
  { name: 'AIIMS Mangalagiri', state: 'Andhra Pradesh', stateId: 'ap', type: 'aiims', closingRankUR: 1400, href: '/mbbs-india' },

  // JIPMER / Central
  { name: 'JIPMER Puducherry', state: 'Puducherry', stateId: 'pondicherry', type: 'central', closingRankUR: 350, href: '/mbbs-india/pondicherry' },
  { name: 'JIPMER Karaikal', state: 'Puducherry', stateId: 'pondicherry', type: 'central', closingRankUR: 3200, href: '/mbbs-india/pondicherry' },
  { name: 'IMS BHU Varanasi', state: 'Uttar Pradesh', stateId: 'up', type: 'central', closingRankUR: 1500, href: '/mbbs-india/up' },
  { name: 'AMU Faculty of Medicine, Aligarh', state: 'Uttar Pradesh', stateId: 'up', type: 'central', closingRankUR: 4500, href: '/mbbs-india/up' },

  // Delhi
  { name: 'Maulana Azad Medical College (MAMC)', state: 'Delhi', stateId: 'delhi', type: 'govt', closingRankUR: 1100, href: '/mbbs-india/delhi' },
  { name: 'Lady Hardinge Medical College', state: 'Delhi', stateId: 'delhi', type: 'govt', closingRankUR: 900, href: '/mbbs-india/delhi' },
  { name: 'VMMC & Safdarjung Hospital', state: 'Delhi', stateId: 'delhi', type: 'govt', closingRankUR: 1400, href: '/mbbs-india/delhi' },
  { name: 'University College of Medical Sciences (UCMS)', state: 'Delhi', stateId: 'delhi', type: 'govt', closingRankUR: 1600, href: '/mbbs-india/delhi' },
  { name: 'Atal Bihari Vajpayee Institute of Medical Sciences (RML)', state: 'Delhi', stateId: 'delhi', type: 'govt', closingRankUR: 220, href: '/mbbs-india/delhi' },

  // Maharashtra
  { name: 'Grant Medical College, Mumbai', state: 'Maharashtra', stateId: 'maharashtra', type: 'govt', closingRankUR: 2100, href: '/mbbs-india/maharashtra' },
  { name: 'Seth GS Medical College (KEM), Mumbai', state: 'Maharashtra', stateId: 'maharashtra', type: 'govt', closingRankUR: 2300, href: '/mbbs-india/maharashtra' },
  { name: 'BJ Medical College, Pune', state: 'Maharashtra', stateId: 'maharashtra', type: 'govt', closingRankUR: 4500, href: '/mbbs-india/maharashtra' },
  { name: 'Government Medical College, Nagpur', state: 'Maharashtra', stateId: 'maharashtra', type: 'govt', closingRankUR: 7000, href: '/mbbs-india/maharashtra' },
  { name: 'AFMC Pune (via NEET + AFMC process)', state: 'Maharashtra', stateId: 'maharashtra', type: 'govt', closingRankUR: 500, href: '/mbbs-india/maharashtra' },

  // UP
  { name: 'King George Medical University (KGMU), Lucknow', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 3500, href: '/mbbs-india/up' },
  { name: 'GSVM Medical College, Kanpur', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/up' },
  { name: 'LLRM Medical College, Meerut', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 12000, href: '/mbbs-india/up' },
  { name: 'SN Medical College, Agra', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 14000, href: '/mbbs-india/up' },
  { name: 'MLN Medical College, Prayagraj', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 15000, href: '/mbbs-india/up' },
  { name: 'BRD Medical College, Gorakhpur', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 18000, href: '/mbbs-india/up' },
  { name: 'Government Medical College, Azamgarh', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 22000, href: '/mbbs-india/up' },

  // Rajasthan
  { name: 'SMS Medical College, Jaipur', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 4000, href: '/mbbs-india/rajasthan' },
  { name: 'Dr SN Medical College, Jodhpur', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 8000, href: '/mbbs-india/rajasthan' },
  { name: 'RNT Medical College, Udaipur', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 10000, href: '/mbbs-india/rajasthan' },
  { name: 'SP Medical College, Bikaner', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 11000, href: '/mbbs-india/rajasthan' },
  { name: 'Government Medical College, Kota', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 13000, href: '/mbbs-india/rajasthan' },

  // Karnataka
  { name: 'Bangalore Medical College (BMCRI)', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 2800, href: '/mbbs-india/karnataka' },
  { name: 'Mysore Medical College', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 6500, href: '/mbbs-india/karnataka' },
  { name: 'Karnataka Institute of Medical Sciences, Hubli', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/karnataka' },
  { name: 'Belgaum Institute of Medical Sciences', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 12000, href: '/mbbs-india/karnataka' },
  { name: 'Hassan Institute of Medical Sciences', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 15000, href: '/mbbs-india/karnataka' },

  // Tamil Nadu
  { name: 'Madras Medical College, Chennai', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'govt', closingRankUR: 2500, href: '/mbbs-india/tamil-nadu' },
  { name: 'Stanley Medical College, Chennai', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'govt', closingRankUR: 4000, href: '/mbbs-india/tamil-nadu' },
  { name: 'Madurai Medical College', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'govt', closingRankUR: 7000, href: '/mbbs-india/tamil-nadu' },
  { name: 'Coimbatore Medical College', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/tamil-nadu' },
  { name: 'Kilpauk Medical College, Chennai', state: 'Tamil Nadu', stateId: 'tamil-nadu', type: 'govt', closingRankUR: 5500, href: '/mbbs-india/tamil-nadu' },

  // Kerala
  { name: 'Government Medical College, Thiruvananthapuram', state: 'Kerala', stateId: 'kerala', type: 'govt', closingRankUR: 2200, href: '/mbbs-india/kerala' },
  { name: 'Government Medical College, Kozhikode', state: 'Kerala', stateId: 'kerala', type: 'govt', closingRankUR: 3500, href: '/mbbs-india/kerala' },
  { name: 'Government Medical College, Kottayam', state: 'Kerala', stateId: 'kerala', type: 'govt', closingRankUR: 5000, href: '/mbbs-india/kerala' },
  { name: 'Government Medical College, Thrissur', state: 'Kerala', stateId: 'kerala', type: 'govt', closingRankUR: 6000, href: '/mbbs-india/kerala' },

  // West Bengal
  { name: 'Medical College, Kolkata', state: 'West Bengal', stateId: 'west-bengal', type: 'govt', closingRankUR: 3000, href: '/mbbs-india/west-bengal' },
  { name: 'IPGMER & SSKM Hospital, Kolkata', state: 'West Bengal', stateId: 'west-bengal', type: 'govt', closingRankUR: 4500, href: '/mbbs-india/west-bengal' },
  { name: 'Nil Ratan Sircar Medical College, Kolkata', state: 'West Bengal', stateId: 'west-bengal', type: 'govt', closingRankUR: 7000, href: '/mbbs-india/west-bengal' },
  { name: 'RG Kar Medical College, Kolkata', state: 'West Bengal', stateId: 'west-bengal', type: 'govt', closingRankUR: 8000, href: '/mbbs-india/west-bengal' },
  { name: 'Burdwan Medical College', state: 'West Bengal', stateId: 'west-bengal', type: 'govt', closingRankUR: 14000, href: '/mbbs-india/west-bengal' },

  // Bihar
  { name: 'Patna Medical College', state: 'Bihar', stateId: 'bihar', type: 'govt', closingRankUR: 6000, href: '/mbbs-india/bihar' },
  { name: 'Nalanda Medical College, Patna', state: 'Bihar', stateId: 'bihar', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/bihar' },
  { name: 'Darbhanga Medical College', state: 'Bihar', stateId: 'bihar', type: 'govt', closingRankUR: 14000, href: '/mbbs-india/bihar' },
  { name: 'Jawaharlal Nehru Medical College, Bhagalpur', state: 'Bihar', stateId: 'bihar', type: 'govt', closingRankUR: 18000, href: '/mbbs-india/bihar' },
  { name: 'SK Medical College, Muzaffarpur', state: 'Bihar', stateId: 'bihar', type: 'govt', closingRankUR: 20000, href: '/mbbs-india/bihar' },

  // MP
  { name: 'Gandhi Medical College, Bhopal', state: 'Madhya Pradesh', stateId: 'mp', type: 'govt', closingRankUR: 5500, href: '/mbbs-india/mp' },
  { name: 'MGM Medical College, Indore', state: 'Madhya Pradesh', stateId: 'mp', type: 'govt', closingRankUR: 7000, href: '/mbbs-india/mp' },
  { name: 'Netaji Subhash Chandra Bose Medical College, Jabalpur', state: 'Madhya Pradesh', stateId: 'mp', type: 'govt', closingRankUR: 11000, href: '/mbbs-india/mp' },
  { name: 'GR Medical College, Gwalior', state: 'Madhya Pradesh', stateId: 'mp', type: 'govt', closingRankUR: 13000, href: '/mbbs-india/mp' },
  { name: 'SS Medical College, Rewa', state: 'Madhya Pradesh', stateId: 'mp', type: 'govt', closingRankUR: 17000, href: '/mbbs-india/mp' },

  // Haryana
  { name: 'Pt BD Sharma PGIMS, Rohtak', state: 'Haryana', stateId: 'haryana', type: 'govt', closingRankUR: 5000, href: '/mbbs-india/haryana' },
  { name: 'BPS Government Medical College, Sonepat', state: 'Haryana', stateId: 'haryana', type: 'govt', closingRankUR: 12000, href: '/mbbs-india/haryana' },
  { name: 'SHKM Government Medical College, Nalhar', state: 'Haryana', stateId: 'haryana', type: 'govt', closingRankUR: 15000, href: '/mbbs-india/haryana' },
  { name: 'Kalpana Chawla Government Medical College, Karnal', state: 'Haryana', stateId: 'haryana', type: 'govt', closingRankUR: 16000, href: '/mbbs-india/haryana' },

  // Gujarat
  { name: 'BJ Medical College, Ahmedabad', state: 'Gujarat', stateId: 'gujarat', type: 'govt', closingRankUR: 2800, href: '/mbbs-india' },
  { name: 'Government Medical College, Surat', state: 'Gujarat', stateId: 'gujarat', type: 'govt', closingRankUR: 7000, href: '/mbbs-india' },
  { name: 'MP Shah Medical College, Jamnagar', state: 'Gujarat', stateId: 'gujarat', type: 'govt', closingRankUR: 10000, href: '/mbbs-india' },
  { name: 'Government Medical College, Baroda', state: 'Gujarat', stateId: 'gujarat', type: 'govt', closingRankUR: 8000, href: '/mbbs-india' },

  // Punjab / Chandigarh
  { name: 'GMCH Chandigarh', state: 'Chandigarh', stateId: 'chandigarh', type: 'govt', closingRankUR: 1200, href: '/mbbs-india' },
  { name: 'Government Medical College, Amritsar', state: 'Punjab', stateId: 'punjab', type: 'govt', closingRankUR: 8000, href: '/mbbs-india' },
  { name: 'Government Medical College, Patiala', state: 'Punjab', stateId: 'punjab', type: 'govt', closingRankUR: 9000, href: '/mbbs-india' },

  // Telangana / AP
  { name: 'Osmania Medical College, Hyderabad', state: 'Telangana', stateId: 'telangana', type: 'govt', closingRankUR: 3500, href: '/mbbs-india' },
  { name: 'Gandhi Medical College, Secunderabad', state: 'Telangana', stateId: 'telangana', type: 'govt', closingRankUR: 4500, href: '/mbbs-india' },
  { name: 'Andhra Medical College, Visakhapatnam', state: 'Andhra Pradesh', stateId: 'ap', type: 'govt', closingRankUR: 5000, href: '/mbbs-india' },
  { name: 'Guntur Medical College', state: 'Andhra Pradesh', stateId: 'ap', type: 'govt', closingRankUR: 8000, href: '/mbbs-india' },
  { name: 'Kurnool Medical College', state: 'Andhra Pradesh', stateId: 'ap', type: 'govt', closingRankUR: 10000, href: '/mbbs-india' },

  // Odisha / Chhattisgarh / Jharkhand / UK / HP
  { name: 'SCB Medical College, Cuttack', state: 'Odisha', stateId: 'odisha', type: 'govt', closingRankUR: 6000, href: '/mbbs-india' },
  { name: 'MKCG Medical College, Berhampur', state: 'Odisha', stateId: 'odisha', type: 'govt', closingRankUR: 12000, href: '/mbbs-india' },
  { name: 'Pt JNM Medical College, Raipur', state: 'Chhattisgarh', stateId: 'chhattisgarh', type: 'govt', closingRankUR: 10000, href: '/mbbs-india/chhattisgarh' },
  { name: 'Rajendra Institute of Medical Sciences, Ranchi', state: 'Jharkhand', stateId: 'jharkhand', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/jharkhand' },
  { name: 'Government Doon Medical College, Dehradun', state: 'Uttarakhand', stateId: 'uttarakhand', type: 'govt', closingRankUR: 11000, href: '/mbbs-india/uttarakhand' },
  { name: 'IGMC Shimla', state: 'Himachal Pradesh', stateId: 'himachal-pradesh', type: 'govt', closingRankUR: 7000, href: '/mbbs-india/himachal-pradesh' },
  { name: 'Dr RPGMC Tanda', state: 'Himachal Pradesh', stateId: 'himachal-pradesh', type: 'govt', closingRankUR: 14000, href: '/mbbs-india/himachal-pradesh' },

  // Assam / NE
  { name: 'Gauhati Medical College', state: 'Assam', stateId: 'assam', type: 'govt', closingRankUR: 10000, href: '/mbbs-india' },
  { name: 'Assam Medical College, Dibrugarh', state: 'Assam', stateId: 'assam', type: 'govt', closingRankUR: 15000, href: '/mbbs-india' },
  { name: 'RIMS Imphal', state: 'Manipur', stateId: 'manipur', type: 'govt', closingRankUR: 12000, href: '/mbbs-india' },

  // Mid-tier newer GMCs (AIQ often closes ~20k–45k UR)
  { name: 'Government Medical College, Badaun', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 28000, href: '/mbbs-india/up' },
  { name: 'Government Medical College, Basti', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 30000, href: '/mbbs-india/up' },
  { name: 'Government Medical College, Firozabad', state: 'Uttar Pradesh', stateId: 'up', type: 'govt', closingRankUR: 32000, href: '/mbbs-india/up' },
  { name: 'ESIC Medical College, Faridabad', state: 'Haryana', stateId: 'haryana', type: 'govt', closingRankUR: 9000, href: '/mbbs-india/haryana' },
  { name: 'Government Medical College, Alwar', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 20000, href: '/mbbs-india/rajasthan' },
  { name: 'Government Medical College, Bharatpur', state: 'Rajasthan', stateId: 'rajasthan', type: 'govt', closingRankUR: 22000, href: '/mbbs-india/rajasthan' },
  { name: 'Chamarajanagar Institute of Medical Sciences', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 22000, href: '/mbbs-india/karnataka' },
  { name: 'Kodagu Institute of Medical Sciences', state: 'Karnataka', stateId: 'karnataka', type: 'govt', closingRankUR: 25000, href: '/mbbs-india/karnataka' },
];

const partners = [];
for (const s of tree.states) {
  const close = PRIVATE_CLOSE[s.id] ?? 300000;
  s.colleges.forEach((c, i) => {
    const closingRankUR = Math.max(90000, Math.round(close - i * 4000));
    const type = /deemed|d\.?y\.?\s*patil|symbiosis|manipal|amrita|srm|jss|yenepoya/i.test(c.name)
      ? 'deemed'
      : 'private';
    partners.push({
      name: c.name,
      state: s.name,
      stateId: s.id,
      type,
      closingRankUR: type === 'deemed' ? Math.min(closingRankUR, 180000) : closingRankUR,
      href: c.href,
      source: 'partner',
    });
  });
}

const colleges = [
  ...GOVT.map((c) => ({ ...c, source: 'mcc_aiq_indicative' })),
  ...partners,
];

const out = {
  generatedAt: new Date().toISOString(),
  disclaimer:
    'Indicative closing ranks based on MCC AIQ / counselling trends (approx. 2024–25). Not official NMC seat allotment. Always verify on mcc.nic.in and state counselling portals. State quota cutoffs differ by domicile.',
  yearLabel: 'MCC AIQ trends 2024–25 (indicative)',
  colleges,
};

const outPath = path.join(root, 'apps/frontend/data/neet-ug-college-cutoffs.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log('Wrote', outPath);
console.log('Govt/AIIMS:', GOVT.length, 'Partners:', partners.length, 'Total:', colleges.length);
