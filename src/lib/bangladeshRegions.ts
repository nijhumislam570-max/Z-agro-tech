// Bangladesh Division, District, and Thana data
export interface Region {
  name: string;
  districts: District[];
}

export interface District {
  name: string;
  thanas: string[];
}

export const divisions: Region[] = [
  {
    name: "Dhaka",
    districts: [
      { name: "Dhaka", thanas: ["Dhanmondi", "Gulshan", "Mirpur", "Mohammadpur", "Uttara", "Tejgaon", "Motijheel", "Ramna", "Lalbagh", "Wari"] },
      { name: "Gazipur", thanas: ["Gazipur Sadar", "Kaliakair", "Kapasia", "Sreepur", "Kaliganj"] },
      { name: "Narayanganj", thanas: ["Narayanganj Sadar", "Araihazar", "Bandar", "Rupganj", "Sonargaon"] },
      { name: "Tangail", thanas: ["Tangail Sadar", "Basail", "Bhuapur", "Delduar", "Ghatail", "Gopalpur", "Kalihati", "Madhupur", "Mirzapur", "Nagarpur", "Sakhipur"] },
      { name: "Manikganj", thanas: ["Manikganj Sadar", "Daulatpur", "Ghior", "Harirampur", "Saturia", "Shivalaya", "Singair"] },
      { name: "Munshiganj", thanas: ["Munshiganj Sadar", "Gazaria", "Lohajang", "Sirajdikhan", "Sreenagar", "Tongibari"] },
      { name: "Narsingdi", thanas: ["Narsingdi Sadar", "Belabo", "Monohardi", "Palash", "Raipura", "Shibpur"] },
      { name: "Kishoreganj", thanas: ["Kishoreganj Sadar", "Austagram", "Bajitpur", "Bhairab", "Hossainpur", "Itna", "Karimganj", "Katiadi", "Kuliarchar", "Mithamain", "Nikli", "Pakundia", "Tarail"] },
      { name: "Madaripur", thanas: ["Madaripur Sadar", "Kalkini", "Rajoir", "Shibchar"] },
      { name: "Gopalganj", thanas: ["Gopalganj Sadar", "Kashiani", "Kotalipara", "Muksudpur", "Tungipara"] },
      { name: "Faridpur", thanas: ["Faridpur Sadar", "Alfadanga", "Bhanga", "Boalmari", "Charbhadrasan", "Madhukhali", "Nagarkanda", "Sadarpur", "Saltha"] },
      { name: "Rajbari", thanas: ["Rajbari Sadar", "Baliakandi", "Goalandaghat", "Kalukhali", "Pangsha"] },
      { name: "Shariatpur", thanas: ["Shariatpur Sadar", "Bhedarganj", "Damudya", "Gosairhat", "Naria", "Zanjira"] }
    ]
  },
  {
    name: "Chattogram",
    districts: [
      { name: "Chattogram", thanas: ["Kotwali", "Panchlaish", "Pahartali", "Khulshi", "Double Mooring", "Halishahar", "Patenga", "Bakalia", "Chandgaon", "Bayazid", "Banshkhali", "Patiya", "Sitakunda", "Mirsharai", "Sandwip", "Anwara", "Boalkhali", "Chandanaish", "Fatikchhari", "Hathazari", "Lohagara", "Rangunia", "Raozan", "Satkania"] },
      { name: "Cox's Bazar", thanas: ["Cox's Bazar Sadar", "Chakaria", "Kutubdia", "Maheshkhali", "Pekua", "Ramu", "Teknaf", "Ukhia"] },
      { name: "Rangamati", thanas: ["Rangamati Sadar", "Bagaichhari", "Barkal", "Belaichhari", "Juraichhari", "Kaptai", "Kawkhali", "Langadu", "Naniarchar", "Rajasthali"] },
      { name: "Bandarban", thanas: ["Bandarban Sadar", "Alikadam", "Lama", "Naikhongchhari", "Rowangchhari", "Ruma", "Thanchi"] },
      { name: "Khagrachhari", thanas: ["Khagrachhari Sadar", "Dighinala", "Lakshmichhari", "Mahalchhari", "Manikchhari", "Matiranga", "Panchhari", "Ramgarh"] },
      { name: "Feni", thanas: ["Feni Sadar", "Chhagalnaiya", "Daganbhuiyan", "Parshuram", "Sonagazi", "Fulgazi"] },
      { name: "Lakshmipur", thanas: ["Lakshmipur Sadar", "Kamalnagar", "Raipur", "Ramganj", "Ramgati"] },
      { name: "Noakhali", thanas: ["Noakhali Sadar", "Begumganj", "Chatkhil", "Companiganj", "Hatiya", "Kabirhat", "Senbag", "Sonaimuri", "Subarnachar"] },
      { name: "Comilla", thanas: ["Comilla Sadar", "Barura", "Brahmanpara", "Burichang", "Chandina", "Chauddagram", "Daudkandi", "Debidwar", "Homna", "Laksam", "Manoharganj", "Meghna", "Muradnagar", "Nangalkot", "Titas"] },
      { name: "Brahmanbaria", thanas: ["Brahmanbaria Sadar", "Akhaura", "Ashuganj", "Bancharampur", "Bijoynagar", "Kasba", "Nabinagar", "Nasirnagar", "Sarail"] },
      { name: "Chandpur", thanas: ["Chandpur Sadar", "Faridganj", "Haimchar", "Haziganj", "Kachua", "Matlab Dakshin", "Matlab Uttar", "Shahrasti"] }
    ]
  },
  {
    name: "Rajshahi",
    districts: [
      { name: "Rajshahi", thanas: ["Rajshahi City", "Bagha", "Bagmara", "Charghat", "Durgapur", "Godagari", "Mohanpur", "Paba", "Puthia", "Tanore"] },
      { name: "Chapainawabganj", thanas: ["Chapainawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"] },
      { name: "Naogaon", thanas: ["Naogaon Sadar", "Atrai", "Badalgachhi", "Dhamoirhat", "Manda", "Mahadebpur", "Mohadevpur", "Niamatpur", "Patnitala", "Porsha", "Raninagar", "Sapahar"] },
      { name: "Natore", thanas: ["Natore Sadar", "Bagatipara", "Baraigram", "Gurudaspur", "Lalpur", "Singra", "Naldanga"] },
      { name: "Nawabganj", thanas: ["Nawabganj Sadar", "Bholahat", "Gomastapur", "Nachole", "Shibganj"] },
      { name: "Pabna", thanas: ["Pabna Sadar", "Atgharia", "Bera", "Bhangura", "Chatmohar", "Faridpur", "Ishwardi", "Santhia", "Sujanagar"] },
      { name: "Sirajganj", thanas: ["Sirajganj Sadar", "Belkuchi", "Chauhali", "Kamarkhanda", "Kazipur", "Raiganj", "Shahjadpur", "Tarash", "Ullahpara"] },
      { name: "Bogra", thanas: ["Bogra Sadar", "Adamdighi", "Dhunat", "Dhupchanchia", "Gabtali", "Kahaloo", "Nandigram", "Sariakandi", "Shajahanpur", "Sherpur", "Shibganj", "Sonatala"] },
      { name: "Joypurhat", thanas: ["Joypurhat Sadar", "Akkelpur", "Kalai", "Khetlal", "Panchbibi"] }
    ]
  },
  {
    name: "Khulna",
    districts: [
      { name: "Khulna", thanas: ["Khulna City", "Batiaghata", "Dacope", "Dumuria", "Dighalia", "Koyra", "Paikgachha", "Phultala", "Rupsa", "Terokhada"] },
      { name: "Bagerhat", thanas: ["Bagerhat Sadar", "Chitalmari", "Fakirhat", "Kachua", "Mollahat", "Mongla", "Morrelganj", "Rampal", "Sarankhola"] },
      { name: "Satkhira", thanas: ["Satkhira Sadar", "Assasuni", "Debhata", "Kalaroa", "Kaliganj", "Shyamnagar", "Tala"] },
      { name: "Jessore", thanas: ["Jessore Sadar", "Abhaynagar", "Bagherpara", "Chaugachha", "Jhikargachha", "Keshabpur", "Manirampur", "Sharsha"] },
      { name: "Magura", thanas: ["Magura Sadar", "Mohammadpur", "Shalikha", "Sreepur"] },
      { name: "Narail", thanas: ["Narail Sadar", "Kalia", "Lohagara"] },
      { name: "Kushtia", thanas: ["Kushtia Sadar", "Bheramara", "Daulatpur", "Khoksa", "Kumarkhali", "Mirpur"] },
      { name: "Meherpur", thanas: ["Meherpur Sadar", "Gangni", "Mujibnagar"] },
      { name: "Chuadanga", thanas: ["Chuadanga Sadar", "Alamdanga", "Damurhuda", "Jibannagar"] },
      { name: "Jhenaidah", thanas: ["Jhenaidah Sadar", "Harinakunda", "Kaliganj", "Kotchandpur", "Maheshpur", "Shailkupa"] }
    ]
  },
  {
    name: "Barishal",
    districts: [
      { name: "Barishal", thanas: ["Barishal Sadar", "Agailjhara", "Babuganj", "Bakerganj", "Banaripara", "Gaurnadi", "Hizla", "Mehendiganj", "Muladi", "Wazirpur"] },
      { name: "Barguna", thanas: ["Barguna Sadar", "Amtali", "Bamna", "Betagi", "Patharghata", "Taltali"] },
      { name: "Bhola", thanas: ["Bhola Sadar", "Borhanuddin", "Char Fasson", "Daulatkhan", "Lalmohan", "Manpura", "Tazumuddin"] },
      { name: "Jhalokati", thanas: ["Jhalokati Sadar", "Kathalia", "Nalchity", "Rajapur"] },
      { name: "Patuakhali", thanas: ["Patuakhali Sadar", "Bauphal", "Dashmina", "Dumki", "Galachipa", "Kalapara", "Mirzaganj", "Rangabali"] },
      { name: "Pirojpur", thanas: ["Pirojpur Sadar", "Bhandaria", "Kawkhali", "Mathbaria", "Nazirpur", "Nesarabad", "Zianagar"] }
    ]
  },
  {
    name: "Sylhet",
    districts: [
      { name: "Sylhet", thanas: ["Sylhet Sadar", "Balaganj", "Beanibazar", "Bishwanath", "Companiganj", "Fenchuganj", "Golapganj", "Gowainghat", "Jaintiapur", "Kanaighat", "Osmaninagar", "South Surma", "Zakiganj"] },
      { name: "Moulvibazar", thanas: ["Moulvibazar Sadar", "Barlekha", "Juri", "Kamalganj", "Kulaura", "Rajnagar", "Sreemangal"] },
      { name: "Habiganj", thanas: ["Habiganj Sadar", "Ajmiriganj", "Bahubal", "Baniyachong", "Chunarughat", "Lakhai", "Madhabpur", "Nabiganj", "Shayestaganj"] },
      { name: "Sunamganj", thanas: ["Sunamganj Sadar", "Bishwamvarpur", "Chhatak", "Derai", "Dharampasha", "Dowarabazar", "Jagannathpur", "Jamalganj", "Sullah", "Tahirpur"] }
    ]
  },
  {
    name: "Rangpur",
    districts: [
      { name: "Rangpur", thanas: ["Rangpur City", "Badarganj", "Gangachara", "Kaunia", "Mithapukur", "Pirgachha", "Pirganj", "Taraganj"] },
      { name: "Dinajpur", thanas: ["Dinajpur Sadar", "Birampur", "Birganj", "Biral", "Bochaganj", "Chirirbandar", "Fulbari", "Ghoraghat", "Hakimpur", "Kaharole", "Khansama", "Nawabganj", "Parbatipur"] },
      { name: "Gaibandha", thanas: ["Gaibandha Sadar", "Fulchhari", "Gobindaganj", "Palashbari", "Sadullapur", "Saghata", "Sundarganj"] },
      { name: "Kurigram", thanas: ["Kurigram Sadar", "Bhurungamari", "Char Rajibpur", "Chilmari", "Nageshwari", "Phulbari", "Rajarhat", "Raumari", "Ulipur"] },
      { name: "Lalmonirhat", thanas: ["Lalmonirhat Sadar", "Aditmari", "Hatibandha", "Kaliganj", "Patgram"] },
      { name: "Nilphamari", thanas: ["Nilphamari Sadar", "Dimla", "Domar", "Jaldhaka", "Kishoreganj", "Saidpur"] },
      { name: "Panchagarh", thanas: ["Panchagarh Sadar", "Atwari", "Boda", "Debiganj", "Tetulia"] },
      { name: "Thakurgaon", thanas: ["Thakurgaon Sadar", "Baliadangi", "Haripur", "Pirganj", "Ranisankail"] }
    ]
  },
  {
    name: "Mymensingh",
    districts: [
      { name: "Mymensingh", thanas: ["Mymensingh Sadar", "Bhaluka", "Dhobaura", "Fulbaria", "Gaffargaon", "Gauripur", "Haluaghat", "Ishwarganj", "Muktagachha", "Nandail", "Phulpur", "Trishal"] },
      { name: "Jamalpur", thanas: ["Jamalpur Sadar", "Baksiganj", "Dewanganj", "Islampur", "Madarganj", "Melandaha", "Sarishabari"] },
      { name: "Netrokona", thanas: ["Netrokona Sadar", "Atpara", "Barhatta", "Durgapur", "Kalmakanda", "Kendua", "Khaliajuri", "Madan", "Mohanganj", "Purbadhala"] },
      { name: "Sherpur", thanas: ["Sherpur Sadar", "Jhenaigati", "Nakla", "Nalitabari", "Sreebardi"] }
    ]
  }
];

// Division coordinates for GPS-based location detection
export const divisionCoordinates: Record<string, { lat: number; lng: number }> = {
  'Dhaka': { lat: 23.8103, lng: 90.4125 },
  'Chattogram': { lat: 22.3569, lng: 91.7832 },
  'Rajshahi': { lat: 24.3745, lng: 88.6042 },
  'Khulna': { lat: 22.8456, lng: 89.5403 },
  'Barishal': { lat: 22.7010, lng: 90.3535 },
  'Sylhet': { lat: 24.8949, lng: 91.8687 },
  'Rangpur': { lat: 25.7439, lng: 89.2752 },
  'Mymensingh': { lat: 24.7471, lng: 90.4203 }
};

// Calculate distance between two coordinates (Haversine formula)
export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Find nearest division based on GPS coordinates
export const findNearestDivision = (lat: number, lng: number): string => {
  let nearestDivision = 'Dhaka';
  let minDistance = Infinity;

  Object.entries(divisionCoordinates).forEach(([division, coords]) => {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestDivision = division;
    }
  });

  return nearestDivision;
};

export const getDivisions = (): string[] => {
  return divisions.map(d => d.name);
};

export const getDistricts = (divisionName: string): string[] => {
  const division = divisions.find(d => d.name === divisionName);
  return division ? division.districts.map(d => d.name) : [];
};

export const getThanas = (divisionName: string, districtName: string): string[] => {
  const division = divisions.find(d => d.name === divisionName);
  if (!division) return [];
  const district = division.districts.find(d => d.name === districtName);
  return district ? district.thanas : [];
};
