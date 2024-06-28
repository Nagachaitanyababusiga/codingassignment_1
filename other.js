const express = require('express')
const app = express()
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
let db = null
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {format} = require('date-fns')
const dbPath = path.join(__dirname, 'todoApplication.db')
app.use(express.json())

const connectDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('port running on 3000')
    })
  } catch (e) {
    console.log(`DB Error ${e}`)
    process.exit(1)
  }
}
connectDbAndServer()

const hasStatusProperty = eachItem => {
  return eachItem.status !== undefined
}

const haspriorityProperty = eachItem => {
  return eachItem.priority !== undefined
}

const hasStatusAndPriorityProperty = eachItem => {
  return eachItem.status !== undefined && eachItem.priority !== undefined
}
const hasSearchqProperty = eachItem => {
  return eachItem.search_q !== undefined
}

const hasCategoryAndStatusProperty = eachItem => {
  return eachItem.category !== undefined && eachItem.status !== undefined
}

const hasCategoryProperty = eachItem => {
  return eachItem.category !== undefined
}

const hasTodoPropery = eachItem => {
  return eachItem.todo !== undefined
}

app.get('/todos/', async (request, response) => {
  const {status, priority, search_q, category} = request.query
  let getQuery = ``
  let details
  switch (true) {
    case hasStatusProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE status LIKE 
        '${status}' AND todo LIKE '%${search_q}%'`
      break
    case haspriorityProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE priority LIKE '${priority}
    AND todo Like '%${search_q}%'`
      break
    case hasStatusAndPriorityProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE priority LIKE '${priority}
    AND todo Like '%${search_q}%' AND status LIKE '${status}'`
      break
    case hasSearchqProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE todo LIKE '${search_q}'`
      break
    case hasCategoryAndStatusProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE category LIKE '${category}'
    AND status LIKE '${status}'`
      break
    case hasCategoryProperty(request.query):
      getQuery = `SELECT * FROM todo WHERE category LIKE '${category}'`
      break
    default:
      getQuery = `SELECT * FROM todo WHERE category LIKE '${category}'
    AND priority LIKE '${priority}'`
  }
  const data = await db.all(getQuery)
  response.send(data)
})

app.get('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getUser = `SELECT * FROM todo WHERE id = ${todoId}`
  const dbUser = await db.get(getUser)
  response.send(dbUser)
})

app.get('/agenda/', async (request, response) => {
  const getDetails = request.query
  const date = getDetails.date
  const getTodoQuery = `SELECT * FROM user WHERE due_date = '${date}'`
  const dbTodo = await db.all(getTodoQuery)
  response.send(dbTodo)
})

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const addQuery = `INSERT INTO todo(id, todo, priority, status, category, dueDate)
  VALUES(
    ${id},
    '${todo}',
    '${priority}',
    '${status}',
    '${category}',
    '${dueDate}'
  )`
  await db.run(addQuery)
  response.send('Todo Successfully Added')
})

app.put('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const getDetails = request.body
  let details
  switch (true) {
    case hasStatusProperty(request.body):
      details = 'Status'
      break
    case haspriorityProperty(request.body):
      details = 'Priority'
      break
    case hasTodoPropery(request.body):
      details = 'Todo'
      break
    case hasCategoryProperty(request.body):
      details = 'Category'
      break
    default:
      details = 'Due Date'
  }
  const previousQuery = `SELECT * FROM todo WHERE id = ${todoId}`
  const previousTodo = await db.get(previousQuery)
  const {
    todo = previousTodo.todo,
    category = previousTodo.category,
    priority = previousTodo.priority,
    status = previousTodo.status,
    dueDate = previousTodo.due_date,
  } = request.body
  const updateQuery = `UPDATE todo 
  SET todo = '${todo}',
  category = '${category}',
  priority = '${priority}',
  status = '${status}',
  due_date = '${dueDate}'`
  await db.run(updateQuery)
  response.send(`'${details}' Updated`)
})

app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const deleteTodoQuery = `DELETE FROM todo WHERE id = ${todoId}`
  await db.run(deleteTodoQuery)
  response.send('Todo Deleted')
})

module.exports = app
