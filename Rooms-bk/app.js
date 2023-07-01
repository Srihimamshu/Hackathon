const { request, response } = require("express");
const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { Persons,Rooms,Events } = require("./models");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
app.use(bodyParser.json());

app.set("view engine", "ejs");
app.engine('ejs', require('ejs').__express);
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");

const flash = require("connect-flash");
app.set("views", path.join(__dirname, "views"));
app.use(flash());

const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(
  session({
    secret: "my-super-secret-key-21728172615261563",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
        Persons.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(null, false, {
            message: "Your account doesn't exist, try signing up",
          });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
    Persons.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.get("/", async (request, response) => {
  if (request.user) {
    return response.redirect("/room");
  }
  return response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get("/signup", (request, response) => {
    response.render("signup", {
      title: "Signup",
      csrfToken: request.csrfToken(),
    });
  });
  
  app.post("/users", async (request, response) => {
    const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
    if (request.body.password.length < 8) {
      request.flash("error", "Password length can't less than 8");
      return response.redirect("/signup");
    }
    try {
      const user = await Persons.create({
        firstName: request.body.firstName,
        lastName: request.body.lastName,
        email: request.body.email,
        role: request.body.role,
        password: hashedPwd,
      });
      request.login(user, (err) => {
        if (err) {
          console.log(err);
        }
        response.redirect("/room");
      });
    } catch (error) {
      console.log(error);
      request.flash("error", error.errors[0].message);
      return response.redirect("/signup");
    }
  });

  app.get(
    "/room",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      const loggedInUserRole = request.user.role;
  
      try {
        if (request.accepts("html")) {
          response.render("room", {
            role: loggedInUserRole,
            csrfToken: request.csrfToken(),
          });
        }
      } catch (error) {
        console.log(error);
      }
    }
  );
  
  app.get("/login", (request, response) => {
    if (request.user) {
      return response.redirect("/room");
    }
    return response.render("login", {
      csrfToken: request.csrfToken(),
    });
  });

  app.post(
    "/session",
    passport.authenticate("local", {
      failureRedirect: "/login",
      failureFlash: true,
    }),
    function (request, response) {
      console.log(request.user);
      response.redirect("/room");
    }
  );
  
  app.get("/signout", (request, response, next) => {
    request.logout((err) => {
      if (err) {
        return next(err);
      }
      response.redirect("/");
    });
  });

  app.get(
    "/addRoom",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      try {
        response.render("createRoom", {
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.post(
    "/room",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      try {
        const room = await Rooms.addRoom({
          roomNo: request.body.roomNo
        });
        return response.redirect("/room");
      } catch (error) {
        console.log(error);
        return response.status(422).json(error);
      }
    }
  );

let Date1, availableRooms
  app.post(
    "/viewRooms",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
     
      try {
        const allRooms = await Rooms.getRooms();
        const EventsOnDate = await Events.findEvents(
          request.body.date1,
        );
        const mapped = EventsOnDate.map((v) => v.roomId);
        availableRooms = await Rooms.findRooms(
          allRooms,
          mapped
        );
        Date1 = request.body.date1;     
        response.redirect("/viewRooms")
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.get(
    "/viewRooms",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      try {
        response.render("ListOfRooms",{
          Date1,
          availableRooms
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.get(
    "/room/:roomId",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      const room = await Rooms.findByPk(request.params.roomId);
      try {
        response.render("event", {
          title: room.roomNo,
          room,
          Date1,
          csrfToken: request.csrfToken(),
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.post(
    "/createEvent/:roomId",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      if (request.body.NoOfAttendees < 1) {
        request.flash("error", "Number of attendees can't less than 1");
        return response.redirect(`/room/${request.params.roomId}`);
      }
      try {
        console.log(request.body)
        const event = await Events.addEvent({
          eventName: request.body.eventName,
          date: request.body.date,
          speakerName: request.body.speakerName,
          target: request.body.target,
          NoOfAttendees: request.body.NoOfAttendees,
          userId: request.user.id,
          roomId: request.params.roomId,
          confirmed:false,
          cancelled:false
        });
        console.log(event);
        return response.redirect("/room");
      } catch (error) {
        console.log(error);
        request.flash("error", error.errors[0].message);
        return response.redirect(`/room/${request.params.roomId}`);
      }
    }
  );

  app.get(
    "/confirmRoom",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      try {
        const TotalEvents = await Events.getEvents()
        const ConfirmEvents = await Events.ConfirmEvents(TotalEvents)
        const Confirmation=[]
        for (let i = 0; i < ConfirmEvents.length; i++) {
          const room = await Rooms.findByPk(ConfirmEvents[i].roomId);
          Confirmation.push(room.roomNo);
        }
        console.log(Confirmation)
        response.render("confirmRoom", {
          csrfToken: request.csrfToken(),
          ConfirmEvents,
          Confirmation
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.put(
    '/room/:id',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      console.log('We have to update a event with ID:', request.params.id)
      const event = await Events.findByPk(request.params.id)
      try {
        const updatedEvent = await Events.setConfirmedStatus(
          event,request.body.confirmed
        )
        return response.json(updatedEvent)
      } catch (error) {
        console.log(error)
        return response.status(422).json(error)
      }
    }
  )

  app.get(
    "/RoomsConfirmed",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      try {
        const TotalEvents = await Events.getConfirmedEvents()
        const ConfirmEvents = await Events.ConfirmEvents(TotalEvents)
        const Confirmation=[]
        for (let i = 0; i < ConfirmEvents.length; i++) {
          const room = await Rooms.findByPk(ConfirmEvents[i].roomId);
          Confirmation.push(room.roomNo);
        }
        console.log(Confirmation)
        response.render("RoomsConfirmed", {
          csrfToken: request.csrfToken(),
          ConfirmEvents,
          Confirmation
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.get(
    "/CancelRoom",
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response, next) => {
      try {
        const TotalEvents = await Events.UserCreatedEvents(request.user.id)
        const ConfirmEvents = await Events.ConfirmEvents(TotalEvents)
        const Confirmation=[]
        for (let i = 0; i < ConfirmEvents.length; i++) {
          const room = await Rooms.findByPk(ConfirmEvents[i].roomId);
          Confirmation.push(room.roomNo);
        }
        console.log(Confirmation)
        response.render("CancelRoom", {
          csrfToken: request.csrfToken(),
          ConfirmEvents,
          Confirmation
        });
      } catch (error) {
        console.log(error);
      }
    }
  );

  app.put(
    '/Cancelroom/:id',
    connectEnsureLogin.ensureLoggedIn(),
    async (request, response) => {
      console.log('We have to cancel a event with ID:', request.params.id)
      const event = await Events.findByPk(request.params.id)
      try {
        const CancelEvent = await Events.setCancel(
          event,request.body.cancelled
        )
        return response.json(CancelEvent)
      } catch (error) {
        console.log(error)
        return response.status(422).json(error)
      }
    }
  )
module.exports = app;