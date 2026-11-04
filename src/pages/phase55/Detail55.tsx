import { Button, Card, Descriptions, Space, Table, Tag, Typography } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../../store'
import { completedLessons, studentLessons, TRIAL_REPORT_URL } from '../../lessons'
import type { LessonRecord } from '../../types'
import { useI18n } from '../../i18n'

const REPORTS = [
  { key: 'trial', label: 'v55.report.trial', match: (lesson: LessonRecord) => lesson.lessonType === '体验课' },
  { key: 'class', label: 'v55.report.class', match: (lesson: LessonRecord) => lesson.lessonType === '正式课' },
  { key: 'unit', label: 'v55.report.unit', match: () => false },
  { key: 'week', label: 'v55.report.week', match: () => false },
  { key: 'month', label: 'v55.report.month', match: () => false },
] as const

function openReport(key: string, title: string, time: string) {
  if (key === 'trial') {
    window.open(TRIAL_REPORT_URL, '_blank', 'noopener,noreferrer')
    return
  }
  const page = window.open('', '_blank')
  if (!page) return
  page.document.write(`<!doctype html><title>${title}</title><body style="font-family:sans-serif;padding:32px"><h1>${title}</h1><p>${time}</p></body>`)
  page.document.close()
}

export default function Detail55({ from }: { from: 'users' | 'sales' }) {
  const { t } = useI18n()
  const { studentId = '' } = useParams()
  const navigate = useNavigate()
  const students = useStore((s) => s.students)
  const lessons = useStore((s) => s.lessons ?? [])
  const student = students.find((item) => item.studentId === studentId)
  const back = from === 'sales' ? '/sales-v55' : '/users-v55'
  const done = completedLessons(lessons, studentId)

  if (!student) {
    return <Card className="page-card" bordered={false}><Button type="link" onClick={() => navigate(back)}>{t('common.back')}</Button><Typography.Text>{t('v55.user.notFound')}</Typography.Text></Card>
  }

  return (
    <Space direction="vertical" size={16} style={{ display: 'flex' }}>
      <Card className="page-card" bordered={false} title={<span className="section-title">{t('user.detail')}</span>} extra={<Button onClick={() => navigate(back)}>{from === 'sales' ? t('v55.user.backSales') : t('v55.user.backUsers')}</Button>}>
        <Descriptions bordered size="small" column={2}>
          <Descriptions.Item label={t('user.col.id')}>{student.studentId}</Descriptions.Item>
          <Descriptions.Item label={t('user.col.name')}>{student.localName || student.name}</Descriptions.Item>
          <Descriptions.Item label={t('user.col.country')}>{student.country || student.businessLine}</Descriptions.Item>
          <Descriptions.Item label={t('user.col.status')}>{t(`enum.status.${student.status}`)}</Descriptions.Item>
        </Descriptions>
      </Card>
      <Card className="page-card" bordered={false} title={<span className="section-title">{t('user.courseInfo')}</span>}>
        <Table
          style={{ marginBottom: 16 }}
          pagination={false}
          rowKey="key"
          dataSource={REPORTS.map((item) => ({
            key: item.key,
            name: t(item.label),
            times: done.filter(item.match).map((lesson) => lesson.completedAt || lesson.startedAt || '—'),
          }))}
          columns={[
            { title: t('v55.report.type'), dataIndex: 'name', width: 180 },
            {
              title: t('v55.report.valid'),
              dataIndex: 'times',
              render: (times: string[], row) => times.length
                ? <Space direction="vertical" size={0}>{times.map((time) => <Button key={time} type="link" style={{ padding: 0 }} onClick={() => openReport(row.key, row.name, time)}>{time}</Button>)}</Space>
                : <Typography.Text type="secondary">—</Typography.Text>,
            },
          ]}
        />
        <Table
          rowKey="id"
          dataSource={studentLessons(lessons, studentId)}
          pagination={false}
          locale={{ emptyText: t('common.noData') }}
          columns={[
            { title: t('v55.user.courseCode'), dataIndex: 'courseLabel', render: (value) => value || '—' },
            { title: t('v55.user.courseStatus'), dataIndex: 'status', render: (value) => <Tag>{value}</Tag> },
            { title: t('v55.user.courseName'), dataIndex: 'courseName', render: (value, row) => value || row.lessonType },
            { title: t('v55.user.lessonTime'), dataIndex: 'startedAt', render: (value) => value || '—' },
            { title: t('v55.user.completedAt'), dataIndex: 'completedAt', render: (value) => value || '—' },
            {
              title: t('v55.report.trialAction'),
              render: (_, row) => row.lessonType === '体验课' && row.status === '已完课' && row.report
                ? <Button type="link" style={{ padding: 0 }} onClick={() => window.open(TRIAL_REPORT_URL, '_blank', 'noopener,noreferrer')}>{t('v55.report.trialAction')}</Button>
                : <Typography.Text type="secondary">—</Typography.Text>,
            },
          ]}
        />
      </Card>
    </Space>
  )
}
