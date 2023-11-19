const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'societify'
});

connection.connect((err) => {
  if (err) {
    console.error(err);
    return;
  }

  console.log('Connected to MySQL');

  app.get('/visitor/in', (req, res) => {
    res.sendFile(__dirname + '/visitor-in.html');
  });

  app.post('/visitor/in', (req, res) => {
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
  });

  app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
  });


  
  app.get('/visitor/out', (req, res) => {
    res.sendFile(__dirname + '/visitor-out.html');
  });

  app.post('/visitor/out', (req, res) => {
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
  });

  app.get('/visitor/record', (req, res) => {
    let filters = {};
    const { name, phone, vehicle_number, residence, from, to } = req.query;
  
    if (name) filters['name'] = name;
    if (phone) filters['phone'] = phone;
    if (vehicle_number) filters['vehicle_number'] = vehicle_number;
    if (residence) filters['residence'] = residence;
    if (from && to) filters['in_timestamp'] = { $gte: new Date(from), $lte: new Date(to) };
  
    let query = `SELECT * FROM visitors`;
  
    const keys = Object.keys(filters);
    if (keys.length > 0) {
      const conditions = keys.map((key) => `${key}='${filters[key]}'`).join(' AND ');
      query += ` WHERE ${conditions}`;
    }
  
    connection.query(query, (err, rows) => {
      if (err) {
        console.error(err);
        return res.send('An error occurred');
      }

      res.send(`
      <html>
        <head>
          <link rel="stylesheet" href="/css/style.css">
          <title>Visitor Record</title>
        </head>
        <body>
          <form action="/visitor/record" method="GET">
            <label for="name">Name:</label>
            <input type="text" name="name"><br>

            <label for="phone">Phone:</label>
            <input type="text" name="phone"><br>

            <label for="vehicle_number">Vehicle Number:</label>
            <input type="text" name="vehicle_number"><br>

            <label for="residence">Residence:</label>
            <input type="text" name="residence"><br>

            <label for="from">From:</label>
            <input type="date" name="from">

            <label for="to">To:</label>
            <input type="date" name="to"><br>

            <input type="submit" value="Filter">
          </form>

          <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle Number</th>
              <th>Residence</th>
              <th>In Timestamp</th>
              <th>Out Timestamp</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(
              (row) =>
                `<tr>
                   <td>${row.name}</td>
                   <td>${row.phone}</td>
                   <td>${row.vehicle_number}</td>
                   <td>${row.residence}</td>
                   <td>${row.in_timestamp}</td>
                   <td>${row.out_timestamp}</td>
                 </tr>`
            )}
          </tbody>
        </table>
      </body>
    </html>
  `);
});
});

  app.listen(3000, () => {
    console.log('Server listening on port 3000');
  });
});
