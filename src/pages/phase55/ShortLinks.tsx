import { useEffect, useMemo, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Col, DatePicker, Form, Input, Modal, Radio, Row, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import { CopyOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { type BusinessLine } from '../../types'
import { useSession } from '../../auth'
import { usePerm } from '../../perm'

type ShortLinkLine = BusinessLine | '菲律宾' | '阿联酋'

type ShortLink = {
  id: string
  line: ShortLinkLine
  name: string
  url: string
  domain: string
  alias: string
  tiny: string
  remark?: string
  creator: string
  createdAt: string
  expiresAt?: string
  unavailable?: boolean
}

const COUNTRY_DOMAINS: { line: ShortLinkLine; country: string; domain: string }[] = [
  { line: '马来', country: '马来西亚', domain: 'my.go.dinoai.ai' },
  { line: '印尼', country: '印度尼西亚', domain: 'id.go.dinoai.ai' },
  { line: '泰国', country: '泰国', domain: 'th.go.dinoai.ai' },
  { line: '新加坡', country: '新加坡', domain: 'sg.go.dinoai.ai' },
  { line: '越南', country: '越南', domain: 'vn.go.dinoai.ai' },
  { line: '韩国', country: '韩国', domain: 'kr.go.dinoai.ai' },
  { line: '沙特', country: '沙特阿拉伯', domain: 'sa.go.dinoai.ai' },
  { line: '菲律宾', country: '菲律宾', domain: 'ph.go.dinoai.ai' },
  { line: '阿联酋', country: '阿联酋', domain: 'ae.go.dinoai.ai' },
] as const
const domainForLine = (line: string) => COUNTRY_DOMAINS.find((item) => item.line === line)?.domain
const domainOptions = COUNTRY_DOMAINS.map((item) => ({ label: `${item.country} · ${item.domain}`, value: item.domain }))
const countryLines = COUNTRY_DOMAINS.map((item) => item.line)
const DEFAULT_DOMAIN = COUNTRY_DOMAINS[0].domain
const MAX_LINKS = 500
const INITIAL_USAGE = 486
const RESET_DATE = '2026-11-12'
const seed: ShortLink[] = [
  {
    id: 'sl-ksa',
    line: '沙特',
    name: 'KSA 体验课 9 月',
    url: 'https://www.dinoai.ai/ksa/trial',
    domain: 'sa.go.dinoai.ai',
    alias: 'ksa-trial',
    tiny: 'https://sa.go.dinoai.ai/ksa-trial',
    remark: '沙特体验课广告投放',
    creator: 'marketing@dinoai.ai',
    createdAt: '2026-09-23 14:20',
  },
  {
    id: 'sl-ksa-2',
    line: '沙特',
    name: 'KSA 社媒 10 月',
    url: 'https://www.dinoai.ai/ksa/social',
    domain: 'sa.go.dinoai.ai',
    alias: 'ksa-social',
    tiny: 'https://sa.go.dinoai.ai/ksa-social',
    remark: '10 月社媒活动',
    creator: 'admin@dinoai.ai',
    createdAt: '2026-10-02 11:05',
    expiresAt: '2026-10-31',
  },
  {
    id: 'sl-kr',
    line: '韩国',
    name: 'KR 体验课',
    url: 'https://www.dinoai.ai/kr/trial',
    domain: 'kr.go.dinoai.ai',
    alias: 'kr-trial',
    tiny: 'https://kr.go.dinoai.ai/kr-trial',
    remark: '韩国体验课',
    creator: 'growth.kr@dinoai.ai',
    createdAt: '2026-09-28 09:40',
  },
  {
    id: 'sl-kr-2',
    line: '韩国',
    name: 'KR 品牌周',
    url: 'https://www.dinoai.ai/kr/brand',
    domain: 'kr.go.dinoai.ai',
    alias: 'kr-brand',
    tiny: 'https://kr.go.dinoai.ai/kr-brand',
    remark: '品牌周活动',
    creator: 'admin@dinoai.ai',
    createdAt: '2026-10-06 16:12',
    unavailable: true,
  },
  {
    id: 'sl-vn',
    line: '越南',
    name: 'VN TikTok',
    url: 'https://www.dinoai.ai/vn/tiktok',
    domain: 'vn.go.dinoai.ai',
    alias: 'vn-tiktok',
    tiny: 'https://vn.go.dinoai.ai/vn-tiktok',
    remark: 'TikTok 投放',
    creator: 'ops.vn@dinoai.ai',
    createdAt: '2026-09-30 13:18',
  },
  {
    id: 'sl-vn-2',
    line: '越南',
    name: 'VN 体验课',
    url: 'https://www.dinoai.ai/vn/trial',
    domain: 'vn.go.dinoai.ai',
    alias: 'vn-trial',
    tiny: 'https://vn.go.dinoai.ai/vn-trial',
    remark: '越南体验课',
    creator: 'growth.kr@dinoai.ai',
    createdAt: '2026-10-01 10:02',
  },
]

export default function ShortLinks55() {
  const session = useSession()
  const { account, role } = usePerm()
  const me = (account?.email || session?.email || '').toLowerCase()
  // 角色决定能否进入模块；成员岗位决定进入后的短链数据范围。
  const canViewLine = !role || account?.shortLinkManager === true
  const lineOptions = useMemo(() => {
    if (!role || role.dataScope === 'all') return [...countryLines]
    const allowed = new Set(account?.businessLines ?? [])
    return countryLines.filter((item) => allowed.has(item as BusinessLine))
  }, [account?.businessLines, role])
  const [line, setLine] = useState<ShortLinkLine>(lineOptions.find((item) => seed.some((link) => link.line === item)) ?? lineOptions[0] ?? '沙特')
  const [links, setLinks] = useState<ShortLink[]>(seed)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<ShortLink | null>(null)
  const [saving, setSaving] = useState(false)
  const [usage, setUsage] = useState(INITIAL_USAGE)
  const [draftFilters, setDraftFilters] = useState({ name: '', creator: undefined as string | undefined, domain: undefined as string | undefined, status: undefined as string | undefined })
  const [filters, setFilters] = useState(draftFilters)
  const [form] = Form.useForm()
  const expiryMode = Form.useWatch('expiryMode', form)
  const domainReady = !!domainForLine(line)

  useEffect(() => {
    if (!lineOptions.includes(line)) setLine(lineOptions[0] ?? '沙特')
  }, [line, lineOptions])

  const permittedRows = useMemo(
    () => links.filter((item) => item.line === line && (canViewLine || item.creator.toLowerCase() === me)),
    [links, line, canViewLine, me],
  )

  const statusOf = (link: ShortLink) => {
    if (link.unavailable) return 'unavailable'
    if (!link.expiresAt) return 'permanent'
    return dayjs(link.expiresAt).isBefore(dayjs()) ? 'expired' : 'active'
  }

  const rows = useMemo(() => permittedRows
    .filter((item) => !filters.name || item.name.toLowerCase().includes(filters.name.trim().toLowerCase()))
    .filter((item) => !filters.creator || item.creator === filters.creator)
    .filter((item) => !filters.domain || item.domain === filters.domain)
    .filter((item) => !filters.status || statusOf(item) === filters.status)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [permittedRows, filters])

  const creatorOptions = useMemo(() => [...new Set(permittedRows.map((item) => item.creator))]
    .map((value) => ({ label: value, value })), [permittedRows])

  const startCreating = () => {
    if (usage >= MAX_LINKS) {
      message.warning(`本周期短链创建额度已用完，将于 ${RESET_DATE} 重置`)
      return
    }
    setEditing(null)
    form.setFieldsValue({ domain: domainForLine(line) ?? DEFAULT_DOMAIN, expiryMode: 'permanent', remark: '' })
    setCreating(true)
  }

  const closeForm = () => {
    setCreating(false)
    setEditing(null)
    form.resetFields()
  }

  const startEditing = (link: ShortLink) => {
    setEditing(link)
    form.setFieldsValue({
      name: link.name,
      url: link.url,
      domain: link.domain,
      remark: link.remark,
      expiryMode: link.expiresAt ? 'scheduled' : 'permanent',
      expiresAt: link.expiresAt ? dayjs(link.expiresAt) : undefined,
    })
    setCreating(true)
  }

  const deleteLink = (link: ShortLink) => {
    Modal.confirm({
      title: '删除短链',
      content: `确认删除「${link.name}」？删除后不可恢复。`,
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        setLinks((current) => current.filter((item) => item.id !== link.id))
        message.success('短链已删除')
      },
    })
  }

  const copyLink = async (link: ShortLink) => {
    await navigator.clipboard.writeText(link.tiny)
    message.success('短链已复制')
  }

  const columns: ColumnsType<ShortLink> = [
    {
      title: '短链名称',
      dataIndex: 'name',
      width: 170,
      ellipsis: { showTitle: false },
      render: (value: string) => <Tooltip title={value}>{value}</Tooltip>,
    },
    { title: '短链', dataIndex: 'tiny', width: 230, ellipsis: { showTitle: false }, render: (value: string) => <Tooltip title={value}>{value}</Tooltip> },
    { title: '原始链接', dataIndex: 'url', width: 260, ellipsis: { showTitle: false }, render: (value: string) => <Tooltip title={value}>{value}</Tooltip> },
    { title: '域名', dataIndex: 'domain', width: 150 },
    { title: '备注', dataIndex: 'remark', width: 180, ellipsis: { showTitle: false }, render: (value?: string) => value ? <Tooltip title={value}>{value}</Tooltip> : '—' },
    { title: '创建人', dataIndex: 'creator', width: 210, ellipsis: true },
    { title: '业务线', dataIndex: 'line', width: 90 },
    { title: '创建时间', dataIndex: 'createdAt', width: 160 },
    { title: '过期时间', dataIndex: 'expiresAt', width: 150, render: (value?: string) => value || '永久有效' },
    {
      title: '状态',
      key: 'status',
      width: 120,
      render: (_, row) => {
        const status = statusOf(row)
        const config = {
          active: { color: 'success', text: '生效中' },
          expired: { color: 'default', text: '已过期' },
          permanent: { color: 'blue', text: '永久有效' },
          unavailable: { color: 'error', text: '第三方不可用' },
        }[status]
        return <Tag color={config.color}>{config.text}</Tag>
      },
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 230,
      render: (_, row) => {
        const disabled = ['expired', 'unavailable'].includes(statusOf(row))
        return (
          <Space size={0}>
            <Button type="link" icon={<CopyOutlined />} disabled={disabled} onClick={() => copyLink(row)}>复制</Button>
            <Button type="link" icon={<EditOutlined />} onClick={() => startEditing(row)}>编辑</Button>
            <Button type="link" danger icon={<DeleteOutlined />} onClick={() => deleteLink(row)}>删除</Button>
          </Space>
        )
      },
    },
  ]

  const save = async () => {
    const values = await form.validateFields()
    if (!domainReady || (!editing && usage >= MAX_LINKS)) return
    setSaving(true)
    window.setTimeout(() => {
      const expiresAt = values.expiryMode === 'scheduled' ? values.expiresAt?.format('YYYY-MM-DD HH:mm:ss') : undefined
      if (editing) {
        setLinks((current) => current.map((item) => item.id === editing.id ? {
          ...item,
          name: values.name.trim(),
          url: values.url.trim(),
          domain: values.domain,
          tiny: `https://${values.domain}/${item.alias}`,
          remark: values.remark?.trim(),
          expiresAt,
        } : item))
        setSaving(false)
        closeForm()
        message.success('短链已更新')
        return
      }
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const finalAlias = Math.random().toString(36).slice(2, 8)
      setLinks((current) => [{
        id: `sl-${Date.now()}`,
        line,
        name: values.name.trim(),
        url: values.url.trim(),
        domain: values.domain,
        alias: finalAlias,
        tiny: `https://${values.domain}/${finalAlias}`,
        remark: values.remark?.trim(),
        creator: account?.email || session?.email || '当前成员',
        createdAt,
        expiresAt,
      }, ...current])
      setUsage((value) => value + 1)
      setSaving(false)
      closeForm()
      message.success('短链已创建，平台用量已刷新')
    }, 400)
  }

  if (creating) {
    return (
      <Card className="page-card" bordered={false}>
        <Breadcrumb style={{ marginBottom: 20 }} items={[
          { title: '营销中心' },
          { title: <a onClick={closeForm}>短链管理</a> },
          { title: editing ? '编辑短链' : '新建短链' },
        ]} />
        <Typography.Title level={4}>{editing ? '编辑短链' : '新建短链'}</Typography.Title>
        <Alert type="info" showIcon message={`TinyURL 本周期已使用 ${usage} / ${MAX_LINKS}，${RESET_DATE} 重置`} style={{ marginBottom: 20 }} />
        <Form form={form} layout="vertical" style={{ maxWidth: 720 }} onFinish={save}>
          <Form.Item name="name" label="短链名称" rules={[{ required: true, message: '请填写短链名称' }, { max: 50, message: '最多 50 个字符' }]}>
            <Input maxLength={50} showCount placeholder="例如：KSA 体验课 11 月投放" />
          </Form.Item>
          <Form.Item name="url" label="原始链接" rules={[
            { required: true, message: '请填写原始链接' },
            { max: 2048, message: '最多 2048 个字符' },
            { validator: (_, value) => {
              try {
                const parsed = new URL(value)
                return ['http:', 'https:'].includes(parsed.protocol) && !/\s/.test(value)
                  ? Promise.resolve()
                  : Promise.reject(new Error('仅支持完整的 http:// 或 https:// 链接'))
              } catch {
                return Promise.reject(new Error('仅支持完整的 http:// 或 https:// 链接'))
              }
            } },
          ]}>
            <Input placeholder="https://www.dinoai.ai/..." />
          </Form.Item>
          <Form.Item name="domain" label="域名" rules={[{ required: true, message: '请选择域名' }]} extra="按所选业务线自动回显对应域名；支持九个国家的 Active 子域名">
            <Select disabled options={domainOptions} />
          </Form.Item>
          <Form.Item name="remark" label="备注" rules={[{ max: 200, message: '最多 200 个字符' }]}>
            <Input.TextArea rows={3} maxLength={200} showCount placeholder="填写该短链的用途或投放说明" />
          </Form.Item>
          <Form.Item name="expiryMode" label="有效期">
            <Radio.Group>
              <Radio value="permanent">永久有效</Radio>
              <Radio value="scheduled">指定过期时间</Radio>
            </Radio.Group>
          </Form.Item>
          {expiryMode === 'scheduled' && (
            <Form.Item name="expiresAt" rules={[{ required: true, message: '请选择过期时间' }]}>
              <DatePicker showTime style={{ width: '100%' }} disabledDate={(date) => date.endOf('day').isBefore(dayjs())} placeholder="按当前业务线时区选择" />
            </Form.Item>
          )}
          <Row gutter={16}>
            <Col span={12}><Form.Item label="业务线"><Input value={line} disabled /></Form.Item></Col>
            <Col span={12}><Form.Item label="创建人"><Input value={account?.email || session?.email || '当前成员'} disabled /></Form.Item></Col>
          </Row>
          <Alert type="warning" showIcon message="第三方创建成功后即占用本周期额度；提交中请勿重复操作。" style={{ marginBottom: 20 }} />
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>{editing ? '保存修改' : '创建短链'}</Button>
            <Button onClick={closeForm}>取消</Button>
          </Space>
        </Form>
      </Card>
    )
  }

  return (
    <Card className="page-card" bordered={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>短链管理</div>
          <Typography.Text type="secondary">{canViewLine ? '当前岗位可查看本业务线全部短链' : 'CC 岗位仅可查看本人创建的短链'}</Typography.Text>
        </div>
        <Tooltip title={usage >= MAX_LINKS ? `本周期短链创建额度已用完，将于 ${RESET_DATE} 重置` : undefined}>
          <Button type="primary" icon={<PlusOutlined />} disabled={!domainReady || usage >= MAX_LINKS} onClick={startCreating}>新建短链</Button>
        </Tooltip>
      </div>
      <Card size="small" style={{ marginTop: 16, background: '#fafafa' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12} xl={6}><Input value={draftFilters.name} maxLength={50} placeholder="短链名称（模糊搜索）" onChange={(e) => setDraftFilters({ ...draftFilters, name: e.target.value })} /></Col>
          <Col xs={24} md={12} xl={6}><Select allowClear style={{ width: '100%' }} value={draftFilters.creator} placeholder="创建人" options={creatorOptions} onChange={(creator) => setDraftFilters({ ...draftFilters, creator })} /></Col>
          <Col xs={24} md={12} xl={6}><Select allowClear style={{ width: '100%' }} value={draftFilters.domain} placeholder="域名" options={domainOptions} onChange={(domain) => setDraftFilters({ ...draftFilters, domain })} /></Col>
          <Col xs={24} md={12} xl={6}><Select allowClear style={{ width: '100%' }} value={draftFilters.status} placeholder="有效状态" options={[
            { label: '全部', value: '' }, { label: '生效中', value: 'active' }, { label: '已过期', value: 'expired' }, { label: '永久有效', value: 'permanent' },
          ]} onChange={(status) => setDraftFilters({ ...draftFilters, status })} /></Col>
          <Col xs={24} xl={12}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => setFilters({ ...draftFilters })}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                const empty = { name: '', creator: undefined, domain: undefined, status: undefined }
                setDraftFilters(empty)
                setFilters(empty)
              }}>重置</Button>
            </Space>
          </Col>
        </Row>
      </Card>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '16px 0 12px' }}>
        <Space>
          <Typography.Text strong>TinyURL 本周期用量：已使用 {usage} / {MAX_LINKS}</Typography.Text>
          <Typography.Text type="secondary">重置时间 {RESET_DATE}</Typography.Text>
        </Space>
        <Space><span>当前业务线</span><Select style={{ width: 140 }} value={line} onChange={setLine} options={lineOptions.map((item) => ({ label: item, value: item }))} /></Space>
      </div>
      {!domainReady && <Alert type="warning" showIcon message="该业务线暂无 Active 品牌域名，暂不可新建短链。" style={{ marginBottom: 12 }} />}
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        pagination={{ defaultPageSize: 20, pageSizeOptions: [20, 50, 100], showSizeChanger: true, showTotal: (n) => `共 ${n} 条` }}
        scroll={{ x: 1850 }}
      />
    </Card>
  )
}
