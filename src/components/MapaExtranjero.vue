<template>
  <v-sheet class="position-relative overflow-hidden">
    <v-navigation-drawer v-model="drawer" absolute temporary width="300" color="#12a2c2" dark>
      <v-container class="contenedor-filtros">
        <h3 class="mb-4 text-uppercase" style="font-family: 'Oswald', sans-serif;">
          Filtros Internacionales
        </h3>

        <div class="texto-filtro">VUELTA*</div>
        <v-select v-model="filtroVuelta" :items="itemsVuelta" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"></v-select>

        <div class="texto-filtro">PARTIDO POLITICO*</div>
        <v-select v-model="filtroPartido" :items="itemsPartido" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"></v-select>

        <div class="texto-filtro">PAÍS</div>
        <v-select v-model="filtroPais" :items="itemsPais" outlined dense background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-6" placeholder="Ej: España"></v-select>

        <p class="caption white--text">*Campo Obligatorio</p>

        <v-btn block color="white" light class="font-weight-bold" style="font-family: 'Oswald', sans-serif;"
          @click="aplicarFiltros">
          BUSCAR
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <v-btn color="#12a2c2" dark fab small absolute top left style="top: 20px; left: 20px; z-index: 5;"
      @click="drawer = !drawer">
      <svg style="width:24px;height:24px" viewBox="0 0 24 24">
        <path fill="currentColor"
          d="M9.5,3A6.5,6.5 0 0,1 16,9.5C16,11.11 15.41,12.59 14.44,13.73L14.71,14H15.5L20.5,19L19,20.5L14,15.5V14.71L13.73,14.44C12.59,15.41 11.11,16 9.5,16A6.5,6.5 0 0,1 3,9.5A6.5,6.5 0 0,1 9.5,3M9.5,5C7,5 5,7 5,9.5C5,12 7,14 9.5,14C12,14 14,12 14,9.5C14,7 12,5 9.5,5Z" />
      </svg>
    </v-btn>


    <v-container fluid class="fondo-general">
      <v-row no-gutters>
        <v-card outlined color="transparent" width="100%">
          <v-row no-gutters>
            <v-col cols="12" md="3"></v-col>
            <v-col cols="12" md="6">
              <div class="flex-column-center">
                <div class="contenedor-titulo">
                  <v-card elevation="24" color="#2c3e50">
                    <div class="tarjeta-titulo-mapa">
                      Resultados Internacionales 1996
                    </div>
                  </v-card>
                </div>

                <div class="contenedor-botones-vuelta">
                  <v-btn tile class="btn-vuelta" :class="esPrimeraVuelta ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                    @click="setVuelta(1)">
                    PRIMERA VUELTA
                  </v-btn>

                  <v-btn tile class="btn-vuelta" :class="!esPrimeraVuelta ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                    @click="setVuelta(2)">
                    SEGUNDA VUELTA
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12" md="9">
              <MapaMundi :datos="datosParaMapa" :configuracion="configuracionMapa" />
            </v-col>
            <v-col cols="12" md="3">
              <v-card class="pa-4 text-center">
                <h3>Tarjetas Pendientes</h3>
              </v-card>
            </v-col>
          </v-row>
        </v-card>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script>
import MapaMundi from "./MapaMundi.vue";

const NAME_TO_ISO = {
  "ESPAÑA": "ES",
  "ITALIA": "IT",
  "ESTADOS UNIDOS": "US",
  "CANADA": "CA",
  "CANADÁ": "CA",
  "VENEZUELA": "VE",
  "COLOMBIA": "CO",
  "PERU": "PE",
  "PERÚ": "PE",
  "CHILE": "CL",
  "ARGENTINA": "AR",
  "BRASIL": "BR",
  "MEXICO": "MX",
  "MÉXICO": "MX",
  "RUSIA": "RU",
  "CHINA": "CN",
  "JAPON": "JP",
  "JAPÓN": "JP",
  "AUSTRALIA": "AU",
  "REINO UNIDO": "GB",
  "FRANCIA": "FR",
  "ALEMANIA": "DE",
  "SUIZA": "CH",
  "BELGICA": "BE",
  "BÉLGICA": "BE",
  "PAISES BAJOS": "NL",
  "SUECIA": "SE"
};

export default {
  name: "MapaExtranjero",

  components: {
    MapaMundi,
  },

  props: {
    resultadosCantones: { type: Array, default: () => [] },
    colores: { type: Object, default: () => ({}) },
  },

  data() {
    return {
      drawer: false,
      filtroVuelta: 'Primera Vuelta',
      filtroPartido: '',
      filtroPais: '',
      itemsVuelta: ['Primera Vuelta', 'Segunda Vuelta'],
      vueltaSeleccionada: 1,
      configuracionMapa: {
        colorDefecto: "#CCC6C6",
        colorBorde: "#000000",
        proyeccion: "Miller",
      },
    };
  },

  computed: {
    esPrimeraVuelta() {
      return this.vueltaSeleccionada === 1;
    },
    itemsPais() {
      if (!this.resultadosCantones || this.resultadosCantones.length === 0) return [];

      const paises = this.resultadosCantones
        .filter(c => c.CANTON && NAME_TO_ISO[c.CANTON.toUpperCase()])
        .map(c => c.CANTON);
      return [...new Set(paises)].sort();
    },
    itemsPartido() {
      if (!this.colores) return [];
      return Object.keys(this.colores).sort();
    },
    datosParaMapa() {
      if (!this.resultadosCantones || this.resultadosCantones.length === 0) return [];

      const datosMapeados = [];

      this.resultadosCantones.forEach(cantonData => {
        const nombreCanton = cantonData.CANTON ? cantonData.CANTON.toUpperCase() : "";

        if (this.filtroPais && this.filtroPais.toUpperCase() !== nombreCanton) {
           return;
        }

        const isoCode = NAME_TO_ISO[nombreCanton];

        if (isoCode) {
           let winnerName = cantonData.ganador || "Desconocido";
           let winnerVotes = 0;
           let winnerPercent = 0;

           let fill = "#cccccc";
           let tooltipText = "";

           if (this.filtroPartido && cantonData.resultados && cantonData.resultados[this.filtroPartido]) {
              const partyData = cantonData.resultados[this.filtroPartido];
              winnerName = this.filtroPartido;
              winnerVotes = partyData.votos;
              winnerPercent = partyData.porcentaje;
              
              const baseColor = this.colores[this.filtroPartido] ? (this.colores[this.filtroPartido].principal || this.colores[this.filtroPartido]) : "#666666";
              fill = baseColor;
              
              tooltipText = `[bold]${nombreCanton}[/]\n${winnerName}: ${winnerVotes.toLocaleString()} (${winnerPercent}%)`;

           } else {
               if (cantonData.resultados && cantonData.resultados[winnerName]) {
                 winnerVotes = cantonData.resultados[winnerName].votos;
                 winnerPercent = cantonData.resultados[winnerName].porcentaje; 
               }

               if (this.colores[winnerName]) {
                 fill = this.colores[winnerName].principal || this.colores[winnerName]; 
               }
               
               tooltipText = `[bold]${nombreCanton}[/]\nGanador: ${winnerName}\nVotos: ${winnerVotes.toLocaleString()} (${winnerPercent}%)`;
           }

           datosMapeados.push({
             id: isoCode,
             name: nombreCanton,
             fill: fill, 
             colorHover: fill,
             ganador: winnerName,
             votos: winnerVotes.toLocaleString(),
             tooltipPersonalizado: tooltipText
           });
        }
      });

      return datosMapeados;
    },
  },

  methods: {
    setVuelta(numero) {
      this.vueltaSeleccionada = numero;
    },
    aplicarFiltros() {
      console.log("Filtros:", {
        vuelta: this.filtroVuelta,
        partido: this.filtroPartido,
        pais: this.filtroPais
      });
      this.drawer = false;
    }
  },
};
</script>

<style scoped></style>