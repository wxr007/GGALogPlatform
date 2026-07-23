export interface TileProvider {
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
}

export const tileProviders: TileProvider[] = [
  {
    name: '高德地图',
    url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://www.amap.com">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
  },
  {
    name: '高德卫星',
    url: 'https://webst0{s}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}',
    attribution: '&copy; <a href="https://www.amap.com">高德地图</a>',
    subdomains: ['1', '2', '3', '4'],
  },
  {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    subdomains: [],
  },
];

export const defaultTileIndex = 0; // 默认高德地图
