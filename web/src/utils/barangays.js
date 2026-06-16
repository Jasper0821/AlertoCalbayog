export const CALBAYOG_BARANGAYS = [
  "Acedillo", "Aguit-itan", "Alibaba", "Amampacang", "Anislag", "Awang East", "Awang West", 
  "Ba-ay", "Bagacay", "Bagong Lipunan", "Baja", "Balud", "Bante", "Bantian", "Basud", "Bayo", 
  "Begaho", "Binaliw", "Bontay", "Buenavista", "Bugtong", "Cabacungan", "Cabatuan", "Cabicahan", 
  "Cabugawan", "Cacaransan", "Cag-anahaw", "Cag-Anibong", "Cag-olango", "Cagbanayacao", 
  "Cagbayang", "Cagbilwang", "Cagboborac", "Caglanipao Sur", "Cagmanipis Norte", "Cagmanipis Sur", 
  "Cagnipa", "Cagsalaosao", "Cahumpan", "Calocnayan", "Cangomaod", "Canhumadac", "Capacuhan", 
  "Capoocan", "Carayman", "Carmen", "Catabunan", "Caybago", "Central", "Cogon", "Dagum", 
  "Danao I", "Danao II", "Dawo", "De Victoria", "Dinabongan", "Dinagan", "Dinawacan", 
  "Esperanza", "Gabay", "Gadgaran", "Gasdo", "Geragaan", "Guin-on", "Guinbaoyan Norte", 
  "Guinbaoyan Sur", "Hamorawon", "Helino", "Hibabngan", "Hibatang", "Higasaan", "Himalandrog", 
  "Hugon Rosales", "Jacinto", "Jimautan", "Jose A. Roño", "Kalilihan", "Kilikili", "La Paz", 
  "Langoyon", "Lapaan", "Libertad", "Limarayon", "Longsob", "Lonoy", "Looc", "Mabini I", 
  "Mabini II", "Macatingog", "Mag-Ubay", "Malaga", "Malajog", "Malayog", "Malopalo", "Mancol", 
  "Manguino-o", "Mantaong", "Manuel Barral Sr.", "Marcatubig", "Matobato", "Mawacat", "Maybog", 
  "Maysalong", "Migara", "Nabang", "Nag-uma", "Naga", "Navarro", "Nijaga", "Oboob", "Obrero", 
  "Olera", "Oquendo", "Osmeña", "Pagbalican", "Palanyogon", "Panalay", "Pancol", "Pilar", "Pinalanga", 
  "Pobo", "Polangi", "Rawis", "Rizal", "Roxas I", "Roxas II", "Salvajero", "San Antonio", "San Isidro", 
  "San Jose", "San Policarpo", "San Rufino", "Sinidman", "Tabawan", "Tarabucan", "Tinambacan Norte", 
  "Tinambacan Sur", "Trinidad", "Villahermosa", "Obrero"
];

export function getValidCalbayogBarangay(input) {
  if (!input || typeof input !== "string") return null;
  const normalizedInput = input.trim().toLowerCase();
  
  const match = CALBAYOG_BARANGAYS.find(
    (b) => normalizedInput.includes(b.toLowerCase()) || b.toLowerCase().includes(normalizedInput)
  );
  
  return match || null;
}
