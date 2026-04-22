import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Spin } from 'antd'
import { DatabaseOutlined, FileTextOutlined, HddOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { dataService } from '../services/data.service'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await dataService.getStats()
      setStats(response.data)
    } catch (error) {
      console.error('Failed to load stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName'
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => formatSize(size)
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    }
  ]

  return (
    <div>
      <h2>数据概览</h2>
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="数据集总数"
              value={stats?.totalDatasets || 0}
              prefix={<DatabaseOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="记录总数"
              value={stats?.totalRecords || 0}
              prefix={<FileTextOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="存储大小"
              value={formatSize(stats?.totalSize || 0)}
              prefix={<HddOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="最新数据"
              value={stats?.dateRange?.latest ? dayjs(stats.dateRange.latest).format('YYYY-MM-DD') : '无'}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Card title="最近上传" style={{ marginTop: 24 }}>
        <Table
          columns={columns}
          dataSource={stats?.recentUploads || []}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  )
}

export default Dashboard
