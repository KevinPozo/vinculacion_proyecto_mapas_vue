<template>
  <div class="contenedor-mapa-mundi" ref="chartdiv"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaMundi",

  props: {
    datos: { type: Array, default: () => [] },
    configuracion: {
      type: Object,
      default: () => ({
        colorDefecto: "#D9D9D9",
        colorBorde: "#000000",
        proyeccion: "Miller",
        exportar: true
      }),
    },
  },

  data() {
    return {
      chart: null,
      polygonSeries: null,
    };
  },

  mounted() {
    this.crearMapa();
  },

  beforeDestroy() {
    if (this.chart && !this.chart.isDisposed()) {
      this.chart.dispose();
    }
  },

  watch: {
    datos: {
      handler(nuevosDatos) {
        if (this.polygonSeries) {
          this.polygonSeries.data = nuevosDatos;
        }
      },
      deep: true,
    },
  },

  methods: {
    crearMapa() {
      let chart = am4core.create(this.$refs.chartdiv, am4maps.MapChart);
      chart.geodata = am4geodata_worldLow;

      chart.projection =
        this.configuracion.proyeccion === "Miller"
          ? new am4maps.projections.Miller()
          : new am4maps.projections.Mercator();

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.exclude = ["AQ"];

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.tooltipText = "{name}\n{tooltipPersonalizado}";

      polygonTemplate.fill = am4core.color(this.configuracion.colorDefecto);
      polygonTemplate.stroke = am4core.color(this.configuracion.colorBorde);
      polygonTemplate.strokeWidth = 0.5;

      polygonTemplate.propertyFields.fill = "colorHover";

      let hs = polygonTemplate.states.create("hover");
      hs.properties.stroke = am4core.color("#000000");
      hs.properties.strokeWidth = 1;

      polygonSeries.data = this.datos;
      this.polygonSeries = polygonSeries;

      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginRight = 10;
      chart.zoomControl.marginBottom = 10;

      if (this.configuracion.exportar !== false) {
        chart.exporting.menu = new am4core.ExportMenu();
        chart.exporting.menu.align = "right";
        chart.exporting.menu.verticalAlign = "top";
        chart.exporting.menu.items = [{
          label: "",
          icon: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23546E7A' width='24px' height='24px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E",
          menu: [
            {
              label: "Imagen",
              menu: [
                { type: "png", label: "PNG" },
                { type: "jpg", label: "JPG" },
                { type: "svg", label: "SVG" },
                { type: "pdf", label: "PDF" }
              ]
            },
            {
              label: "Datos",
              menu: [
                { type: "json", label: "JSON" },
                { type: "csv", label: "CSV" },
                { type: "xlsx", label: "XLSX" },
                { type: "html", label: "HTML" }
              ]
            },
            {
              label: "Imprimir",
              type: "print"
            }
          ]
        }];
        chart.exporting.filePrefix = "mapa_export";
      }
      this.chart = chart;
    },
  },
};
</script>

<style scoped>
.contenedor-mapa-mundi {
  width: 100%;
  height: 500px;
  background-color: transparent;
  position: relative;
}

::v-deep .amcharts-export-menu ul {
  background: #ffffff;
  padding: 0;
  list-style: none;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 4px;
}

::v-deep .amcharts-export-menu li {
  padding: 8px 16px;
  cursor: pointer;
  color: #333;
}

::v-deep .amcharts-export-menu li:hover {
  background: #f5f5f5;
  color: #000;
}
</style>