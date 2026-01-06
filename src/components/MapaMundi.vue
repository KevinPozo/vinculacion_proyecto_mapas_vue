<template>
  <div class="contenedor-mapa-mundi" ref="chartdiv"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4geodata_worldLow from "@amcharts/amcharts4-geodata/worldLow";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaMundi",

  props: {
    datos: { type: Array, default: () => [] },
    datosDescarga: { type: Array, default: () => [] },
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
    datosDescarga: {
      handler(nuevosDatos) {
        const hasData = Array.isArray(nuevosDatos) ? nuevosDatos.length > 0 : (nuevosDatos && Object.keys(nuevosDatos).length > 0);
        console.log("MapaMundi: datosDescarga changed, hasData:", hasData);
        this.actualizarDatosExportacion(nuevosDatos);
      },
      deep: true,
      immediate: true
    },
  },

  methods: {
    crearMapa() {
      const self = this;
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
                { label: "JSON", type: "custom", click: function() { self.descargarJSON(); } },
                { label: "XLSX", type: "custom", click: function() { self.descargarXLSX(); } },
                { label: "HTML", type: "custom", click: function() { self.descargarHTML(); } }
              ]
            },
            {
              label: "Imprimir",
              type: "print",
              label: "Imprimir"
            }
          ]
        }];
        chart.exporting.filePrefix = "mapa_export";
     
        this.actualizarDatosExportacion(this.datosDescarga);
      }
      this.chart = chart;
    },

    actualizarDatosExportacion(datos) {
      if (!this.chart || !this.chart.exporting) return;

      if (datos && Array.isArray(datos) && datos.length > 0) {
        try {
          const datosPlanos = this.flattenElectionData(datos);
          this.chart.exporting.data = datosPlanos;
          this.datosExportacionProcesados = datosPlanos;
          console.log("MapaMundi: Export data updated (Provincias Flattened), length: " + datosPlanos.length);
        } catch (e) {
          console.error("MapaMundi: Error flattening data", e);
          const raw = JSON.parse(JSON.stringify(datos));
          this.chart.exporting.data = raw;
          this.datosExportacionProcesados = raw;
        }
      }
    },

    getDatosParaDescarga() {
      return this.datosExportacionProcesados || this.datosDescarga || {};
    },

    flattenElectionData(data) {
      if (!data || !Array.isArray(data)) return [];
      
      return data.map(item => {
        let locationName = item.PROVINCIA || item.CANTON || item.PARROQUIA || "Desconocido";
        
        const flatItem = {
          "Ubicación": locationName,
          "Total de Votos": item.votos_validos || 0
        };

        if (item.resultados) {
          const sortedCandidates = Object.values(item.resultados).sort((a, b) => b.votos - a.votos);
          
          if (sortedCandidates[0]) {
            flatItem["Candidato 1"] = sortedCandidates[0].candidato;
            flatItem["Votos Candidato 1"] = sortedCandidates[0].votos;
          } else {
             flatItem["Candidato 1"] = "";
             flatItem["Votos Candidato 1"] = 0;
          }

          if (sortedCandidates[1]) {
            flatItem["Candidato 2"] = sortedCandidates[1].candidato;
            flatItem["Votos Candidato 2"] = sortedCandidates[1].votos;
          } else {
             flatItem["Candidato 2"] = "";
             flatItem["Votos Candidato 2"] = 0;
          }
        } else {
           flatItem["Candidato 1"] = "";
           flatItem["Votos Candidato 1"] = 0;
           flatItem["Candidato 2"] = "";
           flatItem["Votos Candidato 2"] = 0;
        }
        return flatItem;
      });
    },

    _extractTableData(source, key) {
        return [];
    },

    descargarJSON() {
      let datos = this.getDatosParaDescarga();
      if (!datos || datos.length === 0) {
         console.warn("MapaMundi: No processed data found, trying raw prop");
         datos = this.flattenElectionData(this.datosDescarga);
      }
      
      const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json;charset=utf-8" });
      saveAs(blob, "Resultados_Electorales.json");
    },

    descargarXLSX() {
      let datos = this.getDatosParaDescarga();
      if (!datos || datos.length === 0) {
         datos = this.flattenElectionData(this.datosDescarga);
      }

      if (!datos || datos.length === 0) {
        console.error("MapaMundi: No data to export even after fallback");
        return;
      }

      const ws = XLSX.utils.json_to_sheet(datos);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Resultados");
      
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([wbout], { type: "application/octet-stream" }), "Resultados_Electorales.xlsx");
    },

    descargarHTML() {
       let datos = this.getDatosParaDescarga();
       if (!datos || datos.length === 0) {
         datos = this.flattenElectionData(this.datosDescarga);
      }

       if (!datos || datos.length === 0) return;

       let html = "<html><head><style>table, th, td { border: 1px solid black; border-collapse: collapse; padding: 5px; font-family: Arial; } th { background-color: #f2f2f2; }</style></head><body><h2>Resultados Electorales</h2><table>";
       
       const keys = Object.keys(datos[0]);
       html += "<thead><tr>";
       keys.forEach(k => html += `<th>${k}</th>`);
       html += "</tr></thead><tbody>";

       datos.forEach(row => {
         html += "<tr>";
         keys.forEach(k => html += `<td>${row[k] !== undefined && row[k] !== null ? row[k] : ""}</td>`);
         html += "</tr>";
       });

       html += "</tbody></table></body></html>";
       
       const blob = new Blob([html], { type: "text/html;charset=utf-8" });
       saveAs(blob, "Resultados_Electorales.html");
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