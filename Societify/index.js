const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const session = require('express-session');
const bcrypt = require('bcrypt');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.use(
  session({
    secret: 'mysecret',
    resave: true,
    saveUninitialized: true,
    cookie: {
      secure: false,
      maxAge: 3600000,
    },
  })
);

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'societify',
});

connection.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Connected to MySQL');

  app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.html');
  });

  app.post('/login', (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
  
    // check if email and password are not empty
    if (email && password) {
      connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          // check if user exists and password is correct
          if (results.length > 0 && bcrypt.compareSync(password, results[0].password)) {
            req.session.loggedin = true;
            req.session.userid = results[0].id;
            req.session.username = results[0].name;
            res.redirect('/home');
          } else {
            res.status(401).send('Incorrect email or password');
          }
        }
      });
    } else {
      res.status(400).send('Email and password are required');
    }
  });

  app.get('/signup', (req, res) => {
    res.sendFile(__dirname + '/signup.html');
  });
  
  app.post('/signup', (req, res) => {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
  
    // check if name, email, and password are not empty
    if (name && email && password) {
      // check if user with the same email already exists
      connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          if (results.length > 0) {
            res.status(409).send('User with the same email already exists');
          } else {
            // hash the password and insert the user into the database
            const hashedPassword = bcrypt.hashSync(password, 10);
            connection.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword], (err, results) => {
              if (err) {
                console.log(err);
                res.status(500).send('Internal Server Error');
              } else {
                req.session.loggedin = true;
                req.session.userid = results.insertId;
                req.session.username = name;
                res.redirect('/home');
              }
            });
          }
        }
      });
    } else {
      res.status(400).send('Name, email, and password are required');
    }
  });


// login route
app.post('/login', (req, res) => {
const email = req.body.email;
const password = req.body.password;

// check if email and password are not empty
if (email && password) {
// get user with the same email from the database
connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
if (err) {
console.log(err);
res.status(500).send('Internal Server Error');
} else {
if (results.length > 0) {
// check if password matches the hashed password stored in the database
const user = results[0];
if (bcrypt.compareSync(password, user.password)) {
req.session.loggedin = true;
req.session.userid = user.id;
req.session.username = user.name;
res.redirect('/home');
} else {
res.status(401).send('Wrong email or password');
}
} else {
res.status(401).send('Wrong email or password');
}
}
});
} else {
res.status(400).send('Email and password are required');
}
});

// logout route
app.get('/logout', (req, res) => {
  req.session.loggedin = false;
  req.session.userid = null;
  req.session.username = null;
  res.redirect('/login');
  });



  app.get('/visitor/in', (req, res) => {
    if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
      res.sendFile(__dirname + '/visitor-in.html');
    } else {
      res.redirect('/login');
    }
  });

  app.post('/visitor/in', (req, res) => {
    if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
      const { name, phone, residence, mode_of_transport, vehicle_number } = req.body;
      const timestamp = new Date();

      const visitor = { name, phone, residence, mode_of_transport, vehicle_number, timestamp, out_timestamp: null };

      connection.query('INSERT INTO visitors SET ?', visitor, (err, result) => {
        if (err) {
          console.error(err);
          return res.send('An error occurred');
        }

        res.send('Visitor in recorded successfully');
      });
    } else {
      res.redirect('/login');
    }
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });

  app.get('/visitor/out', (req, res) => {
    if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
      res.sendFile(__dirname + '/visitor-out.html');
    } else {
      res.redirect('/login');
    }
  });

  app.post('/visitor/out', (req, res) => {
    if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
      const { name, phone, vehicle_number } = req.body;
      const out_timestamp = new Date();

      const query = `UPDATE visitors SET out_timestamp = ? WHERE name = ? OR phone = ? OR vehicle_number = ?`;

      connection.query(query, [out_timestamp, name, phone, vehicle_number], (err, result) => {
        if (err) {
          console.error(err);
          return res.send('An error occurred');
        }

        if (result.affectedRows === 0) {
          return res.send('No matching visitor found');
        }

        res.send('Visitor out recorded successfully');
      });
    } else {
      res.redirect('/login');
    }
  });

  app.get('/visitor/record', (req, res) => {
    if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
      let filters = {};
      const { name, phone, vehicle_number, residence, from, to } = req.query;

      if (name) filters['name'] = name;
      if (phone) filters['phone'] = phone;
      if (vehicle_number) filters['vehicle_number'] = vehicle_number;
      if (residence) filters['residence'] = residence;
      if (from) filters['entry_time'] = { $gte: new Date(from) };
      if (to) filters['entry_time'] = { ...filters['entry_time'], $lte: new Date(to) };
    
      Visitor.find(filters, (err, visitors) => {
        if (err) {
          console.log(err);
          res.status(500).send('Internal Server Error');
        } else {
          res.render('visitor_record', { title: 'Visitor Record', visitors });
        }
      });
    } else {
      res.redirect('/login');
    }
  });

  app.get('/visitor/record/:id', (req, res) => {
  if (req.session.loggedin && (req.session.role === 'admin' || req.session.role === 'staff')) {
  Visitor.findById(req.params.id, (err, visitor) => {
  if (err) {
  console.log(err);
  res.status(500).send('Internal Server Error');
  } else {
  if (visitor) {
  res.render('visitor_detail', { title: 'Visitor Detail', visitor });
  } else {
  res.status(404).send('Visitor Not Found');
  }
  }
  });
  } else {
  res.redirect('/login');
  }
  });
  
  app.get('/visitor/new', (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
  res.render('visitor_new', { title: 'New Visitor' });
  } else {
  res.redirect('/login');
  }
  });
  
  app.post('/visitor/new', (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
  const { name, phone, vehicle_number, residence, purpose } = req.body;
  const visitor = new Visitor({ name, phone, vehicle_number, residence, purpose });
  visitor.save((err, visitor) => {
  if (err) {
  console.log(err);
  res.status(500).send('Internal Server Error');
  } else {
  res.redirect('/visitor/record');
  }
  });
  } else {
  res.redirect('/login');
  }
  });
  
  app.get('/visitor/:id/edit', (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
  Visitor.findById(req.params.id, (err, visitor) => {
  if (err) {
  console.log(err);
  res.status(500).send('Internal Server Error');
  } else {
  if (visitor) {
  res.render('visitor_edit', { title: 'Edit Visitor', visitor });
  } else {
  res.status(404).send('Visitor Not Found');
  }
  }
  });
  } else {
  res.redirect('/login');
  }
  });
  
  app.post('/visitor/:id/edit', (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
  Visitor.findByIdAndUpdate(req.params.id, req.body, (err, visitor) => {
  if (err) {
  console.log(err);
  res.status(500).send('Internal Server Error');
  } else {
  res.redirect('/visitor/record');
  }
  });
  } else {
  res.redirect('/login');
  }
  });
  
  app.post('/visitor/:id/delete', (req, res) => {
  if (req.session.loggedin && req.session.role === 'admin') {
  Visitor.findByIdAndDelete(req.params.id, (err, visitor) => {
  if (err) {
  console.log(err);
  ('Error deleting visitor with ID ${req.params.id}: ${err}');
res.status(500).send('Internal Server Error');
} else if (!visitor) {
console.log('Visitor with ID ${req.params.id} not found');
res.status(404).send('Visitor not found');
} else {
console.log('Visitor with ID ${req.params.id} deleted successfully');
res.redirect('/visitor/list');
}
});
} else {
res.status(403).send('Forbidden');
}
});
});

// handle 404 errors
app.use((req, res, next) => {
res.status(404).send("Sorry can't find that!");
});

// handle other errors
app.use((err, req, res, next) => {
console.error(err.stack);
res.status(500).send('Something broke!');
});

// start server
app.listen(3000, () => {
console.log('Server started on port 3000');
});