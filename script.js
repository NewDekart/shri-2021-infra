import util from 'util'
import { exec as syncExec } from 'child_process';
const exec = util.promisify(syncExec);
import fetch from 'node-fetch'

async function test() {
    const { stdout: newReleaseTags } = await exec('git describe --tags')
    const newReleaseTag =  newReleaseTags.replace('\n', '')
    const { stdout: oldReleaseTag } = await exec(`git tag | grep -B1 ${newReleaseTag} | head -1`)
    const { stdout: changeLog } = await exec(`git log ${newReleaseTag}...${oldReleaseTag.replace('\n', '')}`)
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
                newRelease:${newReleaseTag}<br>
                oldRelease:${oldReleaseTag}
            </body>
        </html>#>`
    }
    await fetch('https://api.tracker.yandex.net/v2/issues/', {
        method: 'POST',
        body: JSON.stringify(createJson),
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'OAuth AQAAAAA74JZXAAd4ycKPSFr9UET4qtCw3Dhubj8',
            'X-Org-ID': '6461097'
        }
    })
}

test()
