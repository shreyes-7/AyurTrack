const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { authService, userService, tokenService, emailService } = require('../services');
const ApiError = require('../utils/ApiError');

const register = catchAsync(async (req, res) => {
  // Additional validation for supply chain participants
  if (req.body.participantType !== 'user') {
    if (!req.body.location || !req.body.fabricOrganization) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Location and fabricOrganization are required for supply chain participants');
    }
  }

  const user = await userService.createUser(req.body);
  const tokens = await tokenService.generateAuthTokens(user);

  res.status(httpStatus.CREATED).send({
    user: {
      ...user.toJSON(),
      message: user.isBlockchainEnrolled
        ? 'User created and enrolled in blockchain'
        : 'User created, blockchain enrollment in progress'
    },
    tokens
  });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const user = await authService.loginUserWithEmailAndPassword(email, password);

  // Check blockchain enrollment status for supply chain participants
  if (user.participantType !== 'user' && !user.isBlockchainEnrolled) {
    // Attempt re-enrollment in background
    setImmediate(async () => {
      try {
        await userService.enrollUserInBlockchain(user.id);
      } catch (error) {
        console.error(`Background re-enrollment failed for ${user.email}:`, error.message);
      }
    });
  }

  const tokens = await tokenService.generateAuthTokens(user);
  res.send({ user, tokens });
});

const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const tokens = await authService.refreshAuth(req.body.refreshToken);
  res.send({ ...tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const resetPassword = catchAsync(async (req, res) => {
  await authService.resetPassword(req.query.token, req.body.password);
  res.status(httpStatus.NO_CONTENT).send();
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const verifyEmail = catchAsync(async (req, res) => {
  await authService.verifyEmail(req.query.token);
  res.status(httpStatus.NO_CONTENT).send();
});

module.exports = {
  register,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};
