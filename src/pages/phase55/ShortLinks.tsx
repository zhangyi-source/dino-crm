import { useEffect, useMemo, useState } from 'react'
import { Alert, Button, Card, Form, Input, Radio, Select, Space, Table, Tag, Typography, message } from 'antd'
import { CopyOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { BUSINESS_LINES, type BusinessLine, type PermLevel } from '../../types'
import { useSession } from '../../auth'
import { usePerm } from '../../perm'
import { setState } from '../../store'
import { useI18n } from '../../i18n'

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
  expires: string
}

const { Text } = Typography
const DOMAIN = 'go.dinoai.ai'
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
    expires: '不过期',
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
    expires: '不过期',
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
    expires: '不过期',
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
    expires: '不过期',
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
    expires: '不过期',
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
    expires: '不过期',
  },
]

export default function ShortLinks55() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const session = useSession()
  const { account, role, can } = usePerm()
  const me = (account?.email || session?.email || '').toLowerCase()
  const canViewLine = can('marketingV2_shortlinks_view_line') === 'operate'
  const lineOptions = useMemo(() => {
    if (!role || role.dataScope === 'all') return [...BUSINESS_LINES]
    const allowed = new Set(account?.businessLines ?? [])
    return BUSINESS_LINES.filter((item) => allowed.has(item))
  }, [account?.businessLines, role])
  const [line, setLine] = useState<BusinessLine>(lineOptions.find((item) => seed.some((link) => link.line === item)) ?? lineOptions[0] ?? '沙特')
  const [links, setLinks] = useState<ShortLink[]>(seed)
  const [creating, setCreating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm()
  const domainReady = READY_LINES.has(line)

  useEffect(() => {
    if (!lineOptions.includes(line)) setLine(lineOptions[0] ?? '沙特')
  }, [line, lineOptions])

  const rows = useMemo(
    () => links.filter((item) => item.line === line && (canViewLine || item.creator.toLowerCase() === me)),
    [links, line, canViewLine, me],
  )

  const setViewLine = (level: PermLevel) => {
    if (!role) return
    setState((prev) => ({
      ...prev,
      roles: prev.roles.map((item) => item.id === role.id
        ? { ...item, perms: { ...item.perms, marketingV2_shortlinks_view_line: level } }
        : item),
    }))
  }

  const copy = async (value: string) => {
    await navigator.clipboard.writeText(value)
    message.success(t('v55.short.copied'))
  }

  const columns: ColumnsType<ShortLink> = [
    { title: t('v55.short.name'), dataIndex: 'name', width: 160 },
    { title: t('v55.short.tiny'), dataIndex: 'tiny', width: 240, render: (value: string) => <Typography.Text copyable={{ text: value, tooltips: [t('common.copy'), t('common.copied')] }}>{value}</Typography.Text> },
    { title: t('v55.short.url'), dataIndex: 'url', ellipsis: true },
    { title: t('v55.short.domain'), dataIndex: 'domain', width: 140 },
    { title: t('v55.short.alias'), dataIndex: 'alias', width: 120 },
    {
      title: t('v55.short.creator'),
      dataIndex: 'creator',
      width: 220,
      render: (value: string) => (
        <Space size={6}>
          <span>{value}</span>
          {value.toLowerCase() !== me && <Tag>{lang === 'en' ? 'Someone else' : '他人'}</Tag>}
        </Space>
      ),
    },
    { title: t('v55.short.createdAt'), dataIndex: 'createdAt', width: 160 },
    { title: t('v55.short.expires'), dataIndex: 'expires', width: 120, render: (value: string) => value === '不过期' ? t('v55.short.never') : value },
    {
      title: t('common.action'),
      key: 'op',
      width: 160,
      render: (_, row) => <Button type="link" icon={<CopyOutlined />} onClick={() => copy(row.tiny)}>{t('v55.short.copy')}</Button>,
    },
  ]

  const save = async () => {
    const values = await form.validateFields()
    if (!domainReady) return
    const alias = (values.alias || '').trim()
    if (alias && links.some((item) => item.domain === DOMAIN && item.alias === alias)) {
      message.error(t('v55.short.duplicate'))
      return
    }
    setSaving(true)
    window.setTimeout(() => {
      const now = new Date()
      const pad = (n: number) => String(n).padStart(2, '0')
      const createdAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const finalAlias = alias || Math.random().toString(36).slice(2, 8)
      setLinks((current) => [
        {
          id: `sl-${Date.now()}`,
          line,
          name: values.name.trim(),
          url: values.url.trim(),
          domain: DOMAIN,
          alias: finalAlias,
          tiny: `https://${DOMAIN}/${finalAlias}`,
          creator: account?.email || session?.email || '当前成员',
          createdAt,
          expires: '不过期',
        },
        ...current,
      ])
      setSaving(false)
      setCreating(false)
      form.resetFields()
      message.success(t('v55.short.created'))
    }, 400)
  }

  return (
    <Card className="page-card" bordered={false}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start' }}>
        <div>
          <div className="section-title" style={{ marginBottom: 8 }}>{t('v55.short.title')}</div>
          <Typography.Text type="secondary">{t('v55.short.note')}</Typography.Text>
        </div>
        {!creating && (
          <Button type="primary" icon={<PlusOutlined />} disabled={!domainReady} onClick={() => setCreating(true)}>{t('v55.short.create')}</Button>
        )}
      </div>
      <Alert
        style={{ marginTop: 16 }}
        type="info"
        showIcon
        message={canViewLine ? t('v55.short.scopeLine') : t('v55.short.scopeOwn')}
        description={(
          <div>
            <div style={{ marginTop: 8 }}>
              <Text>{lang === 'en' ? 'Short links' : '短链管理'}</Text>
              <Tag color="green" style={{ marginLeft: 8 }}>{t('sys.level.operate')}</Tag>
            </div>
            <div style={{ margin: '8px 0 0 16px' }}>
              <Text type="secondary">└ {lang === 'en' ? 'View every short link on this business line' : '查看本业务线全部短链'}</Text>
              <Radio.Group
                size="small"
                style={{ marginLeft: 12 }}
                optionType="button"
                disabled={!role}
                value={canViewLine ? 'operate' : 'none'}
                onChange={(event) => setViewLine(event.target.value)}
                options={(['none', 'operate'] as PermLevel[]).map((level) => ({ label: t(`sys.level.${level}`), value: level }))}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary">{role ? `${role.name}。${t('v55.short.samePlace')}` : t('v55.short.previewOnly')}</Text>
              {can('system') !== 'none' && <Button type="link" size="small" onClick={() => navigate('/system-v55')}>{t('v55.short.openRoles')}</Button>}
            </div>
          </div>
        )}
      />
      <Space style={{ margin: '16px 0' }}>
        <span>{t('v55.short.line')}</span>
        <Select style={{ width: 160 }} value={line} onChange={setLine} options={lineOptions.map((item) => ({ label: item, value: item }))} />
      </Space>
      {!domainReady && <Typography.Paragraph type="secondary">{t('v55.short.domainMissing')}</Typography.Paragraph>}
      {creating ? (
        <Form form={form} layout="vertical" style={{ maxWidth: 560 }} onFinish={save}>
          <Form.Item name="name" label={t('v55.short.name')} rules={[{ required: true, message: t('v55.short.nameRequired') }]}>
            <Input placeholder={t('v55.short.namePlaceholder')} />
          </Form.Item>
          <Form.Item name="url" label={t('v55.short.url')} rules={[{ required: true, message: t('v55.short.urlRequired') }, { pattern: /^https?:\/\/\S+$/, message: t('v55.short.urlPattern') }]}>
            <Input placeholder="https://" />
          </Form.Item>
          <Form.Item label={t('v55.short.domainField')} required>
            <Select value={DOMAIN} options={[{ label: DOMAIN, value: DOMAIN }]} />
          </Form.Item>
          <Form.Item name="alias" label={t('v55.short.aliasField')} rules={[{ pattern: /^[A-Za-z0-9_-]*$/, message: t('v55.short.aliasRule') }]}>
            <Input placeholder={t('v55.short.aliasPlaceholder')} />
          </Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>{t('common.save')}</Button>
            <Button onClick={() => { setCreating(false); form.resetFields() }}>{t('v55.short.backToList')}</Button>
          </Space>
        </Form>
      ) : (
        <Table rowKey="id" columns={columns} dataSource={rows} pagination={{ showTotal: (n) => t('common.total', { n }) }} scroll={{ x: 1280 }} />
      )}
    </Card>
  )
}
