import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
// CAMBIO 1: Importamos 'mdi' en lugar de 'md'
import { aliases, mdi } from 'vuetify/iconsets/mdi' 

export default createVuetify({
  components,
  directives,
  icons: {
    defaultSet: 'mdi', // CAMBIO 2: Definimos 'mdi' como el set por defecto
    aliases,
    sets: {
      mdi, // CAMBIO 3: Registramos el set mdi
    },
  },
})