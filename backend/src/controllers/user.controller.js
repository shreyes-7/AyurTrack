const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role', 'participantType', 'fabricOrganization', 'isBlockchainEnrolled']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const getUserWithBlockchain = catchAsync(async (req, res) => {
  const user = await userService.getUserWithBlockchain(req.params.userId);
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

const enrollUserInBlockchain = catchAsync(async (req, res) => {
  const result = await userService.enrollUserInBlockchain(req.params.userId);
  res.send(result);
});

const getUserBlockchainStatus = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.send({
    userId: user.id,
    blockchainUserId: user.blockchainUserId,
    isBlockchainEnrolled: user.isBlockchainEnrolled,
    fabricOrganization: user.fabricOrganization,
    participantType: user.participantType,
    location: user.location,
    enrollmentDate: user.blockchainEnrollmentDate || null,
    metrics: user.metrics
  });
});

const queryBlockchainParticipants = catchAsync(async (req, res) => {
  const { participantType = 'farmer' } = req.params;
  const participants = await userService.queryBlockchainParticipants(participantType);
  res.send(participants);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  getUserWithBlockchain,
  updateUser,
  deleteUser,
  enrollUserInBlockchain,
  getUserBlockchainStatus,
  queryBlockchainParticipants,
};
