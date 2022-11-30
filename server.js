import express from 'express'
const app = express()

import { createServer } from "http";
import { Server } from "socket.io";

import { config } from './config/mariaDB.js'
import { options } from './config/sqlite3.js'
import Contenedor from './controllers/Contenedor.js'

const Automovil = new Contenedor(config)

import Chats from './controllers/Chats.js'
const historial = new Chats(options)

const httpServer = new createServer(app)
const io = new Server(httpServer)

app.set('view engine', 'ejs')
app.set('views', './public/views');

app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended:true}));

//mySQL Productos

Automovil.createTable()
    .then(()=>{
        console.log('tabla Articulos creada');

        const articulos = [
            {
                "title": "hilux",
                "price": 7000000,
                "thumbnail": "https://i.postimg.cc/bv22PTtc/toyota2002.jpg",
                "id_articulo": 1
            },
            {
                "title": "Chevrolet S10",
                "price": 8000000,
                "thumbnail": "https://i.postimg.cc/bJ1Z4w2Q/chevrolet-s10.jpg",
                "id_articulo": 2
            },
            {
                "title": "Volkswagen Amarok",
                "price": 10000000,
                "thumbnail": "https://i.postimg.cc/jd6ST12r/amarokv6.jpg",
                "id_articulo": 3
            },
            {
                "title": "ford raptor",
                "price": 11324299,
                "thumbnail": "https://i.postimg.cc/0j2pL0NK/ranger.jpg",
                "id_articulo": 4
            },
        ]
        return Automovil.save(articulos)
    })
    .then(()=>{
        console.log('articulos insertados');
    })
    .catch((error)=> {
        console.log(error);
        throw error ;
    })
    // .finally(() => {
    //     Automovil.close();
    // });

//SQLITE3 Chats

historial.createTable()
    .then(()=>{
        console.log('tabla chats creada');

        const chats = [
            {
                "email": "estebanfernadez@gmail.com",
                "date": "16/11/22",
                "textoMensaje": "Hola 👋👋",
                "id_chat": 1
            },
            {
                "email": "margaritagomez@gmail.com",
                "date": "16/11/22",
                "textoMensaje": "Hola , esteban todo bien?",
                "id_chat": 2
            },
            {
                "email": "cristianlopez@gmail.com",
                "date": "16/11/22",
                "textoMensaje": "Como anda la gente?🤪🤪?",
                "id_chat": 3
            },
        ]
        return historial.save(chats)
    })
    .then(()=>{
        console.log('Chats insertados');
    })
    .catch((error)=> {
        console.log(error);
        throw error ;
    })
    // .finally(() => {
    //     Automovil.close();
    // });

//webSocket
io.on('connection', async (socket) => {
    console.log('Un cliente se ha conectado');

    //productos
    socket.emit("productos", await Automovil.getAll())
    socket.on("guardarNuevoProducto", (nuevoProducto) => {

        Automovil.save(nuevoProducto)
        io.sockets.emit("productos", Automovil.getAll)
    })

//mensajes

    const messages = await historial.getAllChats()
    socket.emit('messages', messages);

    socket.on('messegesNew', async (data) => {
        const newMessage = {
            email: data.email,
            textoMensaje: data.textoMensaje,
            date: new Date
        }
        const historialSave = await historial.save(newMessage)
        io.sockets.emit('messages', historialSave);
    });
});

//CRUD
app.get('/', async (req, res, next) =>{
    const productos = await Automovil.getAll()
    res.render('pages/index',{productos})
})

app.get('/:id', async (req,res,next) => {
    const { id } = req.params
    const productos = await Automovil.getById(id)
    res.render('pages/index',{productos})
})

app.post('/', async (req, res, next) => {
    const { title, price, thumbnail } = req.body
    const newArticulo = {
        title: title,
        price: price,
        thumbnail: thumbnail
    }
    const newProducto = await Automovil.save(newArticulo)
    const productos = await Automovil.getAll()
    res.render('pages/index', {productos})
})

app.put('/:id',async (req, res, next) => {
    const { title, price, thumbnail } = req.body
    const { id } = req.params;
    const upDateProducto = await Automovil.update(title, price, thumbnail,id)
    const productos = await Automovil.getAll()
    res.render('pages/index', {productos})
})

app.delete('/:id', async (req, res, next) => {
    const { id } = req.params;
    const deleteProducto = await Automovil.deleteById(id)
    console.log(deleteProducto)
    const productos = await Automovil.getAll()
    res.render('pages/index', {productos})
})

//Server
const port = 8080
const server = httpServer.listen(port, () => {
    console.log(`Servidor http escuchando en el puerto http://localhost:${port}`)
})
server.on("error", error => console.log(`Error en servidor ${error}`))
