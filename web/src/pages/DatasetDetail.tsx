import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, message } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { dataService } from '../services/data.service'

const DatasetDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dataset, setDataset] = useState<any>(null)

  useEffect(() => {
    loadDataset()
  }, [id])

  const loadDataset = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await dataService.getDatasetDetail(id)
      setDataset(response.data)
    } catch (error) {
      message.error('加载数据失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!dataset) return
    try {
      await dataService.downloadDataset(dataset.id, dataset.fileName)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
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

  if (!dataset) {
    return <div>数据不存在</div>
  }

  return (
    <div>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/datasets')}
        style={{ marginBottom: 16 }}
      >
        返回数据集列表
      </Button>

      <Card title="数据详情" extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载文件
        </Button>
      }>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="文件名">{dataset.fileName}</Descriptions.Item>
          <Descriptions.Item label="文件大小">{formatSize(dataset.fileSize)}</Descriptions.Item>
          <Descriptions.Item label="数据时间">{dayjs(dataset.date).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="记录数">{dataset.recordCount}</Descriptions.Item>
          <Descriptions.Item label="上传时间">{dayjs(dataset.uploadTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="设备ID">{dataset.deviceInfo?.deviceId || '-'}</Descriptions.Item>
          <Descriptions.Item label="设备型号">{dataset.deviceInfo?.model || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="数据预览" style={{ marginTop: 16 }}>
        <pre style={{ background: '#f5f5f5', padding: 16, borderRadius: 4, maxHeight: 400, overflow: 'auto' }}>
          {dataset.preview || '无预览数据'}
        </pre>
      </Card>
    </div>
  )
}

export default DatasetDetail
