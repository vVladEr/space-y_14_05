import * as path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import { isatty } from "tty";

const rootDir = process.cwd();
const port = 3000;
const app = express();
const loginedUsers = {};

app.use(express.static('spa/build'));
app.use(express.json());
app.use(cookieParser());

const isAuthorized = function(req, res, next){
  const routeCond = req.originalUrl.includes('api') || req.originalUrl.includes('static') || req.originalUrl.includes('login');
  console.log(req.cookies);
  //const authCond = "username" in req.cookies;
  const authCond =  req.cookies.username in loginedUsers;
  console.log(routeCond, authCond);
  if(routeCond || authCond){
    next();
    return;
  }
  next();
  res.redirect('/login');
}

app.use(isAuthorized)


app.get("/client.mjs", (_, res) => {
  res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
  res.sendFile(path.join(rootDir, "client.mjs"), {
    maxAge: -1,
    cacheControl: false,
  });
});

app.get("/", (_, res) => {
  res.send(":)");
});

app.get("*", (_, res) => {
  res.sendFile(path.join(rootDir, "spa/build/index.html"));
})

app.post("/api/login", (req, res) => {
  let username = req.body.username;
  loginedUsers[username] = true;
  res.cookie('username', username, {secure: true, httpOnly: true, sameSite: true});
  res.json({username: username});
  console.log(`logined user ${username}`)
});


app.post("/api/logout", (req, res) => {
  let username = req.body.username;
  delete loginedUsers[username];
  res.json({status: true});
  console.log(`logout user ${username}`)
});

https.createServer(
        {
            key: fs.readFileSync("certs/server.key"),
            cert: fs.readFileSync("certs/server.cert"),
        },
        app
    )
    .listen(port, function () {
        console.log(
            `Listening on port ${port}!`
        );
    });