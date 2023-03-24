const express = require('express')
const app = express();
const dotenv = require('dotenv')
dotenv.config()
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const User = require('./db/conn');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie:{
        secure:true,
        maxAge:30000
    }
}));

const GoogleStrategy = require('passport-google-oauth20').Strategy;

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    User.findById(id).then(res=>done(null,res)).catch(err=>done(err))
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        const existingUser = await User.findOne({ googleId: profile.id })
        if (existingUser) {
            done(null, existingUser);
        } else {
            const newUser = new User({
                googleId: profile.id,
                displayName: profile.displayName,
                email: profile.emails[0].value
                // other user information
            });
            newUser.save().then(res => done(null, res)).catch(err => done(err))

        }

    }
));

app.use(passport.initialize());
app.use(passport.session());

require('./db/conn')

app.get('/', (req, res) => {
    res.send('home')
})
app.get('/login', (req, res) => {
    res.send('login')
})
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
    passport.authenticate('google', { 
        failureRedirect: '/login' ,
        successRedirect:'/'
    })
);

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});
app.get('/api/user/:id', async (req, res) => {

    try {
        const user = await User.findById(req.params.id)
        !user && res.status(404).send('User not found');
        user && res.send(user);
    } catch (error) {
        res.status(500).send('Internal server error');

    }
});

app.post('/api/user', (req, res) => {
    const newUser = new User({
        googleId: req.body.googleId,
        displayName: req.body.displayName,
        email: req.body.email
        // other user information
    });
    newUser.save().catch(err=>console.log(err.message))
})


app.listen(4000, () => {
    console.log("server is running on http://localhost:4000");
})