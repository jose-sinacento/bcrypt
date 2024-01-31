const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const app = express();
const PORT = 4000;

const users = [
  { id: 1, username: 'usuario1', password: 'contraseña1', name: 'Usuario Uno' },
  { id: 2, username: 'usuario2', password: 'contraseña2', name: 'Usuario Dos' },
];

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    secret: 'se_guardar_un_secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

function generateToken(user) {
  return jwt.sign({ user: user.id }, 'se_guardar_un_secreto', {
    expiresIn: '1h',
  });
}

function verifyToken(req, res, next) {
  const token = req.session.token;
  if (!token) {
    return res.status(401).json({ mensaje: 'token no generado' });
  }
  jwt.verify(token, 'se_guardar_un_secreto', (err, decoded) => {
    if (err) {
      return res.status(401).json({ mensaje: 'token invalido' });
    }
    req.user = decoded.user;
    next();
  });
}

app.get('/', (req, res) => {
  const loginForm = `
    <form action="/login" method="post">
      <label for="username">Usuario:</label>
      <input type="text" id="username" name="username" required><br>

      <label for="password">Contraseña:</label>
      <input type="password" id="password" name="password" required><br>

      <button type="submit">Iniciar sesión</button>
    </form>
  `;
  const dashboardLink = `<a href="/dashboard">dashboard</a>`;
  const logoutButton = `
    <form action="/logout" method="post">
      <button type="submit">Cerrar sesión</button>
    </form>
  `;
  let homeHTML = '';

  if (req.session.token) {
    homeHTML = dashboardLink + logoutButton;
  } else {
    homeHTML = loginForm + dashboardLink;
  }

  res.send(homeHTML);
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const user = users.find(
    (user) => user.username === username && user.password === password
  );

  if (user) {
    const token = generateToken(user);
    req.session.token = token;
    res.redirect('/dashboard');
  } else {
    res.status(401).json({ mensaje: 'Credenciales incorrectas' });
  }
});

app.get('/dashboard', verifyToken, (req, res) => {
  const userId = req.user;
  const user = users.find((user) => user.id === userId);
  if (user) {
    res.send(`
      <h1>Bienvenido, ${user.name}</h1>
      <p>ID: ${user.id}</p>
      <p>UserNme: ${user.username}</p>
      <a href="/">Home</a>
      <form action="/logout" method="post">
        <button type="submit">Cerrar sesión</button>
      </form>
    `);
  } else {
    res.status(401).json({ mensaje: 'Usuario no encontrado' });
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
