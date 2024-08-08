const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const cors = require('cors');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/telegram_bot', {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
}).then(() => {
    console.log('MongoDBga muvaffaqiyatli ulandik');
}).catch(err => {
    console.error('MongoDBga ulanishda xatolik:', err);
});

// Define User schema and model
const UserSchema = new mongoose.Schema({
    ism: { type: String, required: true },
    familiya: { type: String, required: true },
    otasiningIsmi: { type: String, required: true },
    tugilganSanasi: { type: String, required: true },
    telefonRaqami: { type: String, required: true },
    qoshimchaRaqam: { type: String, required: true },
    pasportSeriyaRaqami: { type: String, required: true },
    yonalish: { type: String, required: true },
    talimTuri: { type: String, required: true },
    source: { type: String, default: 'telegram' },
    dtmTestBali: { type: String, required: true },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Create a new user
app.post('/users', async (req, res) => {
    try {
        const user = new User({
            ...req.body,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        await user.save();
        res.status(201).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get all users
app.get('/users', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Get a single user by ID
app.get('/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

// Update a user by ID
app.patch('/users/:id', async (req, res) => {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['first_name', 'last_name', 'middle_name', 'date_of_birth', 'phone_number', 'secondary_phone_number', 'pasportSeriyaRaqami', 'direction', 'type_of_education'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        updates.forEach(update => user[update] = req.body[update]);
        user.updated_at = new Date().toISOString();
        await user.save();
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Delete a user by ID
app.delete('/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).send();
        }
        res.status(200).send(user);
    } catch (error) {
        res.status(500).send(error);
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
