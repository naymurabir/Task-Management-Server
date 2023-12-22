const express = require('express');
const cors = require('cors');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

//Middleware 
app.use(cors())
app.use(express.json())


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

        app.get('/updateTask/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await tasksCollection.findOne(query)
            res.send(result)
        })

        app.put('/updateTask/:id', async (req, res) => {
            const id = req.params.id;
            const updateTask = req.body
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    title: updateTask.title,
                    priority: updateTask.priority,
                    current_date: updateTask.current_date,
                    deadline: updateTask.deadline,
                    task_description: updateTask.task_description,
                }
            }
            const result = await tasksCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })

        app.delete('/allTasks/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await tasksCollection.deleteOne(query)
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
