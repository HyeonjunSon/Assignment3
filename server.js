const express = require('express');
const app = express();
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const userService = require("./user-service.js");

const passport = require("passport");
const passportJWT = require("passport-jwt");
const jwt = require("jsonwebtoken");

const HTTP_PORT = process.env.PORT || 8080;

const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

// ------------------------------
// Passport JWT Strategy
// ------------------------------
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme("jwt"),
      secretOrKey: process.env.JWT_SECRET
    },
    (jwt_payload, done) => {
      return done(null, jwt_payload);
    }
  )
);

// ------------------------------
// Middleware
// ------------------------------
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// ------------------------------
// Routes
// ------------------------------

// REGISTER
app.post("/api/user/register", (req, res) => {
  userService.registerUser(req.body)
    .then((msg) => {
      res.json({ message: msg });
    })
    .catch((msg) => {
      res.status(422).json({ message: msg });
    });
});

// LOGIN → JWT 발급 포함
app.post("/api/user/login", (req, res) => {
  userService.checkUser(req.body)
    .then((user) => {
      const payload = {
        _id: user._id,
        userName: user.userName
      };

      // JWT 생성
      const token = jwt.sign(payload, process.env.JWT_SECRET);

      res.json({
        message: "login successful",
        token: token
      });
    })
    .catch(msg => {
      res.status(422).json({ message: msg });
    });
});

// GET FAVOURITES (JWT 보호)
app.get(
  "/api/user/favourites",
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService.getFavourites(req.user._id)
      .then(data => res.json(data))
      .catch(msg => res.status(422).json({ error: msg }));
  }
);

// ADD FAVOURITE (JWT 보호)
app.put(
  "/api/user/favourites/:id",
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService.addFavourite(req.user._id, req.params.id)
      .then(data => res.json(data))
      .catch(msg => res.status(422).json({ error: msg }));
  }
);

// REMOVE FAVOURITE (JWT 보호)
app.delete(
  "/api/user/favourites/:id",
  passport.authenticate('jwt', { session: false }),
  (req, res) => {
    userService.removeFavourite(req.user._id, req.params.id)
      .then(data => res.json(data))
      .catch(msg => res.status(422).json({ error: msg }));
  }
);

// ------------------------------
// Start Server
// ------------------------------
userService.connect()
  .then(() => {
    app.listen(HTTP_PORT, () => {
      console.log("API listening on: " + HTTP_PORT);
    });
  })
  .catch((err) => {
    console.log("unable to start the server: " + err);
    process.exit();
  });
