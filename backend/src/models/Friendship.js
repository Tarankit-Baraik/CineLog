const { Schema, model } = require('mongoose');

const friendshipSchema = new Schema({
  userA: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  userB: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

friendshipSchema.index({ userA: 1, userB: 1 });

module.exports = model('Friendship', friendshipSchema);
