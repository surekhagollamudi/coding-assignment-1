const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const isMatch = require("date-fns/isMatch");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};

hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

hasPriorityAndStatus = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

hasSearchProperty = (requestQuery) => {
  return requestQuery.search_q !== undefined;
};

hasCategoryAndStatus = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.status !== undefined
  );
};

hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

hasCategoryAndPriority = (requestQuery) => {
  return (
    requestQuery.category !== undefined && requestQuery.priority !== undefined
  );
};

const convertToResponse = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//API 1

app.get("/todos/", async (request, response) => {
  const { search_q = "", priority, status, category } = request.query;

  let data = null;
  let getTodoQuery = "";

  switch (true) {
    //scenario 1
    case hasStatusProperty(request.query):
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        getTodoQuery = `
                SELECT * FROM todo WHERE status = '${status}';`;
        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertToResponse(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    //scenario 2
    case hasPriorityProperty(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        getTodoQuery = `
            SELECT * FROM todo WHERE priority = '${priority}';`;

        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertToResponse(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 3
    case hasPriorityAndStatus(request.query):
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `
                    SELECT * FROM todo
                    WHERE priority LIKE '${priority}' AND status LIKE '${status}';`;
          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertToResponse(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    //scenario 4
    case hasSearchProperty(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE todo LIKE '%${search_q}%';`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => convertToResponse(eachItem)));
      break;

    //scenario 5
    case hasCategoryAndStatus(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          status === "TO DO" ||
          status === "IN PROGRESS" ||
          status === "DONE"
        ) {
          getTodoQuery = `SELECT * FROM todo 
                                WHERE category = '${category}'
                                AND status = '${status}';`;

          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertToResponse(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Status");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario 6
    case hasCategoryProperty(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        getTodoQuery = `SELECT * FROM todo
                                WHERE category = '${category}';`;

        data = await db.all(getTodoQuery);
        response.send(data.map((eachItem) => convertToResponse(eachItem)));
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    //scenario 7
    case hasCategoryAndPriority(request.query):
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (
          priority === "HIGH" ||
          priority === "MEDIUM" ||
          priority === "LOW"
        ) {
          getTodoQuery = `SELECT * FROM todo 
                                WHERE category = '${category}' AND priority = '${priority}';`;

          data = await db.all(getTodoQuery);
          response.send(data.map((eachItem) => convertToResponse(eachItem)));
        } else {
          response.status(400);
          response.send("Invalid Todo Priority");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    default:
      getTodoQuery = `SELECT * FROM todo`;
      data = await db.all(getTodoQuery);
      response.send(data.map((eachItem) => convertToResponse(eachItem)));
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `SELECT * FROM todo
                            WHERE id = ${todoId};`;
  const data = await db.all(getTodoQuery);
  response.send(convertToResponse(data));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;

  if (isMatch(date, "yyyy-MM-dd")) {
    const newDate = format(new Date(2021, 1, 21), "yyyy-MM-dd");
    const getTodoQuery = `SELECT * FROM todo
                                    WHERE due_date = ${newDate};`;

    const data = await db.all(getTodoQuery);
    response.send(data.map((eachItem) => convertToResponse(eachItem)));
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;

  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      if (
        category === "WORK" ||
        category === "HOME" ||
        category === "LEARNING"
      ) {
        if (isMatch(dueDate, "yyyy-MM-dd")) {
          const newDate = format(new Date(dueDate), "yyyy-MM-dd");
          const getTodoQuery = `
                            INSERT INTO todo(id, todo, priority, status, category, due_date)
                            VALUES ( ${id},'${todo}','${priority}','${status}','${category}', ${newDate});`;
          const data = await db.run(getTodoQuery);
          response.send("Todo Successfully Added");
        } else {
          response.status(400);
          response.send("Invalid Due Date");
        }
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else {
    response.status(400);
    response.send("Invalid Todo Priority");
  }
});

//API 5

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const requestBody = request.body;
  const previousTodoQuery = `SELECT * FROM todo WHERE id = ${todoId};`;
  const previousTodo = await db.get(previousTodoQuery);
  let updateTodo;

  const {
    id = previousTodo.id,
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;

  switch (true) {
    case requestBody.status !== undefined:
      if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
        updateTodo = `
                    UPDATE todo
                    SET
                        todo = '${todo}',
                        priority = '${priority}',
                        status = '${status}',
                        category = '${category}',
                        due_date = ${dueDate}
                    WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Status Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
        updateTodo = `UPDATE todo
                                SET 
                                    todo = '${todo}',
                                    priority = '${priority}',
                                    status = '${status}',
                                    category = '${category}',
                                    due_date = ${dueDate}
                                WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Priority Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      updateTodo = `UPDATE todo
                            SET 
                                todo = '${todo}',
                                priority = '${priority}',
                                status = '${status}',
                                category = '${category}',
                                due_date = '${dueDate}'
                            WHERE id = ${todoId};`;
      await db.run(updateTodo);
      response.send("Todo Updated");
      break;
    case requestBody.category !== undefined:
      if (
        category === "HOME" ||
        category === "WORK" ||
        category === "LEARNING"
      ) {
        updateTodo = `UPDATE todo
                                SET 
                                    todo = '${todo}',
                                    priority = '${priority}',
                                    status = '${status}',
                                    category = '${category}',
                                    due_date = ${dueDate}
                                WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Category Updated");
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (isMatch(dueDate, "yyyy-MM-dd")) {
        const newDate = format(new Date(dueDate), "yyyy-MM-dd");

        updateTodo = `SELECT todo
                                SET 
                                    todo = ${todo},
                                    priority = '${priority}',
                                    status = '${status}',
                                    category = '${category}',
                                    due_date = ${newDate}
                                WHERE id = ${todoId};`;
        await db.run(updateTodo);
        response.send("Due Date Updated");
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  }
});

//API 6

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
            DELETE FROM todo
            WHERE id = ${todoId};`;
  await db.run(getTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
