const router = require('express').Router()
const {
  ECRClient,
  DescribeImagesCommand,
  DescribeImageScanFindingsCommand,
} = require('@aws-sdk/client-ecr')

const REGION = process.env.AWS_REGION || 'us-east-1'
const REPO   = process.env.ECR_REPOSITORY || 'fincorp-api'

const ecr = new ECRClient({ region: REGION })

function attr(attributes, key) {
  return attributes?.find(a => a.key === key)?.value ?? null
}

router.get('/', async (_req, res) => {
  try {
    // Resolve :stable to its commit SHA tag
    const { imageDetails = [] } = await ecr.send(
      new DescribeImagesCommand({
        repositoryName: REPO,
        imageIds: [{ imageTag: 'stable' }],
      })
    )

    const stableImage = imageDetails[0]
    const imageTag = stableImage?.imageTags?.find(t => !['latest', 'stable'].includes(t))
      || stableImage?.imageTags?.[0]
      || 'stable'

    const { imageScanStatus, imageScanFindings } = await ecr.send(
      new DescribeImageScanFindingsCommand({
        repositoryName: REPO,
        imageId: { imageTag },
      })
    )

    if (imageScanStatus?.status !== 'COMPLETE') {
      return res.json({
        image_tag:   imageTag,
        scan_status: imageScanStatus?.status || 'PENDING',
        gate_status: 'PENDING',
        counts:      { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, INFORMATIONAL: 0 },
        findings:    [],
      })
    }

    const c = imageScanFindings?.findingSeverityCounts || {}
    const counts = {
      CRITICAL:      c.CRITICAL      || 0,
      HIGH:          c.HIGH          || 0,
      MEDIUM:        c.MEDIUM        || 0,
      LOW:           c.LOW           || 0,
      INFORMATIONAL: c.INFORMATIONAL || 0,
    }

    // Enhanced scanning (Inspector) uses enhancedFindings; basic uses findings
    const rawFindings = imageScanFindings?.enhancedFindings?.length
      ? imageScanFindings.enhancedFindings.map(f => ({
          id:       f.title || f.packageVulnerabilityDetails?.vulnerabilityId,
          severity: f.severity,
          package:  f.packageVulnerabilityDetails?.vulnerablePackages?.[0]?.name,
          version:  f.packageVulnerabilityDetails?.vulnerablePackages?.[0]?.version,
          fixed_in: f.packageVulnerabilityDetails?.vulnerablePackages?.[0]?.fixedInVersion,
          uri:      f.packageVulnerabilityDetails?.sourceUrl,
        }))
      : (imageScanFindings?.findings || []).map(f => ({
          id:       f.name,
          severity: f.severity,
          package:  attr(f.attributes, 'package_name'),
          version:  attr(f.attributes, 'package_version'),
          fixed_in: attr(f.attributes, 'fixed_in_version'),
          uri:      f.uri,
        }))

    const topFindings = rawFindings
      .filter(f => ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity))
      .sort((a, b) => {
        const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2 }
        return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
      })
      .slice(0, 5)

    res.json({
      image_tag:   imageTag,
      image_uri:   `${process.env.ECR_REGISTRY || ''}/${REPO}:${imageTag}`,
      scanned_at:  imageScanFindings?.imageScanCompletedAt,
      scan_status: 'COMPLETE',
      gate_status: (counts.CRITICAL > 0 || counts.HIGH > 0) ? 'BLOCKED' : 'PASSED',
      counts,
      findings:    topFindings,
    })
  } catch (err) {
    console.error('security route error:', err.message)
    res.status(502).json({ error: err.message, code: err.name })
  }
})

module.exports = router
