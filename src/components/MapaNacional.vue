<template>
    <v-sheet class="position-relative overflow-hidden">
        <v-navigation-drawer v-model="drawer" absolute temporary width="300" color="#12a2c2" dark>
            <v-container class="contenedor-filtros">
                <h3 class="mb-4 text-uppercase" style="font-family: var(--fuente-titulos);">
                    Seleccionar en Filtro
                </h3>

                <div class="texto-filtro">VUELTA*</div>
                <v-select v-model="filtroVuelta" :items="itemsVuelta" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-4"></v-select>

                <div class="texto-filtro">PARTIDO POLITICO*</div>
                <v-select v-model="filtroPartido" :items="itemsPartido" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-4"></v-select>

                <div class="texto-filtro">PROVINCIA*</div>
                <v-select v-model="filtroProvincia" :items="itemsProvincia" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-4"></v-select>

                <div class="texto-filtro">CANTÓN</div>
                <v-select v-model="filtroCanton" :items="itemsCanton" outlined dense
                    background-color="rgba(255,255,255,0.1)" hide-details dark class="mb-6"
                    placeholder="Seleccione..."></v-select>

                <p class="caption white--text">*Campo Obligatorio</p>

                <v-btn block color="white" light class="font-weight-bold" style="font-family: var(--fuente-titulos);"
                    @click="aplicarFiltros">
                    BUSCAR
                </v-btn>
            </v-container>
        </v-navigation-drawer>

        <v-btn class="btn-accion-cyan" dark fab small absolute top left style="top: 20px; left: 20px; z-index: 5;"
            @click="drawer = !drawer">
            <v-icon>mdi-magnify</v-icon>
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
                                            Resultados Nacionales 1996
                                        </div>
                                    </v-card>
                                </div>

                                <div class="contenedor-botones-vuelta">
                                    <v-btn tile class="btn-vuelta"
                                        :class="vueltaSeleccionada === 1 ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                                        @click="setVuelta(1)">
                                        PRIMERA VUELTA
                                    </v-btn>
                                    <v-btn tile class="btn-vuelta"
                                        :class="vueltaSeleccionada === 2 ? 'btn-vuelta-activo' : 'btn-vuelta-inactivo'"
                                        @click="setVuelta(2)">
                                        SEGUNDA VUELTA
                                    </v-btn>
                                </div>
                            </div>
                        </v-col>
                    </v-row>

                    <v-row>
                        <v-col cols="12" md="9">
                            <div class="text-center pa-10 white--text" style="font-family: var(--fuente-principal);">
                                <v-progress-circular indeterminate color="white"></v-progress-circular>
                                <p class="mt-4">Preparando visualización cartográfica nacional...</p>
                            </div>
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
export default {
    name: "MapaNacional",
    data: () => ({
        drawer: false,
        vueltaSeleccionada: 1,
        filtroVuelta: 'Primera Vuelta',
        filtroPartido: '',
        filtroProvincia: '',
        filtroCanton: '',
        itemsVuelta: ['Primera Vuelta', 'Segunda Vuelta'],
        itemsPartido: ['Alianza Creo 21 Psc 6', 'Unión Por La Esperanza', 'Pachakutik', 'Izquierda Democrática'],
        itemsProvincia: ['Pichincha', 'Guayas', 'Manabí', 'Azuay', 'Santa Elena'],
        itemsCanton: []
    }),
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