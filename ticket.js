import util from 'util'
import { exec as syncExec } from 'child_process';
const exec = util.promisify(syncExec);
import fetch from 'node-fetch'

async function ticket() {
    const { stdout: newReleaseTags } = await exec('git describe --tags')
    const newReleaseTag = newReleaseTags.replace('\n', '')
    const { stdout: oldReleaseTag } = await exec(`git tag | grep -B1 ${newReleaseTag} | head -1`)
    const { stdout: changeLog } = await exec(`git log ${newReleaseTag}...${oldReleaseTag.replace('\n', '')} --oneline`)
    const actualChangeLogs = changeLog.replace('\n', '<br>')
    const { stdout: lastTagInfo } = await exec(`git show ${newReleaseTag}`)
    const author = lastTagInfo.match(/Author:(.+)\n/).at(1).trim()
    const date = lastTagInfo.match(/Date:(.+)\n/).at(1).trim()
    const createJson = {
        queue: "TMP",
        summary: `Dekart hw8 ${newReleaseTag}`,
        type: "task",
        description: `<#<html>
            <head></head>
            <body>
                Release:&nbsp;${newReleaseTag}<br>
                Author:&nbsp;${author}<br>
                Date:&nbsp;${date}<br><br>
                Changelog:<br><br>${actualChangeLogs}
            </body>
        </html>#>`
    }

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
    const ticketId = response?.at(0)?.id

    if (ticketId) {
        await fetch(`https://api.tracker.yandex.net/v2/issues/${ticketId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                description: createJson.description
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `OAuth ${process.env.API_TOKEN}`,
                'X-Org-ID': process.env.API_ID
            }
        })
    } else {
        await fetch('https://api.tracker.yandex.net/v2/issues/', {
            method: 'POST',
            body: JSON.stringify(createJson),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `OAuth ${process.env.API_TOKEN}`,
                'X-Org-ID': process.env.API_ID
            }
        })
    }
}

ticket()
