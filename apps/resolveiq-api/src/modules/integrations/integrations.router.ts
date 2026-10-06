import { Request, Response, Router } from 'express';

const integrationsRouter = Router();

// POST /integrations/email/send
integrationsRouter.post('/email/send', (req: Request, res: Response) => {
  const { incidentId, recipients, subject, executiveSummary } = req.body;

  if (!recipients || !recipients.length || !subject) {
    return res.status(400).json({ message: 'recipients and subject are required.' });
  }

  return res.status(200).json({
    success: true,
    messageId: `msg_${Date.now()}_smtp`,
    recipients,
    subject,
    status: 'DELIVERED',
    timestamp: new Date().toISOString(),
    executiveSummarySnippet: executiveSummary ? executiveSummary.substring(0, 100) + '...' : '',
  });
});

// POST /integrations/calendar/war-room
integrationsRouter.post('/calendar/war-room', (req: Request, res: Response) => {
  const { incidentId, title, attendees, durationMinutes } = req.body;

  const meetingId = `meet_${Math.random().toString(36).substring(2, 9)}`;

  return res.status(200).json({
    success: true,
    calendarEventId: `evt_${Date.now()}`,
    title: title || `🚨 Emergency War Room: ${incidentId}`,
    meetingUrl: `https://meet.google.com/${meetingId}`,
    provider: 'Google Calendar / Google Meet',
    attendees: attendees || ['sre-team@acme.com'],
    durationMinutes: durationMinutes || 30,
    startTime: new Date().toISOString(),
    status: 'CONFIRMED',
  });
});

// POST /integrations/jira/ticket
integrationsRouter.post('/jira/ticket', (req: Request, res: Response) => {
  const { incidentId, projectKey, summary, description, priority } = req.body;

  const ticketKey = `${projectKey || 'PROD'}-1042`;

  return res.status(201).json({
    success: true,
    jiraKey: ticketKey,
    jiraUrl: `https://acme-corp.atlassian.net/browse/${ticketKey}`,
    summary: summary || `[SEV-1] Incident ${incidentId}`,
    priority: priority || 'Highest',
    status: 'OPEN (INVESTIGATING)',
    createdVia: 'ResolveIQ Autonomous SRE Agent',
    timestamp: new Date().toISOString(),
  });
});

// POST /integrations/teams/notify
integrationsRouter.post('/teams/notify', (req: Request, res: Response) => {
  const { incidentId, channel, cardData } = req.body;

  return res.status(200).json({
    success: true,
    channel: channel || '#incident-war-room',
    status: 'POSTED',
    cardDelivered: true,
    interactiveButtons: ['Approve Rollback', 'Acknowledge', 'Open Command Center'],
    timestamp: new Date().toISOString(),
  });
});

export default integrationsRouter;
