import { Request, Response, Router } from 'express';

const databaseRouter = Router();

// Mock active PostgreSQL locks / hanging queries
let activeLocks = [
  {
    pid: 4821,
    clientAddress: '10.244.2.84',
    query: "SELECT * FROM charges WHERE status = 'pending' AND updated_at < NOW() FOR UPDATE",
    blockedDurationSec: 54,
    state: 'active (exclusive row lock)',
    waitingForLock: true,
  },
  {
    pid: 4829,
    clientAddress: '10.244.2.85',
    query: "UPDATE accounts SET balance = balance - 100 WHERE id = 'acc_8819'",
    blockedDurationSec: 42,
    state: 'waiting on lock 4821',
    waitingForLock: true,
  },
];

// GET /database/schemas
databaseRouter.get('/schemas', (req: Request, res: Response) => {
  const dbName = (req.query.dbName as string) || 'payment_production';
  
  return res.status(200).json({
    databaseName: dbName,
    engine: 'PostgreSQL 15.4 (RDS Multi-AZ)',
    totalSizeMb: 1420.5,
    activeConnections: 100,
    maxConnections: 100,
    tables: [
      { name: 'charges', rowCount: 4821900, sizeMb: 620.4, indexSizeMb: 180.2, tableStatus: 'LOCK_CONTENTION' },
      { name: 'payment_methods', rowCount: 890400, sizeMb: 120.1, indexSizeMb: 45.0, tableStatus: 'HEALTHY' },
      { name: 'refunds', rowCount: 142000, sizeMb: 35.8, indexSizeMb: 12.1, tableStatus: 'HEALTHY' },
      { name: 'idempotency_keys', rowCount: 310500, sizeMb: 48.2, indexSizeMb: 16.5, tableStatus: 'HEALTHY' },
    ],
  });
});

// GET /database/locks
databaseRouter.get('/locks', (req: Request, res: Response) => {
  return res.status(200).json({
    database: 'payment_production',
    totalActiveLocks: activeLocks.length,
    poolExhaustionWarning: true,
    locks: activeLocks,
  });
});

// POST /database/locks/:pid/kill
databaseRouter.post('/locks/:pid/kill', (req: Request, res: Response) => {
  const pid = parseInt(req.params.pid, 10);
  const foundIndex = activeLocks.findIndex((l) => l.pid === pid);

  if (foundIndex === -1) {
    return res.status(404).json({ message: `Process ID ${pid} not found or already terminated.` });
  }

  activeLocks.splice(foundIndex, 1);

  return res.status(200).json({
    success: true,
    message: `Terminated blocking PostgreSQL process PID ${pid}. Lock contention released.`,
    remainingLocks: activeLocks.length,
    timestamp: new Date().toISOString(),
  });
});

export default databaseRouter;
