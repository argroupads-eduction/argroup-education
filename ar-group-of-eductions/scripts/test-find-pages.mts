import config from '@payload-config'
import { getPayload } from 'payload'

const payload = await getPayload({ config })
try {
  const result = await payload.find({ collection: 'pages', limit: 1 })
  console.log('OK', result.docs[0]?.slug)
} catch (e) {
  console.error('FAIL', e)
}
process.exit(0)
