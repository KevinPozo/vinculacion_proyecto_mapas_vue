<template>
  <div class="mapa" ref="mapa"></div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

import {
  getColorPartido,
  COLORES_PARTIDOS,
} from "@/assets/Informacion/ColoresPartidos";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaEcuador",

  props: {
    geoProvincias: { type: Object, required: true },
    geoCantones: { type: Object, required: true },
    geoParroquias: { type: Object, required: true },

    id_1: {
      type: Array,
      default: () => ["", "", 0, 0],
    },
    nvuelta: String,
    datos: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {};
  },
  created() {
    this.chart = null;
    this.paisSeries = null;
    this.provinciaSeries = null;
    this.cantonSeries = null;
  },
  mounted() {
    this.initMap();
    this.updateMapData();
  },

  watch: {
    id_1: {
      handler() {
        this.updateMapData();
      },
      deep: true,
    },
    datos: {
      handler() {
        this.updateMapData();
      },
      deep: true,
    },
  },

  unmounted() {
    if (this.chart) {
      this.chart.dispose();
    }
  },

  methods: {
    fixGeoJsonIds(geoData) {
      if (geoData && geoData.features) {
        geoData.features.forEach((f) => {
          if (f.properties) {
            const candidateId =
              f.properties.id || f.properties.CODPRO || f.properties.CODCAN;
            if (candidateId && !f.id) {
              f.id = candidateId;
            }
          }
        });
      }
    },
    goBack() {
      if (!this.chart) return;

      // 1. Si estamos viendo Parroquias (Nivel 3) -> Volver a Cantones
      if (this.cantonSeries.visible) {
        this.cantonSeries.hide();
        // Limpiamos la geodata para liberar memoria
        this.cantonSeries.geodata = { type: "FeatureCollection", features: [] };

        this.provinciaSeries.show();

        // --- CORRECCIÓN ---
        // En lugar de intentar un zoom complejo, simplemente dejamos la vista como está
        // o si prefieres centrar, usamos goHome() que es seguro.
        // Si quieres que el usuario vea la provincia entera de nuevo:
        // this.chart.goHome();

        return;
      }

      // 2. Si estamos viendo Cantones (Nivel 2) -> Volver a País
      if (this.provinciaSeries.visible) {
        this.resetMapToHome();
        return;
      }

      // 3. Si ya estamos en el inicio
      this.chart.goHome();
    },
    processData(datos) {
      if (!datos) return [];
      return datos.map((item) => {
        const colorInfo = getColorPartido(item.partido_id);
        const partidoInfo = COLORES_PARTIDOS[item.partido_id];
        return {
          ...item,
          fill: colorInfo.principal,
          winnerName: partidoInfo ? partidoInfo.nombre : "Desconocido",
        };
      });
    },
    initMap() {
      // USAMOS LAS PROPS (this.geo...)
      this.fixGeoJsonIds(this.geoProvincias);
      this.fixGeoJsonIds(this.geoCantones);
      this.fixGeoJsonIds(this.geoParroquias);

      let chart = am4core.create(this.$refs.mapa, am4maps.MapChart);
      chart.projection = new am4maps.projections.Miller();
      chart.zoomControl = new am4maps.ZoomControl();

      // ... (Configuración de Export menú igual que antes) ...
      chart.exporting.menu = new am4core.ExportMenu(); // Simplificado para brevedad

      // --- PAIS ---
      let pais = chart.series.push(new am4maps.MapPolygonSeries());
      pais.geodata = this.geoProvincias; // <--- USAR PROP
      pais.useGeodata = true;
      pais.reverseGeodata = true;
      this.paisSeries = pais;

      let paisPolygon = pais.mapPolygons.template;
      paisPolygon.fill = am4core.color("#D9D9D9");
      paisPolygon.stroke = am4core.color("#000000");
      paisPolygon.strokeWidth = 0.5;
      paisPolygon.nonScalingStroke = true;
      paisPolygon.propertyFields.fill = "fill";
      paisPolygon.tooltipText = "[bold]{PROVINCIA}[/]\nGanador: {winnerName}";

      let hs = paisPolygon.states.create("hover");
      hs.properties.stroke = am4core.color("#000000");
      hs.properties.strokeWidth = 1;

      // --- PROVINCIA ---
      let provincia = chart.series.push(new am4maps.MapPolygonSeries());
      provincia.useGeodata = true;
      provincia.reverseGeodata = true;
      provincia.hidden = true;
      this.provinciaSeries = provincia;

      let provinciaPolygon = provincia.mapPolygons.template;
      provinciaPolygon.fill = am4core.color("#D9D9D9");
      provinciaPolygon.stroke = am4core.color("#000000");
      provinciaPolygon.strokeWidth = 0.5;
      provinciaPolygon.propertyFields.fill = "fill";
      provinciaPolygon.tooltipText = "[bold]{CANTON}[/]\nGanador: {winnerName}";

      let hs2 = provinciaPolygon.states.create("hover");
      hs2.properties.stroke = am4core.color("#000000");
      hs2.properties.strokeWidth = 1;

      // --- CANTON ---
      let canton = chart.series.push(new am4maps.MapPolygonSeries());
      canton.useGeodata = true;
      canton.reverseGeodata = true;
      canton.hidden = true;
      this.cantonSeries = canton;

      let cantonPolygon = canton.mapPolygons.template;
      cantonPolygon.fill = am4core.color("#D9D9D9");
      cantonPolygon.stroke = am4core.color("#000000");
      cantonPolygon.strokeWidth = 0.5;
      cantonPolygon.propertyFields.fill = "fill";
      cantonPolygon.tooltipText = "[bold]{PARROQUIA}[/]\nGanador: {winnerName}";

      let hs3 = cantonPolygon.states.create("hover");
      hs3.properties.stroke = am4core.color("#000000");
      hs3.properties.strokeWidth = 1;

      // EVENTOS
      paisPolygon.events.on("hit", (ev) => {
        ev.target.series.chart.zoomToMapObject(ev.target);
        this.drillDownToProvince(ev.target.dataItem.dataContext);
      });
      provinciaPolygon.events.on("hit", (ev) => {
        ev.target.series.chart.zoomToMapObject(ev.target);
        this.drillDownToCanton(ev.target.dataItem.dataContext);
      });

      // Botón Regresar
      let back = new am4core.Button();
      back.events.on("hit", () => {
        this.goBack();
      });
      back.icon = new am4core.Sprite();
      back.padding(7, 5, 7, 5);
      back.width = 30;
      back.icon.path =
        "M16,8 L14,8 L14,16 L10,16 L10,10 L6,10 L6,16 L2,16 L2,8 L0,8 L8,0 L16,8 Z M16,8";
      back.parent = chart.zoomControl;
      back.insertBefore(chart.zoomControl.plusButton);

      provincia.geodataSource.events.on("done", () => {
        pais.hide();
        provincia.show();
      });
      canton.geodataSource.events.on("done", () => {
        provincia.hide();
        canton.show();
      });

      this.chart = chart;
    },

    updateMapData() {
      if (!this.chart) return;
      const newData = this.processData(this.datos);
      this.resetMapToHome();
      this.paisSeries.data = newData;
      this.provinciaSeries.data = newData;
      this.cantonSeries.data = newData;
    },

    resetMapToHome() {
      if (!this.chart) return;
      this.chart.goHome();
      this.provinciaSeries.hide();
      this.cantonSeries.hide();
      this.provinciaSeries.geodata = {
        type: "FeatureCollection",
        features: [],
      };
      this.cantonSeries.geodata = { type: "FeatureCollection", features: [] };
      this.paisSeries.show();
    },

    drillDownToProvince(dataContext) {
      try {
        let id = dataContext.id || dataContext.CODPRO;

        // USAMOS PROP this.geoCantones
        let features = this.geoCantones.features || [];
        let provinceCantones = features.filter((f) => {
          return (
            String(f.properties.CODPRO).replace(/^0+/, "") ===
            String(id).replace(/^0+/, "")
          );
        });

        if (provinceCantones.length === 0) return;

        let freshFeatures = JSON.parse(JSON.stringify(provinceCantones));
        this.provinciaSeries.geodata = {
          type: "FeatureCollection",
          crs: this.geoCantones.crs,
          features: freshFeatures,
        };
        this.provinciaSeries.data = this.processData(this.datos);
        this.provinciaSeries.validateData();

        this.paisSeries.hide();
        this.provinciaSeries.show();
      } catch (error) {
        console.error(error);
      }
    },

    drillDownToCanton(dataContext) {
      try {
        let idCanton = dataContext.id || dataContext.CODCAN;

        // USAMOS PROP this.geoParroquias
        let features = this.geoParroquias.features || [];
        let cantonParroquias = features.filter((f) => {
          return (
            String(f.properties.CODCAN).replace(/^0+/, "") ===
            String(idCanton).replace(/^0+/, "")
          );
        });

        if (cantonParroquias.length === 0) return;

        let freshFeatures = JSON.parse(JSON.stringify(cantonParroquias));
        this.cantonSeries.geodata = {
          type: "FeatureCollection",
          crs: this.geoParroquias.crs,
          features: freshFeatures,
        };
        this.cantonSeries.data = this.processData(this.datos);
        this.cantonSeries.validateData();

        this.provinciaSeries.hide();
        this.cantonSeries.show();
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>

<style scoped>
.mapa {
  width: 100%;
  height: 500px;
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