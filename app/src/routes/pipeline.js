const router = require('express').Router()
const { ECRClient, DescribeImagesCommand, DescribeImageScanFindingsCommand } = require('@aws-sdk/client-ecr')

const REGION = process.env.AWS_REGION || 'us-east-1'
const REPO   = process.env.ECR_REPOSITORY || 'fincorp-api'

const ecr = new ECRClient({ region: REGION })

const SKIP_TAGS = new Set(['latest', 'stable'])

// Cosign signature images have tags like sha256-<digest> — skip them
function isCoSign(img) {
  return img.imageTags?.every(t => /^sha256-/.test(t))
}

function sha(img) {
  return img.imageTags?.find(t => !SKIP_TAGS.has(t)) || img.imageTags?.[0] || img.imageDigest.slice(7, 15)
}

async function getScanCounts(imageTag) {
  try {
    const { imageScanStatus, imageScanFindings } = await ecr.send(
      new DescribeImageScanFindingsCommand({ repositoryName: REPO, imageId: { imageTag } })
    )
    if (imageScanStatus?.status !== 'COMPLETE') {
      return { status: imageScanStatus?.status || 'PENDING', counts: null }
    }
    const c = imageScanFindings?.findingSeverityCounts || {}
    return {
      status: 'COMPLETE',
      counts: {
        CRITICAL: c.CRITICAL || 0,
        HIGH:     c.HIGH     || 0,
        MEDIUM:   c.MEDIUM   || 0,
        LOW:      c.LOW      || 0,
      },
    }
  } catch {
    return { status: 'UNAVAILABLE', counts: null }
  }
}

router.get('/', async (_req, res) => {
  try {
    const { imageDetails = [] } = await ecr.send(
      new DescribeImagesCommand({ repositoryName: REPO, filter: { tagStatus: 'TAGGED' } })
    )

    const recent = imageDetails
      .filter(img => !isCoSign(img))
      .sort((a, b) => new Date(b.imagePushedAt) - new Date(a.imagePushedAt))
      .slice(0, 50)

    const builds = await Promise.all(
      recent.map(async (img) => {
        const imageTag = sha(img)
        const { status: scanStatus, counts } = await getScanCounts(imageTag)
        const blocked = counts ? (counts.CRITICAL > 0 || counts.HIGH > 0) : false

        return {
          sha:       imageTag,
          pushed_at: img.imagePushedAt,
          size_mb:   Math.round((img.imageSizeInBytes || 0) / 1024 / 1024),
          tags:      img.imageTags || [],
          stable:    img.imageTags?.includes('stable') || false,
          status:    scanStatus !== 'COMPLETE' ? scanStatus.toLowerCase() : blocked ? 'blocked' : 'promoted',
          scan:      counts || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 },
        }
      })
    )

    res.json(builds)
  } catch (err) {
    console.error('pipeline route error:', err.message)
    res.status(502).json({ error: err.message, code: err.name })
  }
})

module.exports = router
