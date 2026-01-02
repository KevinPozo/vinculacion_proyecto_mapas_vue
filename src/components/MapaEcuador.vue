<template>
  <div class="wrapper-mapa">
    
    <transition name="fade">
      <div v-if="nivelActual !== 'provincias'" class="boton-regresar" @click="subirNivel">
        <v-icon left small>mdi-arrow-left</v-icon>
        Regresar a {{ nombreNivelSuperior }}
      </div>
    </transition>

    <div class="contenedor-mapa" ref="chartdiv"></div>

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
    configuracion: {
      type: Object,
      default: () => ({
        colorDefecto: "#D9D9D9",
        colorBorde: "#FFFFFF",
        exportar: true
      }),
    },
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
    nombreNivelSuperior() {
      return this.nivelActual === "parroquias" ? "Cantón" : "Ecuador";
    },
  },

  mounted() {
    this.crearMapa();
  },

  beforeDestroy() {
    if (this.chart) this.chart.dispose();
  },

  methods: {
    crearMapa() {
      if (this.chart) this.chart.dispose();

      let chart = am4core.create(this.$refs.chartdiv, am4maps.MapChart);
      chart.projection = new am4maps.projections.Mercator();
      chart.chartContainer.wheelable = true; 

      chart.zoomControl = new am4maps.ZoomControl();
      chart.zoomControl.align = "right";
      chart.zoomControl.valign = "bottom";
      chart.zoomControl.marginBottom = 10;
      chart.zoomControl.marginRight = 10;

      if (this.configuracion.exportar !== false) {
        chart.exporting.menu = new am4core.ExportMenu();
        chart.exporting.menu.align = "right";
        chart.exporting.menu.verticalAlign = "top";
      }

      let polygonSeries = chart.series.push(new am4maps.MapPolygonSeries());
      polygonSeries.useGeodata = true;
      polygonSeries.calculateVisualCenter = true;

      // 1. CARGA INICIAL
      const featuresProcesados = this.procesarDatosCompleto(this.geoJsonProvincias, 'CODPRO');
      polygonSeries.data = featuresProcesados; 
      chart.geodata = { type: "FeatureCollection", features: featuresProcesados };

      // 2. ESTILOS
      let polygonTemplate = polygonSeries.mapPolygons.template;
      polygonTemplate.fill = am4core.color(this.configuracion.colorDefecto);
      polygonTemplate.stroke = am4core.color(this.configuracion.colorBorde);
      polygonTemplate.strokeWidth = 1;

      // Bindings
      polygonTemplate.propertyFields.fill = "colorHover";

      // 3. TOOLTIP LIMPIO (HTML DISEÑADO AQUÍ)
      // Usamos las variables que inyectamos en procesarDatosCompleto
      polygonSeries.tooltip.getFillFromObject = false;
      polygonSeries.tooltip.background.fill = am4core.color("#2c3e50"); // Fondo oscuro elegante
      polygonSeries.tooltip.background.stroke = am4core.color("#FFFFFF");
      polygonSeries.tooltip.background.strokeWidth = 1;
      polygonSeries.tooltip.label.fill = am4core.color("#FFFFFF");
      polygonSeries.tooltip.label.padding(5, 5, 5, 5);

      // Si no hay ganador, mostramos "Sin datos"
      // El {nombre_visual} cubre Provincia, Canton o Parroquia según nivel
      polygonTemplate.tooltipHTML = `
        <div style="font-family: 'Open Sans', sans-serif; text-align: center; min-width: 130px;">
          <h3 style="margin: 0 0 5px 0; border-bottom: 1px solid rgba(255,255,255,0.3); font-size: 14px; text-transform: uppercase;">
            {nombre_visual}
          </h3>
          <div style="font-size: 12px; line-height: 1.5;">
            <div>Ganador: <strong>{ganador}</strong></div>
            <div>Votos: {votos}</div>
          </div>
        </div>
      `;

      // Adaptador para ocultar tooltip si no hay nombre (limpieza visual)
      polygonTemplate.adapter.add("tooltipHTML", (text, target) => {
         if (!target.dataItem.dataContext.ganador) {
             return `
              <div style="font-family: sans-serif; text-align: center;">
                 <strong>{nombre_visual}</strong><br>
                 <span style="font-size:11px; color:#ccc">Sin resultados</span>
              </div>`;
         }
         return text;
      });

      let hs = polygonTemplate.states.create("hover");
      hs.properties.stroke = am4core.color("#333");
      hs.properties.strokeWidth = 2;

      polygonTemplate.events.on("hit", this.manejarClick);

      this.polygonSeries = polygonSeries;
      this.chart = chart;
      
      chart.events.on("ready", () => { chart.goHome(); });
    },

    procesarDatosCompleto(geojsonOriginal, campoID) {
       if (!geojsonOriginal || !geojsonOriginal.features) return [];
       const features = JSON.parse(JSON.stringify(geojsonOriginal.features));
       
       return features.map(f => {
         // Corrección geometría
         if (f.geometry) {
            if (f.geometry.type === "Polygon") {
                f.geometry.coordinates.forEach(ring => ring.reverse());
            } else if (f.geometry.type === "MultiPolygon") {
                f.geometry.coordinates.forEach(poly => poly.forEach(ring => ring.reverse()));
            }
         }

         // Asignación de ID
         if (f.properties && f.properties[campoID]) {
             f.id = f.properties[campoID];
         }

         // Nombre visual unificado
         f.properties.nombre_visual = f.properties.PROVINCIA || f.properties.CANTON || f.properties.PARROQUIA || f.properties.DPA_DESPRO;

         // Inyección de Datos (Colores)
         const datosVoto = this.datos.find(d => d.id === f.id);
         if (datosVoto) {
             f.colorHover = datosVoto.colorHover;
             f.ganador = datosVoto.ganador;
             f.votos = datosVoto.votos;
         } else {
             f.ganador = null; // Marcamos como null para el adaptador del tooltip
             f.votos = "";
         }

         return f;
       });
    },

    manejarClick(ev) {
      const data = ev.target.dataItem.dataContext;
      const props = data.properties;

      // Pasamos info al padre si se necesita (opcional)
      // this.$emit('zona-click', props);

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
        const featuresListos = this.procesarDatosCompleto({ features: parrDelSector }, 'CODPAR'); // Una R

        this.actualizarMapa(featuresListos, "parroquias", `PARROQUIAS DE ${nombre}`);
      }
    },

    // Método para ser llamado desde el PADRE (Buscador)
    navegarExternamente(nivelDestino, codigo, nombre, codigoPadre = null) {
        if (nivelDestino === "provincias") {
             // Simular click en provincia
             const mockProps = { CODPRO: codigo, PROVINCIA: nombre };
             // Llamamos a la lógica interna de drill-down
             // Ojo: necesitamos estar en nivel provincias. Si no, reseteamos primero.
             if (this.nivelActual !== 'provincias') this.subirNivel(); 
             
             // Pequeño hack para esperar el reset
             setTimeout(() => {
                 this.manejarClick({ target: { dataItem: { dataContext: { properties: mockProps } } } });
             }, 500);
        }
        else if (nivelDestino === "cantones") {
             // Primero entramos a la provincia
             // Esto requiere lógica más compleja de encadenamiento.
             // Por simplicidad, haremos zoom directo al canton si ya estamos en la provincia,
             // o alertaremos si estamos lejos. 
             // Para esta demo: Solo soportamos búsqueda de provincia para navegación fluida.
             alert("Buscando " + nombre);
        }
    },

    actualizarMapa(features, nivel, titulo) {
        if (features.length === 0) return;

        // GUARDAMOS EN HISTORIAL NO SOLO GEODATA, SINO TAMBIÉN 'DATA' (COLORES)
        this.historialNavegacion.push({
            geodata: this.chart.geodata,
            data: this.polygonSeries.data, // <--- CLAVE PARA RECUPERAR COLORES
            nivel: this.nivelActual,
        });

        this.chart.zoomToRectangle(
            this.polygonSeries.west, this.polygonSeries.east,
            this.polygonSeries.north, this.polygonSeries.south,
            1, true
        );

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
            
            // RESTAURAMOS TODO
            this.chart.geodata = estadoAnterior.geodata;
            this.polygonSeries.data = estadoAnterior.data; // <--- RESTAURAMOS COLORES
            this.nivelActual = estadoAnterior.nivel;
            
            this.chart.validateData();
            this.chart.goHome();
        }
    }
  },
};
</script>

<style scoped>
.wrapper-mapa { position: relative; width: 100%; height: 500px; }
.contenedor-mapa { width: 100%; height: 100%; }

.boton-regresar {
  position: absolute; top: 20px; right: 20px; z-index: 10;
  background: white; padding: 8px 16px; border-radius: 20px; cursor: pointer;
  box-shadow: 0 4px 6px rgba(0,0,0,0.1); font-weight: bold; display: flex; align-items: center;
  color: #555; transition: all 0.3s;
}
.boton-regresar:hover { transform: translateY(-2px); color: #000; }
.fade-enter-active, .fade-leave-active { transition: opacity 0.5s; }
.fade-enter, .fade-leave-to { opacity: 0; }
</style>