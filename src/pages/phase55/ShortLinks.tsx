import { useEffect, useMemo, useState } from 'react'
import { Alert, Breadcrumb, Button, Card, Col, DatePicker, Form, Input, Radio, Row, Select, Space, Table, Tag, Tooltip, Typography, message } from 'antd'
import { CopyOutlined, PlusOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { BUSINESS_LINES, type BusinessLine } from '../../types'
import { useSession } from '../../auth'
import { usePerm } from '../../perm'

type ShortLink = {
  id: string
  line: BusinessLine
  name: string
  url: string
  domain: string
  alias: string
  tiny: string
  creator: string
  createdAt: string
  expiresAt?: string
  unavailable?: boolean
}

const DOMAIN = 'go.dinoai.ai'
const MAX_LINKS = 500
const INITIAL_USAGE = 486
const RESET_DATE = '2026-11-12'
const READY_LINES = new Set<BusinessLine>(BUSINESS_LINES.filter((line) => line !== '其他'))

const seed: ShortLink[] = [
  {
    id: 'sl-ksa',
    line: '沙特',
    name: 'KSA 体验课 9 月',
    url: 'https://www.dinoai.ai/ksa/trial',
    domain: DOMAIN,
    alias: 'ksa-trial',
    tiny: `https://${DOMAIN}/ksa-trial`,
    creator: 'marketing@dinoai.ai',
    createdAt: '2026-09-23 14:20',
  },
  {
    id: 'sl-ksa-2',
    line: '沙特',
    name: 'KSA 社媒 10 月',
    url: 'https://www.dinoai.ai/ksa/social',
    domain: DOMAIN,
    alias: 'ksa-social',
    tiny: `https://${DOMAIN}/ksa-social`,
    creator: 'admin@dinoai.ai',
    createdAt: '2026-10-02 11:05',
    expiresAt: '2026-10-31',
  },
  {
    id: 'sl-kr',
    line: '韩国',
    name: 'KR 体验课',
    url: 'https://www.dinoai.ai/kr/trial',
    domain: DOMAIN,
    alias: 'kr-trial',
    tiny: `https://${DOMAIN}/kr-trial`,
    creator: 'growth.kr@dinoai.ai',
    createdAt: '2026-09-28 09:40',
  },
  {
    id: 'sl-kr-2',
    line: '韩国',
    name: 'KR 品牌周',
    url: 'https://www.dinoai.ai/kr/brand',
    domain: DOMAIN,
    alias: 'kr-brand',
    tiny: `https://${DOMAIN}/kr-brand`,
    creator: 'admin@dinoai.ai',
    createdAt: '2026-10-06 16:12',
    unavailable: true,
  },
  {
    id: 'sl-vn',
    line: '越南',
    name: 'VN TikTok',
    url: 'https://www.dinoai.ai/vn/tiktok',
    domain: DOMAIN,
    alias: 'vn-tiktok',
    tiny: `https://${DOMAIN}/vn-tiktok`,
    creator: 'ops.vn@dinoai.ai',
    createdAt: '2026-09-30 13:18',
  },
  {
    id: 'sl-vn-2',
    line: '越南',
    name: 'VN 体验课',
    url: 'https://www.dinoai.ai/vn/trial',
    domain: DOMAIN,
    alias: 'vn-trial',
    tiny: `https://${DOMAIN}/vn-trial`,
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
    if (!role || role.dataScope === 'all') return [...BUSINESS_LINES]
    const allowed = new Set(account?.businessLines ?? [])
    return BUSINESS_LINES.filter((item) => allowed.has(item))
  }, [account?.businessLines, role])
  const [line, setLine] = useState<BusinessLine>(lineOptions.find((item) => seed.some((link) => link.line === item)) ?? lineOptions[0] ?? '沙特')
  const [links, setLinks] = useState<ShortLink[]>(seed)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [usage, setUsage] = useState(INITIAL_USAGE)
  const [draftFilters, setDraftFilters] = useState({ name: '', creator: undefined as string | undefined, domain: undefined as string | undefined, dates: undefined as [dayjs.Dayjs, dayjs.Dayjs] | undefined, status: undefined as string | undefined })
  const [filters, setFilters] = useState(draftFilters)
  const [form] = Form.useForm()
  const alias = Form.useWatch('alias', form)
  const selectedDomain = Form.useWatch('domain', form)
  const expiryMode = Form.useWatch('expiryMode', form)
  const domainReady = READY_LINES.has(line)

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
    .filter((item) => !filters.dates || (
      dayjs(item.createdAt).isAfter(filters.dates[0].startOf('day')) &&
      dayjs(item.createdAt).isBefore(filters.dates[1].endOf('day'))
    ))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [permittedRows, filters])

  const creatorOptions = useMemo(() => [...new Set(permittedRows.map((item) => item.creator))]
    .map((value) => ({ label: value, value })), [permittedRows])

  const startCreating = () => {
    if (usage >= MAX_LINKS) {
      message.warning(`本周期短链创建额度已用完，将于 ${RESET_DATE} 重置`)
      return
    }
    form.setFieldsValue({ domain: DOMAIN, alias: '', expiryMode: 'permanent' })
    setCreating(true)
  }

  const closeForm = () => {
    setCreating(false)
    form.resetFields()
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
    { title: '后缀', dataIndex: 'alias', width: 130 },
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
      width: 110,
      render: (_, row) => {
        const disabled = ['expired', 'unavailable'].includes(statusOf(row))
        return <Button type="link" icon={<CopyOutlined />} disabled={disabled} onClick={() => copyLink(row)}>复制短链</Button>
      },
    },
  ]

  const save = async () => {
    const values = await form.validateFields()
    if (!domainReady || usage >= MAX_LINKS) return
    const alias = (values.alias || '').trim()
    if (alias && links.some((item) => item.domain === values.domain && item.alias === alias)) {
      message.error('后缀已被占用，请更换后再保存')
      return
    }
    setSaving(true)
    window.setTimeout(() => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const finalAlias = alias || Math.random().toString(36).slice(2, 8)
      const expiresAt = values.expiryMode === 'scheduled' ? values.expiresAt?.format('YYYY-MM-DD HH:mm:ss') : undefined
      setLinks((current) => [{
        id: `sl-${Date.now()}`,
        line,
        name: values.name.trim(),
        url: values.url.trim(),
        domain: values.domain,
        alias: finalAlias,
        tiny: `https://${values.domain}/${finalAlias}`,
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
          { title: '新建短链' },
        ]} />
        <Typography.Title level={4}>新建短链</Typography.Title>
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
          <Form.Item name="domain" label="域名" rules={[{ required: true, message: '请选择域名' }]} extra="仅展示 TinyURL 状态为 Active 且已配置给当前业务线的品牌域名">
            <Select options={[{ label: `${DOMAIN}（Active）`, value: DOMAIN }]} />
          </Form.Item>
          <Form.Item name="alias" label="自定义后缀（TinyURL alias）" rules={[
            { pattern: /^[A-Za-z0-9_-]*$/, message: '只允许字母、数字、连字符和下划线' },
            { max: 30, message: '最多 30 个字符' },
          ]} extra="选填；留空由 TinyURL 自动生成，同一域名下不可重复">
            <Input maxLength={30} placeholder="例如：ksa-trial" />
          </Form.Item>
          <div style={{ padding: '12px 16px', background: '#f5f7fa', borderRadius: 8, marginBottom: 20 }}>
            <Typography.Text type="secondary">短链预览　</Typography.Text>
            <Typography.Text strong>
              {alias ? `https://${selectedDomain || DOMAIN}/${alias}` : '创建后由平台生成'}
            </Typography.Text>
          </div>
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
            <Button type="primary" htmlType="submit" loading={saving}>创建短链</Button>
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
          <Col xs={24} md={12} xl={6}><Select allowClear style={{ width: '100%' }} value={draftFilters.domain} placeholder="域名" options={domainReady ? [{ label: DOMAIN, value: DOMAIN }] : []} onChange={(domain) => setDraftFilters({ ...draftFilters, domain })} /></Col>
          <Col xs={24} md={12} xl={6}><Select allowClear style={{ width: '100%' }} value={draftFilters.status} placeholder="有效状态" options={[
            { label: '全部', value: '' }, { label: '生效中', value: 'active' }, { label: '已过期', value: 'expired' }, { label: '永久有效', value: 'permanent' },
          ]} onChange={(status) => setDraftFilters({ ...draftFilters, status })} /></Col>
          <Col xs={24} xl={12}><DatePicker.RangePicker style={{ width: '100%' }} value={draftFilters.dates} onChange={(dates) => setDraftFilters({ ...draftFilters, dates: dates as [dayjs.Dayjs, dayjs.Dayjs] | undefined })} placeholder={['创建开始时间', '创建结束时间']} /></Col>
          <Col xs={24} xl={12}>
            <Space>
              <Button type="primary" icon={<SearchOutlined />} onClick={() => setFilters({ ...draftFilters })}>查询</Button>
              <Button icon={<ReloadOutlined />} onClick={() => {
                const empty = { name: '', creator: undefined, domain: undefined, dates: undefined, status: undefined }
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
