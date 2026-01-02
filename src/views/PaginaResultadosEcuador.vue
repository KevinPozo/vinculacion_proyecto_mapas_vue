<template>
  <v-sheet class="position-relative overflow-hidden fondo-general">
    
    <v-navigation-drawer v-model="drawer" absolute temporary width="320" color="#12a2c2" dark>
      <v-container class="contenedor-filtros">
        <h3 class="mb-4 text-uppercase" style="font-family: 'Oswald', sans-serif;">
          Configuración
        </h3>

        <div class="texto-filtro">ETAPA ELECTORAL</div>
        <v-select 
          v-model="filtroVuelta" 
          :items="['Primera Vuelta', 'Segunda Vuelta']" 
          outlined dense 
          background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"
          @change="filtroPartido = null" 
        ></v-select>

        <div class="texto-filtro">PARTIDO / MOVIMIENTO</div>
        <v-select 
          v-model="filtroPartido" 
          :items="listaPartidos"
          item-text="nombre"
          item-value="id" 
          outlined dense 
          background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"
          placeholder="Ver todos (Ganadores)"
          clearable
        >
          <template v-slot:item="{ item }">
            <div class="d-flex align-center" style="width: 100%">
              <div :style="`width: 15px; height: 15px; border-radius: 50%; background: ${item.color}; margin-right: 10px; border: 1px solid white;`"></div>
              <span>{{ item.nombre }}</span>
            </div>
          </template>
          <template v-slot:selection="{ item }">
             <div class="d-flex align-center">
              <div :style="`width: 12px; height: 12px; border-radius: 50%; background: ${item.color}; margin-right: 8px;`"></div>
              <span class="text-truncate">{{ item.nombre }}</span>
            </div>
          </template>
        </v-select>

        <v-divider class="my-3 white"></v-divider>

        <div class="texto-filtro">PROVINCIA</div>
        <v-select 
          v-model="filtroProvincia" 
          :items="listaProvincias" 
          item-text="nombre"
          item-value="codigo"
          outlined dense 
          background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-2"
          placeholder="Seleccione..."
          @change="alCambiarProvincia"
        ></v-select>

        <div class="texto-filtro">CANTÓN</div>
        <v-select 
          v-model="filtroCanton" 
          :items="listaCantonesFiltrados"
          item-text="nombre"
          item-value="codigo" 
          outlined dense 
          background-color="rgba(255,255,255,0.1)"
          hide-details dark class="mb-4"
          placeholder="Seleccione..."
          :disabled="!filtroProvincia"
        ></v-select>

        <v-btn block color="white" light class="font-weight-bold mt-4" style="font-family: 'Oswald', sans-serif;" @click="ejecutarBusqueda">
          APLICAR FILTROS
        </v-btn>
      </v-container>
    </v-navigation-drawer>

    <v-btn color="#12a2c2" dark fab small absolute top left style="top: 20px; left: 20px; z-index: 5;" @click="drawer = !drawer">
      <v-icon>mdi-menu</v-icon>
    </v-btn>

    <v-container fluid class="fill-height align-start">
      <v-row no-gutters>
        <v-card outlined color="transparent" width="100%">
          
          <v-row no-gutters class="mt-5">
            <v-col cols="12" md="3"></v-col>
            <v-col cols="12" md="6">
              <div class="flex-column-center">
                <div class="contenedor-titulo">
                  <v-card elevation="24" color="#2c3e50">
                    <div class="tarjeta-titulo-mapa">
                      RESULTADOS PRESIDENCIALES 2021
                    </div>
                  </v-card>
                </div>

                <div class="contenedor-botones-vuelta">
                  <v-btn tile class="btn-vuelta" :class="filtroVuelta === 'Primera Vuelta' ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'" @click="cambiarVuelta('Primera Vuelta')">
                    1RA VUELTA
                  </v-btn>
                  <v-btn tile class="btn-vuelta" :class="filtroVuelta === 'Segunda Vuelta' ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'" @click="cambiarVuelta('Segunda Vuelta')">
                    2DA VUELTA
                  </v-btn>
                </div>
              </div>
            </v-col>
          </v-row>

          <v-row class="mt-4 justify-center">
            
            <v-col cols="12" md="9" lg="8">
              <v-card elevation="10" color="rgba(255,255,255,0.95)" class="rounded-lg overflow-hidden">
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
                   <span class="ml-3 font-weight-bold">Cargando...</span>
                </div>
              </v-card>
            </v-col>

            <v-col cols="12" md="3" lg="3">
              <v-card class="pa-0 ml-md-4 mt-4 mt-md-0" elevation="10" color="white" rounded="lg">
                <div class="pa-3 text-center white--text" style="background-color: #2c3e50; font-family: 'Oswald', sans-serif; font-size: 1.1rem;">
                  RESULTADOS GENERALES
                </div>
                
                <v-card-text class="pa-0">
                  
                  <div v-if="filtroVuelta === 'Segunda Vuelta'">
                    <div v-for="(candidato, i) in datosGeneralesSegundaVuelta" :key="i">
                      <div class="d-flex flex-column align-center py-4 px-2" :style="i === 0 ? 'border-bottom: 1px solid #eee' : ''">
                        <v-avatar size="100" class="mb-2" :style="`border: 4px solid ${candidato.color}`">
                          <img :src="candidato.foto" alt="Candidato" style="object-fit: cover;">
                        </v-avatar>
                        <div class="text-h6 font-weight-bold text-uppercase text-center" style="font-family: 'Oswald', sans-serif !important; line-height: 1.1;">
                          {{ candidato.nombre }}
                        </div>
                        <div class="caption grey--text text--darken-1 text-center font-weight-bold mb-1">
                          {{ candidato.partido }}
                        </div>
                        <v-chip :color="candidato.color" dark small label class="font-weight-bold mt-1">
                          {{ candidato.porcentaje }}%
                        </v-chip>
                        <div class="caption mt-1">{{ candidato.votos }} VOTOS</div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="pa-0">
                    <v-list dense>
                      <v-list-item v-for="(partido, i) in datosGeneralesPrimeraVuelta" :key="i" style="border-bottom: 1px solid #f0f0f0;">
                        
                        <v-list-item-avatar size="24" :color="partido.color" class="white--text font-weight-bold justify-center caption">
                           {{ i + 1 }}
                        </v-list-item-avatar>

                        <v-list-item-content>
                          <v-list-item-title class="font-weight-bold text-uppercase caption">
                            {{ partido.nombre }}
                          </v-list-item-title>
                          <v-list-item-subtitle class="caption grey--text">
                             {{ partido.votos }} votos
                          </v-list-item-subtitle>
                        </v-list-item-content>

                        <v-list-item-action>
                          <span class="font-weight-black body-2 blue-grey--text">{{ partido.porcentaje }}%</span>
                        </v-list-item-action>

                      </v-list-item>
                    </v-list>
                  </div>

                </v-card-text>

                <div class="pa-2 grey lighten-3 text-center caption">
                  <div class="font-weight-bold mb-1">ZONA: {{ zonaSeleccionada || 'NACIONAL' }}</div>
                  <v-icon x-small>mdi-information-outline</v-icon> Datos oficiales
                </div>
              </v-card>
            </v-col>

          </v-row>

        </v-card>
      </v-row>
    </v-container>
  </v-sheet>
</template>

<script>
import MapaEcuador from "@/components/MapaEcuador.vue";
import { getColorPartido } from "@/assets/Informacion/ColoresPartidos.js";

import provinciasData from "@/assets/GeoJSON/provincias.json";
import cantonesData from "@/assets/GeoJSON/cantones.json";
import parroquiasData from "@/assets/GeoJSON/parroquias.json";

// --- DATOS SIMULADOS ---
const INFO_CANDIDATOS_2DA = [
  { nombre: "GUILLERMO LASSO", partido: "CREO - PSC", color: "#08519c", porcentaje: 52.36, votos: "4,656,426", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/52/Guillermo_Lasso_%282021%29.jpg/220px-Guillermo_Lasso_%282021%29.jpg" },
  { nombre: "ANDRÉS ARAUZ", partido: "UNES", color: "#a63603", porcentaje: 47.64, votos: "4,236,515", foto: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Andr%C3%A9s_Arauz_Galarza.jpg/220px-Andr%C3%A9s_Arauz_Galarza.jpg" }
];

const INFO_PARTIDOS_1RA = [
  { id: 2, nombre: "UNES (Arauz)", color: "#a63603", porcentaje: 32.72, votos: "3,033,791" },
  { id: 1, nombre: "CREO-PSC (Lasso)", color: "#08519c", porcentaje: 19.74, votos: "1,830,172" },
  { id: 3, nombre: "PACHAKUTIK (Yaku)", color: "#7D3C98", porcentaje: 19.39, votos: "1,798,057" },
  { id: 4, nombre: "ID (Hervas)", color: "#e69237", porcentaje: 15.68, votos: "1,453,915" },
  { id: 6, nombre: "AVANZA (Isidro)", color: "#e91e63", porcentaje: 2.30, votos: "150,000" },
];

const MAPA_COLORES_1RA = [
  { id: "01", id_partido: 3, ganador: "Pachakutik" },
  { id: "17", id_partido: 4, ganador: "Izquierda Democrática" },
  { id: "09", id_partido: 2, ganador: "UNES" },
  { id: "13", id_partido: 2, ganador: "UNES" },
  { id: "11", id_partido: 1, ganador: "CREO-PSC" },
];

const MAPA_COLORES_2DA = [
  { id: "01", id_partido: 1, ganador: "Lasso" },
  { id: "17", id_partido: 1, ganador: "Lasso" },
  { id: "09", id_partido: 2, ganador: "Arauz" },
  { id: "13", id_partido: 2, ganador: "Arauz" },
  { id: "11", id_partido: 1, ganador: "Lasso" },
];

export default {
  name: "PaginaResultadosEcuador",
  components: { MapaEcuador },
  
  data() {
    return {
      drawer: false,
      datosCargados: false,
      
      // Filtros
      filtroVuelta: 'Primera Vuelta',
      filtroPartido: null,
      filtroProvincia: null,
      filtroCanton: null,
      
      jsonProvincias: null,
      jsonCantones: null,
      jsonParroquias: null,

      configMapa: {
        colorDefecto: "#D9D9D9",
        colorBorde: "#FFFFFF",
        exportar: true
      },
      
      zonaSeleccionada: null,
    };
  },

  computed: {
    // Lista para el Combo de Filtros
    listaPartidos() {
      let lista = this.filtroVuelta === 'Segunda Vuelta' 
          ? INFO_CANDIDATOS_2DA.map((c, i) => ({ id: i+1, nombre: c.nombre, color: c.color }))
          : INFO_PARTIDOS_1RA.map(p => ({ id: p.id, nombre: p.nombre, color: p.color }));
      return lista;
    },

    datosGeneralesSegundaVuelta() { return INFO_CANDIDATOS_2DA; },
    datosGeneralesPrimeraVuelta() { return INFO_PARTIDOS_1RA; },

    // Lista de Provincias
    listaProvincias() {
        if (!this.jsonProvincias) return [];
        return this.jsonProvincias.features.map(f => ({
            nombre: f.properties.PROVINCIA,
            codigo: f.properties.CODPRO
        })).sort((a,b) => a.nombre.localeCompare(b.nombre));
    },

    // Lista de Cantones
    listaCantonesFiltrados() {
        if (!this.jsonCantones || !this.filtroProvincia) return [];
        return this.jsonCantones.features
            .filter(f => f.properties.CODPRO === this.filtroProvincia)
            .map(f => ({
                nombre: f.properties.CANTON,
                codigo: f.properties.CODCAN
            })).sort((a,b) => a.nombre.localeCompare(b.nombre));
    },

    // LÓGICA PRINCIPAL DEL MAPA
    datosParaMapa() {
      // 1. MODO "UN SOLO PARTIDO" (Filtro Activo en 1ra Vuelta)
      if (this.filtroPartido && this.filtroVuelta === 'Primera Vuelta') {
          // Buscamos info del partido seleccionado
          const partidoInfo = this.listaPartidos.find(p => p.id === this.filtroPartido);
          if (!partidoInfo) return [];

          // PINTAMOS TODO EL MAPA DEL COLOR DEL PARTIDO
          return this.listaProvincias.map(prov => {
              // Simulamos votos aleatorios para que veas el efecto
              const votosSimulados = Math.floor(Math.random() * 50000) + 500;
              return {
                  id: prov.codigo,
                  colorHover: partidoInfo.color, // Todo del mismo color
                  ganador: partidoInfo.nombre,   // Nombre para mostrar
                  votos: votosSimulados.toLocaleString(),
                  
                  // Tooltip Específico
                  tooltipPersonalizado: `Votos por ${partidoInfo.nombre}:\n${votosSimulados.toLocaleString()}`
              };
          });
      }

      // 2. MODO "GANADORES" (Sin filtro o 2da Vuelta)
      let datosBase = this.filtroVuelta === 'Segunda Vuelta' ? MAPA_COLORES_2DA : MAPA_COLORES_1RA;

      return datosBase.map(item => {
        const colorInfo = getColorPartido(item.id_partido);
        return {
          id: item.id,
          colorHover: colorInfo.principal,
          ganador: item.ganador,
          votos: "---",
          tooltipPersonalizado: `Ganador: ${item.ganador}`
        };
      });
    }
  },

  mounted() {
    setTimeout(() => {
      this.jsonProvincias = provinciasData;
      this.jsonCantones = cantonesData;
      this.jsonParroquias = parroquiasData;
      this.datosCargados = true;
    }, 800);
  },

  methods: {
    alCambiarProvincia() {
        this.filtroCanton = null;
    },
    
    cambiarVuelta(vuelta) {
        this.filtroVuelta = vuelta;
        this.filtroPartido = null; 
    },

    ejecutarBusqueda() {
        this.drawer = false;
        
        if (this.filtroCanton && this.filtroProvincia) {
            const nombreCanton = this.listaCantonesFiltrados.find(c => c.codigo === this.filtroCanton).nombre;
            this.$refs.mapaRef.navegarExternamente("cantones", this.filtroCanton, nombreCanton, this.filtroProvincia);
            this.zonaSeleccionada = nombreCanton;
        } 
        else if (this.filtroProvincia) {
            const nombreProv = this.listaProvincias.find(p => p.codigo === this.filtroProvincia).nombre;
            this.$refs.mapaRef.navegarExternamente("provincias", this.filtroProvincia, nombreProv);
            this.zonaSeleccionada = nombreProv;
        }
    }
  }
};
</script>

<style scoped>
.contenedor-titulo { margin-top: 10px; display: flex; justify-content: center; }
.tarjeta-titulo-mapa {
  color: #ffffff;
  font-family: "Oswald", sans-serif;
  font-size: 1.2rem;
  text-transform: uppercase;
  text-align: center;
  padding: 10px;
}
.contenedor-botones-vuelta {
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 10px;
}
.btn-vuelta { font-family: "Oswald", sans-serif !important; color: white; }
.btn-vuelta-activo { background-color: #f88c0f !important; color: white !important; }
.btn-vuelta-inactivo { background-color: white !important; color: black !important; }
.flex-column-center { display: flex; flex-direction: column; align-items: center; }
.texto-filtro {
  font-family: "Oswald", sans-serif;
  font-size: 14px;
  font-weight: 500;
  margin-top: 10px;
  margin-bottom: 2px;
  text-transform: uppercase;
  color: white;
}
</style>