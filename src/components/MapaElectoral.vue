<template>
  <div class="contenedor-mapa-electoral" ref="chartDiv"></div>
</template>

<script>
/**
 * @file MapaElectoral.vue
 * @description Componente LÓGICO Y VISUAL del mapa.
 * - Carga los datos GeoJSON.
 * - Maneja AmCharts.
 * - Gestiona el Drill-down (Provincias -> Cantones -> Parroquias).
 * - Emite eventos de cambio de nivel para que el padre actualice títulos/UI.
 */

import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

// Datos GeoJSON
import provinciasData from "@/assets/1996/mapa/Provincias.json";
import cantonesData from "@/assets/1996/mapa/Cantones.json";
import parroquiasData from "@/assets/1996/mapa/Parroquias.json";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaElectoral",
  props: {
    configuracion: {
      type: Object,
      default: () => ({
        colorBase: "#ECEFF1",
        colorHover: "#E91E63",
        colorBorde: "#607D8B",
        exportar: true,
      }),
    },
  },
  data() {
    return {
      chart: null,
      polygonSeries: null,
      nivelActual: "provincias",
      tituloActual: "Resultados Nacionales 1996",
      historialNavegacion: [],
    };
  },
  mounted() {
    this.crearMapa();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
  methods: {
    /**
     * Función interna para corregir GeoJSON
     */
    corregirGeoJSON(geojsonOriginal) {
      const geojson = JSON.parse(JSON.stringify(geojsonOriginal));
      if (!geojson.features) return geojson;

      geojson.features.forEach((feature) => {
        const geometry = feature.geometry;
        if (!geometry) return;
        if (geometry.type === "Polygon") {
          geometry.coordinates.forEach((ring) => ring.reverse());
        } else if (geometry.type === "MultiPolygon") {
          geometry.coordinates.forEach((poly) =>
            poly.forEach((ring) => ring.reverse())
          );
        }
      });
      return geojson;
    },

    /**
     * Configurar tooltip
     */
    bindRegionTooltip(template) {
      template.tooltipText = `[bold]{PROVINCIA}[/]
{CANTON}
{PARROQUIA}
[font-size: 12px]Click para detalles[/]`;
    },

    /**
     * Manejador de click en región
     */
    handleRegionClick(event) {
      const target = event?.target || event?.mapPolygon || event;
      const data = target?.dataItem?.dataContext || target?.dataContext || event?.dataItem?.dataContext;

      if (!data) return;

      console.log(`Click en: ${data.PROVINCIA || data.CANTON || data.name}`);

      // Emitir selección
      this.$emit("region-selected", data);

      // Lógica Drill Down
      if (this.nivelActual === "provincias") {
        const codProvincia = data.CODPRO || data.properties?.CODPRO;
        const nombre = data.PROVINCIA || data.properties?.PROVINCIA || data.name;
        if (codProvincia) {
          this.entrarEnProvincia(codProvincia, nombre);
        }
      } else if (this.nivelActual === "cantones") {
        const codCanton = data.CODCAN || data.properties?.CODCAN;
        const nombre = data.CANTON || data.properties?.CANTON || data.name;
        if (codCanton) {
          this.entrarEnCanton(codCanton, nombre);
        }
      }
    },

    entrarEnProvincia(idProvincia, nombreProvincia) {
      const features = cantonesData.features.filter(
        (f) => f.properties.CODPRO === idProvincia
      );

      if (features.length > 0) {
        this.actualizarMapa(features, "cantones", `Provincia de ${nombreProvincia}`);
      }
    },

    entrarEnCanton(idCanton, nombreCanton) {
      const features = parroquiasData.features.filter(
        (f) => f.properties.CODCAN === idCanton
      );

      if (features.length > 0) {
        this.actualizarMapa(features, "parroquias", `Cantón ${nombreCanton}`);
      }
    },

    actualizarMapa(nuevosFeatures, nuevoNivel, nuevoTitulo) {
      // Guardamos estado anterior
      this.historialNavegacion.push({
        nivel: this.nivelActual,
        geodata: this.chart.geodata,
        titulo: this.tituloActual,
      });

      // Forzar cierre de tooltips
      if (this.chart && this.chart.tooltip) {
        this.chart.tooltip.hide();
      }

      const nuevoGeoJSON = {
        type: "FeatureCollection",
        features: nuevosFeatures,
      };

      const datosCorregidos = this.corregirGeoJSON(nuevoGeoJSON);
      this.chart.geodata = datosCorregidos;

      this.nivelActual = nuevoNivel;
      this.tituloActual = nuevoTitulo;

      // Emitimos cambio de nivel
      this.$emit("level-change", {
        nivel: nuevoNivel,
        titulo: nuevoTitulo,
        puedeRegresar: true,
      });

      setTimeout(() => {
        this.chart.goHome();
      }, 100);
    },

    /**
     * Función pública para regresar nivel
     */
    regresarNivel() {
      if (this.historialNavegacion.length > 0) {
        const estadoAnterior = this.historialNavegacion.pop();

        this.chart.geodata = estadoAnterior.geodata;
        this.nivelActual = estadoAnterior.nivel;
        this.tituloActual = estadoAnterior.titulo;

        // Forzar cierre de tooltips
        if (this.chart && this.chart.tooltip) {
          this.chart.tooltip.hide();
        }

        this.$emit("level-change", {
          nivel: this.nivelActual,
          titulo: estadoAnterior.titulo,
          puedeRegresar: this.historialNavegacion.length > 0,
        });

        setTimeout(() => {
          this.chart.goHome();
        }, 100);
      }
    },

    crearMapa() {
      if (this.chart) this.chart.dispose();

      let chart = am4core.create(this.$refs.chartDiv, am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      chart.chartContainer.wheelable = false;

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;

      // Carga inicial
      const datosIniciales = this.corregirGeoJSON(provinciasData);
      chart.geodata = datosIniciales;

      // Template
      let polygonTemplate = polygonSeries.mapPolygons.template;
      this.bindRegionTooltip(polygonTemplate);

      polygonTemplate.fill = am4core.color(this.configuracion.colorBase);
      polygonTemplate.stroke = am4core.color(this.configuracion.colorBorde);
      polygonTemplate.strokeWidth = 1;
      polygonTemplate.nonScalingStroke = false;

      let hs = polygonTemplate.states.create("hover");
      hs.properties.fill = am4core.color(this.configuracion.colorHover);

      polygonTemplate.events.on("hit", this.handleRegionClick);

      // Controles de Zoom
      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";

      // Botón de Inicio (Home)
      let homeButton = new am4core.Button();
      homeButton.events.on("hit", function () {
        chart.goHome();
      });

      homeButton.icon = new am4core.Sprite();
      homeButton.padding(7, 5, 7, 5);
      homeButton.width = 30;
      homeButton.icon.path = "M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z";
      homeButton.marginBottom = 10;
      homeButton.parent = chart.zoomControl;
      homeButton.insertBefore(chart.zoomControl.plusButton);

      // --- CONFIGURACIÓN DE EXPORTACIÓN (Copiado de MapaMundi) ---
      if (this.configuracion.exportar !== false) {
        chart.exporting.menu = new am4core.ExportMenu();
        chart.exporting.menu.align = "right";
        chart.exporting.menu.verticalAlign = "top";
        chart.exporting.menu.items = [
          {
            label: "",
            icon: "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23546E7A' width='24px' height='24px'%3E%3Cpath d='M0 0h24v24H0z' fill='none'/%3E%3Cpath d='M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'/%3E%3C/svg%3E",
            menu: [
              {
                label: "Imagen",
                menu: [
                  { type: "png", label: "PNG" },
                  { type: "jpg", label: "JPG" },
                  { type: "svg", label: "SVG" },
                  { type: "pdf", label: "PDF" },
                ],
              },
              {
                label: "Datos",
                menu: [
                  { type: "json", label: "JSON" },
                  { type: "csv", label: "CSV" },
                  { type: "xlsx", label: "XLSX" },
                  { type: "html", label: "HTML" },
                ],
              },
              {
                label: "Imprimir",
                type: "print",
              },
            ],
          },
        ];
        chart.exporting.filePrefix = "mapa_electoral_ecuador";
      }

      this.chart = chart;
      this.$emit("map-ready");

      // Emit state initial
      this.$emit("level-change", {
        nivel: "provincias",
        titulo: "Ecuador",
        puedeRegresar: false, // Inicio no puede regresar
      });
    },
  },
};
</script>

<style scoped>
.contenedor-mapa-electoral {
  width: 100%;
  height: 500px;
  background-color: transparent;
  position: relative;
}

::v-deep .amcharts-amexport-item:hover {
  background: #f5f5f5;
  color: #000;
}

/* LABEL (Texto de los items) */
::v-deep .amcharts-amexport-label {
  display: block;
  text-decoration: none;
  color: inherit;
}
</style>
