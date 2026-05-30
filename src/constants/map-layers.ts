export type MapLayer = {
  name: string;
  url: string;
  attribution: string;
};

const MAP_LAYERS: MapLayer[] = [

  {
    name: "Google Maps",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
  },
  {
    name: "Bản đồ mượt mà (Stadia)",
    url: "https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a>'
  },
  // {
  //   name: "Bản đồ Cứu hộ",
  //   url: "https://mt1.google.com/vt/lyrs=m&apistyle=s.t:8|p.v:off&x={x}&y={y}&z={z}",
  //   //url: "https://mt1.google.com/vt/lyrs=h&x={x}&y={y}&z={z}",
  //   //url: "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
  //   attribution: "&copy; OpenStreetMap",

  // },

  {
    name: "Vệ tinh",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
  },
];

export default MAP_LAYERS;
