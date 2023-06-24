const express = require('express');
const bcrypt = require("bcrypt");
const sqlite3 = require('sqlite3');
const {open} = require('sqlite');
const cors = require('cors');
const path = require('path');
const PORT = 3009 || process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors());

let database = null;
const dbPath = path.join(__dirname, "userData.db");

const init = async() => {
    try {
        database = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });
        app.listen(PORT, () => {
          console.log("Server is running");
        });      
    } catch (e) {
        console.log(`DB Error ${e.message}`);
        process.exit(1);        
    }
}
init();

const validatePassword = (password) => {
    return password.length > 4;
}

app.post("/register", async (request, response) => {
    const {username,name,password,gender,location} = request.body;
    var passwordLength = password.length;
    const hashedPassword = await bcrypt.hash(password, 10);
    const selectUserQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await database.get(selectUserQuery);

    if(passwordLength < 5) {
        response.status(400);
        response.send("Password is too short");        
    } else {
        if (dbUser === undefined) {
          const createUser = `INSERT INTO user (username, name, password, gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
          await database.run(createUser);
          response.status(200);
          response.send("User created successfully");
        } else {
          response.status(400);
          response.send("User already exists");
        }   
    }     
});

app.post("/login", async (request, response) => {
    const {username, password} = request.body;
    const selectUser = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await database.get(selectUser);
    
    if(dbUser === undefined) {
        response.status(400).send("Invalid User");                
    }else {
        const verifyPassword = await bcrypt.compare(password, dbUser.password);
        if(verifyPassword === true) {
               response.status(200).send("Login success!");
        }else {
            response.status(400).send("Invalid Password");
        }        
    }
});

app.put("/change-password", async (request,response) => {
    const {username, oldPassword, newPassword} = request.body;
    const selectQuery = `SELECT * FROM user WHERE username = '${username}';`;
    const dbUser = await database.get(selectQuery);

    if(dbUser === undefined) {
        response.status(400).send("Invalid User");
    }else {
      const isPasswordMatched = await bcrypt.compare(oldPassword, dbUser.password);
      if(validatePassword(newPassword)) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        const updatedPassword = `UPDATE user SET password='${hashedPassword}' WHERE username='${username}';`;
        const user = await database.run(updatedPassword);
        response.send("Password Updated");
      }else {
        response.status(400).send("Password is too short");
      }
      
    }    
});

module.exports = app;