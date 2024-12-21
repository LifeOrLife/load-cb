import https from 'https'


const stableLink = `https://versionhistory.googleapis.com/v1/chrome/platforms/mac/channels/stable/versions`

export async function getStableVersion() {
  return new Promise((resolve, reject) => {
    https.get(stableLink, res => {
      let data = ''
      res.on('data', chunk => {
        data += chunk
      })
      res.on('end', () => {
        const json = JSON.parse(data)
        resolve(json)
      })
			res.on('error', reject)
    }).on('error', reject)
  })
}

getStableVersion().then(console.log).catch(console.error)