import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table, Card, Button, DatePicker, Space, Spin, message, Select, Tag } from 'antd'
import { ArrowLeftOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { adminService } from '../services/admin.service'

const { RangePicker } = DatePicker

const AdminUserDatasets = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [datasets, setDatasets] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)
  const [fileType, setFileType] = useState<string | undefined>(undefined)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const fileTypeColors: Record<string, string> = {
    RawRover: 'blue',
    RawBase: 'green',
    LogRover: 'orange',
    LogBase: 'purple'
  }

  const fileTypeOptions = [
    { label: 'RawRover', value: 'RawRover' },
    { label: 'RawBase', value: 'RawBase' },
    { label: 'LogRover', value: 'LogRover' },
    { label: 'LogBase', value: 'LogBase' }
  ]

  const loadDatasets = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize
      }
      if (dateRange) {
        params.startDate = dateRange[0].format('YYYY-MM-DD')
        params.endDate = dateRange[1].format('YYYY-MM-DD')
      }
      if (fileType) {
        params.fileType = fileType
      }
      const response = await adminService.getUserDatasets(id, params)
      setUser(response.data.user)
      setDatasets(response.data.datasets)
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }))
    } catch (error) {
      console.error('Failed to load datasets:', error)
    } finally {
      setLoading(false)
    }
  }, [id, pagination.current, pagination.pageSize, dateRange, fileType])

  useEffect(() => {
    loadDatasets()
  }, [loadDatasets])

  const handleDownload = async (dataset: any) => {
    try {
      await adminService.downloadDataset(dataset.id, dataset.fileName)
    } catch (error) {
      message.error('下载失败')
    }
  }

  const handleUpdateFileType = async (datasetId: string, newType: string) => {
    try {
      setUpdatingId(datasetId)
      await adminService.updateDatasetFileType(datasetId, newType)
      setDatasets(prev =>
        prev.map(d => d.id === datasetId ? { ...d, fileType: newType } : d)
      )
      message.success('文件类型已更新')
    } catch (error) {
      message.error('更新文件类型失败')
    } finally {
      setUpdatingId(null)
    }
  }

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName'
    },
    {
      title: '文件类型',
      dataIndex: 'fileType',
      key: 'fileType',
      render: (type: string, record: any) => (
        <Select
          value={type}
          loading={updatingId === record.id}
          style={{ width: 140 }}
          size="small"
          onChange={(value) => handleUpdateFileType(record.id, value)}
          options={fileTypeOptions}
          optionRender={(option) => (
            <Tag color={fileTypeColors[option.value as string]}>{option.label}</Tag>
          )}
          labelRender={(props) => (
            <Tag color={fileTypeColors[props.value as string]}>{props.label}</Tag>
          )}
        />
      )
    },
    {
      title: '数据时间',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '记录数',
      dataIndex: 'recordCount',
      key: 'recordCount'
    },
    {
      title: '文件大小',
      dataIndex: 'fileSize',
      key: 'fileSize',
      render: (size: number) => {
        if (size < 1024) return `${size} B`
        if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
        return `${(size / 1024 / 1024).toFixed(2)} MB`
      }
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/datasets/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ]

  return (
    <Spin spinning={loading && !user}>
      <Card
        title={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin')}>
              返回用户列表
            </Button>
            <span>
              {user ? `${user.username} (${user.email})` : '加载中...'} 的数据集
            </span>
          </Space>
        }
      >
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            onChange={(dates) => {
              setDateRange(dates ? [dates[0], dates[1]] : null)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
          />
          <Select
            placeholder="文件类型"
            style={{ width: 150 }}
            allowClear
            value={fileType}
            onChange={(value) => {
              setFileType(value)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
            options={fileTypeOptions}
            optionRender={(option) => (
              <Tag color={fileTypeColors[option.value as string]}>{option.label}</Tag>
            )}
          />
        </Space>
        <Table
          columns={columns}
          dataSource={datasets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: pagination.current,
            pageSize: pagination.pageSize,
            total: pagination.total,
            showSizeChanger: true,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, current: page, pageSize }))
            }
          }}
        />
      </Card>
    </Spin>
  )
}

export default AdminUserDatasets
