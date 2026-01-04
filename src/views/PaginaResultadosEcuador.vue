<template>
  <v-app>
    <v-app-bar color="white" elevation="1" height="70" style="z-index: 200;">
      <div class="d-flex align-center ml-4">
        <h1 style="font-family: 'Oswald', sans-serif; color: #1565C0; font-size: 2.5rem; letter-spacing: -2px;">
          sevee
        </h1>
      </div>
      <v-spacer></v-spacer>
      <div class="d-none d-md-flex mr-4">
        <v-btn text class="btn-nav">Inicio</v-btn>
        <v-btn text class="btn-nav active-nav">Votantes Nacionales</v-btn>
        <v-btn text class="btn-nav">Votantes Extranjero</v-btn>
        <v-btn text class="btn-nav">Acerca De</v-btn>
      </div>
      <v-app-bar-nav-icon color="#12a2c2" @click="drawer = !drawer"></v-app-bar-nav-icon>
    </v-app-bar>

    <v-navigation-drawer 
      v-model="drawer" 
      absolute 
      temporary 
      width="320" 
      color="#12a2c2" 
      dark 
      style="top: 70px; height: calc(100vh - 70px); z-index: 150;"
    >
      <v-container class="contenedor-filtros">
        <h3 class="mb-4 text-uppercase white--text" style="font-family: 'Oswald', sans-serif;">
          CONFIGURACIÓN
        </h3>

        <div class="texto-filtro">ETAPA ELECTORAL</div>
        <v-select 
          v-model="filtroVuelta" 
          :items="['Primera Vuelta', 'Segunda Vuelta']" 
          variant="outlined" density="compact" bg-color="rgba(255,255,255,0.1)"
          hide-details class="mb-4 text-white"
          @update:model-value="alCambiarVuelta" 
        ></v-select>

        <div class="texto-filtro">PARTIDO / MOVIMIENTO</div>
        <v-select 
          v-model="filtroPartido" 
          :items="listaPartidos"
          item-title="nombre"
          item-value="id" 
          variant="outlined" density="compact" bg-color="rgba(255,255,255,0.1)"
          hide-details class="mb-4 text-white"
          placeholder="Ver todos (Ganadores)"
          clearable
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" title="">
              <template v-slot:prepend>
                 <div :style="`width: 15px; height: 15px; background: ${item.raw.color}; margin-right: 10px; border: 1px solid white;`"></div>
              </template>
              <v-list-item-title>{{ item.raw.nombre }}</v-list-item-title>
            </v-list-item>
          </template>
        </v-select>

        <v-divider class="my-3 border-opacity-50"></v-divider>

        <div class="texto-filtro">PROVINCIA</div>
        <v-select 
          v-model="filtroProvincia" 
          :items="listaProvincias" 
          item-title="nombre"
          item-value="codigo"
          variant="outlined" density="compact" bg-color="rgba(255,255,255,0.1)"
          hide-details class="mb-2 text-white"
          placeholder="Seleccione..."
          @update:model-value="alCambiarProvincia"
        ></v-select>

        <div class="texto-filtro">CANTÓN</div>
        <v-select 
          v-model="filtroCanton" 
          :items="listaCantonesFiltrados"
          item-title="nombre"
          item-value="codigo" 
          variant="outlined" density="compact" bg-color="rgba(255,255,255,0.1)"
          hide-details class="mb-4 text-white"
          placeholder="Seleccione..."
          :disabled="!filtroProvincia"
        ></v-select>

        <v-btn block color="white" class="mt-4 font-weight-bold" style="color: #12a2c2" @click="ejecutarBusqueda">
          APLICAR FILTROS
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <v-main class="fondo-general">
      <v-container fluid class="fill-height align-start pt-8">
        <v-row justify="center">
          
          <v-col cols="12" class="text-center mb-0">
             <div class="d-inline-block">
                <v-card color="#12a2c2" elevation="4" class="px-10 py-2 mb-2 rounded-0 d-flex justify-center align-center" style="min-width: 400px;">
                  <span class="text-h5 white--text font-weight-bold text-uppercase" style="font-family: 'Oswald', sans-serif !important;">
                    RESULTADOS NACIONALES
                  </span>
                </v-card>
                
                <div class="d-flex justify-center">
                  <v-btn tile class="btn-vuelta mr-1 elevation-2" :color="filtroVuelta === 'Primera Vuelta' ? '#F88C0F' : 'white'" :style="{ color: filtroVuelta === 'Primera Vuelta' ? 'white' : '#555' }" @click="cambiarVuelta('Primera Vuelta')">PRIMERA VUELTA</v-btn>
                  <v-btn tile class="btn-vuelta ml-1 elevation-2" :color="filtroVuelta === 'Segunda Vuelta' ? '#F88C0F' : 'white'" :style="{ color: filtroVuelta === 'Segunda Vuelta' ? 'white' : '#555' }" @click="cambiarVuelta('Segunda Vuelta')">SEGUNDA VUELTA</v-btn>
                </div>
             </div>
          </v-col>

          <v-col cols="12" md="11" lg="10">
            <v-row>
              
              <v-col cols="12" md="9">
                 <v-card color="transparent" elevation="0" class="overflow-visible" style="min-height: 600px;">
                    <MapaEcuador
                      ref="mapaRef"
                      v-if="datosCargados"
                      :geoJsonProvincias="jsonProvincias"
                      :geoJsonCantones="jsonCantones"
                      :geoJsonParroquias="jsonParroquias"
                      :datos="datosParaMapa" 
                      :configuracion="configMapa"
                    />
                    <div v-else class="d-flex justify-center align-center" style="height: 500px">
                       <v-progress-circular indeterminate color="#12a2c2" size="64"></v-progress-circular>
                    </div>
                 </v-card>
              </v-col>

              <v-col cols="12" md="3">
                <v-card elevation="4" rounded="0" class="mt-4">
                  <div class="pa-3 white--text" style="background-color: #00838F; font-family: sans-serif;">
                    <div class="text-caption mb-0 opacity-80">Partido Político</div>
                    <div class="text-subtitle-1 font-weight-medium">Resultados Generales ▼</div>
                  </div>
                  
                  <v-card-text class="pa-0" style="max-height: 500px; overflow-y: auto;">
                    
                    <div v-if="filtroVuelta === 'Segunda Vuelta'">
                      <div v-for="(candidato, i) in datosGeneralesSegundaVuelta" :key="i">
                        <div class="d-flex flex-column align-center py-4 px-2 border-b">
                          <v-avatar size="80" class="mb-2" :style="`border: 3px solid ${candidato.color}`">
                            <v-img :src="candidato.foto" alt="Candidato" cover></v-img>
                          </v-avatar>
                          <div class="text-subtitle-1 font-weight-bold text-uppercase text-center" style="font-family: 'Oswald', sans-serif !important; line-height: 1.1;">{{ candidato.nombre }}</div>
                          <div class="caption grey--text text--darken-1 text-center font-weight-bold mb-1">{{ candidato.partido }}</div>
                          <v-chip :color="candidato.color" size="small" label class="font-weight-bold mt-1 text-white">{{ candidato.porcentaje }}%</v-chip>
                          <div class="caption mt-1">{{ candidato.votos }} VOTOS</div>
                        </div>
                      </div>
                    </div>

                    <div v-else>
                      <v-list density="compact" class="pa-0">
                        <v-list-item v-for="(partido, i) in datosGeneralesPrimeraVuelta" :key="i" class="py-3 border-b">
                          <template v-slot:prepend>
                            <div :style="`width: 20px; height: 20px; background-color: ${partido.color}; margin-right: 15px; border-radius: 2px;`"></div>
                          </template>
                          
                          <v-list-item-title class="text-caption font-weight-bold text-wrap mb-1" style="line-height: 1.2;">
                            {{ partido.nombre }}
                          </v-list-item-title>
                          
                          <v-list-item-subtitle class="text-caption grey--text">
                             {{ partido.porcentaje }}%
                          </v-list-item-subtitle>
                        </v-list-item>
                      </v-list>
                    </div>

                  </v-card-text>
                </v-card>
              </v-col>

            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script>
import MapaEcuador from "@/components/MapaEcuador.vue";
import { getColorPartido } from "@/assets/Informacion/ColoresPartidos.js";
import provinciasData from "@/assets/GeoJSON/provincias.json";
import cantonesData from "@/assets/GeoJSON/cantones.json";
import parroquiasData from "@/assets/GeoJSON/parroquias.json";

/** @constant {Array} Datos Candidatos 2da Vuelta */
const INFO_CANDIDATOS_2DA = [
  { id: 1, nombre: "GUILLERMO LASSO", partido: "CREO - PSC", color: "#08519c", porcentaje: 52.36, votos: "4,656,426", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Guillermo_Lasso_%282021%29.jpg/220px-Guillermo_Lasso_%282021%29.jpg" },
  { id: 2, nombre: "ANDRÉS ARAUZ", partido: "UNES", color: "#e67e22", porcentaje: 47.64, votos: "4,236,515", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Andr%C3%A9s_Arauz_Galarza.jpg/220px-Andr%C3%A9s_Arauz_Galarza.jpg" }
];

/** @constant {Array} Partidos 1ra Vuelta */
const INFO_PARTIDOS_1RA = [
  { id: 1, nombre: "Alianza Creo 21 Psc 6", color: "#08519c", porcentaje: 19.74 },
  { id: 2, nombre: "1-5 Unión Por La Esperanza", color: "#e67e22", porcentaje: 32.72 },
  { id: 3, nombre: "Movimiento Pachakutik", color: "#4a148c", porcentaje: 19.39 },
  { id: 4, nombre: "Izquierda Democrática", color: "#f1c40f", porcentaje: 15.68 },
  { id: 6, nombre: "Partido Político Avanza", color: "#e91e63", porcentaje: 2.03 },
  { id: 7, nombre: "Sociedad Patriótica", color: "#c0392b", porcentaje: 1.05 },
];

/** @constant {Array} Mapa 2da Vuelta (Binario) */
const MAPA_2DA = [
  { id: "01", id_partido: 1, ganador: "Lasso" },
  { id: "17", id_partido: 1, ganador: "Lasso" },
  { id: "09", id_partido: 2, ganador: "Arauz" },
  { id: "13", id_partido: 2, ganador: "Arauz" },
  { id: "11", id_partido: 1, ganador: "Lasso" },
];

/**
 * @component PaginaResultadosEcuador
 */
export default {
  name: "PaginaResultadosEcuador",
  components: { MapaEcuador },
  
  data() {
    return {
      drawer: false,
      datosCargados: false,
      filtroVuelta: 'Primera Vuelta',
      filtroPartido: null,
      filtroProvincia: null,
      filtroCanton: null,
      
      jsonProvincias: null,
      jsonCantones: null,
      jsonParroquias: null,

      configMapa: { colorDefecto: "#ECEFF1", colorBorde: "#FFFFFF", exportar: true },
    };
  },

  computed: {
    listaPartidos() { return this.filtroVuelta === 'Segunda Vuelta' ? INFO_CANDIDATOS_2DA : INFO_PARTIDOS_1RA; },
    datosGeneralesSegundaVuelta() { return INFO_CANDIDATOS_2DA; },
    datosGeneralesPrimeraVuelta() { return INFO_PARTIDOS_1RA; },
    listaProvincias() {
        if (!this.jsonProvincias) return [];
        return this.jsonProvincias.features.map(f => ({ nombre: f.properties.PROVINCIA, codigo: f.properties.CODPRO })).sort((a,b) => a.nombre.localeCompare(b.nombre));
    },
    listaCantonesFiltrados() {
        if (!this.jsonCantones || !this.filtroProvincia) return [];
        return this.jsonCantones.features.filter(f => f.properties.CODPRO === this.filtroProvincia).map(f => ({ nombre: f.properties.CANTON, codigo: f.properties.CODCAN })).sort((a,b) => a.nombre.localeCompare(b.nombre));
    },
    datosParaMapa() {
      if (this.filtroVuelta === 'Segunda Vuelta') {
          return MAPA_2DA.map(item => {
             const info = INFO_CANDIDATOS_2DA.find(c => c.id === item.id_partido);
             return { id: item.id, colorHover: info ? info.color : "#999", ganador: info ? info.nombre : "N/A", votos: "---", tooltipPersonalizado: `Ganador: ${info ? info.nombre : ''}` };
          });
      }
      if (this.filtroPartido) {
          const partidoInfo = this.listaPartidos.find(p => p.id === this.filtroPartido);
          if (!partidoInfo) return [];
          return this.listaProvincias.map(prov => ({ id: prov.codigo, colorHover: partidoInfo.color, ganador: partidoInfo.nombre, tooltipPersonalizado: `Votos: ${Math.floor(Math.random()*50000)}` }));
      }
      return this.listaProvincias.map((prov, index) => {
          const partidoRandom = INFO_PARTIDOS_1RA[index % INFO_PARTIDOS_1RA.length];
          return { id: prov.codigo, colorHover: partidoRandom.color, ganador: partidoRandom.nombre, tooltipPersonalizado: `Ganador: ${partidoRandom.nombre}` };
      });
    }
  },

  mounted() {
    setTimeout(() => {
      this.jsonProvincias = provinciasData;
      this.jsonCantones = cantonesData;
      this.jsonParroquias = parroquiasData;
      this.datosCargados = true;
    }, 500);
  },

  methods: {
    alCambiarProvincia() { this.filtroCanton = null; },
    alCambiarVuelta() { this.filtroPartido = null; },
    cambiarVuelta(vuelta) { this.filtroVuelta = vuelta; this.filtroPartido = null; },
    ejecutarBusqueda() {
        this.drawer = false;
        if (this.filtroCanton && this.filtroProvincia) {
            const nombreCanton = this.listaCantonesFiltrados.find(c => c.codigo === this.filtroCanton).nombre;
            this.$refs.mapaRef.navegarExternamente("cantones", this.filtroCanton, nombreCanton, this.filtroProvincia);
        } else if (this.filtroProvincia) {
            const nombreProv = this.listaProvincias.find(p => p.codigo === this.filtroProvincia).nombre;
            this.$refs.mapaRef.navegarExternamente("provincias", this.filtroProvincia, nombreProv);
        }
    }
  }
};
</script>

<style scoped>
/* ESTILOS BOTÓN LUPA (FLOTANTE SUPERIOR) */
.boton-lupa {
  position: absolute;
  top: 90px; /* Debajo de la barra de 70px */
  left: 20px;
  z-index: 100;
  border-radius: 50%;
}

.fondo-general {
  background-image: url("@/assets/img/Fondos/fondo2.png");
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
}

.texto-filtro { font-family: "Oswald", sans-serif; font-size: 13px; font-weight: 500; margin-bottom: 5px; color: white; letter-spacing: 0.5px; }
.btn-nav { color: #757575; font-weight: 600; text-transform: none; font-size: 1rem; }
.active-nav { color: #F39C12 !important; }
.btn-vuelta { font-family: "Oswald", sans-serif !important; font-weight: bold; letter-spacing: 1px; min-width: 160px; height: 40px !important; }
</style>