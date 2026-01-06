import { createRouter, createWebHistory } from "vue-router";

import PaginaResultadosExtranjero from "@/views/PaginaResultadosExtranjero.vue";
import PaginaResultadoNacional from "@/views/PaginaResultadosNacional.vue";
const routes = [
  {
    path: "/",
    name: "Home",
    component: PaginaResultadoNacional,
  },
  {
    path: "/extranjero",
    name: "Extranjero",
    component: PaginaResultadosExtranjero,
  },

];
const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});
export default router;
