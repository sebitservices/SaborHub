# SABORHUB

Sistema de gestión para restaurantes que permite administrar menús, pedidos e inventario.

## 🚀 Características

- Gestión de menú digital
- Sistema de modificadores para productos
- Control de inventario y recetas
- Interfaz responsiva y moderna
- Sistema de pedidos en tiempo real
- Gestión de mesas y comandas

## 🛠️ Tecnologías

- React + Vite
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- FontAwesome Icons

## 📋 Requisitos Previos

- Node.js (v14 o superior)
- npm o yarn
- Cuenta de Firebase

## 🔧 Instalación

1. Clona el repositorio
```bash
git clone <tu-repositorio>
cd SABORHUB
```

2. Instala las dependencias
```bash
npm install
# o
yarn install
```

3. Configura las variables de entorno
```bash
cp .env.example .env
```
Edita el archivo `.env` con tus credenciales de Firebase

4. Inicia el servidor de desarrollo
```bash
npm run dev
# o
yarn dev
```

## 📦 Estructura del Proyecto

```
SABORHUB/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── pages/         # Páginas de la aplicación
│   ├── context/       # Contextos de React
│   ├── firebase/      # Configuración de Firebase
│   ├── utils/         # Utilidades y helpers
│   └── assets/        # Recursos estáticos
```

## 🔄 Comandos para Actualizar el Repositorio

```bash
# Verificar cambios pendientes
git status

# Añadir todos los cambios
git add .

# Crear commit con los cambios
git commit -m "descripción de los cambios"

# Subir cambios al repositorio remoto
git push origin master
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE.md](LICENSE.md) para más detalles.

## ✨ Contribuir

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request hacia la rama `master` 