import { useMemo, useState } from 'react'
import { Card, Col, Row, Statistic, Table, Tabs, Tag } from 'antd'
import { useStore } from '../../store'
import { useI18n } from '../../i18n'

type PayRow = {
  id: string
  studentId: string
  method: string
  status: '已完成' | '待支付' | '已取消' | '已支付'
  amount: number
  counted: boolean
}

export default function Dashboard55() {
  const { t } = useI18n()
  const orders = useStore((s) => s.orders)
  const [tab, setTab] = useState('overview')
  const manual: PayRow[] = [
    { id: 'MB-1008', studentId: '900000121', method: t('v55.dash.manual'), status: '已完成', amount: 1280, counted: true },
    { id: 'MB-1009', studentId: '900000122', method: t('v55.dash.manual'), status: '待支付', amount: 1280, counted: false },
    { id: 'MB-1010', studentId: '900000123', method: t('v55.dash.manual'), status: '已取消', amount: 1280, counted: false },
  ]
  const online = useMemo<PayRow[]>(() => orders
    .filter((order) => order.orderStatus === '已支付' && order.paidAmount > 0)
    .map((order) => ({ id: order.orderId, studentId: order.studentId, method: order.payMethod, status: '已支付' as const, amount: order.paidAmount, counted: true })), [orders])
  const rows = [...online, ...manual]
  const paidUsers = new Set(rows.filter((row) => row.counted).map((row) => row.studentId)).size
  const leads = 1151

  return (
    <Card className="page-card" bordered={false}>
      <div className="section-title">{t('v55.dash.title')}</div>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'overview', label: t('v55.dash.overview') },
        { key: 'pay', label: t('v55.dash.pay') },
      ]} />
      {tab === 'overview' ? (
        <Row gutter={16}>
          <Col span={4}><Statistic title={t('v55.dash.leads')} value={leads} /></Col>
          <Col span={4}><Statistic title={t('v55.dash.paidUsers')} value={paidUsers} /></Col>
          <Col span={4}><Statistic title="L2S" value={`${((paidUsers / leads) * 100).toFixed(1)}%`} /></Col>
        </Row>
      ) : (
        <>
          <Table
            rowKey="id"
            pagination={false}
            dataSource={rows}
            columns={[
              { title: t('v55.dash.order'), dataIndex: 'id' },
              { title: t('user.col.id'), dataIndex: 'studentId' },
              { title: t('v55.dash.method'), dataIndex: 'method' },
              { title: t('v55.dash.status'), dataIndex: 'status', render: (value: PayRow['status'], row) => <Tag color={row.counted ? 'green' : 'default'}>{t(value === '已完成' ? 'v55.dash.completed' : value === '待支付' ? 'v55.dash.pending' : value === '已取消' ? 'v55.dash.cancelled' : 'v55.dash.paid')}</Tag> },
              { title: t('v55.dash.amount'), dataIndex: 'amount' },
              { title: t('v55.dash.paidUsers'), render: (_, row) => row.counted ? t('v55.dash.counted') : t('v55.dash.notCounted') },
            ]}
          />
        </>
      )}
    </Card>
  )
}
