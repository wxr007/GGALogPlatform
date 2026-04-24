import { useState, useEffect } from 'react'
import { Card, Row, Col, Statistic, Table, Spin, Upload, Button, message } from 'antd'
import { DatabaseOutlined, FileTextOutlined, HddOutlined, CalendarOutlined, UploadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { dataService } from '../services/data.service'

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [uploading, setUploading] = useState(false)

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

  const handleUpload = async (file: any) => {
    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('dateTime', new Date().toISOString())
      
      const response = await fetch('/api/data/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      })
      
      const result = await response.json()
      if (result.success) {
        message.success('文件上传成功')
        loadStats() // 重新加载统计数据
      } else {
        message.error(`上传失败: ${result.error.message}`)
      }
    } catch (error) {
      console.error('上传失败:', error)
      message.error('上传失败，请稍后重试')
    } finally {
      setUploading(false)
    }
    return false // 阻止自动上传
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <h2>数据概览</h2>
        <Upload
          beforeUpload={handleUpload}
          showUploadList={false}
          maxCount={1}
        >
          <Button
            type="primary"
            icon={<UploadOutlined />}
            loading={uploading}
          >
            上传文件
          </Button>
        </Upload>
      </Row>
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
