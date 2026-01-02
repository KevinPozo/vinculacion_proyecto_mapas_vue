<template>
    <v-sheet class="position-relative overflow-hidden">
        <v-navigation-drawer v-model="drawer" app absolute temporary width="300" color="#12a2c2" dark
            style="z-index: 10000;">
            <v-container class="contenedor-filtros">
                <h3 class="mb-4 text-uppercase" style="font-family: var(--fuente-titulos);">Seleccionar en Filtro</h3>

                <div class="texto-filtro">VUELTA*</div>
                <v-select v-model="filtroVuelta" :items="itemsVuelta" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark></v-select>
                <div class="seleccionado-label">Seleccionado: <span class="white--text">{{ filtroVuelta }}</span></div>

                <div class="texto-filtro mt-4">PARTIDO POLITICO*</div>
                <v-select v-model="filtroPartido" :items="itemsPartido" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark placeholder="Seleccione..."></v-select>
                <div class="seleccionado-label">Seleccionado: <span class="white--text">{{ filtroPartido || 'Ninguno'
                        }}</span></div>

                <div class="texto-filtro mt-4">PROVINCIA*</div>
                <v-select v-model="filtroProvincia" :items="itemsProvincia" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark placeholder="Seleccione..."></v-select>
                <div class="seleccionado-label">Seleccionado: <span class="white--text">{{ filtroProvincia || 'Ninguna'
                        }}</span></div>

                <div class="texto-filtro mt-4">CANTÓN</div>
                <v-select v-model="filtroCanton" :items="itemsCanton" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark placeholder="Seleccione..."></v-select>
                <div class="seleccionado-label">Seleccionado: <span class="white--text">{{ filtroCanton || 'Ninguno'
                        }}</span></div>

                <div class="caption mt-4 mb-2">*Campo Obligatorio</div>

                <v-btn block color="white" light class="font-weight-bold" @click="aplicarFiltros">BUSCAR</v-btn>
            </v-container>
        </v-navigation-drawer>

        <v-btn color="#12a2c2" dark fab small fixed top left
            style="margin-top: 20px; margin-left: 20px; z-index: 5000 !important;" @click="drawer = !drawer">
            <v-icon>mdi-magnify</v-icon>
        </v-btn>

        <v-container fluid class="fondo-general" style="min-height: 100vh;">
            <v-row no-gutters>
                <v-card outlined color="transparent" width="100%">
                    <v-row no-gutters>
                        <v-col cols="12" md="3"></v-col>
                        <v-col cols="12" md="6">
                            <div class="flex-column-center">
                                <div class="contenedor-titulo">
                                    <v-card elevation="24" color="#2c3e50">
                                        <div class="tarjeta-titulo-mapa">Resultados Nacionales 1996</div>
                                    </v-card>
                                </div>
                                <div class="contenedor-botones-vuelta">
                                    <v-btn tile class="btn-vuelta"
                                        :class="vueltaSeleccionada === 1 ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                                        @click="setVuelta(1)">PRIMERA VUELTA</v-btn>
                                    <v-btn tile class="btn-vuelta"
                                        :class="vueltaSeleccionada === 2 ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                                        @click="setVuelta(2)">SEGUNDA VUELTA</v-btn>
                                </div>
                            </div>
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12" md="9" style="min-height: 600px;">
                            <MapaEcuador v-if="jsonProv && jsonProv.features" :provincias="jsonProv"
                                :cantones="jsonCant" :parroquias="jsonParr" :vuelta="vueltaSeleccionada" />
                        </v-col>
                        <v-col cols="12" md="3">
                            <v-card class="pa-4 text-center">
                                <h3 style="font-family: var(--fuente-titulos);">Tarjetas Pendientes</h3>
                            </v-card>
                        </v-col>
                    </v-row>
                </v-card>
            </v-row>
        </v-container>
    </v-sheet>
</template>

<script>
import MapaEcuador from "./MapaEcuador.vue";
import provData from "@/assets/GeoJson/ProvinciasEcu.json";
import cantData from "@/assets/GeoJson/CantonesEcu.json";
import parrData from "@/assets/GeoJson/ParroquiasEcu.json";
export default {
    name: "MapaNacional",
    components: {
        MapaEcuador,
    },
    data: () => ({
        drawer: false,
        vueltaSeleccionada: 1,
        filtroVuelta: 'Primera Vuelta',
        filtroPartido: '',
        filtroProvincia: '',
        filtroCanton: '',
        jsonProv: provData,
        jsonCant: cantData,
        jsonParr: parrData,
        itemsVuelta: ['Primera Vuelta', 'Segunda Vuelta'],
        itemsPartido: ['Alianza Creo 21 Psc 6', 'Unión Por La Esperanza', 'Pachakutik', 'Izquierda Democrática'],
        itemsCanton: []
    }),


    computed: {
        itemsProvincia() {
            if (!this.jsonProv || !this.jsonProv.features) return [];

            const nombres = this.jsonProv.features.map(f => f.properties.PROVINCIA);
            return [...new Set(nombres)].sort();
        }
    },
    methods: {
        setVuelta(num) {
            this.vueltaSeleccionada = num;
            this.filtroVuelta = (num === 1) ? 'Primera Vuelta' : 'Segunda Vuelta';
        },
        aplicarFiltros() {
            this.drawer = false;
            console.log("Filtros aplicados:", this.filtroProvincia, this.filtroCanton);
        }
    }
};
</script>
