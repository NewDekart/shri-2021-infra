import util from 'util'
import { exec as syncExec } from 'child_process';
const exec = util.promisify(syncExec);
import fetch from 'node-fetch'

async function docker() {
    const { stdout: newReleaseTagWithN } = await exec('git describe --tags')
    const newReleaseTag = newReleaseTagWithN.replace('\n', '')
    const findJson = {
        filter: {
            queue: "TMP",
            summary: `Dekart hw8 ${newReleaseTag}`,
        }
    }
    const find = await fetch('https://api.tracker.yandex.net/v2/issues/_search', {
        method: 'POST',
        body: JSON.stringify(findJson),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `OAuth ${process.env.API_TOKEN}`,
            'X-Org-ID': process.env.API_ID
        }
    })
    const response = await find.json()
    const ticketId = response.at(0).id

    await exec(`docker build -t dekarthw8:${newReleaseTag} .`)

    const commentJson = {
        "text": `Докер образ dekrarthw8:${newReleaseTag} собран`
    }

    await fetch(`https://api.tracker.yandex.net/v2/issues/${ticketId}/comments`, {
        method: 'POST',
        body: JSON.stringify(commentJson),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `OAuth ${process.env.API_TOKEN}`,
            'X-Org-ID': process.env.API_ID
        }
    })
}

docker()
