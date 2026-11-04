import { useMemo, useState } from 'react'
import { Button, Card, DatePicker, Form, Input, Modal, Space, Table, Tag, message } from 'antd'
import { DownloadOutlined, DownOutlined, SearchOutlined } from '@ant-design/icons'
import { Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { completedLessons } from '../../lessons'
import type { Student } from '../../types'
import { useI18n } from '../../i18n'

export default function Users55() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const students = useStore((s) => s.students)
  const lessons = useStore((s) => s.lessons ?? [])
  const [keyword, setKeyword] = useState('')
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>(null)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form] = Form.useForm()

  const data = useMemo(() => students.filter((student) => {
    const text = `${student.studentId} ${student.name} ${student.localName || ''} ${student.account || ''}`.toLowerCase()
    if (keyword && !text.includes(keyword.trim().toLowerCase())) return false
    if (!range) return true
    const time = dayjs(student.registerTime)
    return !time.isBefore(range[0], 'day') && !time.isAfter(range[1], 'day')
  }), [students, keyword, range])

  const exportUsers = () => {
    if (data.length > 10000) {
      message.error(t('v55.user.exportTooMany'))
      return
    }
    message.success(t('v55.user.exported', { n: data.length }))
  }

  const columns: ColumnsType<Student> = [
    { title: t('user.col.id'), dataIndex: 'studentId', width: 200, render: (id: string) => <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/users-v55/${id}`)}>{id}</Button> },
    { title: t('user.col.name'), width: 140, render: (_, row) => row.localName || row.name },
    { title: t('user.col.status'), dataIndex: 'status', width: 140, render: (value) => <Tag>{t(`enum.status.${value}`)}</Tag> },
    { title: t('user.col.country'), width: 100, render: (_, row) => row.country || row.businessLine },
    { title: t('user.col.account'), dataIndex: 'account', width: 180 },
    { title: t('user.col.regTime'), dataIndex: 'registerTime', width: 180 },
    {
      title: t('common.action'),
      width: 120,
      render: (_, row) => (
        <Dropdown menu={{ items: [{ key: 'edit', label: t('v55.user.editInfo'), onClick: () => { setEditing(row); form.setFieldsValue({ name: row.localName || row.name }) } }] }}>
          <Button>{t('common.action')} <DownOutlined /></Button>
        </Dropdown>
      ),
    },
  ]

  const completed = editing ? completedLessons(lessons, editing.studentId).length : 0

  return (
    <Card className="page-card" bordered={false} title={<span className="section-title">{t('app.nav.users')}</span>}>
      <Space wrap style={{ marginBottom: 16 }}>
        <Input allowClear prefix={<SearchOutlined />} placeholder={t('v55.user.search')} style={{ width: 280 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        <DatePicker.RangePicker value={range} onChange={(value) => setRange(value && value[0] && value[1] ? [value[0], value[1]] : null)} placeholder={[t('v55.user.dateStart'), t('v55.user.dateEnd')]} />
        <Button onClick={() => { setKeyword(''); setRange(null) }}>{t('v55.resetFilters')}</Button>
        <Button icon={<DownloadOutlined />} onClick={exportUsers}>{t('v55.user.export')}</Button>
      </Space>
      <Table rowKey="studentId" columns={columns} dataSource={data} pagination={{ showTotal: (n) => t('common.total', { n }), showSizeChanger: true }} />
      <Modal
        open={!!editing}
        title={t('v55.user.editTitle', { id: editing?.studentId || '' })}
        okText={t('common.save')}
        cancelText={t('common.cancel')}
        onCancel={() => setEditing(null)}
        onOk={async () => {
          await form.validateFields()
          message.success(t('v55.user.saved'))
          setEditing(null)
        }}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
          <Form.Item name="name" label={t('user.col.name')} rules={[{ required: true, message: t('v55.user.nameRequired') }]}><Input /></Form.Item>
          <Form.Item label={t('v55.user.completedLessons')}><Input value={String(completed)} disabled /></Form.Item>
          <Form.Item label={t('v55.user.availableLessons')}><Input value="—" disabled /></Form.Item>
          <Form.Item label={t('v55.user.studyDuration')}><Input value="—" disabled /></Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
