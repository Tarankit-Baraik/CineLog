const Friendship = require('../models/Friendship');
const User = require('../models/User');
const { ValidationError, NotFoundError } = require('../utils/AppError');

async function list(req, res) {
  const userId = req.user.id;
  const friendships = await Friendship.find({
    status: 'accepted',
    $or: [{ userA: userId }, { userB: userId }]
  }).populate('userA userB', 'username');

  const friends = friendships.map((f) => {
    const friend = f.userA._id.toString() === userId ? f.userB : f.userA;
    return { friendshipId: f._id, id: friend._id, username: friend.username };
  });

  res.json(friends);
}

async function sendRequest(req, res) {
  const { toUsername } = req.body;
  if (!toUsername) throw new ValidationError('toUsername required');

  const toUser = await User.findOne({ username: toUsername });
  if (!toUser) throw new NotFoundError(`No user found with username "${toUsername}"`);
  if (toUser._id.toString() === req.user.id) throw new ValidationError('Cannot friend yourself');

  // No unique DB index on {userA,userB} (blueprint §4.5 doesn't specify one) - check app-side.
  const existing = await Friendship.findOne({
    $or: [
      { userA: req.user.id, userB: toUser._id },
      { userA: toUser._id, userB: req.user.id }
    ]
  });
  if (existing) throw new ValidationError('Friendship already exists or is pending');

  const friendship = await Friendship.create({ userA: req.user.id, userB: toUser._id, status: 'pending' });
  res.status(201).json(friendship);
}

async function accept(req, res) {
  // Only the recipient (userB) can accept - the sender is already implicitly "in".
  const friendship = await Friendship.findOne({ _id: req.params.id, userB: req.user.id, status: 'pending' });
  if (!friendship) throw new NotFoundError('Pending friend request not found');

  friendship.status = 'accepted';
  await friendship.save();
  res.json(friendship);
}

async function getPending(req, res) {
  const userId = req.user.id;
  // userB is the recipient, they are the ones who can accept it
  const pendingRequests = await Friendship.find({ userB: userId, status: 'pending' })
    .populate('userA', 'username');

  const requests = pendingRequests.map(req => ({
    friendshipId: req._id,
    fromUserId: req.userA._id,
    fromUsername: req.userA.username,
    createdAt: req.createdAt
  }));

  res.json(requests);
}

module.exports = { list, sendRequest, accept, getPending };
