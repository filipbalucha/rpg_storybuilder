import express, { Request, Response } from 'express';
import { isMongoError, mongoChecker, authenticate } from '../helpers';
import { UserModel } from '../../db/models';
import { User } from '../../frontend/src/types';

export const router = express.Router();

// Client should not be trusted to handle the storage of game data in user

// POST: Create user
router.post('/user', mongoChecker, async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;

    const uniqueUsername = !(await UserModel.findOne({ username }));
    const uniqueEmail = !(await UserModel.findOne({ email }));
    if (!uniqueUsername || !uniqueEmail) {
      res.status(403).send('Username and email must be unique.');
      return;
    }

    console.log('Creating user', req.body);
    const newUser: Omit<User, '_id'> = { username, password, email, games: [], images: [] };
    const user = new UserModel(newUser);
    const result = await user.save();
    res.send(result);
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});


router.post('/user/login', mongoChecker, async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    UserModel.compareUsernamePassword(username, password)
      .then(user => {
        // // Add the user's id to the session.
        // // We can check later if this exists to ensure we are logged in.
        req.session.user = user._id;
        req.session.save();
        // req.session.email = user.email; // we will later send the email to the browser when checking if someone is logged in through GET /check-session (we will display it on the frontend dashboard. You could however also just send a boolean flag).
        res.send({ currentUser: user._id });
      })
      .catch(error => {
        res.status(401).send("Invalid username/password")
      });
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});



router.get("/user/logout", (req, res) => {
  // DESTORY SESSION
  req.session.destroy(error => {
    if (error) {
      res.status(500).send(error);
    } else {
      res.send()
    }
  });
});


// TODO: Ensure that only the user corresponding to the session can be retrieved
// TODO: Probably don't send the password and other sensitive information back
// GET: Retrieve user by ID
router.get('/user/:id', mongoChecker, authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log(`Retrieving user ${id}`);
    const user = await UserModel.findById(id);
    res.send(user);
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});

// GET: Retrieve user by username
router.get('/user/username/:username', mongoChecker, authenticate, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    console.log(`Retrieving user ${username}`);

    const user = await UserModel.findOne({ username });
    res.send(user);
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});

router.get("/user/check-session", (req, res) => {
  console.log("CHECKING SESSION");
  if (req.session.user) {
    res.status(200).send();
  } else {
    res.status(401).send();
  }
});


// DELETE: Delete User
router.delete('/user/:id', mongoChecker, authenticate, async (req: Request, res: Response) => {
  // TODO: Ensure that only the user corresponding to the session can be deleted
  console.log('Deleting user');

  // TODO: delete user from the lists of users in their games
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
    res.send(user);
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});



// PATCH: Update any of the properties of User
router.patch('/user/:id', mongoChecker, authenticate, async (req: Request, res: Response) => {
  // TODO: Ensure that only the user corresponding to the session can be retrieved
  // TODO: Ensure that new username and email are unique and permitted
  // TODO: Ensure image is of the proper size
  console.log('Updating user');

  const updates = req.body; // TODO: perform some validation?
  try {
    const user = await UserModel.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.send(user);
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});



// PATCH: Update the user's list of images
router.patch('/user/:id/images', mongoChecker, authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { image } = req.body;
  try {
    const user = await UserModel.findById(id);
    if (user) {
      user.images.push(image);
      user.markModified('images');
      await user.save();
      res.send(user);
    } else {
      res.status(404).send('User not found');
    }
  } catch (error) {
    console.log(error);
    if (isMongoError(error)) {
      res.status(500).send('Internal server error');
    } else {
      res.status(400).send('Bad request');
    }
  }
});


