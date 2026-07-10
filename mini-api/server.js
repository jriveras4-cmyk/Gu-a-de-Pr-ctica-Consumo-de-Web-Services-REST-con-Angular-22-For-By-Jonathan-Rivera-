const express = require('express');
const app = express();
app.use(express.json());

let posts = [
    { id: 1, title: 'Primer post', body: 'Contenido de prueba', userId: 1 }
];
let nextId = 2;

app.get('/posts', (req, res) => {
    res.json(posts);
});

app.post('/posts', (req, res) => {
    const newPost = { id: nextId++, ...req.body };
    posts.push(newPost);
    res.status(201).json(newPost);
});

app.delete('/posts/:id', (req, res) => {
    posts = posts.filter(p => p.id !== parseInt(req.params.id));
    res.status(204).send();
});

app.listen(3000, () => console.log('API corriendo en http://localhost:3000'));