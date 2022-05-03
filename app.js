const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
var format = require("date-fns/format");
var isValid = require("date-fns/isValid");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const app = express();
app.use(express.json());
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB Error:${error.message}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    category: dbObject.category,
    priority: dbObject.priority,
    status: dbObject.status,
    dueDate: dbObject.due_date,
  };
};

//API 1
app.get("/todos/", async (request, response) => {
  const { status, priority, category, search_q } = request.query;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE status = '${status}';
            `;
      const dbTodoSList = await database.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE priority = '${priority}';
            `;
      const dbTodoSList = await database.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const getTodoSQuery = `
                SELECT *
                FROM todo
                WHERE category = '${category}';
            `;
      const dbTodoSList = await database.all(getTodoSQuery);
      response.send(
        dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
      );
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (search_q !== undefined) {
    const getTodoSQuery = `
        SELECT *
        FROM todo
        WHERE todo LIKE "%${search_q}%";
      `;
    const dbTodoSList = await database.all(getTodoSQuery);
    response.send(
      dbTodoSList.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  }
});

//API 2
app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoQuery = `
        SELECT *
        FROM todo
        WHERE id = ${todoId};
    `;
  const dbTodo = await database.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(dbTodo));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  let dateObj = new Date(date);
  let isDateValid = isValid(dateObj);
  if (isDateValid === true) {
    let date1 = dateObj.getDate();
    let month1 = dateObj.getMonth();
    let year1 = dateObj.getFullYear();
    const formattedDate = format(new Date(year1, month1, date1), "yyyy-MM-dd");
    const getTodoSQuery = `
        SELECT *
        FROM todo
        WHERE due_date = '${formattedDate}';
    `;
    const dbTodoS = await database.all(getTodoSQuery);
    response.send(
      dbTodoS.map((eachTodo) => convertDbObjectToResponseObject(eachTodo))
    );
  } else {
    response.status(400);
    response.send("Invalid Due Date");
  }
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let status1 = null;
  let priority1 = null;
  let category1 = null;
  let dueDate1 = null;
  let dateObj = new Date(dueDate);
  const isDateValid = isValid(dateObj);
  if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
    status1 = status;
  } else {
    status1 = undefined;
    response.status(400);
    response.send("Invalid Todo Status");
  }
  if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
    priority1 = priority;
  } else {
    priority1 = undefined;
    response.status(400);
    response.send("Invalid Todo Priority");
  }
  if (category === "WORK" || category === "HOME" || category === "LEARNING") {
    category1 = category;
  } else {
    category1 = undefined;
    response.status(400);
    response.send("Invalid Todo Category");
  }
  if (isDateValid === true) {
    let year1 = dateObj.getFullYear();
    let month1 = dateObj.getMonth();
    let date1 = dateObj.getDate();
    let formattedDate = format(new Date(year1, month1, date1), "yyyy-MM-dd");
    dueDate1 = formattedDate;
  } else {
    dueDate1 = undefined;
    response.status(400);
    response.send("Invalid Due Date");
  }

  if (
    id !== undefined &&
    todo !== undefined &&
    priority1 !== undefined &&
    status1 !== undefined &&
    category1 !== undefined &&
    dueDate1 !== undefined
  ) {
    const createTodoQuery = `
        INSERT INTO todo(id,todo,priority,status,category,due_date) 
        VALUES (${id},'${todo}','${priority1}','${status1}','${category1}','${dueDate1}');
    `;
    await database.run(createTodoQuery);
    response.send("Todo Successfully Added");
  }
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const { status, priority, todo, category, dueDate } = request.body;
  if (status !== undefined) {
    if (status === "TO DO" || status === "IN PROGRESS" || status === "DONE") {
      const updateTodoQuery = `
            UPDATE todo
            SET status = '${status}'
            WHERE id = ${todoId};
        `;
      await database.run(updateTodoQuery);
      response.send("Status Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  } else if (priority !== undefined) {
    if (priority === "HIGH" || priority === "MEDIUM" || priority === "LOW") {
      const updateTodoQuery = `
            UPDATE todo
            SET priority = '${priority}'
            WHERE id = ${todoId};
        `;
      await database.run(updateTodoQuery);
      response.send("Priority Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  } else if (todo !== undefined) {
    const updateTodoQuery = `
            UPDATE todo
            SET todo = '${todo}'
            WHERE id = ${todoId};
        `;
    await database.run(updateTodoQuery);
    response.send("Todo Updated");
  } else if (category !== undefined) {
    if (category === "WORK" || category === "HOME" || category === "LEARNING") {
      const updateTodoQuery = `
            UPDATE todo
            SET category = '${category}'
            WHERE id = ${todoId};
        `;
      await database.run(updateTodoQuery);
      response.send("Category Updated");
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  } else if (dueDate !== undefined) {
    let dateObj = new Date(dueDate);
    const isDateValid = isValid(dateObj);
    if (isDateValid === true) {
      let date1 = dateObj.getDate();
      let month1 = dateObj.getMonth();
      let year1 = dateObj.getFullYear();
      const formattedDate = format(
        new Date(year1, month1, date1),
        "yyyy-MM-dd"
      );
      const updateTodoQuery = `
            UPDATE todo
            SET due_date = '${formattedDate}'
            WHERE id = ${todoId};
        `;
      await database.run(updateTodoQuery);
      response.send("Due Date Updated");
    } else {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
        DELETE 
        FROM todo
        WHERE id = ${todoId};
    `;
  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
