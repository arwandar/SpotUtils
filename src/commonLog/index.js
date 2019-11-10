import { getGistParams } from '../commonBDD'

const Octokit = require('@octokit/rest')

let gistParams
let clientWithAuth

const queue = []
let isQueueStarted = false

const startQueue = () => {
  if (isQueueStarted) return

  isQueueStarted = true

  const content = queue.shift()
  while (queue.length > 0 && queue[0].gist_id === content.gist_id) {
    const nextQueue = queue.shift()
    content.files = {
      ...content.files,
      ...nextQueue.files,
    }
  }

  clientWithAuth.gists
    .update(content)
    .then(() => {
      setTimeout(() => {
        isQueueStarted = false
        if (queue.length > 0) startQueue()
      }, 5000)
    })
    .catch((e) => console.log('CommonLog::ERREUR::e =>', e))
}

const addToQueue = (content) => {
  queue.push(content)
  setTimeout(() => {
    startQueue()
  }, 5000)
}

const formatFiles = (excludes) => {
  const files = {}
  Object.keys(excludes).forEach((key) => {
    files[`${key}.txt`] = {
      content: excludes[key].sort((a, b) => a.localeCompare(b)).join('\n'),
    }
  })
  return files
}

export const initGist = () =>
  getGistParams().then((result) => {
    gistParams = result
    clientWithAuth = new Octokit({
      auth: gistParams.token,
    })
  })

export const updateExclusionGist = (excludes) =>
  addToQueue({
    gist_id: gistParams.exclusionId,
    files: formatFiles(excludes),
  })

export const updateOrderGist = (fileName, order): void =>
  addToQueue({
    gist_id: gistParams.orderId,
    files: {
      [`${fileName}.txt`]: {
        content: order,
      },
    },
  })

export const updateTracksGist = (fileName, tracks): void =>
  addToQueue({
    gist_id: gistParams.tracksId,
    files: {
      [`${fileName}.txt`]: {
        content: tracks,
      },
    },
  })
