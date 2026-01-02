import { createRouter, createWebHistory } from "vue-router";

// Tu vista original
import PaginaResultadosExtranjero from "@/views/PaginaResultadosExtranjero.vue";

// 1. IMPORTAMOS LA NUEVA VISTA DE ECUADOR
import PaginaResultadosEcuador from "@/views/PaginaResultadosEcuador.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: PaginaResultadosExtranjero,
  },
  {
    path: "/extranjero",
    name: "Extranjero",
    component: PaginaResultadosExtranjero,
  },
  // 2. AGREGAMOS LA NUEVA RUTA
  {
    path: "/ecuador",
    name: "Ecuador",
    component: PaginaResultadosEcuador,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;