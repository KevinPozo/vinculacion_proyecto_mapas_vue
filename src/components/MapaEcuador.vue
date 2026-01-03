<template>
  <div class="mapa-ecuador">
    <div id="chartdiv"></div>
  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaEcuador",
  props: ["provincias", "cantones", "parroquias"],
  data: () => ({
    chart: null,
    nivelActual: "provincias"
  }),
  mounted() {
    this.iniciarMapa();
  },
  methods: {
    iniciarMapa() {
      if (this.chart) {
        this.chart.dispose();
      }

      let chart = am4core.create("chartdiv", am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      chart.geodata = this.corregirGeoJSON(this.provincias);
      chart.background.fillOpacity = 0;

      chart.padding(10, 10, 45, 10);

      chart.chartContainer.wheelable = false;

      chart.exporting.menu = new am4core.ExportMenu();
      chart.exporting.menu.align = "right";
      chart.exporting.menu.verticalAlign = "top";
      chart.exporting.menu.items = [{
        label: "",
        icon: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23546E7A' width='24px' height='24px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E",
        menu: [
          { label: "Imagen", menu: [{ type: "png", label: "PNG" }, { type: "jpg", label: "JPG" }, { type: "pdf", label: "PDF" }] },
          { label: "Datos", menu: [{ type: "json", label: "JSON" }, { type: "csv", label: "CSV" }] },
          { label: "Imprimir", type: "print" }
        ]
      }];

      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginRight = 10;
      chart.zoomControl.marginBottom = 10;

      let homeButton = chart.zoomControl.createChild(am4core.Button);
      homeButton.width = 30;
      homeButton.height = 30;
      homeButton.padding(0, 0, 0, 0);
      homeButton.icon = new am4core.Sprite();
      homeButton.icon.path = "M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z";
      homeButton.icon.align = "center";
      homeButton.icon.valign = "middle";
      homeButton.toBack();

      chart.zoomControl.plusButton.index = 1;
      chart.zoomControl.minusButton.index = 2;
      homeButton.events.on("hit", () => this.regresarNivelNacional());

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      polygonSeries.tooltip.background.fillOpacity = 0;
      polygonSeries.tooltip.background.strokeOpacity = 0;
      polygonSeries.tooltip.getFillFromObject = false;
      polygonSeries.tooltip.label.padding(0, 0, 0, 0);

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color("#12a2c2").lighten(0.3);
      polygonTemplate.stroke = am4core.color("#000000");
      polygonTemplate.strokeWidth = 0.5;

      polygonTemplate.tooltipHTML = `
        <div style="
          background-color: #1a5276; 
          padding: 15px; 
          border: 1px solid #ffffff; 
          border-radius: 2px;
          text-align: left;
          font-family: 'Oswald', sans-serif;
          min-width: 180px;
          max-width: 320px;
          height: auto;
          color: #ffffff;
          box-sizing: border-box;
        ">
          <div style="font-weight: bold; font-size: 16px; text-transform: uppercase; margin-bottom: 8px;">
            {name}
          </div>
          <div style="font-size: 14px; line-height: 1.4;">
            Ganador: <span style="font-weight: 300;">{ganador}</span><br>
            Votos: <span style="font-weight: 300;">{votos}</span><br>
            <span style="color: #ffffff; font-weight: bold;">Porcentaje: {porcentaje}%</span>
          </div>
        </div>
      `;

      polygonTemplate.events.on("hit", (ev) => this.manejarClick(ev.target.dataItem.dataContext));
      this.chart = chart;
    },


    manejarClick(data) {
      
      if (this.chart && this.chart.tooltip) {
        this.chart.tooltip.hide();
      }

     
      if (this.nivelActual === "provincias") {
        const filtrados = this.cantones.features.filter(f => f.properties.CODPRO === data.CODPRO);
        this.actualizarMapa(filtrados, "cantones");
      } else if (this.nivelActual === "cantones") {
        const filtrados = this.parroquias.features.filter(f => f.properties.CODCAN === data.CODCAN);
        if (filtrados.length > 0) this.actualizarMapa(filtrados, "parroquias");
      }
    },
    actualizarMapa(features, nivel) {
      this.nivelActual = nivel;
      this.chart.geodata = this.corregirGeoJSON({ type: "FeatureCollection", features: features });
      this.chart.events.once("validated", () => {
        this.chart.goHome();
      });
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
    if (this.chart) {
      this.chart.dispose();
    }
  }
};
</script>

<style scoped>
.mapa-ecuador {
  width: 100%;
  height: 600px;
  background: transparent !important;
  position: relative;
  overflow: hidden;
}

#chartdiv {
  width: 100%;
  height: 100%;
}

::v-deep .amcharts-tooltip {
  pointer-events: none;
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
}

::v-deep .amcharts-tooltip div {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  margin: 0 !important;
}

::v-deep .amcharts-tooltip-pointer {
  fill: #1a5276 !important;
  stroke: #ffffff !important;
  stroke-width: 1px;
}
</style>