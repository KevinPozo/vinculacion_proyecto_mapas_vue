<template>
  <div class="wrapper-mapa-transparente">
    <div id="chartdiv" class="mapa-full-size"></div>
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
    nivelActual: "provincias"
  }),
  mounted() {
    this.iniciarMapa();
  },
  methods: {
    iniciarMapa() {
      let chart = am4core.create("chartdiv", am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      chart.geodata = this.corregirGeoJSON(this.provincias);
      
      chart.background.fillOpacity = 0;
      chart.chartContainer.wheelable = false;
      chart.seriesContainer.draggable = true;
      chart.padding(0, 0, 0, 0);

      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginRight = 20;
      chart.zoomControl.marginBottom = 20;

      let homeButton = chart.zoomControl.createChild(am4core.Button);
      homeButton.icon = new am4core.Sprite();
      homeButton.icon.path = "M16,1L1,12h3v11h5v-6h4v6h5V12h3L16,1z";
      homeButton.width = 30;
      homeButton.height = 30;
      homeButton.index = 0; 
      homeButton.events.on("hit", () => {
        this.regresarNivelNacional();
      });

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color("#12a2c2").lighten(0.3);
      polygonTemplate.stroke = am4core.color("#FFFFFF");
      polygonTemplate.strokeWidth = 1.5;

      polygonTemplate.tooltipHTML = `
        <div style="background-color: #1a5276; color: white; padding: 10px; border: 1px solid #fff; border-radius: 4px; text-align: center;">
          <div style="font-weight: bold; text-transform: uppercase; font-size: 14px;">{name}</div>
          <div style="font-size: 11px; margin-top:4px;">Ganador: {ganador}</div>
          <div style="font-size: 11px;">Votos: {votos}</div>
          <div style="font-size: 11px;">Porcentaje: {porcentaje}%</div>
        </div>
      `;

      polygonTemplate.adapter.add("fill", (fill, target) => {
        if (target.dataItem.dataContext) {
          if (this.nivelActual === "provincias") return am4core.color("#12a2c2").lighten(0.3);
          if (this.nivelActual === "cantones") return am4core.color("#1a5276").lighten(0.4);
          return am4core.color("#e67e22").lighten(0.3);
        }
        return fill;
      });

      polygonTemplate.events.on("hit", (ev) => {
        this.manejarClick(ev.target.dataItem.dataContext);
      });

      this.chart = chart;
    },
    manejarClick(data) {
      if (this.nivelActual === "provincias") {
        const filtrados = this.cantones.features.filter(f => f.properties.CODPRO === data.CODPRO);
        this.actualizarMapa(filtrados, "cantones");
      } else if (this.nivelActual === "cantones") {
        const filtrados = this.parroquias.features.filter(f => f.properties.CODCAN === data.CODCAN);
        if (filtrados.length > 0) {
          this.actualizarMapa(filtrados, "parroquias");
        }
      }
    },
    actualizarMapa(features, nivel) {
      this.nivelActual = nivel;
      this.chart.geodata = this.corregirGeoJSON({ type: "FeatureCollection", features: features });
      this.chart.goHome();
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
        f.properties.name = f.properties.PARROQUIA || f.properties.CANTON || f.properties.PROVINCIA;
        f.properties.ganador = "Alianza 1996";
        f.properties.votos = "12,350";
        f.properties.porcentaje = "45.8";
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
.wrapper-mapa-transparente { 
  width: 100%; 
  height: 100%;
  background: transparent !important; 
}
.mapa-full-size {
  width: 100%;
  height: 750px; 
  background: transparent !important;
}
#chartdiv {
  outline: none;
}
</style>