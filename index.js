const express = require('express');
const cors = require('cors');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express()
const port = process.env.PORT || 5000

//Middleware 
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(express.json())
app.use(cookieParser())



//Database
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.cgjyfgp.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const usersCollection = client.db("visionTaskDB").collection("users")

        const tasksCollection = client.db("visionTaskDB").collection("allTasks")

        //JWT related APIs
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none'

            }).send({ success: true })
        })

        //Remove token after logout the user
        app.post('/logout', async (req, res) => {
            const user = req.body
            console.log("User: ", user);
            res.clearCookie('token', {
                maxAge: 0,
                secure: process.env.NODE_ENV === 'production' ? true : false,
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
                .send({ status: true })
        })

        //------------------Users related APIs-------------------
        app.post('/users', async (req, res) => {
            const user = req.body
            const query = { email: user.email }
            const existUser = await usersCollection.findOne(query)
            if (existUser) {
                return res.send({ message: "User already exists.", insertedId: null })
            } else {
                const result = await usersCollection.insertOne(user)
                res.send(result)
            }
        })


        //------------------Tasks related APIs-------------------
        app.post('/allTasks', async (req, res) => {
            const newTask = req.body
            const result = await tasksCollection.insertOne(newTask)
            res.send(result)
        })

        app.get('/allTasks', async (req, res) => {
            let query = {}
            if (req.query?.email) {
                query = { email: req.query?.email }
            }
            const result = await tasksCollection.find(query).toArray()
            res.send(result)
        })



        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        // console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send("The Vision Task server is running successfully...")
})

app.listen(port, () => {
    console.log(`The server is running on port: ${port}`);
})
