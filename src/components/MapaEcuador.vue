<template>
  <div class="wrapper-mapa">
    
    <transition name="fade">
      <div v-if="nivelActual !== 'provincias'" class="boton-regresar" @click="subirNivel">
        <v-icon left small>mdi-arrow-left</v-icon>
        <span>Regresar a {{ nombreNivelSuperior }}</span>
      </div>
    </transition>

    <div class="contenedor-mapa" ref="chartdiv"></div>

    <div class="boton-home" @click="resetMap" title="Vista Nacional">
       <v-icon color="#455a64" size="24">mdi-home</v-icon>
    </div>

  </div>
</template>

<script>
import * as am4core from "@amcharts/amcharts4/core";
import * as am4maps from "@amcharts/amcharts4/maps";
import am4themes_animated from "@amcharts/amcharts4/themes/animated";

am4core.useTheme(am4themes_animated);

export default {
  name: "MapaEcuador",

  props: {
    geoJsonProvincias: { type: Object, required: true },
    geoJsonCantones: { type: Object, required: true },
    geoJsonParroquias: { type: Object, required: true },
    datos: { type: Array, default: () => [] }, 
    configuracion: { type: Object, default: () => ({ colorDefecto: "#D9D9D9", colorBorde: "#FFFFFF", exportar: true }) },
  },

  data() {
    return {
      chart: null,
      polygonSeries: null,
      nivelActual: "provincias",
      historialNavegacion: [],
    };
  },

  computed: {
    nombreNivelSuperior() { return this.nivelActual === "parroquias" ? "Cantón" : "Ecuador"; },
  },

  watch: {
    datos: {
      deep: true,
      handler() { if (this.chart && this.nivelActual === 'provincias') this.crearMapa(); }
    }
  },

  mounted() { this.crearMapa(); },
  beforeDestroy() { if (this.chart) this.chart.dispose(); },

  methods: {
    crearMapa() {
      if (this.chart) this.chart.dispose();

      let chart = am4core.create(this.$refs.chartdiv, am4maps.MapChart);
      chart.background.fillOpacity = 0;
      chart.projection = new am4maps.projections.Mercator();
      
      // AJUSTE CÁMARA (Centrado en el continente)
      chart.homeGeoPoint = { latitude: -1.5, longitude: -78.5 }; 
      chart.homeZoomLevel = 1.1;
      
      chart.panBehavior = "move"; 
      chart.chartContainer.wheelable = true; 

      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginBottom = 20; 
      chart.zoomControl.marginRight = 15;

      if (this.configuracion.exportar !== false) {
        chart.exporting.menu = new am4core.ExportMenu();
        chart.exporting.menu.align = "right";
        chart.exporting.menu.verticalAlign = "top";
      }

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      const featuresProcesados = this.procesarDatosCompleto(this.geoJsonProvincias, 'CODPRO');
      polygonSeries.data = featuresProcesados; 
      chart.geodata = { type: "FeatureCollection", features: featuresProcesados };

      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color(this.configuracion.colorDefecto);
      polygonTemplate.stroke = am4core.color(this.configuracion.colorBorde);
      polygonTemplate.strokeWidth = 1;
      polygonTemplate.propertyFields.fill = "colorHover";

      polygonSeries.tooltip.getFillFromObject = false;
      polygonSeries.tooltip.background.fill = am4core.color("#8E44AD");
      polygonSeries.tooltip.background.stroke = am4core.color("#FFFFFF");
      polygonSeries.tooltip.background.strokeWidth = 2;
      polygonSeries.tooltip.label.fill = am4core.color("#FFFFFF");

      polygonTemplate.tooltipHTML = `
        <div style="font-family: sans-serif; text-align: left; min-width: 150px; padding: 5px;">
          <div style="font-weight: bold; font-size: 14px; text-transform: uppercase; border-bottom: 1px solid rgba(255,255,255,0.4); margin-bottom: 4px;">
            {nombre_visual}
          </div>
          <div style="font-size: 12px; line-height: 1.4;">{tooltipPersonalizado}</div>
        </div>
      `;

      polygonTemplate.adapter.add("tooltipHTML", (text, target) => {
         if (!target.dataItem.dataContext.ganador && !target.dataItem.dataContext.tooltipPersonalizado) {
             return `<div style="text-align:center"><strong>{nombre_visual}</strong></div>`;
         }
         return text;
      });

      let hs = polygonTemplate.states.create("hover");
      hs.properties.stroke = am4core.color("#333");
      hs.properties.strokeWidth = 2;

      polygonTemplate.events.on("hit", this.manejarClick);

      this.polygonSeries = polygonSeries;
      this.chart = chart;
    },

    procesarDatosCompleto(geojsonOriginal, campoID) {
       if (!geojsonOriginal || !geojsonOriginal.features) return [];
       const features = JSON.parse(JSON.stringify(geojsonOriginal.features));
       
       return features.map(f => {
         if (f.properties && f.properties[campoID]) f.id = f.properties[campoID];
         f.properties.nombre_visual = f.properties.PROVINCIA || f.properties.CANTON || f.properties.PARROQUIA || f.properties.DPA_DESPRO;

         if (f.geometry) {
            const esGalapagos = (f.properties.CODPRO === "20" || f.properties.id === "20");
            
            // --- CORRECCIÓN FINAL DE POSICIÓN ---
            // shiftX: 6.5 (Acerca las islas a la izquierda de la costa, sin pegarlas demasiado)
            // shiftY: -2.5 (Las baja un poco respecto a su posición real, para alinearlas al centro visual)
            const shiftX = esGalapagos ? 6.5 : 0; 
            const shiftY = esGalapagos ? -0.5 : 0; 

            const procesarAnillo = (ring) => {
                return ring.reverse().map(coord => [coord[0] + shiftX, coord[1] + shiftY]);
            };

            if (f.geometry.type === "Polygon") {
                f.geometry.coordinates = f.geometry.coordinates.map(procesarAnillo);
            } else if (f.geometry.type === "MultiPolygon") {
                f.geometry.coordinates = f.geometry.coordinates.map(poly => poly.map(procesarAnillo));
            }
         }

         const datosVoto = this.datos.find(d => d.id === f.id);
         if (datosVoto) {
             f.colorHover = datosVoto.colorHover;
             f.ganador = datosVoto.ganador;
             f.votos = datosVoto.votos;
             f.tooltipPersonalizado = datosVoto.tooltipPersonalizado;
         } else {
             f.ganador = null;
             f.votos = "";
             f.tooltipPersonalizado = "Sin datos";
         }
         return f;
       });
    },

    manejarClick(ev) {
      const data = ev.target.dataItem.dataContext;
      const props = data.properties;

      if (this.nivelActual === "provincias") {
        const codPro = props.CODPRO; 
        const nombre = props.PROVINCIA;
        const cantonesDelSector = this.geoJsonCantones.features.filter(f => f.properties.CODPRO === codPro);
        const featuresListos = this.procesarDatosCompleto({ features: cantonesDelSector }, 'CODCAN');
        this.actualizarMapa(featuresListos, "cantones", `CANTONES DE ${nombre}`);
      } 
      else if (this.nivelActual === "cantones") {
        const codCan = props.CODCAN;
        const nombre = props.CANTON;
        const parrDelSector = this.geoJsonParroquias.features.filter(f => f.properties.CODCAN === codCan);
        const featuresListos = this.procesarDatosCompleto({ features: parrDelSector }, 'CODPAR');
        this.actualizarMapa(featuresListos, "parroquias", `PARROQUIAS DE ${nombre}`);
      }
    },

    actualizarMapa(features, nivel, titulo) {
        if (features.length === 0) return;
        this.historialNavegacion.push({
            geodata: this.chart.geodata,
            data: this.polygonSeries.data,
            nivel: this.nivelActual,
            zoomLevel: this.chart.zoomLevel,
            geoPoint: this.chart.zoomGeoPoint
        });
        this.chart.zoomToRectangle(this.polygonSeries.west, this.polygonSeries.east, this.polygonSeries.north, this.polygonSeries.south, 1, true);
        setTimeout(() => {
            const nuevoGeoJSON = { type: "FeatureCollection", features: features };
            this.chart.geodata = nuevoGeoJSON;
            this.polygonSeries.data = features;
            this.nivelActual = nivel;
            this.chart.validateData(); 
            this.chart.goHome(); 
        }, 600);
    },

    subirNivel() {
        if (this.historialNavegacion.length > 0) {
            const estadoAnterior = this.historialNavegacion.pop();
            this.chart.geodata = estadoAnterior.geodata;
            this.polygonSeries.data = estadoAnterior.data;
            this.nivelActual = estadoAnterior.nivel;
            this.chart.validateData();
            
            if (this.nivelActual === 'provincias') this.chart.goHome(); 
            else this.chart.goHome(); 
        }
    },

    resetMap() {
        if (this.nivelActual === 'provincias') {
            this.chart.goHome(); 
        } else {
            while(this.historialNavegacion.length > 0) {
                this.subirNivel();
            }
        }
    },

    navegarExternamente(nivelDestino, codigo, nombre) {
        if (nivelDestino === "provincias") {
             if (this.nivelActual !== 'provincias') this.resetMap();
             setTimeout(() => {
                 this.manejarClick({ target: { dataItem: { dataContext: { properties: { CODPRO: codigo, PROVINCIA: nombre } } } } });
             }, 600);
        }
    }
  },
};
</script>

<style scoped>
.wrapper-mapa { 
  position: relative; width: 100%; height: 600px; background: transparent; 
}
.contenedor-mapa { width: 100%; height: 100%; background: transparent; }

.boton-regresar {
  position: absolute; top: 20px; right: 20px; z-index: 10;
  background: white; padding: 8px 16px; border-radius: 20px; cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: bold; display: flex; align-items: center;
  color: #555; transition: all 0.3s;
  text-decoration: none !important;
}
.boton-regresar span { text-decoration: none !important; margin-left: 5px; }
.boton-regresar:hover { transform: translateY(-2px); color: #000; }

.boton-home {
  position: absolute;
  bottom: 90px; 
  right: 15px; 
  z-index: 50;
  width: 34px; height: 34px;
  background: #dcdee0; 
  border-radius: 0;
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: background 0.2s;
}
.boton-home:hover { background: #cfd1d3; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter, .fade-leave-to { opacity: 0; }

::v-deep .amcharts-export-menu ul { background: #ffffff; padding: 0; list-style: none; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); border-radius: 4px; }
::v-deep .amcharts-export-menu li { padding: 8px 16px; cursor: pointer; color: #333; }
::v-deep .amcharts-export-menu li:hover { background: #f5f5f5; color: #000; }
</style>