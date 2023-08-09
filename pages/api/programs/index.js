import { createProgram } from 'domain/programs/createProgram'
import { findAllProgramsComplete } from 'domain/programs/findAll'
import { newHandler, withMethods, withSuperAdmin } from 'lib/middleware'

async function handler(req, res) {
  if (req.method === 'POST') {
    return await handlePostRequest(req, res)
  }

  if (req.method === 'GET') {
    return await handleGetRequest(req, res)
  }
}

async function handlePostRequest(req, res) {
  const { data, error } = await createProgram({ ...req.body })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

async function handleGetRequest(req, res) {
  const { data, error } = await findAllProgramsComplete({
    ...req.query,
    archived: Number(req.query.archived)
  })

  if (error) {
    return res.status(error.status).json(error)
  }

  return res.status(200).json(data)
}

export default newHandler(withSuperAdmin(withMethods(['POST', 'GET'], handler)))
