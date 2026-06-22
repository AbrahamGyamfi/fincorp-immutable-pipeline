const router = require('express').Router()
const { BackupClient, ListRecoveryPointsByResourceCommand } = require('@aws-sdk/client-backup')
const { RDSClient, DescribeDBInstancesCommand } = require('@aws-sdk/client-rds')

const PRIMARY_REGION = process.env.AWS_REGION  || 'us-east-1'
const DR_REGION      = process.env.DR_REGION   || 'us-west-2'
const PRIMARY_DB_ID  = process.env.PRIMARY_DB_ID || 'fincorp-primary'

const rds    = new RDSClient({ region: PRIMARY_REGION })
const backup = new BackupClient({ region: DR_REGION })

router.get('/', async (_req, res) => {
  try {
    // Query primary DB — its ARN comes back in the response, no env var needed
    const { DBInstances = [] } = await rds.send(
      new DescribeDBInstancesCommand({ DBInstanceIdentifier: PRIMARY_DB_ID })
    )

    if (!DBInstances.length) {
      return res.status(404).json({ error: `DB instance "${PRIMARY_DB_ID}" not found` })
    }

    const db = DBInstances[0]

    // Use the ARN from RDS to query backup recovery points in the DR region
    const { RecoveryPoints = [] } = await backup.send(
      new ListRecoveryPointsByResourceCommand({ ResourceArn: db.DBInstanceArn })
    )

    const sorted = RecoveryPoints.sort(
      (a, b) => new Date(b.CreationDate) - new Date(a.CreationDate)
    )
    const latest = sorted[0] || null

    const ageHours = latest
      ? Number(((Date.now() - new Date(latest.CreationDate).getTime()) / 3_600_000).toFixed(1))
      : null

    res.json({
      primary: {
        region:     PRIMARY_REGION,
        identifier: db.DBInstanceIdentifier,
        status:     db.DBInstanceStatus,
        multi_az:   db.MultiAZ,
        az:         db.AvailabilityZone,
        engine:     `${db.Engine} ${db.EngineVersion}`,
      },
      last_backup: latest ? {
        completed_at: latest.CreationDate,
        size_gb:      latest.BackupSizeInBytes
          ? Number((latest.BackupSizeInBytes / 1e9).toFixed(1))
          : null,
        status: latest.Status,
        vault:  latest.BackupVaultName,
      } : null,
      recovery_point: latest ? {
        arn:       latest.RecoveryPointArn,
        region:    DR_REGION,
        vault:     latest.BackupVaultName,
        status:    latest.Status,
        age_hours: ageHours,
      } : null,
      total_recovery_points: sorted.length,
      rpo_hours:   24,
      rto_minutes: 30,
      // Mark DR active if the primary is anything other than "available"
      dr_active: db.DBInstanceStatus !== 'available',
    })
  } catch (err) {
    console.error('dr route error:', err.message)
    res.status(502).json({ error: err.message, code: err.name })
  }
})

module.exports = router
