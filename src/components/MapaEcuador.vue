<template>
  <div class="wrapper-mapa">
    <v-btn 
      v-if="nivelActual !== 'provincias'" 
      class="btn-regresar" 
      color="var(--color-cyan)" 
      dark 
      small 
      @click="subirNivel"
    >
      <v-icon left>mdi-arrow-left</v-icon> Regresar al País
    </v-btn>
    <div id="chartdiv" class="contenedor-mapa"></div>
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaEcuador",
  props: ["provincias", "cantones", "parroquias", "vuelta"],
  data: () => ({
    chart: null,
    polygonSeries: null,
    nivelActual: "provincias",
    historial: []
  }),
  mounted() {
    this.iniciarMapa();
  },
  methods: {
    iniciarMapa() {
      let chart = am4core.create("chartdiv", am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      
      // CARGA DE DATOS
      chart.geodata = this.corregirGeoJSON(this.provincias);

      // --- CONFIGURACIÓN ESTÁTICA ---
      chart.chartContainer.wheelable = false; // Bloquea zoom con mouse para estabilidad
      chart.seriesContainer.draggable = true; // Permite moverlo pero no "volar" fuera

      // BOTÓN HOME Y ZOOM
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      let homeButton = chart.zoomControl.createChild(am4core.Button);
      homeButton.icon = new am4core.Sprite();
      homeButton.icon.path = "M16,1L1,12h3v11h5v-6h4v6h5V12h3L16,1z";
      homeButton.events.on("hit", () => { chart.goHome(); });

      // SERIE DE POLÍGONOS
      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color("#12a2c2").lighten(0.4);
      polygonTemplate.stroke = am4core.color("#FFFFFF");
      polygonTemplate.strokeWidth = 1;

      // --- SOLUCIÓN AL TOOLTIP MEZCLADO ---
      // Usamos un adaptador para que el texto sea inteligente
      polygonTemplate.adapter.add("tooltipText", (text, target) => {
        if (target.dataItem.dataContext) {
          let data = target.dataItem.dataContext;
          if (this.nivelActual === "provincias") {
            return "[bold]{PROVINCIA}[/]";
          } else {
            return "[bold]{CANTON}[/]";
          }
        }
        return text;
      });

      // EVENTO CLIC
      polygonTemplate.events.on("hit", (ev) => {
        this.manejarNavegacion(ev.target.dataItem.dataContext);
      });

      this.polygonSeries = polygonSeries;
      this.chart = chart;
    },

    corregirGeoJSON(json) {
      if (!json) return { type: "FeatureCollection", features: [] };
      let copia = JSON.parse(JSON.stringify(json));
      copia.features.forEach(f => {
        if (f.geometry.type === "Polygon") {
          f.geometry.coordinates.forEach(r => r.reverse());
        } else if (f.geometry.type === "MultiPolygon") {
          f.geometry.coordinates.forEach(p => p.forEach(r => r.reverse()));
        }
      });
      return copia;
    },

    manejarNavegacion(data) {
      if (this.nivelActual === "provincias" && data.CODPRO) {
        this.historial.push({ geodata: this.chart.geodata, nivel: "provincias" });
        
        // FILTRADO POR CÓDIGO ÚNICO DE QGIS
        const filtrados = this.cantones.features.filter(f => f.properties.CODPRO === data.CODPRO);
        
        if (filtrados.length > 0) {
          this.chart.geodata = this.corregirGeoJSON({ type: "FeatureCollection", features: filtrados });
          this.nivelActual = "cantones";
          this.chart.goHome();
        }
      }
    },

    subirNivel() {
      let anterior = this.historial.pop();
      if (anterior) {
        this.chart.geodata = anterior.geodata;
        this.nivelActual = anterior.nivel;
        this.chart.goHome();
      }
    }
  },
  beforeDestroy() {
    if (this.chart) this.chart.dispose();
  }
};
</script>

<style scoped>
.wrapper-mapa { position: relative; width: 100%; height: 600px; }
.btn-regresar { position: absolute; top: 15px; right: 15px; z-index: 10; font-family: var(--fuente-titulos); }
.contenedor-mapa { width: 100%; height: 100%; background-color: transparent; }
</style>