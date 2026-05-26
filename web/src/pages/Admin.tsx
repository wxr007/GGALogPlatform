import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Button, Input, Space, Card, message, Popconfirm, Tag } from 'antd'
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { adminService } from '../services/admin.service'

const Admin = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })
  const [search, setSearch] = useState('')

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const params: any = {
        page: pagination.current,
        limit: pagination.pageSize
      }
      if (search) {
        params.search = search
      }
      const response = await adminService.getUsers(params)
      setUsers(response.data.users)
      setPagination(prev => ({
        ...prev,
        total: response.data.pagination.total
      }))
    } catch (error) {
      console.error('Failed to load users:', error)
    } finally {
      setLoading(false)
    }
  }, [pagination.current, pagination.pageSize, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleSetAdmin = async (id: string, isAdmin: boolean) => {
    try {
      await adminService.setAdmin(id, isAdmin)
      message.success(isAdmin ? '已设置为管理员' : '已取消管理员权限')
      loadUsers()
    } catch (error: any) {
      message.error(error.response?.data?.error?.message || '操作失败')
    }
  }

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }))
    loadUsers()
  }

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (username: string, record: any) => (
        <Button type="link" onClick={() => navigate(`/admin/users/${record.id}/datasets`)}>
          {username}
        </Button>
      )
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (phone: string) => phone || '-'
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        isActive ? <Tag color="green">正常</Tag> : <Tag color="red">已禁用</Tag>
      )
    },
    {
      title: '数据集数量',
      dataIndex: 'datasetCount',
      key: 'datasetCount'
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '最后登录',
      dataIndex: 'lastLoginAt',
      key: 'lastLoginAt',
      render: (date: string) => date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '管理员',
      dataIndex: 'isAdmin',
      key: 'isAdmin',
      render: (isAdmin: boolean) => (
        isAdmin ? <Tag color="orange">管理员</Tag> : <Tag>普通用户</Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Popconfirm
          title={record.isAdmin ? '确定取消该用户的管理员权限？' : '确定将该用户设置为管理员？'}
          onConfirm={() => handleSetAdmin(record.id, !record.isAdmin)}
        >
          <Button type="link" size="small">
            {record.isAdmin ? '取消管理员' : '设为管理员'}
          </Button>
        </Popconfirm>
      )
    }
  ]

  return (
    <div>
      <Card title="用户管理" extra={
        <Button icon={<ReloadOutlined />} onClick={loadUsers}>刷新</Button>
      }>
        <Space style={{ marginBottom: 16 }}>
          <Input
            placeholder="搜索用户名或邮箱"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 250 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch}>
            搜索
          </Button>
        </Space>
        <Table
          columns={columns}
          dataSource={users}
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
    </div>
  )
}

export default Admin
