import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Descriptions, Button, Spin, message, Input, Select } from 'antd'
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { adminService } from '../services/admin.service'
import { parseGGAData } from '../utils/nmea'
import GGAMap from '../components/GGAMap'

const AdminDatasetDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [dataset, setDataset] = useState<any>(null)
  const [updatingType, setUpdatingType] = useState(false)

  const ggaPoints = useMemo(() => {
    if (dataset?.preview && dataset?.fileType === 'RawRover') {
      return parseGGAData(dataset.preview)
    }
    return []
  }, [dataset])

  useEffect(() => {
    loadDataset()
  }, [id])

  const loadDataset = async () => {
    if (!id) return
    try {
      setLoading(true)
      const response = await adminService.getDatasetDetail(id)
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
      await adminService.downloadDataset(dataset.id, dataset.fileName)
      message.success('下载成功')
    } catch (error) {
      message.error('下载失败')
    }
  }

  const handleUpdateFileType = async (newType: string) => {
    if (!dataset) return
    try {
      setUpdatingType(true)
      await adminService.updateDatasetFileType(dataset.id, newType)
      setDataset((prev: any) => ({ ...prev, fileType: newType }))
      message.success('文件类型已更新')
    } catch (error) {
      message.error('更新文件类型失败')
    } finally {
      setUpdatingType(false)
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
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      {dataset.fileType === 'RawRover' && (
        <GGAMap points={ggaPoints} />
      )}

      <Card title="数据详情（管理员视图）" extra={
        <Button type="primary" icon={<DownloadOutlined />} onClick={handleDownload}>
          下载文件
        </Button>
      }>
        <Descriptions column={2} bordered>
          <Descriptions.Item label="文件名">{dataset.fileName}</Descriptions.Item>
          <Descriptions.Item label="文件大小">{formatSize(dataset.fileSize)}</Descriptions.Item>
          <Descriptions.Item label="数据时间">{dayjs(dataset.date).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="记录数">{dataset.recordCount}</Descriptions.Item>
          <Descriptions.Item label="文件类型">
            <Select
              value={dataset.fileType}
              onChange={handleUpdateFileType}
              loading={updatingType}
              style={{ width: 140 }}
              options={[
                { label: 'RawRover', value: 'RawRover' },
                { label: 'RawBase', value: 'RawBase' },
                { label: 'LogRover', value: 'LogRover' },
                { label: 'LogBase', value: 'LogBase' }
              ]}
            />
          </Descriptions.Item>
          <Descriptions.Item label="上传时间">{dayjs(dataset.uploadTime).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
          <Descriptions.Item label="设备ID">{dataset.deviceInfo?.deviceId || '-'}</Descriptions.Item>
          <Descriptions.Item label="设备型号">{dataset.deviceInfo?.model || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="数据预览" style={{ marginTop: 16 }}>
        <Input.TextArea
          value={dataset.preview || '无预览数据'}
          readOnly
          autoSize={{ minRows: 10, maxRows: 30 }}
          style={{ fontFamily: 'monospace', fontSize: 13, background: '#f5f5f5' }}
        />
      </Card>
    </div>
  )
}

export default AdminDatasetDetail
