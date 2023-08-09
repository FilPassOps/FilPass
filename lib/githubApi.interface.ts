export interface GHUser {
  date: string
  name: string
  email: string
}

export interface GHObject {
  type: string
  sha: string
  url: string
}

export interface GHTree {
  url: string
  sha: string
  path: string
  mode: string
  type: string
  size: number
}

export interface GHParent {
  url: string
  sha: string
  html_url: string
}

export interface GHVerification {
  verified: boolean
  reason: string
  signature: any
  payload: any
}

export interface GHLink {
  self: string
  git: string
  html: string
}

export interface GHContent {
  name: string
  encoding: string
  content: string
  path: string
  sha: string
  size: number
  url: string
  html_url: string
  git_url: string
  download_url: string
  type: string
  _links: GHLink
}

export interface GHCommit {
  sha: string
  node_id: string
  url: string
  author: GHUser
  commiter: GHUser
  message: string
  tree: Exclude<GHTree, 'path' | 'mode' | 'type' | 'size'>
  parents: [GHParent]
  verification: GHVerification
  html_url: string
}

export interface GHCreateBlobResponse {
  url: string
  sha: string
}

export interface GHCreateCommitResponse extends GHCommit {}

export interface GHCreateTreeResponse {
  sha: string
  url: string
  tree: [GHTree]
  truncated: boolean
}

export interface GHUpdateReferenceResponse {
  ref: string
  node_id: string
  url: string
  object: GHObject
}

export interface GHUpdateContentsResponse {
  content: Exclude<GHContent, 'encoding' | 'content'>
  commit: GHCommit
}

export interface GHGetContentsResponse extends GHContent {}
