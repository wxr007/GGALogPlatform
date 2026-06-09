import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Table, Card, Button, DatePicker, Space, Spin, message } from 'antd'
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
  }, [id, pagination.current, pagination.pageSize, dateRange])

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

  const columns = [
    {
      title: '文件名',
      dataIndex: 'fileName',
      key: 'fileName'
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
