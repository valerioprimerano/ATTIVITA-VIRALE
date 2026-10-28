// Regole del gioco Attività Virale. Cambia i numeri qui: il resto del codice li legge da questo file.

export const PROFILO = "attivita.virale";          // il profilo del gioco: i suoi commenti non contano
export const GIORNI_POST_ATTIVI = 30;               // si leggono i commenti dei post degli ultimi 30 giorni

export const PUNTI = {
  apertura: 10,          // aprire l'attività (una volta)
  commentoPost: 5,       // primo commento valido su ogni post
  tag: 3,                // ogni amico taggato
  tagMaxPerPost: 10,     // massimo amici taggati che contano per post
  reclutato: 25,         // un amico taggato apre la sua attività
  storia: 20,            // storia che tagga il profilo (una al giorno)
  quotaDipendente: 0.3,  // quota degli incassi del dipendente che va all'attività
};

// Livelli: [nome, incassi minimi]
export const LIVELLI = [
  ["Bancarella", 0], ["Bottega", 20], ["Negozio", 40], ["Negozio con dehors", 70], ["Attività avviata", 110],
  ["Sede storica", 160], ["Franchising", 230], ["Catena regionale", 330], ["Azienda", 480], ["Grande azienda", 700],
  ["Gruppo nazionale", 1000], ["Holding", 1500], ["Impero", 2500],
];
// Livelli che si sbloccano solo con la licenza a pagamento (indice del livello -> prezzo)
export const LICENZE = { 1: "1,99 €", 4: "2,99 €", 8: "4,99 €", 9: "9,99 €" };
export const LIVELLO_ASSUNZIONI = 4;   // da "Attività avviata" si può assumere
export const POSTI_GRATIS = 1;         // posti di lavoro gratuiti per chi può assumere
export const POSTI_MAX = 25;

// Categorie: chiave, nome, parole che la riconoscono nel commento (le più lunghe vincono)
export const CATEGORIE = [
  ["pizzeria", "Pizzeria", ["pizzeria", "pizza", "pizze"]],
  ["bar", "Bar", ["bar", "caffe", "caffetteria", "bistrot"]],
  ["ristorante", "Ristorante", ["ristorante", "trattoria", "osteria", "sushi", "hamburgeria", "kebab", "paninoteca"]],
  ["gelateria", "Gelateria", ["gelateria", "gelato", "gelati"]],
  ["pasticceria", "Pasticceria", ["pasticceria", "dolci", "cornetteria"]],
  ["panificio", "Forno", ["forno", "panificio", "panetteria", "panificio"]],
  ["parrucchiere", "Parrucchiere", ["parrucchiere", "parrucchieria", "barbiere", "barber", "barbershop", "hair"]],
  ["estetica", "Centro estetico", ["estetista", "estetica", "centro estetico", "nails", "unghie", "beauty"]],
  ["palestra", "Palestra", ["palestra", "gym", "fitness", "crossfit"]],
  ["abbigliamento", "Boutique", ["abbigliamento", "boutique", "vestiti", "moda", "negozio di vestiti"]],
  ["scarpe", "Calzature", ["scarpe", "calzature", "sneakers"]],
  ["officina", "Officina", ["officina", "meccanico", "gommista", "carrozzeria", "elettrauto"]],
  ["marketing", "Agenzia", ["agenzia di marketing", "agenzia marketing", "marketing", "social media", "agenzia"]],
  ["viaggi", "Viaggi", ["agenzia viaggi", "agenzia di viaggi", "viaggi"]],
  ["immobiliare", "Immobiliare", ["immobiliare", "agenzia immobiliare", "case"]],
  ["tech", "Tech", ["tech", "informatica", "telefonia", "cellulari", "elettronica"]],
  ["fiori", "Fiori", ["fiori", "fioraio", "fiorista"]],
  ["macelleria", "Macelleria", ["macelleria", "macellaio", "carne"]],
  ["enoteca", "Enoteca", ["enoteca", "vino", "vini", "wine bar"]],
  ["pulizie", "Pulizie", ["pulizie", "impresa di pulizie", "lavanderia"]],
  ["negozio", "Negozio", ["negozio", "bottega", "market", "alimentari", "tabaccheria"]],
];
