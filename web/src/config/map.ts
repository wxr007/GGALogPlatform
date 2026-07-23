export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
  offset: boolean; // 是否需要WGS-84 -> GCJ-02坐标偏移
}

export const tileProviders: TileProvider[] = [
  {
    name: '高德地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://www.amap.com">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
    offset: true,
  },
  {
    name: '高德卫星',
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://www.amap.com">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
    offset: true,
  },
  {
    name: 'Google 街道',
    url: 'https://www.google.cn/maps/vt?lyrs=m@189&gl=cn&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    offset: true,
  },
  {
    name: 'Google 卫星',
    url: 'https://www.google.cn/maps/vt?lyrs=s@189&gl=cn&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    offset: false,
  },
  {
    name: 'Google 混合',
    url: 'https://www.google.cn/maps/vt?lyrs=y@189&gl=cn&x={x}&y={y}&z={z}',
    attribution: '&copy; Google',
    offset: false,
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: ['a', 'b', 'c'],
    offset: false,
  },
];

export const defaultTileIndex = 0; // 默认高德地图
