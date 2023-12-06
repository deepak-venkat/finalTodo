const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const format = require('date-fns/format')
const isValid = require('date-fns/isValid')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'todoApplication.db')

let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

const validateRequestBody = (request, response, next) => {
  const {status, priority, category, dueDate} = request.body
  let validDueDate = true

  if (dueDate) {
    const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd')
    if (!isValid(formattedDate)) {
      validDueDate = false
    }
  }

  if (status && !['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (category && !['WORK', 'HOME', 'LEARNING'].includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (!validDueDate) {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    next()
  }
}

const validateQueryParameters = (request, response, next) => {
  const {status, priority, category} = request.query
  if (status && !['TO DO', 'IN PROGRESS', 'DONE'].includes(status)) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (priority && !['HIGH', 'MEDIUM', 'LOW'].includes(priority)) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (category && !['WORK', 'HOME', 'LEARNING'].includes(category)) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    next()
  }
}

app.get('/todos/', validateQueryParameters, async (request, response) => {
  const {status, priority, search_q, category} = request.query
  let selectQuery
  switch (true) {
    case status &&
      priority === undefined &&
      search_q === undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE status LIKE '${status}'; `
      break
    case status === undefined &&
      priority &&
      search_q === undefined &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE priority LIKE '${priority}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q === undefined &&
      category:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}'; `
      break
    case status === undefined &&
      priority === undefined &&
      search_q &&
      category === undefined:
      selectQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%'; `
      break
    case status && priority === undefined && search_q === undefined && category:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}' AND status LIKE '${status}'; `
      break
    case status === undefined && priority && search_q === undefined && category:
      selectQuery = `SELECT * FROM todo WHERE category LIKE '${category}' AND priority LIKE '${priority}'; `
      break
    case status && priority && search_q === undefined && category === undefined:
      selectQuery = `SELECT * FROM todo WHERE status LIKE '${status}' AND priority LIKE '${priority}'; `
      break
  }
  const todo_arr = await db.all(selectQuery)
  const todoArr = todo_arr.map(eachObj => {
    return {
      id: eachObj.id,
      todo: eachObj.todo,
      priority: eachObj.priority,
      status: eachObj.status,
      category: eachObj.category,
      dueDate: eachObj.due_date,
    }
  })
  response.send(todoArr)
})
