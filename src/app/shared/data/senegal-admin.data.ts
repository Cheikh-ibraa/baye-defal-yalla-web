export interface SenegalDepartement {
  nom: string;
  communes: string[];
}

export interface SenegalRegion {
  nom: string;
  departements: SenegalDepartement[];
}

export const SENEGAL_REGIONS: SenegalRegion[] = [
  {
    nom: 'Dakar',
    departements: [
      { nom: 'Dakar', communes: ['Dakar-Plateau', 'Médina', 'Grand Dakar', 'Biscuiterie', 'Fann-Point E-Amitié', 'Gueule Tapée-Fass-Colobane', 'HLM', 'Hann Bel Air', 'Sicap-Liberté', 'Xéwel-Gadaye', 'Ouakam', 'Ngor', 'Yoff', 'Camberène', 'Patte d\'Oie'] },
      { nom: 'Guédiawaye', communes: ['Arafat', 'Dalifort', 'Golf Sud', 'Ndiarème Limamoulaye', 'Sam Notaire', 'Médina Gounass Guédiawaye'] },
      { nom: 'Pikine', communes: ['Djida Thiaroye Kao', 'Guinaw Rail Nord', 'Guinaw Rail Sud', 'Malika', 'Mbao', 'Thiaroye Gare', 'Thiaroye sur Mer', 'Tivaouane Diacksao', 'Keur Massar', 'Yeumbeul Nord', 'Yeumbeul Sud'] },
      { nom: 'Rufisque', communes: ['Bargny', 'Diamniadio', 'Sangalkam', 'Rufisque Est', 'Rufisque Nord', 'Rufisque Ouest', 'Yène', 'Bambilor'] },
    ],
  },
  {
    nom: 'Thiès',
    departements: [
      { nom: 'Thiès', communes: ['Thiès Nord', 'Thiès Est', 'Thiès Ouest', 'Fandène', 'Keur Moussa', 'Ndieyène Sirakh', 'Ngoundiane', 'Noto Gouye Diama', 'Pout', 'Tassette', 'Touba Toul'] },
      { nom: 'Mbour', communes: ['Mbour', 'Joal-Fadiouth', 'Malicounda', 'Ndiaganiao', 'Nguékhokh', 'Popenguine', 'Saly Portudal', 'Sindia', 'Somone', 'Thiadiaye'] },
      { nom: 'Tivaouane', communes: ['Tivaouane', 'Mékhé', 'Pambal', 'Pire Goureye', 'Darou Khoudoss', 'Koul', 'Mérina Dakhar', 'Mont Rolland', 'Niakhène', 'Notto Diobass'] },
    ],
  },
  {
    nom: 'Saint-Louis',
    departements: [
      { nom: 'Saint-Louis', communes: ['Saint-Louis', 'Gandon', 'Ndiebène Gandiol', 'Rao', 'Fass-Ngom', 'Mpal', 'Léona', 'Sainte-Marie'] },
      { nom: 'Dagana', communes: ['Dagana', 'Richard-Toll', 'Ross-Béthio', 'Mbane', 'Ronkh', 'Bokhol', 'Gae', 'Ndombo Sandjiry'] },
      { nom: 'Podor', communes: ['Podor', 'Ndioum', 'Gamadji Saré', 'Galoya', 'Guédé Village', 'Mbolo Birane', 'Thiallé'] },
    ],
  },
  {
    nom: 'Louga',
    departements: [
      { nom: 'Louga', communes: ['Louga', 'Coki', 'Guéoul', 'Kab Gaye', 'Léona Louga', 'Mbediene', 'Nguer Malal', 'Ndiagne', 'Thiolom Fall'] },
      { nom: 'Kébémer', communes: ['Kébémer', 'Darou Mousty', 'Darou Marnane', 'Guéoul', 'Ndande', 'Thiep'] },
      { nom: 'Linguère', communes: ['Linguère', 'Barkedji', 'Dodji', 'Labgar', 'Ouarkhokh', 'Ranérou', 'Thiamène', 'Yang Yang'] },
    ],
  },
  {
    nom: 'Kaolack',
    departements: [
      { nom: 'Kaolack', communes: ['Kaolack', 'Gandiaye', 'Kahone', 'Mbadakhoune', 'Ndoffane', 'Thiaré'] },
      { nom: 'Guinguinéo', communes: ['Guinguinéo', 'Dya', 'Ndiob', 'Ngothie', 'Pakala'] },
      { nom: 'Nioro du Rip', communes: ['Nioro du Rip', 'Fass', 'Keur Madiabel', 'Paoskoto', 'Sibassor', 'Taïba Niassène'] },
    ],
  },
  {
    nom: 'Ziguinchor',
    departements: [
      { nom: 'Ziguinchor', communes: ['Ziguinchor', 'Adéane', 'Enampore', 'Niaguis', 'Nyassia'] },
      { nom: 'Bignona', communes: ['Bignona', 'Diannah Ba', 'Diouloulou', 'Kafountine', 'Kataba 1', 'Niamone', 'Tendouck', 'Thionck-Essyl'] },
      { nom: 'Oussouye', communes: ['Oussouye', 'Cabrousse', 'Loudia Ouolof', 'Mlomp', 'Santhiaba Manjaque'] },
    ],
  },
  {
    nom: 'Diourbel',
    departements: [
      { nom: 'Diourbel', communes: ['Diourbel', 'Ndame', 'Ndindy', 'Tocky Gare'] },
      { nom: 'Bambey', communes: ['Bambey', 'Baba Garage', 'Gawane', 'Lambaye', 'Ngogom', 'Ngoye', 'Patar Lia', 'Patèkh', 'Réfane', 'Thiakhar'] },
      { nom: 'Mbacké', communes: ['Mbacké', 'Touba', 'Darou Nahim', 'Kaël', 'Malem Niani', 'Ngabou', 'Sadio', 'Taïf'] },
    ],
  },
  {
    nom: 'Fatick',
    departements: [
      { nom: 'Fatick', communes: ['Fatick', 'Diakhao', 'Fimela', 'Loul Sessène', 'Ndiob', 'Niakhar', 'Patar', 'Tattaguine', 'Toucar'] },
      { nom: 'Foundiougne', communes: ['Foundiougne', 'Diofior', 'Lyndiane', 'Mbam', 'Sokone', 'Toubacouta'] },
      { nom: 'Gossas', communes: ['Gossas', 'Colobane', 'Mbar', 'Ouadiour'] },
    ],
  },
  {
    nom: 'Kolda',
    departements: [
      { nom: 'Kolda', communes: ['Kolda', 'Bagadadji', 'Dabo', 'Mampatim', 'Médina Cherif', 'Médina El Hadj', 'Salikégné', 'Tankanto Escale'] },
      { nom: 'Médina Yoro Fofana', communes: ['Médina Yoro Fofana', 'Bonconto', 'Fafacourou', 'Kounkané', 'Ndorna', 'Némataba', 'Ouassadou'] },
      { nom: 'Vélingara', communes: ['Vélingara', 'Diaobé-Kabendou', 'Dialambéré', 'Kandia', 'Kanème', 'Pakour', 'Paroumba', 'Sinthiang Koundara'] },
    ],
  },
  {
    nom: 'Tambacounda',
    departements: [
      { nom: 'Tambacounda', communes: ['Tambacounda', 'Dialacoto', 'Gouloumbo', 'Koussanar', 'Makacolibantang', 'Niani Toucouleur'] },
      { nom: 'Bakel', communes: ['Bakel', 'Bélé', 'Diawara', 'Goudiry', 'Kidira', 'Moudéry'] },
      { nom: 'Goudiry', communes: ['Goudiry', 'Boynguel Bamba', 'Dianke Makha', 'Missirah Bafou', 'Toumboura'] },
      { nom: 'Koumpentoum', communes: ['Koumpentoum', 'Kahène', 'Kouthia Passa', 'Malem Hoddar'] },
    ],
  },
  {
    nom: 'Kaffrine',
    departements: [
      { nom: 'Kaffrine', communes: ['Kaffrine', 'Diamou', 'Keur Samba Kane', 'Nganda', 'Touba Mbella'] },
      { nom: 'Birkilane', communes: ['Birkilane', 'Dinguira', 'Kathiote', 'Mabo', 'Oulia', 'Touba Mbella'] },
      { nom: 'Koungheul', communes: ['Koungheul', 'Khelcom Birane', 'Lour Escale', 'Missirah Wadene', 'Ndame Koungheul', 'Saly Escale', 'Sibassor'] },
      { nom: 'Malem Hodar', communes: ['Malem Hodar', 'Darou Minam 2', 'Keur Mbaye Fall', 'Mbouma', 'Missirah'] },
    ],
  },
  {
    nom: 'Kédougou',
    departements: [
      { nom: 'Kédougou', communes: ['Kédougou', 'Bandafassi', 'Fongolimbi', 'Khossanto', 'Ninéfecha', 'Tomboronkoto'] },
      { nom: 'Saraya', communes: ['Saraya', 'Bembou', 'Darsalam', 'Dialafara', 'Diawara', 'Moussala'] },
      { nom: 'Salémata', communes: ['Salémata', 'Dakatéli', 'Ethiolo', 'Kévoye'] },
    ],
  },
  {
    nom: 'Matam',
    departements: [
      { nom: 'Matam', communes: ['Matam', 'Agnam Civol', 'Bokidiawé', 'Dabia', 'Gambadji', 'Nguidilogne', 'Oréfondé', 'Semme', 'Thilogne', 'Ogo'] },
      { nom: 'Kanel', communes: ['Kanel', 'Aoundé', 'Bakel Escale', 'Hamady Ounaré', 'Ogo', 'Orkadiéré', 'Sinthiane Demba Diouma', 'Wouro Sidy'] },
      { nom: 'Ranérou', communes: ['Ranérou', 'Lani Tounka', 'Oudalaye', 'Vélingara Ferlo', 'Wendou M\'Bour'] },
    ],
  },
  {
    nom: 'Sédhiou',
    departements: [
      { nom: 'Sédhiou', communes: ['Sédhiou', 'Bambali', 'Djibabouya', 'Djibanar', 'Kabrousse', 'Marsassoum', 'Niaming', 'Samine'] },
      { nom: 'Bounkiling', communes: ['Bounkiling', 'Bona', 'Diacounda', 'Djibidione', 'Niagha', 'Singhère', 'Tanghory'] },
      { nom: 'Goudomp', communes: ['Goudomp', 'Diendé', 'Kaïgal', 'Kandion Mangagoulack', 'Niamina', 'Simbandi Brassou', 'Simbandi Balante', 'Tanaff'] },
    ],
  },
];
