const express = require('express')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const crypto = require('crypto')
const nodemailer = require('nodemailer')
const User = require('./models/user')
const Order = require('./models/order')

const app = express();
const port = 8080;
const cors = require('cors')
app.use(cors())

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

const jwt = require("jsonwebtoken")

mongoose.connect('mongodb+srv://freecoder:DVNwhmWzsO3OXWSI@cluster0.pvvqq.mongodb.net/?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology:true
}).then(() => {
    console.log("Connected to db")
}).catch((err) => {
    console.log("Error connect to db", err)
})

app.listen(port, () => {
    console.log("Server is running")
})

const sendVerificationEmail = async (email, verificationToken) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: 'freecodingboy@gmail.com',
        pass:'pisyzdsildsyrpqz'
    }
    })

    const mailOptions = {
        from: "amazon.com",
        to: email,
        subject: "Email Verification",
        text:`Please click the following link to verify your email: http://localhost:8080/verify/${verificationToken}`
    }

    try {
        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.log("Error sending verification email",error)
    }
}
const generateSecretKey = () => {
    const secretKey = crypto.randomBytes(32).toString("hex")
    return secretKey;
}
const secretKey = generateSecretKey();

app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("Email already registered:", email); 
      return res.status(400).json({ message: "Email already registered" });
    }

    // Create a new user
    const newUser = new User({ name, email, password });

    newUser.verificationToken = crypto.randomBytes(20).toString("hex");

    await newUser.save();

    console.log("New User Registered:", newUser);

    sendVerificationEmail(newUser.email, newUser.verificationToken);

    res.status(201).json({
      message:
        "Registration successful. Please check your email for verification.",
    });
  } catch (error) {
    console.log("Error during registration:", error); // Debugging statement
    res.status(500).json({ message: "Registration failed" });
  }
});

app.get('/verify/:token', async (req, res) => {
    try {
        const token = req.params.token;
        const user = await User.findOne({ verificationToken: token })
        if (!user) {
            return res.status(404).json({message:"invalid verification token"})
        }

        user.verified = true;
        user.verificationToken = undefined;

        await user.save();
        res.status(200).json({message:"Email verified successfully"})
    } catch (error) {
        res.status(500).json({message:"Email Verification failed"})
    }
})

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({message:"invalid email or password"})
        }
        if (user.password !== password) {
            return res.status(401).json({message:"invalid password"})
        }

        const token = jwt.sign({ userid: user._id }, secretKey)
        res.status(200).json({token})
    } catch (error) {
        res.status(500).json({message:"Login failed"})
    }
})