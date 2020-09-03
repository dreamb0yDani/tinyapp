const express = require('express');
const app = express();
const PORT = 8080; // default port
const bodyParser = require('body-parser');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const { generateRandomString, checkEmail } = require('./helpers/helpers');

// setting up middlewares to be used in the project
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cookieParser());
const saltRounds = 10;



const urlDatabase = {
  "b2xVn2": { longURL: "http://www.lighthouselabs.ca", userID: "aJ48lW" },
  "9sm5xK": { longURL: "http://www.google.com", userID: "aJ48lW" }
};

// object with empty database
const users = {};

// route to registration page
app.get('/register', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('registration_page', templateVars);
});

// route to fetch information from form on reistration page
app.post('/register', (req, res) => {
  // checking if email or pssword is empty string
  if (!req.body.email || !req.body.password) {
    return res.status(400).send('Missing email or password');
  }

  // checking if email already exits in the users object
  if (checkEmail(req.body.email, users)) {
    return res.status(400).send('Email already exist!');
  }


  const randomID = generateRandomString();
  users[randomID] = {
    id: randomID,
    email: req.body.email,
    password: req.body.password
  };

  res.redirect('/urls');
});

// route to login page
app.get('/login', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  res.render('login_form', templateVars);
});

// route to fetch infromation from form in login page
app.post('/login', (req, res) => {
  // storing the provided username in tthe cookies

  const email = req.body.email;
  const password = req.body.password;

  const emailkey = checkEmail(email, users);

  // if email doesn't exist
  if (!emailkey) {
    return res.status(400).send('User cannot be found!');
  }

  if (emailkey) {
    if (password === users[emailkey].password) {
      res.cookie('user_id', emailkey);
      return res.redirect('/urls');
    } else {
      return res.status(403).send('Incorrect Password');
    }
  }
});

// route to logout
app.get('/logout', (req, res) => {
  // clearing the cookie by logging-out
  res.clearCookie('user_id');
  res.redirect('/urls');
});

// routing to home page
app.get('/', (req, res) => {
  res.send('Hello!');
});

// route to the list of short and long URL list
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies['user_id']]
  };
  // console.log(users[req.cookies['user_id']])

  res.render("urls_index", templateVars);
});


// route to new URL search query
app.get('/urls/new', (req, res) => {
  const templateVars = {
    user: users[req.cookies['user_id']]
  };
  if (templateVars['user']) {
    res.render('urls_new', templateVars);
  } else {
    res.redirect('/login')
  }
});

// route to use shortURL/IDs to get to the longURL
app.get('/urls/:shortURL', (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];


  const templateVars = {
    shortURL,
    longURL,
    user: users[req.cookies['user_id']]
  };

  res.render('urls_show', templateVars);
});

// POST route to post/update the new url in the database
app.post('/urls/', (req, res) => {

  const shortURL = generateRandomString();
  let longURL = req.body.longURL;
  const userID = req.cookies['user_id'];

  // validating if the entered URL starts with any http protocol
  if (longURL.match(/^(https:\/\/|http:\/\/)/g) === null) {
    longURL = 'http://' + longURL;
  }
  urlDatabase[shortURL] = { "longURL": longURL, "userID": userID }

  res.redirect(`/urls`);
});

// route to redirect to the actual website
app.get('/u/:shortURL', (req, res) => {
  const longURL = urlDatabase[req.params.shortURL]['longURL'];
  res.redirect(longURL);
});

// route to delete URL using the key
app.post('/urls/:shortURL/delete', (req, res) => {
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect('/urls');
});

// route to edit the existing longURLs
app.post('/urls/:shortURL', (req, res) => {
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;

  urlDatabase[shortURL] = longURL;
  res.redirect('/urls');
});

app.get('/hello', (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// listening to the server at port 8080
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});