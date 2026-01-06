export const COLORES_PARTIDOS = {
  1: {
    nombre: "Alianza Creo 21 Psc 6",
    min: "#bdd7e7",
    max: "#08519c",
    principal: "#08519c",
  },
  2: {
    nombre: "Unión Por La Esperanza",
    min: "#fdbe85",
    max: "#a63603",
    principal: "#a63603",
  },
  3: {
    nombre: "Pachakutik",
    min: "#cbaada",
    max: "#7D3C98",
    principal: "#7D3C98",
  },
  4: {
    nombre: "Izquierda Democrática",
    min: "#fcdabc",
    max: "#e69237",
    principal: "#e69237",
  },
  5: {
    nombre: "Movimiento Amigo",
    min: "#B1E1E7",
    max: "#35A0AC",
    principal: "#35A0AC",
  },
  6: {
    nombre: "Partido Político Avanza",
    min: "#f8bbd0",
    max: "#e91e63",
    principal: "#e91e63",
  },
  7: {
    nombre: "Sociedad Patriótica",
    min: "#F5B7B1",
    max: "#E74C3C",
    principal: "#E74C3C",
  },
  8: {
    nombre: "Ecuatoriano Unido",
    min: "#bdbdbd",
    max: "#4a4a4a",
    principal: "#4a4a4a",
  },
  9: {
    nombre: "Alianza País",
    min: "#A4DFBF",
    max: "#229954",
    principal: "#229954",
  },
  10: {
    nombre: "Sociedad Unida Más Acción",
    min: "#c7b69f",
    max: "#553d2a",
    principal: "#553d2a",
  },
  11: {
    nombre: "Movimiento Construye",
    min: "#f9e79f",
    max: "#D4AC0D",
    principal: "#D4AC0D",
  },
  12: {
    nombre: "Alianza Honestidad",
    min: "#b4e4f9",
    max: "#1097D1",
    principal: "#1097D1",
  },
  13: {
    nombre: "Democracia Sí",
    min: "#ffc9c2",
    max: "#e37469",
    principal: "#e37469",
  },
  14: {
    nombre: "Fuerza Ec",
    min: "#fcf099",
    max: "#8f6e0f",
    principal: "#8f6e0f",
  },
  15: {
    nombre: "Unión Ecuatoriana",
    min: "#cbe5f6",
    max: "#3498db",
    principal: "#3498db",
  },
  16: {
    nombre: "Movimiento Nacional Podemos",
    min: "#DFA4CB",
    max: "#b5408c",
    principal: "#b5408c",
  },
  "ADN": {
    nombre: "ADN",
    min: "#bdd7e7",
    max: "#08519c",
    principal: "#08519c", 
  },
  "RC/RETO": {
    nombre: "RC/RETO",
    min: "#fdbe85",
    max: "#a63603",
    principal: "#a63603", 
  },
  "PSC": {
    nombre: "Partido Social Cristiano",
    min: "#f9e79f",
    max: "#D4AC0D",
    principal: "#D4AC0D", 
  },
  "SUMA": {
    nombre: "SUMA",
    min: "#c7b69f",
    max: "#553d2a",
    principal: "#553d2a", 
  },
  "PAIS": {
     nombre: "PAIS",
     min: "#A4DFBF",
     max: "#229954",
     principal: "#229954" 
  },
  "M. AMIGO": {
     nombre: "M. AMIGO",
     min: "#B1E1E7",
     max: "#35A0AC",
     principal: "#35A0AC" 
  },
  "AVANZA": {
    nombre: "AVANZA",
    min: "#f8bbd0",
    max: "#e91e63",
    principal: "#e91e63" 
  },
  "ID": {
    nombre: "ID",
    min: "#fcdabc",
    max: "#e69237",
    principal: "#e69237"
  },
  "PSP": {
    nombre: "PSP",
    min: "#F5B7B1",
    max: "#E74C3C",
    principal: "#E74C3C" 
  },
  "PK-UP": {
    nombre: "PK-UP",
    min: "#cbaada",
    max: "#7D3C98",
    principal: "#7D3C98" 
  }
};
export function getColorPartido(id) {
  return (
    COLORES_PARTIDOS[id] || {
      min: "#cccccc",
      max: "#333333",
      principal: "#333333",
    }
  );
}
