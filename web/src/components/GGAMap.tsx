import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Card, Tag, Space, Statistic, Row, Col, Select } from 'antd';
import { GGAPoint, getQualityColor, getQualityLabel } from '../utils/nmea';
import { tileProviders, defaultTileIndex } from '../config/map';

import 'leaflet/dist/leaflet.css';

// 修复 Leaflet 默认图标问题
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface GGAMapProps {
  points: GGAPoint[];
}

// 创建带颜色的圆形图标
function createCircleIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: '',
    html: `<div style="
      width: 12px; height: 12px;
      background: ${color};
      border: 2px solid #fff;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

// 强制地图重新计算尺寸
function InvalidateSize() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

function FitBounds({ points }: { points: GGAPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(
        points.map(p => [p.latitude, p.longitude] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [points, map]);
  return null;
}

function SetCenter({ points }: { points: GGAPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) {
      map.setView([points[0].latitude, points[0].longitude], 16);
    }
  }, [points, map]);
  return null;
}

const GGAMap = ({ points }: GGAMapProps) => {
  const [selectedPoint, setSelectedPoint] = useState<GGAPoint | null>(null);
  const [tileIndex, setTileIndex] = useState(defaultTileIndex);

  const currentProvider = tileProviders[tileIndex];

  const center: [number, number] = useMemo(() => {
    if (points.length === 1) {
      return [points[0].latitude, points[0].longitude];
    }
    return [34.0, 108.0];
  }, [points]);

  const qualityStats = useMemo(() => {
    const stats: Record<number, number> = {};
    points.forEach(p => {
      stats[p.quality] = (stats[p.quality] || 0) + 1;
    });
    return stats;
  }, [points]);

  const trackLine: [number, number][] = useMemo(
    () => points.map(p => [p.latitude, p.longitude]),
    [points]
  );

  return (
    <Card
      title="轨迹地图"
      extra={
        <Space>
          <Select
            value={tileIndex}
            onChange={setTileIndex}
            style={{ width: 130 }}
            size="small"
            options={tileProviders.map((p, i) => ({ label: p.name, value: i }))}
          />
          总点数: <Tag color="blue">{points.length}</Tag>
        </Space>
      }
    >
      {/* 质量统计 */}
      {Object.keys(qualityStats).length > 0 && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          {Object.entries(qualityStats).map(([q, count]) => (
            <Col key={q}>
              <Statistic
                title={getQualityLabel(Number(q))}
                value={count}
                valueStyle={{ color: getQualityColor(Number(q)), fontSize: 20 }}
              />
            </Col>
          ))}
        </Row>
      )}

      <div style={{ height: '500px', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer
          center={center}
          zoom={5}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <InvalidateSize />
          <TileLayer
            key={currentProvider.url}
            attribution={currentProvider.attribution}
            url={currentProvider.url}
            subdomains={currentProvider.subdomains?.length ? currentProvider.subdomains : undefined}
          />

          <FitBounds points={points} />
          <SetCenter points={points} />

          {trackLine.length > 1 && (
            <Polyline
              positions={trackLine}
              pathOptions={{ color: '#1890ff', weight: 3, opacity: 0.7 }}
            />
          )}

          {points.map((point, index) => (
            <Marker
              key={index}
              position={[point.latitude, point.longitude]}
              icon={createCircleIcon(getQualityColor(point.quality))}
              eventHandlers={{
                click: () => setSelectedPoint(point),
              }}
            >
              <Popup>
                <div style={{ fontSize: 13, lineHeight: 1.8 }}>
                  <div><b>时间:</b> {point.utc_time}</div>
                  <div><b>纬度:</b> {point.latitude.toFixed(6)}</div>
                  <div><b>经度:</b> {point.longitude.toFixed(6)}</div>
                  <div>
                    <b>质量:</b>{' '}
                    <Tag color={getQualityColor(point.quality)}>
                      {getQualityLabel(point.quality)}
                    </Tag>
                  </div>
                  <div><b>卫星数:</b> {point.num_sats}</div>
                  <div><b>海拔:</b> {point.altitude.toFixed(2)} m</div>
                  <div><b>HDOP:</b> {point.hdop.toFixed(2)}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {points.length === 0 && (
        <div style={{ textAlign: 'center', padding: '12px 0 0', color: '#999' }}>
          未能解析到有效的 GGA 数据点
        </div>
      )}

      {selectedPoint && (
        <Card
          size="small"
          title="选中点详情"
          style={{ marginTop: 16 }}
          extra={
            <a onClick={() => setSelectedPoint(null)}>关闭</a>
          }
        >
          <Row gutter={16}>
            <Col span={6}><b>UTC时间:</b> {selectedPoint.utc_time}</Col>
            <Col span={6}><b>纬度:</b> {selectedPoint.latitude.toFixed(6)}</Col>
            <Col span={6}><b>经度:</b> {selectedPoint.longitude.toFixed(6)}</Col>
            <Col span={6}>
              <b>质量:</b>{' '}
              <Tag color={getQualityColor(selectedPoint.quality)}>
                {getQualityLabel(selectedPoint.quality)}
              </Tag>
            </Col>
            <Col span={6}><b>卫星数:</b> {selectedPoint.num_sats}</Col>
            <Col span={6}><b>海拔:</b> {selectedPoint.altitude.toFixed(2)} m</Col>
            <Col span={6}><b>HDOP:</b> {selectedPoint.hdop.toFixed(2)}</Col>
          </Row>
        </Card>
      )}
    </Card>
  );
};

export default GGAMap;
