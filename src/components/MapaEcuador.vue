<template>
  <div class="wrapper-mapa">
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
    nivelActual: "provincias", // Niveles: provincias -> cantones -> parroquias
    idProvinciaSel: null,
    idCantonSel: null
  }),
  mounted() {
    this.iniciarMapa();
  },
  methods: {
    iniciarMapa() {
      let chart = am4core.create("chartdiv", am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      
      // Carga inicial: Provincias
      chart.geodata = this.corregirGeoJSON(this.provincias);

      // --- CONFIGURACIÓN DE ICONOS (Orden: Casa, +, -) ---
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginRight = 15;
      chart.zoomControl.marginBottom = 15;

      // Configurar Botón Home (Casita) para regresar al nivel nacional
      let homeButton = chart.zoomControl.createChild(am4core.Button);
      homeButton.padding(7, 5, 7, 5);
      homeButton.width = 30;
      homeButton.insertBefore(chart.zoomControl.plusButton); // Lo pone antes del +
      homeButton.icon = new am4core.Sprite();
      homeButton.icon.path = "M16,1L1,12h3v11h5v-6h4v6h5V12h3L16,1z";
      homeButton.events.on("hit", () => {
        this.regresarNivelNacional();
      });

      // --- SERIE DE POLÍGONOS ---
      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color("#bdc3c7"); // Gris elegante inicial
      polygonTemplate.stroke = am4core.color("#FFFFFF");
      polygonTemplate.strokeWidth = 1;

      // --- TOOLTIP ESTILO PROFESIONAL ---
      polygonTemplate.tooltipHTML = `
        <div style="background-color: #1a5276; color: white; padding: 12px; border: 1px solid #fff; border-radius: 5px; text-align: center; min-width: 140px;">
          <div style="font-weight: bold; font-size: 14px; margin-bottom: 3px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.3); padding-bottom: 3px;">{name}</div>
          <div style="font-size: 11px; margin-top: 5px;">Ganador: <span style="font-weight: bold;">Alianza 1996</span></div>
          <div style="font-size: 11px;">Votos: <span style="font-weight: bold;">15,420</span></div>
          <div style="font-size: 11px;">Porcentaje: <span style="font-weight: bold;">54.2%</span></div>
        </div>
      `;

      // --- LÓGICA DE COLORES DINÁMICOS POR NIVEL ---
      polygonTemplate.adapter.add("fill", (fill, target) => {
        if (target.dataItem.dataContext) {
          if (this.nivelActual === "provincias") return am4core.color("#12a2c2").lighten(0.3);
          if (this.nivelActual === "cantones") return am4core.color("#1a5276").lighten(0.5);
          return am4core.color("#e67e22").lighten(0.4); // Parroquias en naranja suave
        }
        return fill;
      });

      // --- EVENTO CLIC (NAVEGACIÓN) ---
      polygonTemplate.events.on("hit", (ev) => {
        this.manejarClick(ev.target.dataItem.dataContext);
      });

      this.polygonSeries = polygonSeries;
      this.chart = chart;
    },

    manejarClick(data) {
      if (this.nivelActual === "provincias") {
        // De Provincia a Cantones
        this.idProvinciaSel = data.CODPRO;
        const filtrados = this.cantones.features.filter(f => f.properties.CODPRO === data.CODPRO);
        this.actualizarMapa(filtrados, "cantones");
      } 
      else if (this.nivelActual === "cantones") {
        // De Cantón a Parroquias
        this.idCantonSel = data.CODCAN;
        const filtrados = this.parroquias.features.filter(f => f.properties.CODCAN === data.CODCAN);
        if (filtrados.length > 0) {
          this.actualizarMapa(filtrados, "parroquias");
        }
      }
    },

    actualizarMapa(features, nivel) {
      this.nivelActual = nivel;
      this.chart.geodata = this.corregirGeoJSON({ type: "FeatureCollection", features: features });
      this.chart.goHome(); // Ajusta el zoom automáticamente a la zona
    },

    regresarNivelNacional() {
      this.nivelActual = "provincias";
      this.chart.geodata = this.corregirGeoJSON(this.provincias);
      this.chart.goHome();
    },

    corregirGeoJSON(json) {
      if (!json) return { type: "FeatureCollection", features: [] };
      let copia = JSON.parse(JSON.stringify(json));
      copia.features.forEach(f => {
        // Estandarizamos el nombre para el tooltip {name}
        f.properties.name = f.properties.PARROQUIA || f.properties.CANTON || f.properties.PROVINCIA;
        
        // Corrección de coordenadas para amCharts
        if (f.geometry.type === "Polygon") {
          f.geometry.coordinates.forEach(r => r.reverse());
        } else if (f.geometry.type === "MultiPolygon") {
          f.geometry.coordinates.forEach(p => p.forEach(r => r.reverse()));
        }
      });
      return copia;
    }
  },
  beforeDestroy() {
    if (this.chart) this.chart.dispose();
  }
};
</script>

<style scoped>
.wrapper-mapa { 
  position: relative; 
  width: 100%; 
  background-color: #f8f9fa; /* Fondo gris muy claro para resaltar el mapa */
  border-radius: 8px;
  box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
}

.contenedor-mapa {
  width: 100%;
  height: 650px; /* Altura ideal según tus capturas */
}
</style>