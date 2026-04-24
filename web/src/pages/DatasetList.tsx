import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, DatePicker, Space, Card, Popconfirm, message } from 'antd'
import { EyeOutlined, DownloadOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { dataService } from '../services/data.service'

const { RangePicker } = DatePicker

const DatasetList = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [datasets, setDatasets] = useState([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [dateRange, setDateRange] = useState<[any, any] | null>(null)

  useEffect(() => {
    loadDatasets()
  }, [pagination.current, pagination.pageSize, dateRange])

  const loadDatasets = async () => {
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
      const response = await dataService.getDatasets(params)
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
  }

  const handleDownload = async (id: string, fileName: string) => {
    try {
      await dataService.downloadDataset(id, fileName)
    } catch (error) {
      console.error('Failed to download:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await dataService.deleteDataset(id)
      message.success('删除成功')
      loadDatasets()
    } catch (error) {
      console.error('Failed to delete:', error)
      message.error('删除失败')
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
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
      render: (size: number) => formatSize(size)
    },
    {
      title: '上传时间',
      dataIndex: 'uploadTime',
      key: 'uploadTime',
      render: (time: string) => dayjs(time).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/datasets/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownload(record.id, record.fileName)}
          >
            下载
          </Button>
          <Popconfirm
            title="确定删除此数据集？"
            description="删除后无法恢复"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <RangePicker
            value={dateRange}
            onChange={(dates) => {
              setDateRange(dates as [any, any] | null)
              setPagination(prev => ({ ...prev, current: 1 }))
            }}
          />
          <Button icon={<ReloadOutlined />} onClick={loadDatasets}>
            刷新
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={datasets}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            onChange: (page, pageSize) => {
              setPagination(prev => ({
                ...prev,
                current: page,
                pageSize: pageSize || 20
              }))
            }
          }}
        />
      </Card>
    </div>
  )
}

export default DatasetList
