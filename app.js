const express = require('express')
const app = express()
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
app.use(express.json())
const datefns = require('date-fns')

let db = null
const dbPath = path.join(__dirname, 'todoApplication.db')

const initializeServerAndDB = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, (request, response) => {
      console.log('Server is up and running')
    })
  } catch (e) {
    console.log(`DB ERROR: ${e.message} `)
    process.exit(1)
  }
}

initializeServerAndDB()

const statuscheck = (request, response, next) => {
  const {priority, status, category} = request.query
  if (
    status !== undefined &&
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE'
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== undefined &&
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW'
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== undefined &&
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else {
    next()
  }
}

const datecheck = (request, response, next) => {
  const {date} = request.query
  const parsedDate = datefns.parse(date, 'yyyy-MM-dd', new Date())
  if (parsedDate == 'Invalid Date') {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    request.date = datefns.format(parsedDate, 'yyyy-MM-dd')
    next()
  }
}

//API-1
app.get('/todos/', statuscheck, async (request, response) => {
  const {
    status = '',
    priority = '',
    search_q = '',
    category = '',
  } = request.query
  const dbquery = `
  select id,todo,priority,status,category,due_date as dueDate from todo
  where status like '%${status}%' and priority like '%${priority}%'
  and todo like '%${search_q}%' and category like '%${category}%';
  `
  const dbval = await db.all(dbquery)
  response.send(dbval)
})

//API-2
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const q = `
  select id,todo,priority,status,category,due_date as dueDate from todo where id = ${todoId};
  `
  const val = await db.get(q)
  response.send(val)
})

//API-3
app.get('/agenda/', datecheck, async (request, response) => {
  const date = request.date
  const q = `
  select id,todo,priority,status,category,due_date as dueDate 
  from todo where due_date like '${date}';
  `
  let val = await db.all(q)
  response.send(val)
})

const postchecker = (request, response, next) => {
  const {id, todo, priority, status, category, dueDate} = request.body
  const parsedDate = datefns.parse(dueDate, 'yyyy-MM-dd', new Date())
  if (
    status !== undefined &&
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE'
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== undefined &&
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW'
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== undefined &&
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (parsedDate == 'Invalid Date') {
    response.status(400)
    response.send('Invalid Due Date')
  } else {
    request.id = id
    request.todo = todo
    request.priority = priority
    request.status = status
    request.category = category
    request.date = datefns.format(parsedDate, 'yyyy-MM-dd')
    next()
  }
}

//API-4
app.post('/todos/', postchecker, async (request, response) => {
  const id = request.id
  const todo = request.todo
  const priority = request.priority
  const status = request.status
  const category = request.category
  const date = request.date
  const q = `
  insert into todo(id,todo,priority,status,category,due_date)
  values(${id},'${todo}','${priority}','${status}','${category}','${date}');
  `
  await db.run(q)
  response.send('Todo Successfully Added')
})

const updateChecker = (request, response, next) => {
  const {todo, priority, status, category, dueDate} = request.body
  const parsedDate = datefns.parse(dueDate, 'yyyy-MM-dd', new Date())
  if (
    status !== undefined &&
    status !== 'TO DO' &&
    status !== 'IN PROGRESS' &&
    status !== 'DONE'
  ) {
    response.status(400)
    response.send('Invalid Todo Status')
  } else if (
    priority !== undefined &&
    priority !== 'HIGH' &&
    priority !== 'MEDIUM' &&
    priority !== 'LOW'
  ) {
    response.status(400)
    response.send('Invalid Todo Priority')
  } else if (
    category !== undefined &&
    category !== 'WORK' &&
    category !== 'HOME' &&
    category !== 'LEARNING'
  ) {
    response.status(400)
    response.send('Invalid Todo Category')
  } else if (dueDate === undefined) {
    request.todo = todo
    request.priority = priority
    request.status = status
    request.category = category
    request.date = dueDate
    next()
  } else {
    if (parsedDate == 'Invalid Date') {
      response.status(400)
      response.send('Invalid Due Date')
    } else {
      request.todo = todo
      request.priority = priority
      request.status = status
      request.category = category
      request.date = datefns.format(parsedDate, 'yyyy-MM-dd')
      next()
    }
  }
}

//API-5
//update values
app.put('/todos/:todoId/', updateChecker, async (request, response) => {
  const todo = request.todo
  const priority = request.priority
  const status = request.status
  const category = request.category
  const date = request.date
  const {todoId} = request.params
  /*console.log(
    todo + ' ' + priority + ' ' + status + ' ' + category + ' ' + date,
  )*/
  let q = ''
  let val = ''
  if (todo != undefined) {
    q = `
    update todo 
    set todo = '${todo}'
     where id=${todoId};
    `
    val = 'Todo Updated'
  } else if (priority != undefined) {
    q = `
    update todo 
    set priority = '${priority}'
     where id=${todoId};
    `
    val = 'Priority Updated'
  } else if (status != undefined) {
    q = `
    update todo 
    set status = '${status}'
     where id=${todoId};
    `
    val = 'Status Updated'
  } else if (category != undefined) {
    q = `
    update todo 
    set category = '${category}'
     where id=${todoId};
    `
    val = 'Category Updated'
  } else if (date != undefined) {
    q = `
    update todo 
    set due_date = '${date}'
     where id=${todoId};
    `
    val = 'Due Date Updated'
  }
  await db.run(q)
  response.send(val)
})

//API-6
//delete an row
app.delete('/todos/:todoId', async (request, response) => {
  const {todoId} = request.params
  const q = `
  delete from todo where id = ${todoId};
  `
  await db.run(q)
  response.send('Todo Deleted')
})

module.exports = app
