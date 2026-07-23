export interface GGAPoint {
  type: string;
  utc_time: string;
  latitude: number;
  longitude: number;
  quality: number;
  num_sats: number;
  hdop: number;
  altitude: number;
  geoid_height: number;
  age: number;
  station_id: string;
}

export function parseGGA(nmea: string): GGAPoint | null {
  nmea = nmea.trim();
  if (!nmea.includes('GGA')) {
    return null;
  }
  const parts = nmea.split(',');
  if (parts.length < 15) {
    return null;
  }

  const utc_time = parts[1];
  let latitude = parseFloat(parts[2]);
  const lat_ns = parts[3];
  let longitude = parseFloat(parts[4]);
  const lon_ew = parts[5];
  const quality = parseInt(parts[6]);
  const num_sats = parseInt(parts[7]);
  const hdop = parseFloat(parts[8]);
  const altitude = parseFloat(parts[9]);
  const geoid_height = parseFloat(parts[11]);
  const age = parseFloat(parts[13]);
  const station_id = parts[14];

  if (utc_time === '' || isNaN(latitude) || isNaN(longitude)) {
    return null;
  }

  function dmm2deg(d: number, m: number) {
    return d + m / 60;
  }

  latitude = dmm2deg(Math.floor(latitude / 100), latitude % 100);
  longitude = dmm2deg(Math.floor(longitude / 100), longitude % 100);

  return {
    type: parts[0],
    utc_time,
    latitude: lat_ns === 'N' ? latitude : -latitude,
    longitude: lon_ew === 'E' ? longitude : -longitude,
    quality,
    num_sats,
    hdop,
    altitude,
    geoid_height,
    age,
    station_id,
  };
}

export function parseGGAData(content: string): GGAPoint[] {
  const lines = content.split('\n');
  const points: GGAPoint[] = [];

  for (const line of lines) {
    if (line.includes('GGA')) {
      const point = parseGGA(line);
      if (point) {
        points.push(point);
      }
    }
  }

  return points;
}

export function getQualityColor(quality: number): string {
  switch (quality) {
    case 0: return '#bfbfbf';   // 无效定位 - 浅灰
    case 1: return '#ff4d4f';   // 单点定位 - 红色
    case 2: return '#722ed1';   // 差分定位 - 紫色
    case 4: return '#52c41a';   // RTK固定解 - 绿色
    case 5: return '#fa8c16';   // RTK浮点解 - 橙色
    case 6: return '#1890ff';   // 惯导推算 - 蓝色
    default: return '#8c8c8c';  // 其他 - 灰色
  }
}

export function getQualityLabel(quality: number): string {
  switch (quality) {
    case 0: return '无效定位';
    case 1: return '单点定位';
    case 2: return '差分定位';
    case 4: return 'RTK固定解';
    case 5: return 'RTK浮点解';
    case 6: return '惯导推算';
    default: return '未知';
  }
}
