import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Button, Card, Checkbox, Dropdown, Form, Input, InputNumber, Modal, Space, Table, Tabs, Tag, Typography, message } from 'antd'
import { DownloadOutlined, DownOutlined, PhoneOutlined, StarFilled, StarOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../../store'
import { isClaimedLead, isPoolLead } from '../../funnel'
import type { CallRecord, SalesAppointment, Student } from '../../types'

type TabKey = 'pool' | 'follow' | 'paid' | 'calls'

function Mark55({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      {children}
      <Tag color="blue" style={{ margin: 0, lineHeight: '16px', fontSize: 11, padding: '0 4px' }}>5.5</Tag>
    </span>
  )
}

function currentBooked(student: Student) {
  return (student.salesAppointments ?? []).find((item) => item.appointmentStatus === '已预约' && item.attendanceStatus === '待标记' && item.consultationStatus === '待标记')
}

function latestCompleted(student: Student) {
  return [...(student.salesAppointments ?? [])].reverse().find((item) => item.appointmentStatus === '已预约' && item.attendanceStatus === '已出勤' && item.consultationStatus === '已完成')
}

function downloadRows(filename: string, headers: string[], rows: (string | number)[][]) {
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export default function Sales55() {
  const navigate = useNavigate()
  const students = useStore((s) => s.students)
  const lessons = useStore((s) => s.lessons ?? [])
  const calls = useStore((s) => s.callRecords ?? [])
  const [tab, setTab] = useState<TabKey>('follow')
  const [keyword, setKeyword] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)
  const [minCalls, setMinCalls] = useState<number | null>(null)
  const [favorites, setFavorites] = useState<Record<string, boolean>>({})
  const [released, setReleased] = useState<Record<string, boolean>>({})
  const [appointments, setAppointments] = useState<Record<string, SalesAppointment[]>>({})
  const [reschedule, setReschedule] = useState(false)
  const seeded = useRef(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [selectedCalls, setSelectedCalls] = useState<React.Key[]>([])
  const [form] = Form.useForm()

  useEffect(() => {
    if (seeded.current) return
    const claimed = students.filter((student) => isClaimedLead(student, lessons) && student.status !== '付费' && student.paymentStatusStr !== '已付费')
    if (claimed.length < 2) return
    seeded.current = true
    const booked: SalesAppointment = { appointmentId: 'demo-booked', scheduledStartAt: '2026-11-17 00:00', timezone: 'UTC+07:00', meetingLink: 'https://meet.example.com/dino-trial', appointmentStatus: '已预约', attendanceStatus: '待标记', consultationStatus: '待标记', createdBy: 'demo', createdAt: '2026-11-01 10:00' }
    const completed: SalesAppointment = { appointmentId: 'demo-done', scheduledStartAt: '2026-10-19 01:00:00 UTC+08:00', timezone: 'UTC+08:00', meetingLink: 'https://meet.example.com/dino-done', appointmentStatus: '已预约', attendanceStatus: '已出勤', consultationStatus: '已完成', createdBy: 'demo', createdAt: '2026-10-19 01:00' }
    setAppointments({ [claimed[0].studentId]: [booked], [claimed[1].studentId]: [completed] })
  }, [students, lessons])

  const appointmentsOf = (student: Student) => appointments[student.studentId] ?? student.salesAppointments ?? []
  const withAppointments = (student: Student): Student => ({ ...student, salesAppointments: appointmentsOf(student) })
  const callCount = useMemo(() => {
    const counts = new Map<string, number>()
    calls.forEach((call) => counts.set(call.studentId, (counts.get(call.studentId) || 0) + 1))
    return counts
  }, [calls])

  const matchKeyword = (student: Student) => {
    if (!keyword.trim()) return true
    const text = `${student.studentId} ${student.name} ${student.localName || ''} ${student.account || ''}`.toLowerCase()
    return text.includes(keyword.trim().toLowerCase())
  }
  const matchCalls = (student: Student) => minCalls == null || (callCount.get(student.studentId) || 0) >= minCalls

  const pool = students.filter((student) => (isPoolLead(student, lessons) || released[student.studentId]) && matchKeyword(student) && matchCalls(student))
  const follow = students.filter((student) => isClaimedLead(student, lessons) && !released[student.studentId] && student.status !== '付费' && student.paymentStatusStr !== '已付费' && matchKeyword(student) && matchCalls(student) && (!onlyFav || favorites[student.studentId]))
  const paid = students.filter((student) => (student.status === '付费' || student.paymentStatusStr === '已付费') && matchKeyword(student) && matchCalls(student) && (!onlyFav || favorites[student.studentId]))

  const toggleFav = (id: string) => setFavorites((current) => ({ ...current, [id]: !current[id] }))
  const star = (id: string) => (
    <Button type="text" icon={favorites[id] ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: '#c0c4cc' }} />} onClick={() => toggleFav(id)} />
  )

  const leadColumns = (withStar: boolean): ColumnsType<Student> => [
    { title: '用户ID', dataIndex: 'studentId', width: 190, render: (id: string) => <Button type="link" style={{ padding: 0 }} onClick={() => navigate(`/sales-v55/${id}`)}>{id}</Button> },
    { title: '学生姓名', width: 140, render: (_, row) => row.localName || row.name },
    ...(withStar ? [{ title: <Mark55>收藏</Mark55>, width: 90, render: (_: unknown, row: Student) => star(row.studentId) }] : []),
    { title: <Mark55>通话次数</Mark55>, width: 120, render: (_, row) => callCount.get(row.studentId) || 0 },
    { title: '国家', width: 90, render: (_, row) => row.country || row.businessLine },
    ...(tab === 'pool' ? [] : [{ title: <Mark55>销售预约时间</Mark55>, width: 230, render: (_: unknown, row: Student) => {
      const student = withAppointments(row)
      const appointment = currentBooked(student) || latestCompleted(student)
      return appointment ? appointment.scheduledStartAt : '—'
    } }]),
    { title: '当前跟进阶段', width: 140, render: (_, row) => {
      const student = withAppointments(row)
      if (currentBooked(student)) return <Tag color="blue">已预约</Tag>
      if (latestCompleted(student)) return <Tag color="purple">咨询已完成</Tag>
      return <Tag>待外呼</Tag>
    } },
    ...(tab !== 'pool' ? [{
      title: '操作',
      width: 160,
      render: (_: unknown, row: Student) => (
        <Space>
          <Button type="link" icon={<PhoneOutlined />}>拨号</Button>
          <Dropdown menu={{ items: [
            { key: 'follow', label: '更新跟进', onClick: () => openFollow(row) },
            { key: 'drop', label: '退回公海', onClick: () => { setReleased((current) => ({ ...current, [row.studentId]: true })); setFavorites((current) => ({ ...current, [row.studentId]: false })) } },
          ] }}>
            <Button>更多 <DownOutlined /></Button>
          </Dropdown>
        </Space>
      ),
    }] : []),
  ]

  const callRows = calls.filter((call) => {
    if (!keyword.trim()) return true
    return `${call.studentId} ${call.customer} ${call.phone}`.toLowerCase().includes(keyword.trim().toLowerCase())
  })

  const summaryOf = (call: CallRecord) => {
    const student = students.find((item) => item.studentId === call.studentId)
    return student?.salesHistory?.find((item) => item.aiSummary)?.aiSummary || ''
  }

  const callColumns: ColumnsType<CallRecord> = [
    { title: '起呼时间', dataIndex: 'time', width: 180 },
    { title: '用户ID', dataIndex: 'studentId', width: 180 },
    { title: '姓名', dataIndex: 'customer', width: 120 },
    { title: '手机号', dataIndex: 'phone', width: 140 },
    { title: '通话结果', dataIndex: 'result', width: 110, render: (value) => <Tag>{value}</Tag> },
    { title: '时长', dataIndex: 'duration', width: 80 },
    {
      title: '录音',
      width: 120,
      render: (_, row) => {
        const available = row.recordingStatus === 'available' || !!row.audioUrl
        if (row.recordingStatus === 'unavailable') return <Typography.Text type="secondary">暂不可下载</Typography.Text>
        if (!available || row.recordingStatus === 'pending') return <Typography.Text type="secondary">同步中</Typography.Text>
        return <Mark55><Button type="link" style={{ padding: 0 }} onClick={() => message.success('已开始下载这一通录音')}>下载录音</Button></Mark55>
      },
    },
    { title: '本次跟进记录', dataIndex: 'note', ellipsis: true, render: (value) => value || '—' },
    { title: <Mark55>AI 小结</Mark55>, width: 280, render: (_, row) => summaryOf(row) || <Typography.Text type="secondary">—</Typography.Text> },
  ]

  function openFollow(student: Student) {
    const current = withAppointments(student)
    const booked = currentBooked(current)
    const completed = latestCompleted(current)
    const shown = booked || completed
    setReschedule(false)
    form.setFieldsValue({
      time: shown?.scheduledStartAt || '',
      link: shown?.meetingLink || '',
      note: '',
    })
    setEditing(current)
  }

  const saveFollow = async () => {
    if (!editing) return
    const values = await form.validateFields()
    const link = (values.link || '').trim()
    if (link && !link.startsWith('https://')) {
      message.error('会议链接只接受 https 链接')
      return
    }
    const completed = latestCompleted(editing)
    const booked = currentBooked(editing)
    if (booked && reschedule) {
      const created: SalesAppointment = { ...booked, appointmentId: `new-${Date.now()}`, scheduledStartAt: values.time, meetingLink: link, appointmentStatus: '已预约', attendanceStatus: '待标记', consultationStatus: '待标记' }
      setAppointments((current) => ({
        ...current,
        [editing.studentId]: [created, ...appointmentsOf(editing).map((item) => item.appointmentId === booked.appointmentId ? { ...item, appointmentStatus: '已改期' as const } : item)],
      }))
      message.success('已创建新预约')
    } else if (completed && !booked) {
      const next = { ...completed, scheduledStartAt: values.time, meetingLink: link }
      setAppointments((current) => ({
        ...current,
        [editing.studentId]: appointmentsOf(editing).map((item) => item.appointmentId === completed.appointmentId ? next : item),
      }))
      message.success('已保存，阶段仍是咨询已完成')
    } else {
      message.success('已保存跟进')
    }
    setEditing(null)
  }

  const exportLeads = () => {
    const rows = tab === 'pool' ? pool : tab === 'follow' ? follow : paid
    downloadRows(`销售中心-${tab}.csv`, ['用户ID', '学生姓名', '通话次数', '国家'], rows.map((row) => [row.studentId, row.localName || row.name, callCount.get(row.studentId) || 0, row.country || row.businessLine]))
    message.success('数据下载已开始')
  }

  const exportCalls = () => {
    const source = selectedCalls.length ? callRows.filter((row) => selectedCalls.includes(row.id)) : callRows
    downloadRows('通话记录.csv', ['起呼时间', '用户ID', '姓名', '通话结果', '时长', '本次跟进记录', 'AI 小结'], source.map((row) => [row.time, row.studentId, row.customer, row.result, row.duration, row.note || '', summaryOf(row)]))
    message.success(selectedCalls.length ? `已导出选中的 ${source.length} 行列表字段` : '已导出当前筛选下的列表')
  }

  const editingBooked = editing ? currentBooked(editing) : undefined
  const editingCompleted = editing && !editingBooked ? latestCompleted(editing) : undefined

  return (
    <Card className="page-card" bordered={false} title={<span className="section-title">销售中心</span>}>
      <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>蓝色 5.5 是本版改动：通话次数、收藏、咨询已完成后的预约时间和会议链接、录音下载、本通 AI 小结、勾选导出。</Typography.Paragraph>
      <Tabs activeKey={tab} onChange={(key) => { setTab(key as TabKey); setSelectedCalls([]) }} items={[
        { key: 'pool', label: `公海 (${pool.length})` },
        { key: 'follow', label: `我的跟进 (${follow.length})` },
        { key: 'paid', label: `已付费 (${paid.length})` },
        { key: 'calls', label: `通话记录 (${callRows.length})` },
      ]} />
      <Space wrap style={{ marginBottom: 16 }}>
        <Input allowClear placeholder={tab === 'calls' ? '搜索用户ID / 姓名 / 登录账号' : '搜索手机号 / 用户ID / 姓名'} style={{ width: 280 }} value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        {tab !== 'calls' && <Mark55><InputNumber min={0} precision={0} placeholder="通话次数 ≥" value={minCalls} onChange={(value) => setMinCalls(typeof value === 'number' ? value : null)} /></Mark55>}
        {tab !== 'pool' && tab !== 'calls' && <Mark55><Checkbox checked={onlyFav} onChange={(e) => setOnlyFav(e.target.checked)}>只看收藏</Checkbox></Mark55>}
        <Button onClick={() => { setKeyword(''); setMinCalls(null); setOnlyFav(false) }}>重置筛选</Button>
        {tab === 'calls' ? <Mark55><Button icon={<DownloadOutlined />} onClick={exportCalls}>下载数据</Button></Mark55> : <Button icon={<DownloadOutlined />} onClick={exportLeads}>下载数据</Button>}
      </Space>
      {tab === 'calls' ? (
        <Table rowKey="id" columns={callColumns} dataSource={callRows} rowSelection={{ selectedRowKeys: selectedCalls, onChange: setSelectedCalls }} scroll={{ x: 1400 }} pagination={{ showTotal: (n) => `共 ${n} 条` }} />
      ) : (
        <Table rowKey="studentId" columns={leadColumns(tab !== 'pool')} dataSource={tab === 'pool' ? pool : tab === 'follow' ? follow : paid} scroll={{ x: 1100 }} pagination={{ showTotal: (n) => `共 ${n} 条` }} />
      )}
      <Modal open={!!editing} title="更新跟进" okText="保存" cancelText="取消" onCancel={() => setEditing(null)} onOk={saveFollow} destroyOnClose width={640}>
        {editing && (
          <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
            <Space size={24} style={{ marginBottom: 12 }}>
              <span>手机号 <Input value={editing.phone || '—'} disabled style={{ width: 180 }} /></span>
              <span>领取销售 <Input value={editing.salesOwner || '—'} disabled style={{ width: 220 }} /></span>
            </Space>
            <div style={{ marginBottom: 12 }}>当前跟进阶段 {editingBooked ? <Tag color="blue">已预约</Tag> : editingCompleted ? <Tag color="purple">咨询已完成</Tag> : <Tag>待外呼</Tag>}</div>
            {editingBooked && !reschedule && (
              <>
                <Typography.Paragraph><Mark55>当前预约</Mark55>：{editingBooked.scheduledStartAt} {editingBooked.timezone}</Typography.Paragraph>
                <Typography.Paragraph><Mark55>会议链接</Mark55>：{editingBooked.meetingLink || '—'}</Typography.Paragraph>
                <Button style={{ marginBottom: 16 }} onClick={() => { setReschedule(true); form.setFieldsValue({ time: '', link: '' }) }}>改期并创建新预约</Button>
              </>
            )}
            {editingBooked && reschedule && (
              <>
                <Form.Item name="time" label="新预约时间" rules={[{ required: true, message: '请填写新预约时间' }]}><Input /></Form.Item>
                <Form.Item name="link" label={<Mark55>会议链接</Mark55>}><Input placeholder="https://" /></Form.Item>
              </>
            )}
            {editingCompleted && (
              <>
                <Form.Item name="time" label={<Mark55>预约时间</Mark55>} rules={[{ required: true, message: '请填写预约时间' }]}><Input /></Form.Item>
                <Form.Item name="link" label={<Mark55>会议链接</Mark55>}><Input placeholder="https://" /></Form.Item>
              </>
            )}
            <Form.Item name="note" label="本次跟进说明" rules={[{ required: true, message: '请填写本次跟进说明' }]}>
              <Input.TextArea rows={3} maxLength={500} showCount placeholder="记录沟通细节、家长反馈、下一步安排等" />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </Card>
  )
}
