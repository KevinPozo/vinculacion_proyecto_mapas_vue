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
import {
  getColorPartido,
} from "@/assets/Informacion/ColoresPartidos.js";

const DATOS_MOCK_1RA = [
  { id: "ES", name: "España", ganador: "UNES", id_partido: "2", votos: 45000 },
  { id: "IT", name: "Italia", ganador: "UNES", id_partido: "2", votos: 32000 },
  { id: "US", name: "Estados Unidos", ganador: "CREO-PSC", id_partido: "1", votos: 58000 },
  { id: "CA", name: "Canadá", ganador: "Pachakutik", id_partido: "3", votos: 5000 },
  { id: "VE", name: "Venezuela", ganador: "UNES", id_partido: "2", votos: 12000 },
  { id: "CO", name: "Colombia", ganador: "CREO-PSC", id_partido: "1", votos: 8000 },
  { id: "PE", name: "Perú", ganador: "Izquierda Democrática", id_partido: "4", votos: 4500 },
  { id: "CL", name: "Chile", ganador: "Pachakutik", id_partido: "3", votos: 3000 },
  { id: "AR", name: "Argentina", ganador: "UNES", id_partido: "2", votos: 6500 },
  { id: "BR", name: "Brasil", ganador: "Mov. Construye", id_partido: "11", votos: 2000 },
  { id: "MX", name: "México", ganador: "CREO-PSC", id_partido: "1", votos: 3200 },
  { id: "RU", name: "Rusia", ganador: "UNES", id_partido: "2", votos: 1800 },
  { id: "CN", name: "China", ganador: "Alianza País", id_partido: "9", votos: 1500 },
  { id: "JP", name: "Japón", ganador: "CREO-PSC", id_partido: "1", votos: 800 },
  { id: "AU", name: "Australia", ganador: "Pachakutik", id_partido: "3", votos: 900 },
  { id: "GB", name: "Reino Unido", ganador: "CREO-PSC", id_partido: "1", votos: 4100 },
  { id: "FR", name: "Francia", ganador: "Izquierda Democrática", id_partido: "4", votos: 3600 },
  { id: "DE", name: "Alemania", ganador: "Pachakutik", id_partido: "3", votos: 2900 },
];

const DATOS_MOCK_2DA = [
  { id: "ES", name: "España", ganador: "UNES", id_partido: "2", votos: 55000 },
  { id: "IT", name: "Italia", ganador: "UNES", id_partido: "2", votos: 38000 },
  { id: "US", name: "Estados Unidos", ganador: "CREO-PSC", id_partido: "1", votos: 65000 },
  { id: "CA", name: "Canadá", ganador: "CREO-PSC", id_partido: "1", votos: 6000 },
  { id: "VE", name: "Venezuela", ganador: "UNES", id_partido: "2", votos: 15000 },
  { id: "CO", name: "Colombia", ganador: "CREO-PSC", id_partido: "1", votos: 9500 },
  { id: "PE", name: "Perú", ganador: "CREO-PSC", id_partido: "1", votos: 5500 },
  { id: "CL", name: "Chile", ganador: "CREO-PSC", id_partido: "1", votos: 4000 },
  { id: "AR", name: "Argentina", ganador: "UNES", id_partido: "2", votos: 7500 },
  { id: "BR", name: "Brasil", ganador: "UNES", id_partido: "2", votos: 2800 },
  { id: "MX", name: "México", ganador: "CREO-PSC", id_partido: "1", votos: 4000 },
  { id: "RU", name: "Rusia", ganador: "UNES", id_partido: "2", votos: 2200 },
  { id: "CN", name: "China", ganador: "UNES", id_partido: "2", votos: 1900 },
  { id: "JP", name: "Japón", ganador: "CREO-PSC", id_partido: "1", votos: 1100 },
  { id: "AU", name: "Australia", ganador: "CREO-PSC", id_partido: "1", votos: 1200 },
  { id: "GB", name: "Reino Unido", ganador: "CREO-PSC", id_partido: "1", votos: 5200 },
  { id: "FR", name: "Francia", ganador: "UNES", id_partido: "2", votos: 4800 },
  { id: "DE", name: "Alemania", ganador: "CREO-PSC", id_partido: "1", votos: 3500 },
];

export default {
  name: "MapaExtranjero",

  components: {
    MapaMundi,
  },

  data() {
    return {
      drawer: false,
      filtroVuelta: 'Primera Vuelta',
      filtroPartido: '',
      filtroPais: '',
      itemsVuelta: ['Primera Vuelta', 'Segunda Vuelta'],
      itemsPartido: ['Alianza Creo 21 Psc 6', 'Unión Por La Esperanza', 'Pachakutik', 'Izquierda Democrática'],
      itemsPais: ['España', 'Italia', 'Estados Unidos', 'Venezuela', 'Colombia'],
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
    datosParaMapa() {
      const datosCrudos = this.esPrimeraVuelta ? DATOS_MOCK_1RA : DATOS_MOCK_2DA;
      return datosCrudos.map((item) => {
        const colorInfo = getColorPartido(item.id_partido);
        return {
          id: item.id,
          colorHover: colorInfo.principal,
          ganador: item.ganador,
          votos: item.votos.toLocaleString(),
          tooltipPersonalizado: `Ganador: [bold]${item.ganador}[/]\nVotos: ${item.votos.toLocaleString()}`,
        };
      });
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